/**
 * Work Manager Module - OAE Revisor
 * Gerenciamento avançado de obras com filtros e compartilhamento
 */

const WorkManager = {
  // Cache de obras
  worksCache: new Map(),

  // Estado dos filtros
  activeFilters: {
    search: "",
    author: "",
    status: "",
    dateFrom: null,
    dateTo: null,
    tags: [],
    publicOnly: false,
    mineOnly: false,
    lote: null, // null = all lotes (admin only), "Lote 01" or "Lote 02" for filtering
  },

  /**
   * Inicializa o gerenciador de obras
   */
  async init() {
    await this.loadAllWorks();
    console.log("Work Manager initialized with", this.worksCache.size, "works");
  },

  /**
   * Carrega todas as obras do IndexedDB
   */
  async loadAllWorks() {
    try {
      if (!DB.db) {
        console.warn("Database not initialized. Initializing now...");
        await DB.init();
      }

      const transaction = DB.db.transaction(["obras"], "readonly");
      const store = transaction.objectStore("obras");
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          this.worksCache.clear();
          request.result.forEach((work) => {
            // Migração automática: inicializa metadata se não existir
            if (!work.work.metadata) {
              work.work.metadata = {
                createdBy: work.work.avaliador || "unknown@local",
                createdAt: new Date().toISOString(),
                lastModifiedBy: work.work.avaliador || "unknown@local",
                lastModifiedAt: new Date().toISOString(),
                sharedWith: [],
                isPublic: false,
                version: 1,
                tags: [],
                status: "draft",
              };
              // Salva a obra com metadata inicializado (async, não bloqueante)
              this.saveWork(work, { broadcast: false }).catch(err => console.error("Error migrating work:", err));
            }
            this.worksCache.set(work.work.codigo, work);
          });
          resolve();
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Error loading works:", error);
      throw error;
    }
  },

  /**
   * Salva obra no IndexedDB
   */
  async saveWork(workData, options = { broadcast: true }) {
    try {
      const transaction = DB.db.transaction(["obras"], "readwrite");
      const store = transaction.objectStore("obras");

      return new Promise((resolve, reject) => {
        const request = store.put(workData);

        request.onsuccess = async () => {
          this.worksCache.set(workData.work.codigo, workData);

          // Broadcast to peers unless explicitly disabled
          try {
            if (options && options.broadcast !== false && window.MultiPeerSync && MultiPeerSync.hasConnections()) {
              try {
                MultiPeerSync.broadcastWorkUpdated(workData);
                // Also attempt to send a lightweight share link for quick import
                if (window.SyncMethods && typeof SyncMethods.generateWorkShareLink === 'function') {
                  const inviteLink = await SyncMethods.generateWorkShareLink(workData.work.codigo).catch(()=>null);
                  if (inviteLink) {
                    const url = new URL(inviteLink);
                    const encoded = url.searchParams.get('shareWork');
                    if (encoded) {
                      MultiPeerSync.broadcast({ type: 'work_share_link', payload: { encoded } });
                    }
                  }
                }
              } catch (e) {
                console.warn('Broadcast after save failed:', e);
              }
            }
          } catch (e) {
            console.warn('Error during post-save broadcast:', e);
          }

          resolve();
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Error saving work:", error);
      throw error;
    }
  },

  /**
   * Remove obra do IndexedDB
   */
  async deleteWork(codigo) {
    try {
      const transaction = DB.db.transaction(["obras"], "readwrite");
      const store = transaction.objectStore("obras");

      return new Promise((resolve, reject) => {
        const request = store.delete(codigo);

        request.onsuccess = () => {
          this.worksCache.delete(codigo);
          resolve();
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Error deleting work:", error);
      throw error;
    }
  },

  /**
   * Aplica filtros e retorna obras filtradas
   * REGRAS DE ACESSO:
   * - Admin: vê tudo, pode filtrar por lote
   * - Avaliador: vê obras de todos os lotes, pode filtrar por lote
   * - Inspetor: vê APENAS obras do próprio lote
   */
  getFilteredWorks() {
    let works = Array.from(this.worksCache.values());

    // Get current user info
    const currentUser = window.AuthSystem?.currentUser;
    const isAdmin = currentUser?.role === "admin";
    const isAvaliador = currentUser?.role === "avaliador";
    const isInspetor = currentUser?.role === "inspetor";

    // Filtro por lote (controle de acesso)
    if (isInspetor) {
      // Inspetor SÓ vê obras do próprio lote
      works = works.filter((work) => {
        const workLote = work.work?.metadata?.lote || work.work?.lote;
        return !workLote || workLote === currentUser.lote;
      });
    } else if ((isAdmin || isAvaliador) && this.activeFilters.lote) {
      // Admin e Avaliador podem filtrar por lote específico usando o toggle
      works = works.filter((work) => {
        const workLote = work.work?.metadata?.lote || work.work?.lote;
        return workLote === this.activeFilters.lote;
      });
    }
    // Avaliador sem filtro ativo vê TODOS os lotes

    // Filtro de busca textual
    if (this.activeFilters.search) {
      const searchTerm = this.activeFilters.search.toLowerCase();
      works = works.filter((work) => {
        const obra = work.work;
        return (
          obra.codigo.toLowerCase().includes(searchTerm) ||
          obra.nome.toLowerCase().includes(searchTerm) ||
          obra.avaliador.toLowerCase().includes(searchTerm) ||
          (obra.metadata?.tags || []).some((tag) =>
            tag.toLowerCase().includes(searchTerm)
          )
        );
      });
    }

    // Filtro por autor/criador
    if (this.activeFilters.author) {
      works = works.filter(
        (work) =>
          (work.work.metadata?.createdBy || null) === this.activeFilters.author
      );
    }

    // Filtro por status
    if (this.activeFilters.status) {
      works = works.filter(
        (work) =>
          (work.work.metadata?.status || "draft") === this.activeFilters.status
      );
    }

    // Filtro por período
    if (this.activeFilters.dateFrom) {
      works = works.filter((work) => {
        const createdAt =
          work.work.metadata?.createdAt || work.work?.createdAt || new Date(0);
        return new Date(createdAt) >= new Date(this.activeFilters.dateFrom);
      });
    }

    if (this.activeFilters.dateTo) {
      works = works.filter((work) => {
        const createdAt =
          work.work.metadata?.createdAt || work.work?.createdAt || new Date(0);
        return new Date(createdAt) <= new Date(this.activeFilters.dateTo);
      });
    }

    // Filtro por tags
    if (this.activeFilters.tags.length > 0) {
      works = works.filter((work) => {
        const workTags = work.work.metadata?.tags || [];
        return this.activeFilters.tags.some((tag) => workTags.includes(tag));
      });
    }

    // Apenas obras do usuário atual
    if (this.activeFilters.mineOnly) {
      const currentUser = AuditSystem.getCurrentUser().email;
      works = works.filter(
        (work) => (work.work.metadata?.createdBy || null) === currentUser
      );
    }

    // Apenas obras públicas
    if (this.activeFilters.publicOnly) {
      works = works.filter((work) => work.work.metadata?.isPublic === true);
    }

    // Ordenação por última modificação (mais recente primeiro)
    works.sort((a, b) => {
      const dateA =
        a.work?.metadata?.lastModifiedAt ||
        a.work?.lastModified ||
        a.lastModified ||
        new Date(0);
      const dateB =
        b.work?.metadata?.lastModifiedAt ||
        b.work?.lastModified ||
        b.lastModified ||
        new Date(0);
      return new Date(dateB) - new Date(dateA);
    });

    return works;
  },

  /**
   * Obtém lista de autores únicos
   */
  getUniqueAuthors() {
    const authors = new Set();
    this.worksCache.forEach((work) => {
      const createdBy = work.work.metadata?.createdBy;
      if (createdBy) {
        authors.add(createdBy);
      }
    });
    return Array.from(authors).sort();
  },

  /**
   * Obtém lista de tags únicas
   */
  getUniqueTags() {
    const tags = new Set();
    this.worksCache.forEach((work) => {
      const workTags = work.work.metadata?.tags || [];
      workTags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  },

  /**
   * Obtém estatísticas gerais
   */
  getGeneralStats() {
    const stats = {
      total: this.worksCache.size,
      byStatus: {},
      byAuthor: {},
      byMonth: {},
      public: 0,
      private: 0,
    };

    this.worksCache.forEach((work) => {
      const obra = work.work;
      const metadata = obra.metadata || {};

      // Por status
      const status = metadata.status || "draft";
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      // Por autor
      const author = metadata.createdBy || "unknown";
      stats.byAuthor[author] = (stats.byAuthor[author] || 0) + 1;

      // Por mês
      const createdAt =
        metadata.createdAt || obra.createdAt || new Date().toISOString();
      const month = new Date(createdAt).toISOString().substring(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

      // Públicas vs Privadas
      if (metadata.isPublic) {
        stats.public++;
      } else {
        stats.private++;
      }
    });

    return stats;
  },

  /**
   * Atualiza filtros
   */
  updateFilters(newFilters) {
    this.activeFilters = { ...this.activeFilters, ...newFilters };
  },

  /**
   * Limpa todos os filtros
   */
  clearFilters() {
    this.activeFilters = {
      search: "",
      author: "",
      status: "",
      dateFrom: null,
      dateTo: null,
      tags: [],
      publicOnly: false,
      mineOnly: false,
      lote: null,
    };
  },

  /**
   * Obtém estatísticas por lote
   */
  getStatsByLote() {
    const stats = {
      "Lote 01": { total: 0, byStatus: {} },
      "Lote 02": { total: 0, byStatus: {} },
      "Lote 03": { total: 0, byStatus: {} },
      "Admin": { total: 0, byStatus: {} },
      "Sem Lote": { total: 0, byStatus: {} },
    };

    this.worksCache.forEach((work) => {
      const lote = work.work?.metadata?.lote || work.work?.lote || "Sem Lote";
      const status = work.work?.metadata?.status || "draft";

      if (!stats[lote]) {
        stats[lote] = { total: 0, byStatus: {} };
      }

      stats[lote].total++;
      stats[lote].byStatus[status] = (stats[lote].byStatus[status] || 0) + 1;
    });

    return stats;
  },

  /**
   * Exporta obras filtradas
   */
  exportFilteredWorks() {
    const works = this.getFilteredWorks();
    const exportData = {
      filters: this.activeFilters,
      works: works,
      exportedAt: new Date().toISOString(),
      exportedBy: AuditSystem.getCurrentUser(),
      total: works.length,
    };

    return exportData;
  },

  /**
   * Busca obras por múltiplos critérios
   */
  searchWorks(criteria) {
    const results = [];

    this.worksCache.forEach((work) => {
      const obra = work.work;
      let matches = true;

      // Busca por código
      if (
        criteria.codigo &&
        !obra.codigo.toLowerCase().includes(criteria.codigo.toLowerCase())
      ) {
        matches = false;
      }

      // Busca por nome
      if (
        criteria.nome &&
        !obra.nome.toLowerCase().includes(criteria.nome.toLowerCase())
      ) {
        matches = false;
      }

      // Busca por avaliador
      if (
        criteria.avaliador &&
        !obra.avaliador.toLowerCase().includes(criteria.avaliador.toLowerCase())
      ) {
        matches = false;
      }

      // Busca por tags
      if (criteria.tags && criteria.tags.length > 0) {
        const workTags = obra.metadata?.tags || [];
        if (!criteria.tags.some((tag) => workTags.includes(tag))) {
          matches = false;
        }
      }

      if (matches) {
        results.push(work);
      }
    });

    return results;
  },

  /**
   * Obtém obras recentes (últimos N dias)
   */
  getRecentWorks(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return Array.from(this.worksCache.values())
      .filter((work) => {
        const createdAt =
          work.work.metadata?.createdAt || work.work?.createdAt || new Date(0);
        return new Date(createdAt) >= cutoffDate;
      })
      .sort((a, b) => {
        const dateA =
          a.work.metadata?.createdAt || a.work?.createdAt || new Date(0);
        const dateB =
          b.work.metadata?.createdAt || b.work?.createdAt || new Date(0);
        return new Date(dateB) - new Date(dateA);
      });
  },

  /**
   * Obtém obras criadas pelo usuário atual
   */
  getMyWorks() {
    const currentUser = AuditSystem.getCurrentUser().email;

    return Array.from(this.worksCache.values()).filter(
      (work) => (work.work.metadata?.createdBy || null) === currentUser
    );
  },

  /**
   * Verifica permissões do usuário na obra
   */
  getUserPermissions(codigo) {
    const work = this.worksCache.get(codigo);
    if (!work) return null;

    const currentUser = AuditSystem.getCurrentUser().email;
    const currentUserRole = AuditSystem.getCurrentUser().role;
    const metadata = work.work.metadata || {};

    // Admin tem permissão total
    const isAdmin = currentUserRole === "admin";
    const isOwner = metadata.createdBy === currentUser;

    return {
      canView: metadata.isPublic || isOwner || isAdmin,
      canEdit: true, // Permite que TODOS possam publicar obras (tornar pública/privada)
      canDelete: isOwner || isAdmin,
      canShare: isOwner || isAdmin,
      isOwner: isOwner,
      isPublic: metadata.isPublic === true,
    };
  },

  /**
   * Atualiza cache quando obra é modificada
   */
  updateWorkCache(codigo, workData) {
    this.worksCache.set(codigo, workData);
  },
};

// Export para uso global
window.WorkManager = WorkManager;
