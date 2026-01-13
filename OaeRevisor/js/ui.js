/**
 * UI Module - OAE Revisor
 */

const UI = {
  init() {
    this.setupEventListeners();
    this.updateRoleUI();
    this.renderFamilies();
    this.renderElementErrorTypes();
    this.renderAspects();
    this.initLoteToggle();
  },

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));
        document
          .querySelectorAll(".tab-panel")
          .forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        const targetPanel = document.getElementById(btn.dataset.tab);
        if (targetPanel) {
          targetPanel.classList.add("active");
        }
      });
    });

    // Role switching
    document.querySelectorAll(".role-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        appState.role = btn.dataset.role;
        this.updateRoleUI();
      });
    });

    // Tramos change
    document
      .getElementById("numTramosGlobal")
      .addEventListener("change", (e) => {
        const num = parseInt(e.target.value) || 1;
        Sync.updateTramos(num);
      });

    // Tramo switch refresh families
    document
      .getElementById("bulkTramo")
      ?.addEventListener("change", () => this.renderFamilies());
  },

  updateRoleUI() {
    document.body.setAttribute("data-role", appState.role);
    document.querySelectorAll(".role-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.role === appState.role);
    });

    // Visual toggle for evaluator-only elements
    const evalOnly = document.querySelectorAll(".evaluator-only");
    evalOnly.forEach(
      (el) =>
        (el.style.display = appState.role === "avaliador" ? "block" : "none")
    );

    // Re-renderizar aspectos e deficiências para atualizar botões de erro
    this.renderAspects();
    this.renderFunctionalDeficiencies();
  },

  renderAll() {
    this.renderTramosTable();
    this.renderElementsList();
    this.renderAspects();
    this.renderFunctionalDeficiencies();
    this.renderAttachments();
    this.updateReport();
    this.updateFieldVisuals();
    this.updateTabBadges();

    // Renderiza o sistema de mensagens se disponível (substitui UI.renderMessages antigo)
    if (window.MessageSystem) {
      MessageSystem.renderMessages();
    }
  },

  // --- TRAMOS TABLE ---
  renderTramosTable() {
    const container = document.getElementById("tramosCaracContainer");
    const num = appState.work.numTramos || 1;

    let html = `
            <table class="view-table">
                <thead>
                    <tr>
                        <th style="width: 50px;">Tramo</th>
                        <th>Tipo de Estrutura</th>
                        <th>Sistema Construtivo</th>
                        <th style="width: 80px;">Ext. (m)</th>
                        <th style="width: 70px;">H Min</th>
                        <th style="width: 70px;">H Max</th>
                        <th>Continuidade</th>
                        <th style="width: 40px;"></th>
                    </tr>
                </thead>
                <tbody>`;

    const renderRow = (id, label) => {
      return `
                <tr>
                    <td><strong>${label}</strong></td>
                    <td>
                        <div class="field-wrapper">
                            <input type="text" class="form-input" id="t_${id}_tipo" data-tramo-field="${id}_tipo" value="${
        appState.work.tramos[id]?.tipo || ""
      }">
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_tipo', 'Tipo Estrutura (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td>
                        <div class="field-wrapper">
                            <select class="form-input" id="t_${id}_sistema" data-tramo-field="${id}_sistema">
                                <option value="">Selecione</option>
                                ${CONSTRUCTION_SYSTEMS.map(
                                  (sys) =>
                                    `<option ${
                                      appState.work.tramos[id]?.sistema === sys
                                        ? "selected"
                                        : ""
                                    }>${sys}</option>`
                                ).join("")}
                            </select>
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_sistema', 'Sistema Construtivo (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td>
                        <div class="field-wrapper">
                            <input type="text" class="form-input" id="t_${id}_ext" data-tramo-field="${id}_ext" value="${
        appState.work.tramos[id]?.ext || ""
      }">
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_ext', 'Extensão (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td>
                        <div class="field-wrapper">
                            <input type="text" class="form-input" id="t_${id}_min" data-tramo-field="${id}_min" value="${
        appState.work.tramos[id]?.min || ""
      }">
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_min', 'H Min (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td>
                        <div class="field-wrapper">
                            <input type="text" class="form-input" id="t_${id}_max" data-tramo-field="${id}_max" value="${
        appState.work.tramos[id]?.max || ""
      }">
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_max', 'H Max (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td>
                        <div class="field-wrapper">
                            <input type="text" class="form-input" id="t_${id}_cont" data-tramo-field="${id}_cont" value="${
        appState.work.tramos[id]?.cont || ""
      }">
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_cont', 'Continuidade (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td></td>
                </tr>`;
    };

    for (let i = 1; i <= num; i++) {
      html += renderRow(i, i);
    }

    // Tramo C (Complementar) não é exibido na tabela de características funcionais
    // mas continua existindo internamente e disponível para elementos.

    html += `</tbody></table>`;
    container.innerHTML = html;

    // Re-attach data-tramo-field listeners
    document.querySelectorAll("[data-tramo-field]").forEach((el) => {
      el.addEventListener("input", (e) => {
        const [id, field] = e.target.dataset.tramoField.split("_");
        if (!appState.work.tramos[id]) appState.work.tramos[id] = {};
        appState.work.tramos[id][field] = e.target.value;
        AutoSave.trigger();
      });
    });

    // Update bulk tramo select (incluindo C para elementos)
    const bulkSelect = document.getElementById("bulkTramo");
    let bulkHtml = "";
    for (let i = 1; i <= num; i++)
      bulkHtml += `<option value="${i}">${i}</option>`;
    bulkHtml += `<option value="C">C (Complementar)</option>`;
    bulkSelect.innerHTML = bulkHtml;
  },

  // --- ELEMENTS ---
  renderFamilies(filterRegion = null) {
    const select = document.getElementById("bulkFamilia");
    let html = '<option value="">Selecione</option>';
    const bulkTramo = document.getElementById("bulkTramo")?.value;
    const regionSelect = document.getElementById("bulkRegiaoFiltro");
    const regionContainer = regionSelect?.closest(".form-field");

    if (bulkTramo === "C") {
      // Se for tramo C, bloquear região como 'Complementar'
      if (regionSelect) {
        // Adiciona opção complementar se não existir
        if (
          ![...regionSelect.options].some((o) => o.value === "Complementar")
        ) {
          const opt = new Option("Complementar", "Complementar");
          regionSelect.add(opt);
        }
        regionSelect.value = "Complementar";
        regionSelect.disabled = true;
      }

      COMPLEMENTARY_ELEMENTS.forEach((element) => {
        html += `<option value="${element}">${element}</option>`;
      });
    } else {
      // Comportamento normal para tramos numéricos
      if (regionSelect) {
        regionSelect.disabled = false;
        // Remove opção complementar se existir
        const compOpt = [...regionSelect.options].find(
          (o) => o.value === "Complementar"
        );
        if (compOpt) regionSelect.remove(compOpt.index);
        if (regionSelect.value === "Complementar") regionSelect.value = "";
      }

      const regions = filterRegion
        ? [filterRegion]
        : Object.keys(ELEMENT_FAMILIES);
      regions.forEach((region) => {
        html += `<optgroup label="${region}">`;
        ELEMENT_FAMILIES[region].forEach((element) => {
          html += `<option value="${element}">${element}</option>`;
        });
        html += `</optgroup>`;
      });
    }

    select.innerHTML = html;
  },

  filterElementsByRegion() {
    const filterValue = document.getElementById("bulkRegiaoFiltro").value;
    UI.renderFamilies(filterValue || null);
  },

  renderElementErrorTypes() {
    const select = document.getElementById("bulkErro");
    let html = '<option value="">Selecione</option>';

    ELEMENT_ERROR_TYPES.forEach((tipo) => {
      html += `<option>${tipo}</option>`;
    });

    select.innerHTML = html;
  },

  addBulkElements() {
    const tramo = document.getElementById("bulkTramo").value;
    const familia = document.getElementById("bulkFamilia").value;
    const erro = document.getElementById("bulkErro").value;
    const obs = document.getElementById("bulkObs").value;

    if (!tramo) {
      alert("Selecione um tramo.");
      return;
    }
    if (!familia) {
      alert("Selecione uma família de elemento.");
      return;
    }
    if (!erro) {
      alert("Selecione uma inconsistência.");
      return;
    }

    // Auto-detectar região pela família selecionada
    let regiao = "";
    if (tramo === "C") {
      regiao = "Complementar";
    } else {
      for (const [reg, elementos] of Object.entries(ELEMENT_FAMILIES)) {
        if (elementos.includes(familia)) {
          regiao = reg;
          break;
        }
      }
    }

    if (!regiao) {
      alert("Não foi possível determinar a região deste elemento.");
      return;
    }

    // Cria descrição formatada para aparecer nas mensagens
    let description = `Tramo ${tramo} - ${regiao} | ${familia}: ${erro}`;
    if (obs) {
      description += ` - ${obs}`;
    }

    const elementError = {
      id: "elem_" + Date.now() + Math.random(),
      tramo,
      regiao,
      familia,
      erro,
      obs,
      responses: [],
      description: description, // Adiciona descrição para sistema de mensagens
      nomeUsuario: window.AuthSystem?.currentUser?.name || 'Avaliador',
      perfil: window.AuthSystem?.currentUser?.role || 'avaliador',
      dataHistorico: new Date().toISOString(),
      timestamp: Date.now(),
      tramNumber: tramo,
      field: familia
    };

    appState.elementErrors.push(elementError);

    // Envia notificação via MultiPeerSync se conectado
    if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
      MultiPeerSync.broadcastErrorAdded({
        ...elementError,
        type: "element",
        label: `Tramo ${tramo} - ${regiao} | ${familia}`,
        timestamp: Date.now(),
      });
    }

    document.getElementById("bulkObs").value = "";
    this.renderElementsList();
    this.updateReport();
    this.updateTabBadges();
    AutoSave.trigger();

    // Atualiza o sistema de mensagens
    if (window.MessageSystem) {
      MessageSystem.renderMessages();
    }
  },

  renderElementsList() {
    const container = document.getElementById("elementsContainer");
    if (appState.elementErrors.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum erro de elemento apontado.</p>';
      return;
    }

    // Group by tramo
    const grouped = {};
    appState.elementErrors.forEach((err) => {
      if (!grouped[err.tramo]) grouped[err.tramo] = [];
      grouped[err.tramo].push(err);
    });

    let html = "";
    Object.keys(grouped)
      .sort()
      .forEach((tramo) => {
        html += `
                <div class="section">
                    <div class="section-title">📦 Tramo ${tramo}</div>
                    <div class="elements-grid">
                        ${grouped[tramo]
                          .map(
                            (e) => `
                            <div class="message-card" id="elem_card_${e.id}">
                                <div class="message-header">
                                    <span><strong>${e.regiao}</strong> | ${
                              e.familia
                            }</span>
                                    <div class="evaluator-only" style="display: ${
                                      appState.role === "avaliador"
                                        ? "flex"
                                        : "none"
                                    }; gap: 5px;">
                                        <button class="btn btn-secondary" style="padding: 2px 8px;" onclick="UI.editElementError('${
                                          e.id
                                        }')">✏️</button>
                                        <button class="btn btn-danger" style="padding: 2px 8px;" onclick="UI.removeElementError('${
                                          e.id
                                        }')">×</button>
                                    </div>
                                </div>
                                <div style="color: var(--danger); font-weight: 600; font-size: 0.9rem; margin-bottom: 5px;">${
                                  e.erro
                                }</div>
                                ${
                                  e.obs
                                    ? `<div style="font-size: 0.85rem; color: var(--text-secondary); border-left: 2px solid var(--border); padding-left: 10px; margin: 10px 0;">${e.obs}</div>`
                                    : ""
                                }
                                
                                <div class="inspector-section">
                                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 5px;">RESPOSTAS DA INSPEÇÃO:</div>
                                    <div id="responses_${e.id}">
                                        ${e.responses
                                          .map(
                                            (r) => `
                                            <div style="font-size: 0.8rem; background: var(--bg-tertiary); padding: 5px 10px; border-radius: 4px; margin-bottom: 4px;">
                                                <strong>Inspetor:</strong> ${r.text} <small>(${r.date})</small>
                                            </div>
                                        `
                                          )
                                          .join("")}
                                    </div>
                                    <div class="inspector-only" style="display: ${
                                      appState.role === "inspetor"
                                        ? "flex"
                                        : "none"
                                    }; gap: 5px; margin-top: 10px;">
                                        <input type="text" class="form-input no-btn" style="padding: 5px 10px; font-size: 0.8rem;" id="resp_input_${
                                          e.id
                                        }" placeholder="Escrever resposta...">
                                        <button class="btn btn-primary" style="padding: 5px 15px;" onclick="UI.addResponse('${
                                          e.id
                                        }')">Enviar</button>
                                    </div>
                                </div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>`;
      });
    container.innerHTML = html;
  },

  removeElementError(id) {
    appState.elementErrors = appState.elementErrors.filter((e) => e.id !== id);
    this.renderElementsList();
    this.updateReport();
    this.updateTabBadges();
    AutoSave.trigger();

    // Atualiza o sistema de mensagens
    if (window.MessageSystem) {
      MessageSystem.renderMessages();
    }
  },

  editElementError(id) {
    const elem = appState.elementErrors.find((e) => e.id === id);
    if (!elem) return;

    const card = document.getElementById("elem_card_" + id);
    if (!card) return;

    const renderEditOptions = (currentTramo) => {
      let regiaoHtml = "";
      let familiaHtml = '<option value="">Selecione</option>';

      if (currentTramo === "C") {
        regiaoHtml = `<option value="Complementar" selected>Complementar</option>`;
        COMPLEMENTARY_ELEMENTS.forEach((el) => {
          familiaHtml += `<option value="${el}" ${
            elem.familia === el ? "selected" : ""
          }>${el}</option>`;
        });
      } else {
        const regioes = ["Apoio", "Superestrutura", "Transição"];
        regiaoHtml = regioes
          .map(
            (r) =>
              `<option value="${r}" ${
                elem.regiao === r ? "selected" : ""
              }>${r}</option>`
          )
          .join("");

        Object.keys(ELEMENT_FAMILIES).forEach((region) => {
          familiaHtml += `<optgroup label="${region}">`;
          ELEMENT_FAMILIES[region].forEach((el) => {
            familiaHtml += `<option value="${el}" ${
              elem.familia === el ? "selected" : ""
            }>${el}</option>`;
          });
          familiaHtml += `</optgroup>`;
        });
      }
      return { regiaoHtml, familiaHtml };
    };

    const initial = renderEditOptions(elem.tramo);

    // Build options for tramo (incluindo C)
    const tramoOptions = [];
    for (let i = 1; i <= appState.work.numTramos; i++) {
      tramoOptions.push(
        `<option value="${i}" ${
          elem.tramo == i ? "selected" : ""
        }>${i}</option>`
      );
    }
    tramoOptions.push(
      `<option value="C" ${
        elem.tramo === "C" ? "selected" : ""
      }>C (Complementar)</option>`
    );

    // Build options for erro
    const erroOptions = ELEMENT_ERROR_TYPES.map(
      (tipo) =>
        `<option ${elem.erro === tipo ? "selected" : ""}>${tipo}</option>`
    ).join("");

    card.innerHTML = `
        <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
            <div style="font-weight: 700; margin-bottom: 10px; color: var(--primary);">✏️ Editando Elemento</div>
            <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="form-field">
                    <label class="form-label">Tramo</label>
                    <select class="form-input no-btn" id="edit_tramo_${id}">${tramoOptions.join(
      ""
    )}</select>
                </div>
                <div class="form-field">
                    <label class="form-label">Região</label>
                    <select class="form-input no-btn" id="edit_regiao_${id}">${
      initial.regiaoHtml
    }</select>
                </div>
                <div class="form-field" style="grid-column: span 2;">
                    <label class="form-label">Família de Elemento</label>
                    <select class="form-input no-btn" id="edit_familia_${id}" style="max-height: 150px;">${
      initial.familiaHtml
    }</select>
                </div>
                <div class="form-field" style="grid-column: span 2;">
                    <label class="form-label">Inconsistência</label>
                    <select class="form-input no-btn" id="edit_erro_${id}">${erroOptions}</select>
                </div>
                <div class="form-field" style="grid-column: span 2;">
                    <label class="form-label">Observação</label>
                    <textarea class="form-input no-btn" id="edit_obs_${id}" style="height: 80px;">${
      elem.obs || ""
    }</textarea>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="UI.renderElementsList()">Cancelar</button>
                <button class="btn btn-primary" onclick="UI.updateElementError('${id}')">💾 Salvar</button>
            </div>
        </div>
    `;

    // Add listener for tramo change in edit view
    document
      .getElementById(`edit_tramo_${id}`)
      .addEventListener("change", (e) => {
        const tramoVal = e.target.value;
        const options = renderEditOptions(tramoVal);
        const regiaoSelect = document.getElementById(`edit_regiao_${id}`);
        const familiaSelect = document.getElementById(`edit_familia_${id}`);
        regiaoSelect.innerHTML = options.regiaoHtml;
        familiaSelect.innerHTML = options.familiaHtml;
        regiaoSelect.disabled = tramoVal === "C";
      });

    // Disable region if initially C
    if (elem.tramo === "C")
      document.getElementById(`edit_regiao_${id}`).disabled = true;
  },

  updateElementError(id) {
    const elem = appState.elementErrors.find((e) => e.id === id);
    if (!elem) return;

    elem.tramo = document.getElementById("edit_tramo_" + id).value;
    elem.regiao = document.getElementById("edit_regiao_" + id).value;
    elem.familia = document.getElementById("edit_familia_" + id).value;
    elem.erro = document.getElementById("edit_erro_" + id).value;
    elem.obs = document.getElementById("edit_obs_" + id).value;

    this.renderElementsList();
    this.updateReport();
    AutoSave.trigger();
  },

  addResponse(id) {
    const input = document.getElementById("resp_input_" + id);
    const text = input.value.trim();
    if (!text) return;

    const err = appState.elementErrors.find((e) => e.id === id);
    if (err) {
      err.responses.push({
        text,
        date: new Date().toLocaleString("pt-BR"),
      });
      input.value = "";
      this.renderElementsList();
      AutoSave.trigger();
    }
  },

  // --- ASPECTS ---
  renderAspects() {
    const container = document.getElementById("aspectosContainer");
    if (!container) return;

    if (appState.work.aspects.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum aspecto especial registrado.</p>';
      return;
    }

    container.innerHTML = `
            <table class="view-table">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th style="width: 150px;">Sigla</th>
                        <th>Comentário</th>
                        <th style="width: 80px;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${appState.work.aspects
                      .map(
                        (a) => `
                        <tr>
                            <td>${a.desc}</td>
                            <td>${a.sigla}</td>
                            <td>
                                <input type="text" class="form-input no-btn" value="${
                                  a.comment || ""
                                }" 
                                    oninput="UI.updateAspectComment('${
                                      a.id
                                    }', this.value)" placeholder="Adicionar nota...">
                            </td>
                            <td>
                                <div class="evaluator-only" style="display: ${
                                  appState.role === "avaliador"
                                    ? "flex"
                                    : "none"
                                }; gap: 5px;">
                                    <button class="btn btn-secondary" style="padding: 2px 8px;" onclick="UI.openErrorModal('aspect_${
                                      a.id
                                    }', 'Aspecto: ${a.desc}')">⚠</button>
                                    <button class="btn btn-danger" style="padding: 2px 8px;" onclick="UI.removeAspect('${
                                      a.id
                                    }')">×</button>
                                </div>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        `;
  },

  openAspectModal() {
    const select = document.getElementById("modalAspectSelect");
    select.innerHTML =
      '<option value="">Selecione</option>' +
      SPECIAL_ASPECTS.map(
        (s) => `<option value="${s.desc}">${s.desc}</option>`
      ).join("");

    document.getElementById("aspectModal").style.display = "flex";
  },

  closeAspectModal() {
    document.getElementById("aspectModal").style.display = "none";
    document.getElementById("modalAspectSelect").value = "";
  },

  addAspectFromModal() {
    const desc = document.getElementById("modalAspectSelect").value;
    if (!desc) return;

    const info = SPECIAL_ASPECTS.find((s) => s.desc === desc);
    const id = "aspect_" + Date.now();

    appState.work.aspects.push({
      id,
      desc: info.desc,
      sigla: info.sigla,
      comment: "",
    });

    this.closeAspectModal();
    this.renderAspects();
    AutoSave.trigger();
  },

  updateAspectComment(id, value) {
    const aspect = appState.work.aspects.find((a) => a.id === id);
    if (aspect) {
      aspect.comment = value;
      AutoSave.trigger();
    }
  },

  removeAspect(id) {
    appState.work.aspects = appState.work.aspects.filter((a) => a.id !== id);
    this.renderAspects();
    AutoSave.trigger();
  },

  // --- FUNCTIONAL DEFICIENCIES ---
  renderFunctionalDeficiencies() {
    const container = document.getElementById("deficienciasContainer");
    if (!container) return;

    if (appState.work.functionalDeficiencies.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma deficiência funcional registrada.</p>';
      return;
    }

    container.innerHTML = `
            <table class="view-table">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th style="width: 150px;">Unidade</th>
                        <th style="width: 100px;">Valor/Qtd</th>
                        <th style="width: 80px;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${appState.work.functionalDeficiencies
                      .map(
                        (d) => `
                        <tr>
                            <td>${d.desc}</td>
                            <td>${d.unit}</td>
                            <td>
                                <input type="number" class="form-input no-btn" value="${
                                  d.value || 0
                                }" 
                                    onchange="UI.updateDeficValue('${
                                      d.id
                                    }', this.value)">
                            </td>
                            <td>
                                <div class="evaluator-only" style="display: ${
                                  appState.role === "avaliador"
                                    ? "flex"
                                    : "none"
                                }; gap: 5px;">
                                    <button class="btn btn-secondary" style="padding: 2px 8px;" onclick="UI.openErrorModal('defic_${
                                      d.id
                                    }', 'Deficiência: ${d.desc}')">⚠</button>
                                    <button class="btn btn-danger" style="padding: 2px 8px;" onclick="UI.removeDefic('${
                                      d.id
                                    }')">×</button>
                                </div>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        `;
  },

  openDeficModal() {
    const select = document.getElementById("modalDeficSelect");
    select.innerHTML =
      '<option value="">Selecione</option>' +
      FUNCTIONAL_DEFICIENCIES.map(
        (d) => `<option value="${d.desc}">${d.desc}</option>`
      ).join("");

    document.getElementById("deficModal").style.display = "flex";
  },

  closeDeficModal() {
    document.getElementById("deficModal").style.display = "none";
    document.getElementById("modalDeficSelect").value = "";
  },

  addDeficFromModal() {
    const desc = document.getElementById("modalDeficSelect").value;
    if (!desc) return;

    const info = FUNCTIONAL_DEFICIENCIES.find((f) => f.desc === desc);
    const id = "defic_" + Date.now();

    appState.work.functionalDeficiencies.push({
      id,
      desc: info.desc,
      unit: info.unit,
      value: 0,
    });

    this.closeDeficModal();
    this.renderFunctionalDeficiencies();
    AutoSave.trigger();
  },

  updateDeficValue(id, value) {
    const defic = appState.work.functionalDeficiencies.find((d) => d.id === id);
    if (defic) {
      defic.value = value;
      AutoSave.trigger();
    }
  },

  removeDefic(id) {
    appState.work.functionalDeficiencies =
      appState.work.functionalDeficiencies.filter((d) => d.id !== id);
    this.renderFunctionalDeficiencies();
    AutoSave.trigger();
  },

  // --- ATTACHMENTS ---
  addAnexoError() {
    const nome = document.getElementById("anexoNome").value.trim();
    const tipo = document.getElementById("anexoTipo").value;
    const inconsist = document.getElementById("anexoTipoErro").value;
    const obs = document.getElementById("anexoObs").value.trim();

    if (!nome) return;

    // Cria descrição formatada para aparecer nas mensagens
    let description = `Anexo [${nome}]: ${inconsist}`;
    if (obs) {
      description += ` - ${obs}`;
    }

    const anexoError = {
      id: "anexo_" + Date.now(),
      nome,
      tipo,
      inconsist,
      obs,
      description: description, // Adiciona descrição para sistema de mensagens
      nomeUsuario: window.AuthSystem?.currentUser?.name || 'Avaliador',
      perfil: window.AuthSystem?.currentUser?.role || 'avaliador',
      dataHistorico: new Date().toISOString(),
      timestamp: Date.now()
    };

    appState.anexoErrors.push(anexoError);

    document.getElementById("anexoNome").value = "";
    document.getElementById("anexoObs").value = "";
    this.renderAttachments();
    this.updateReport();
    this.updateTabBadges();
    AutoSave.trigger();

    // Atualiza o sistema de mensagens
    if (window.MessageSystem) {
      MessageSystem.renderMessages();
    }
  },

  renderAttachments() {
    const container = document.getElementById("attachmentsContainer");
    if (appState.anexoErrors.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: var(--text-muted);">Nenhum erro de anexo apontado.</p>';
      return;
    }

    container.innerHTML = `
            <div class="section-title">🔴 Erros em Anexos/Fotos</div>
            <div class="elements-grid">
                ${appState.anexoErrors
                  .map(
                    (e) => `
                    <div class="message-card">
                        <div class="message-header">
                            <span><strong>${e.tipo}:</strong> ${e.nome}</span>
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-secondary" style="padding: 2px 8px;" onclick="UI.openEditAnexo('${
                                  e.id
                                }')">✎</button>
                                <button class="btn btn-danger" style="padding: 2px 8px;" onclick="UI.removeAnexoError('${
                                  e.id
                                }')">×</button>
                            </div>
                        </div>
                        <div style="color: var(--danger); font-size: 0.85rem; font-weight: 600;">${
                          e.inconsist
                        }</div>
                        ${
                          e.obs
                            ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">${e.obs}</div>`
                            : ""
                        }
                    </div>
                `
                  )
                  .join("")}
            </div>`;
  },

  removeAnexoError(id) {
    appState.anexoErrors = appState.anexoErrors.filter((e) => e.id !== id);
    this.renderAttachments();
    this.updateReport();
    this.updateTabBadges();
    AutoSave.trigger();

    // Atualiza o sistema de mensagens
    if (window.MessageSystem) {
      MessageSystem.renderMessages();
    }
  },

  // --- MESSAGES ---
  addMensagem() {
    const input = document.getElementById("novaMensagem");
    const text = input.value.trim();
    if (!text) return;

    const messageData = {
      id: "msg_" + Date.now(),
      author:
        appState.role === "avaliador"
          ? "Auditor/Avaliador"
          : "Inspetor de Campo",
      text,
      date: new Date().toLocaleString("pt-BR"),
    };

    appState.mensagens.push(messageData);

    // Envia mensagem via MultiPeerSync se conectado
    if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
      MultiPeerSync.broadcastMessage(messageData);
    }

    input.value = "";
    this.renderMessages();
    AutoSave.trigger();
  },

  renderMessages() {
    // Delegate to MessageSystem if available (new system)
    if (window.MessageSystem && typeof MessageSystem.renderMessages === 'function') {
      MessageSystem.renderMessages();
      return;
    }

    // Fallback: old container (kept for backward compatibility)
    const container = document.getElementById("mensagensContainer");
    if (!container) {
      // Container doesn't exist, skip rendering
      return;
    }

    // Convert all errors to message format
    const allMessages = [];

    // Add field errors as messages
    Object.values(appState.errors).forEach((err) => {
      const typesText = err.types.join("; ");
      allMessages.push({
        id: err.id,
        type: "field",
        text: `Campo [${err.label}]: ${typesText}${
          err.obs ? " - " + err.obs : ""
        }`,
        author: appState.work.avaliador || "Avaliador",
        role: "Avaliador",
        date: new Date().toLocaleString("pt-BR"),
        isOwn: true,
      });
    });

    // Add element errors as messages
    appState.elementErrors.forEach((err) => {
      allMessages.push({
        id: err.id,
        type: "element",
        text: `Tramo ${err.tramo} - ${err.regiao} | ${err.familia}: ${
          err.erro
        }${err.obs ? " - " + err.obs : ""}`,
        author: appState.work.avaliador || "Avaliador",
        role: "Avaliador",
        date: new Date().toLocaleString("pt-BR"),
        isOwn: true,
      });
    });

    // Add anexo errors as messages
    appState.anexoErrors.forEach((err) => {
      allMessages.push({
        id: err.id,
        type: "anexo",
        text: `Anexo [${err.nome}]: ${err.inconsist}${
          err.obs ? " - " + err.obs : ""
        }`,
        author: appState.work.avaliador || "Avaliador",
        role: "Avaliador",
        date: new Date().toLocaleString("pt-BR"),
        isOwn: true,
      });
    });

    // Add custom messages
    appState.mensagens.forEach((m) => {
      allMessages.push({
        id: m.id,
        type: "message",
        text: m.text,
        author: m.author,
        role: m.author.includes("Auditor") ? "Avaliador" : "Inspetor",
        date: m.date,
        isOwn: m.author.includes("Auditor") || m.author.includes("Avaliador"),
      });
    });

    if (allMessages.length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Nenhuma inconsistência ou mensagem registrada.</p>';
      this.updateMessageCounters(0, 0, 0);
      return;
    }

    let totalCount = 0;
    let pendingCount = 0;
    let completedCount = 0;

    const html = allMessages
      .map((msg) => {
        const isCompleted = appState.completionStates.get(msg.id) || false;
        const savedResponse = appState.messageResponses.get(msg.id);

        if (msg.isOwn) {
          totalCount++;
          if (isCompleted) completedCount++;
          else pendingCount++;
        }

        const cardClasses = msg.isOwn
          ? "message-card own-message"
          : "message-card other-message";
        const completedClass = msg.isOwn && isCompleted ? " completed" : "";

        return `
                <div class="${cardClasses}${completedClass}" data-message-id="${
          msg.id
        }">
                    <div class="message-header">
                        ${
                          msg.isOwn
                            ? `
                            <div class="checkbox-container">
                                <input type="checkbox" class="message-checkbox"
                                    ${isCompleted ? "checked" : ""}
                                    onchange="UI.toggleCompletion('${msg.id}')">
                            </div>
                        `
                            : ""
                        }
                        <div class="message-content">
                            <div class="message-text">${msg.text}</div>
                            <div class="message-meta">
                                <div>
                                    <strong>${msg.author}</strong> - ${
          msg.role
        }<br>
                                    <small>${msg.date}</small>
                                </div>
                                ${
                                  msg.isOwn
                                    ? `
                                    <span style="background: ${
                                      isCompleted
                                        ? "rgba(34, 197, 94, 0.2)"
                                        : "rgba(234, 179, 8, 0.2)"
                                    };
                                          color: ${
                                            isCompleted
                                              ? "var(--success)"
                                              : "var(--warning)"
                                          };
                                          padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                        ${
                                          isCompleted
                                            ? "✅ Corrigido"
                                            : "⏳ Pendente"
                                        }
                                    </span>
                                `
                                    : `
                                    <span style="background: rgba(100, 116, 139, 0.2); color: var(--text-muted);
                                          padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                        📤 Sua Mensagem
                                    </span>
                                `
                                }
                            </div>
                            ${
                              msg.isOwn
                                ? `
                                <div class="response-section" style="margin-top: 15px;">
                                    ${
                                      savedResponse
                                        ? `
                                        <div class="saved-response">
                                            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 5px;">
                                                RESPOSTA DA INSPEÇÃO:
                                            </div>
                                            <div style="font-size: 0.9rem; line-height: 1.5; margin-bottom: 8px;">${
                                              savedResponse.text
                                            }</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">
                                                <small>${
                                                  savedResponse.date
                                                }</small>
                                            </div>
                                            <div class="inspector-only" style="display: ${
                                              appState.role === "inspetor"
                                                ? "flex"
                                                : "none"
                                            }; gap: 8px; margin-top: 10px;">
                                                <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.85rem;"
                                                    onclick="UI.editResponse('${
                                                      msg.id
                                                    }')">✏️ Editar</button>
                                                <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.85rem;"
                                                    onclick="UI.copyResponse('${
                                                      msg.id
                                                    }')">📋 Copiar</button>
                                            </div>
                                        </div>
                                    `
                                        : `
                                        <div class="inspector-only" style="display: ${
                                          appState.role === "inspetor"
                                            ? "block"
                                            : "none"
                                        };">
                                            <textarea class="response-textarea" id="response_input_${
                                              msg.id
                                            }"
                                                placeholder="Escrever resposta..."></textarea>
                                            <button class="btn btn-primary" style="margin-top: 8px; padding: 6px 16px;"
                                                onclick="UI.saveResponse('${
                                                  msg.id
                                                }')">💾 Salvar Resposta</button>
                                        </div>
                                    `
                                    }
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");

    container.innerHTML = html;
    this.updateMessageCounters(totalCount, pendingCount, completedCount);
  },

  updateMessageCounters(total, pending, completed) {
    document.getElementById("msgsTotalCount").textContent = total;
    document.getElementById("msgsPendingCount").textContent = pending;
    document.getElementById("msgsCompletedCount").textContent = completed;
  },

  toggleCompletion(id) {
    const currentState = appState.completionStates.get(id) || false;
    const newState = !currentState;
    appState.completionStates.set(id, newState);

    // Envia notificação via MultiPeerSync se conectado e se foi marcado como resolvido
    if (window.MultiPeerSync && MultiPeerSync.hasConnections() && newState) {
      MultiPeerSync.broadcastErrorResolved(id);
    }

    this.renderMessages();
    AutoSave.trigger();
  },

  saveResponse(id) {
    const textarea = document.getElementById("response_input_" + id);
    const text = textarea.value.trim();
    if (!text) {
      alert("Digite uma resposta antes de salvar.");
      return;
    }

    appState.messageResponses.set(id, {
      text,
      date: new Date().toLocaleString("pt-BR"),
    });

    this.renderMessages();
    AutoSave.trigger();
  },

  editResponse(id) {
    const savedResponse = appState.messageResponses.get(id);
    if (!savedResponse) return;

    const card = document.querySelector(`[data-message-id="${id}"]`);
    if (!card) return;

    const responseSection = card.querySelector(".saved-response");
    if (!responseSection) return;

    responseSection.innerHTML = `
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 5px;">
                EDITANDO RESPOSTA:
            </div>
            <textarea class="response-textarea" id="edit_response_${id}" style="margin-bottom: 10px;">${savedResponse.text}</textarea>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" style="padding: 6px 16px;" onclick="UI.renderMessages()">Cancelar</button>
                <button class="btn btn-primary" style="padding: 6px 16px;" onclick="UI.updateResponse('${id}')">💾 Salvar</button>
            </div>
        `;
  },

  updateResponse(id) {
    const textarea = document.getElementById("edit_response_" + id);
    const text = textarea.value.trim();
    if (!text) {
      alert("Digite uma resposta antes de salvar.");
      return;
    }

    appState.messageResponses.set(id, {
      text,
      date: new Date().toLocaleString("pt-BR"),
    });

    this.renderMessages();
    AutoSave.trigger();
  },

  copyResponse(id) {
    const savedResponse = appState.messageResponses.get(id);
    if (!savedResponse) return;

    navigator.clipboard
      .writeText(savedResponse.text)
      .then(() => {
        alert("Resposta copiada para a área de transferência!");
      })
      .catch((err) => {
        console.error("Erro ao copiar:", err);
        alert("Não foi possível copiar a resposta.");
      });
  },

  // --- ERROR MODAL ---
  openErrorModal(fieldId, fieldLabel) {
    appState.currentField = fieldId;
    const fieldEl =
      document.getElementById(fieldId) ||
      document.getElementById("f_" + fieldId);
    const valor = fieldEl ? fieldEl.value || "(vazio)" : "(vazio)";

    const existing = appState.errors[fieldId];

    const modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Campo</div>
                <div style="font-size: 1.1rem; font-weight: 700;">${fieldLabel}</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Valor no Cadastro</div>
                <div style="padding: 10px; background: var(--bg-tertiary); border-radius: 4px; border: 1px dashed var(--border); font-family: monospace;">${valor}</div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label class="form-label" style="display: block; margin-bottom: 8px;">Tipo de Inconsistência</label>
                <div id="modalTipos" style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    ${this.getErrorTypes(fieldId)
                      .map(
                        (t) => `
                        <label style="display: flex; gap: 10px; align-items: center; padding: 10px; background: var(--bg-tertiary); border-radius: 4px; cursor: pointer;">
                            <input type="checkbox" name="err_tipo" value="${t}" ${
                          existing?.types?.includes(t) ? "checked" : ""
                        }>
                            <span style="font-size: 14px;">${t}</span>
                        </label>
                    `
                      )
                      .join("")}
                </div>
            </div>

            <div class="form-field">
                <label class="form-label">Observação detalhada</label>
                <textarea class="form-input no-btn" id="modalObs" style="height: 80px;">${
                  existing?.obs || ""
                }</textarea>
            </div>
        `;

    document.getElementById("btnRemoveError").style.display = existing
      ? "block"
      : "none";
    document.getElementById("errorModal").classList.add("show");
  },

  getErrorTypes(fieldId) {
    // Determine category - check for tramo fields first
    if (fieldId.startsWith("tramo_")) {
      return ERROR_TYPES.tramos;
    }

    // Check if field has a mapped category
    const category = FIELD_CATEGORIES[fieldId] || "default";
    return ERROR_TYPES[category];
  },

  closeErrorModal() {
    document.getElementById("errorModal").classList.remove("show");
  },

  applyError() {
    const fieldId = appState.currentField;
    const types = Array.from(
      document.querySelectorAll('input[name="err_tipo"]:checked')
    ).map((i) => i.value);
    const obs = document.getElementById("modalObs").value.trim();

    if (types.length === 0 && !obs) {
      this.clearFieldError();
      return;
    }

    const labelMatch = document
      .querySelector(`button[onclick*="'${fieldId}'"]`)
      .getAttribute("onclick")
      .match(/'([^']+)',\s*'([^']+)'/);
    const label = labelMatch ? labelMatch[2] : "Campo";

    // Cria descrição formatada para aparecer nas mensagens
    let description = '';
    if (types.length > 0) {
      description = types.join('; ');
    }
    if (obs) {
      description += (description ? ' - ' : '') + obs;
    }

    const fieldError = {
      id: fieldId,
      label,
      value:
        (
          document.getElementById(fieldId) ||
          document.getElementById("f_" + fieldId)
        )?.value || "(vazio)",
      types,
      obs,
      description: description, // Adiciona descrição para sistema de mensagens
      nomeUsuario: window.AuthSystem?.currentUser?.name || 'Avaliador',
      perfil: window.AuthSystem?.currentUser?.role || 'avaliador',
      dataHistorico: new Date().toISOString(),
      timestamp: Date.now()
    };

    appState.errors[fieldId] = fieldError;

    // Envia notificação via MultiPeerSync se conectado
    if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
      MultiPeerSync.broadcastErrorAdded({
        ...fieldError,
        type: "field",
        fieldId,
        timestamp: Date.now(),
      });
    }

    this.closeErrorModal();
    this.updateFieldVisuals();
    this.updateReport();
    this.updateTabBadges();
    AutoSave.trigger();

    // Atualiza o sistema de mensagens
    if (window.MessageSystem) {
      MessageSystem.renderMessages();
    }
  },

  clearFieldError() {
    delete appState.errors[appState.currentField];
    this.closeErrorModal();
    this.updateFieldVisuals();
    this.updateReport();
    this.updateTabBadges();
    AutoSave.trigger();

    // Atualiza o sistema de mensagens
    if (window.MessageSystem) {
      MessageSystem.renderMessages();
    }
  },

  updateFieldVisuals() {
    document.querySelectorAll(".error-btn").forEach((btn) => {
      const onclick = btn.getAttribute("onclick");
      if (!onclick) return;
      const match = onclick.match(/'([^']+)'/);
      if (match) {
        const fieldId = match[1];
        btn.classList.toggle("has-error", !!appState.errors[fieldId]);
      }
    });
  },

  // --- TAB BADGES ---
  updateTabBadges() {
    // Remove all existing badges
    document.querySelectorAll(".tab-badge").forEach((b) => b.remove());

    // Count errors per tab
    const tabCounts = {
      ident: 0,
      carac: 0,
      elem: 0,
      aspect: 0,
      defic: 0,
      rotas: 0,
      obs: 0,
      anexos: 0,
    };

    // Count field errors
    Object.keys(appState.errors).forEach((fieldId) => {
      // Check for tramos
      if (fieldId.startsWith("tramo_")) {
        tabCounts.carac++;
        return;
      }

      // Check mapped fields
      for (const [tab, fields] of Object.entries(TAB_FIELD_MAP)) {
        if (fields.includes(fieldId)) {
          tabCounts[tab]++;
          return;
        }
      }
    });

    // Add element errors
    tabCounts.elem += appState.elementErrors.length;

    // Add anexo errors
    tabCounts.anexos += appState.anexoErrors.length;

    // Add functional deficiencies
    tabCounts.defic += appState.work.functionalDeficiencies.length;

    // Add aspects
    tabCounts.aspect += appState.work.aspects.length;

    // Apply badges to tabs
    Object.entries(tabCounts).forEach(([tab, count]) => {
      if (count > 0) {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        if (tabBtn) {
          const badge = document.createElement("span");
          badge.className = "tab-badge";
          badge.textContent = count;
          tabBtn.style.position = "relative";
          tabBtn.appendChild(badge);
        }
      }
    });
  },

  // --- REPORT & TOOLS ---
  updateReport() {
    const work = appState.work;
    const errors = appState.errors;
    const elemErrors = appState.elementErrors;
    const anexoErrors = appState.anexoErrors;

    let report = `RELATÓRIO DE AUDITORIA DE OAE\n`;
    report += `════════════════════════════════════════════\n`;
    report += `OAE: ${work.nome || "N/A"}\n`;
    report += `CÓDIGO: ${work.codigo || "N/A"}\n`;
    report += `AUDITOR: ${work.avaliador || "N/A"}\n`;
    report += `DATA: ${new Date().toLocaleDateString(
      "pt-BR"
    )} ${new Date().toLocaleTimeString("pt-BR")}\n`;
    report += `════════════════════════════════════════════\n\n`;

    // Organizar erros por aba
    const errorsByTab = {
      IDENTIFICAÇÃO: [],
      "CARACTERÍSTICAS FUNCIONAIS": [],
      "ASPECTOS ESPECIAIS": [],
      "DEFICIÊNCIAS FUNCIONAIS": [],
      "ROTAS ALTERNATIVAS": [],
      OBSERVAÇÕES: [],
    };

    // Classificar field errors por aba
    Object.keys(errors).forEach((key) => {
      const e = errors[key];
      let tabName = "OUTROS";

      if (key.startsWith("tramo_")) {
        tabName = "CARACTERÍSTICAS FUNCIONAIS";
      } else if (TAB_FIELD_MAP.ident.includes(key)) {
        tabName = "IDENTIFICAÇÃO";
      } else if (TAB_FIELD_MAP.carac.includes(key)) {
        tabName = "CARACTERÍSTICAS FUNCIONAIS";
      } else if (TAB_FIELD_MAP.aspect.includes(key)) {
        tabName = "ASPECTOS ESPECIAIS";
      } else if (TAB_FIELD_MAP.defic.includes(key)) {
        tabName = "DEFICIÊNCIAS FUNCIONAIS";
      } else if (TAB_FIELD_MAP.rotas.includes(key)) {
        tabName = "ROTAS ALTERNATIVAS";
      } else if (TAB_FIELD_MAP.obs.includes(key)) {
        tabName = "OBSERVAÇÕES";
      }

      if (!errorsByTab[tabName]) errorsByTab[tabName] = [];
      errorsByTab[tabName].push(e);
    });

    // Imprimir erros por aba
    Object.keys(errorsByTab).forEach((tabName) => {
      const tabErrors = errorsByTab[tabName];
      if (tabErrors.length > 0) {
        report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📋 ${tabName}\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        tabErrors.forEach((e, idx) => {
          report += `${idx + 1}. Campo: ${e.label}\n`;
          report += `   Valor Atual: ${e.value}\n`;
          if (e.types.length) report += `   Motivo: ${e.types.join("; ")}\n`;
          if (e.obs) report += `   Observação: ${e.obs}\n`;
          report += `\n`;
        });
      }
    });

    // Element errors - agrupar por tramo
    if (elemErrors.length > 0) {
      report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `🔧 ELEMENTOS COMPONENTES\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      // Agrupar por tramo
      const elemsByTramo = {};
      elemErrors.forEach((e) => {
        if (!elemsByTramo[e.tramo]) elemsByTramo[e.tramo] = [];
        elemsByTramo[e.tramo].push(e);
      });

      // Ordenar tramos (C no final)
      const tramos = Object.keys(elemsByTramo).sort((a, b) => {
        if (a === "C") return 1;
        if (b === "C") return -1;
        return parseInt(a) - parseInt(b);
      });

      tramos.forEach((tramo) => {
        report += `╔═══ TRAMO ${tramo} ═══════════════════════════════════╗\n\n`;

        elemsByTramo[tramo].forEach((e, idx) => {
          report += `  ${idx + 1}. Região: ${e.regiao}\n`;
          report += `     Elemento: ${e.familia}\n`;
          report += `     Inconsistência: ${e.erro}\n`;
          if (e.obs) report += `     Observação: ${e.obs}\n`;
          if (e.responses.length) {
            report += `     Respostas da Inspeção:\n`;
            e.responses.forEach(
              (r) => (report += `       → ${r.text} (${r.date})\n`)
            );
          }
          report += `\n`;
        });

        report += `╚═════════════════════════════════════════════════╝\n\n`;
      });
    }

    // Anexo errors
    if (anexoErrors.length > 0) {
      report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `📎 ARQUIVOS ANEXOS\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      anexoErrors.forEach((e, idx) => {
        report += `${idx + 1}. Tipo: ${e.tipo}\n`;
        report += `   Nome: ${e.nome}\n`;
        report += `   Inconsistência: ${e.inconsist}\n`;
        if (e.obs) report += `   Observação: ${e.obs}\n`;
        report += `\n`;
      });
    }

    // Deficiências Funcionais
    if (work.functionalDeficiencies && work.functionalDeficiencies.length > 0) {
      report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `⚠️ DEFICIÊNCIAS FUNCIONAIS ENCONTRADAS\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      work.functionalDeficiencies.forEach((d, idx) => {
        report += `${idx + 1}. ${d.desc}\n`;
        report += `   Valor: ${d.value} ${d.unit}\n\n`;
      });
    }

    // Aspectos Especiais
    if (work.aspects && work.aspects.length > 0) {
      report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `💎 ASPECTOS ESPECIAIS ENCONTRADOS\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      work.aspects.forEach((a, idx) => {
        report += `${idx + 1}. ${a.desc} (${a.sigla})\n`;
        if (a.comment) report += `   Nota: ${a.comment}\n`;
        report += `\n`;
      });
    }

    const total =
      Object.keys(errors).length +
      elemErrors.length +
      anexoErrors.length +
      work.functionalDeficiencies.length +
      work.aspects.length;
    document.getElementById("totalErrorBadge").textContent = total;
    document.getElementById("reportText").value = report;
  },

  copyReport() {
    const text = document.getElementById("reportText").value;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.querySelector('button[onclick="UI.copyReport()"]');
      const original = btn.innerHTML;
      btn.innerHTML = "✓ Copiado!";
      setTimeout(() => (btn.innerHTML = original), 2000);
    });
  },

  clearAll() {
    if (confirm("Deseja limpar todos os apontamentos desta obra?")) {
      appState.errors = {};
      appState.elementErrors = [];
      appState.anexoErrors = [];
      this.renderAll();
      this.updateTabBadges();
      AutoSave.trigger();
    }
  },

  async saveToDatabase() {
    if (!appState.work.codigo || appState.work.codigo.trim() === "") {
      alert(
        "⚠️ Por favor, informe o código da obra antes de salvar no banco de dados."
      );
      // Foca no campo de código
      document.getElementById("obraCodigo")?.focus();
      return;
    }

    try {
      // Garante que metadata existe antes de salvar
      if (!appState.work.metadata) {
        appState.work.metadata = {
          createdBy: AuthSystem.currentUser?.email || "unknown",
          createdAt: new Date().toISOString(),
          lastModifiedBy: AuthSystem.currentUser?.email || "unknown",
          lastModifiedAt: new Date().toISOString(),
          lote: AuthSystem.currentUser?.lote || "Admin", // Vincula ao lote do usuário
          sharedWith: [],
          isPublic: false,
          version: 1,
          tags: [],
          status: OBRA_STATUS.CADASTRO, // Status inicial
        };
      } else {
        // Atualiza última modificação
        appState.work.metadata.lastModifiedBy = AuthSystem.currentUser?.email || "unknown";
        appState.work.metadata.lastModifiedAt = new Date().toISOString();
        // Garante que lote está definido
        if (!appState.work.metadata.lote) {
          appState.work.metadata.lote = AuthSystem.currentUser?.lote || "Admin";
        }
      }

      await DB.saveObra(appState.work.codigo, {
        work: appState.work,
        errors: appState.errors,
        elementErrors: appState.elementErrors,
        anexoErrors: appState.anexoErrors,
        mensagens: appState.mensagens,
        completionStates: appState.completionStates,
        messageResponses: appState.messageResponses,
      });

      this.showToast(
        `✅ Obra "${appState.work.codigo}" salva com sucesso no banco de dados!`
      );
      console.log("Manual save to database successful:", appState.work.codigo);

      // Atualiza título com status
      this.updateWorkTitle();
    } catch (err) {
      console.error("Save to database failed:", err);
      alert("❌ Erro ao salvar no banco de dados: " + err.message);
    }
  },

  showExportModal() {
    Export.all(); // Shortcut for now
  },

  async generateFormattedPDF() {
    try {
      // Verifica se há código para exportar
      if (!appState.work.codigo) {
        alert("Preencha o código da obra antes de exportar o PDF.");
        return;
      }

      // Importa jsPDF dinamicamente
      if (typeof window.jspdf === "undefined") {
        // Carrega jsPDF se não estiver disponível
        await this.loadJsPDF();
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Configurações de estilo
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Função para adicionar nova página se necessário
      function checkPageBreak(requiredHeight) {
        if (yPosition + requiredHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
      }

      // Função para adicionar texto com quebra automática
      function addText(text, fontSize = 12, fontStyle = "normal") {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", fontStyle);
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);

        lines.forEach((line) => {
          checkPageBreak(fontSize * 0.5);
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });

        return yPosition;
      }

      // 1. CAPA DO RELATÓRIO
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO DE OBRA", pageWidth / 2, 60, { align: "center" });

      doc.setFontSize(20);
      doc.text(appState.work.nome || "Sem Nome", pageWidth / 2, 80, {
        align: "center",
      });

      doc.setFontSize(16);
      doc.text(`Código: ${appState.work.codigo || "N/A"}`, pageWidth / 2, 100, {
        align: "center",
      });

      // Informações do usuário
      if (AuthSystem.currentUser) {
        doc.setFontSize(12);
        doc.text(
          `Gerado por: ${AuthSystem.currentUser.name} (${AuthSystem.currentUser.email})`,
          pageWidth / 2,
          120,
          { align: "center" }
        );
        doc.text(
          `Perfil: ${AuthSystem.getRoleDisplayName(
            AuthSystem.currentUser.role
          )}`,
          pageWidth / 2,
          130,
          { align: "center" }
        );
      }

      doc.text(
        `Data: ${new Date().toLocaleString("pt-BR")}`,
        pageWidth / 2,
        140,
        { align: "center" }
      );

      // Nova página para o conteúdo
      doc.addPage();
      yPosition = margin;
      doc.setTextColor(0, 0, 0);

      // 2. SUMÁRIO EXECUTIVO
      addText("SUMÁRIO EXECUTIVO", 18, "bold");
      yPosition += 5;

      const summary = [
        `Obra: ${appState.work.nome || "N/A"}`,
        `Código: ${appState.work.codigo || "N/A"}`,
        `Avaliador: ${appState.work.avaliador || "N/A"}`,
        `Tipo: ${appState.work.tipo || "cadastral"}`,
        `Data de Geração: ${new Date().toLocaleString("pt-BR")}`,
        `Total de Erros: ${Object.keys(appState.errors || {}).length}`,
        `Total de Elementos: ${
          Object.keys(appState.elementErrors || {}).length
        }`,
        `Total de Mensagens: ${(appState.mensagens || []).length}`,
      ];

      summary.forEach((line) => {
        addText(`• ${line}`, 11, "normal");
      });

      yPosition += 10;

      // 3. DADOS DE IDENTIFICAÇÃO
      addText("DADOS DE IDENTIFICAÇÃO", 16, "bold");
      yPosition += 5;

      const identificationData = [
        { label: "Nome da Obra", value: appState.work.nome || "N/A" },
        { label: "Código", value: appState.work.codigo || "N/A" },
        { label: "Avaliador", value: appState.work.avaliador || "N/A" },
        { label: "Tipo de Obra", value: appState.work.tipo || "cadastral" },
        { label: "Fiscal", value: appState.work.fiscal || "N/A" },
        { label: "Data Início", value: appState.work.dataInicio || "N/A" },
        { label: "Data Término", value: appState.work.dataTermino || "N/A" },
        { label: "Localização", value: appState.work.localizacao || "N/A" },
      ];

      identificationData.forEach((item) => {
        addText(`${item.label}: ${item.value}`, 11, "normal");
      });

      yPosition += 10;

      // 4. ERROS DE CAMPO (ABA CAMPOS)
      if (Object.keys(appState.errors || {}).length > 0) {
        addText("ERROS DE CAMPO", 16, "bold");
        yPosition += 5;

        Object.entries(appState.errors).forEach(([fieldId, error]) => {
          checkPageBreak(20);

          // Cabeçalho do erro
          doc.setFillColor(255, 0, 0);
          doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`Campo: ${fieldId}`, margin + 2, yPosition + 2);

          yPosition += 10;
          doc.setTextColor(0, 0, 0);

          // Detalhes do erro
          const errorDetails = [
            `Erro: ${error.error || "N/A"}`,
            `Descrição: ${error.description || "N/A"}`,
            `Data: ${
              error.date ? new Date(error.date).toLocaleString("pt-BR") : "N/A"
            }`,
          ];

          errorDetails.forEach((detail) => {
            addText(`  ${detail}`, 10, "normal");
          });

          yPosition += 5;
        });

        yPosition += 10;
      }

      // 5. ERROS DE ELEMENTO (ABA ELEMENTOS)
      if (Object.keys(appState.elementErrors || {}).length > 0) {
        addText("ERROS DE ELEMENTO", 16, "bold");
        yPosition += 5;

        Object.entries(appState.elementErrors).forEach(([elementId, error]) => {
          checkPageBreak(20);

          // Cabeçalho do elemento
          doc.setFillColor(255, 165, 0);
          doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`Elemento: ${elementId}`, margin + 2, yPosition + 2);

          yPosition += 10;
          doc.setTextColor(0, 0, 0);

          // Detalhes do elemento
          const elementDetails = [
            `Tramo: ${error.tramo || "N/A"}`,
            `Região: ${error.regiao || "N/A"}`,
            `Família: ${error.familia || "N/A"}`,
            `Erro: ${error.error || "N/A"}`,
            `Observação: ${error.observacao || "N/A"}`,
            `Data: ${
              error.date ? new Date(error.date).toLocaleString("pt-BR") : "N/A"
            }`,
          ];

          elementDetails.forEach((detail) => {
            addText(`  ${detail}`, 10, "normal");
          });

          yPosition += 5;
        });

        yPosition += 10;
      }

      // 6. MENSAGENS (ABA MENSAGENS)
      if (appState.mensagens && appState.mensagens.length > 0) {
        addText("MENSAGENS E COMUNICAÇÃO", 16, "bold");
        yPosition += 5;

        appState.mensagens.forEach((message, index) => {
          checkPageBreak(15);

          // Cabeçalho da mensagem
          doc.setFillColor(0, 128, 255);
          doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(
            `Mensagem #${index + 1} - ${message.author || "N/A"}`,
            margin + 2,
            yPosition + 2
          );

          yPosition += 10;
          doc.setTextColor(0, 0, 0);

          // Conteúdo da mensagem
          addText(`Data: ${message.date || "N/A"}`, 10, "normal");
          addText(`Conteúdo: ${message.text || "N/A"}`, 10, "normal");

          // Status de conclusão
          const isCompleted =
            appState.completionStates &&
            appState.completionStates.get(message.id);
          if (isCompleted !== undefined) {
            addText(
              `Status: ${isCompleted ? "✅ Concluído" : "⏳ Pendente"}`,
              10,
              "normal"
            );
          }

          yPosition += 5;
        });

        yPosition += 10;
      }

      // 7. AUDITORIA (ABA AUDITORIA)
      if (appState.work.auditTrail && appState.work.auditTrail.length > 0) {
        addText("HISTÓRICO DE AUDITORIA", 16, "bold");
        yPosition += 5;

        appState.work.auditTrail.forEach((audit, index) => {
          checkPageBreak(15);

          // Cabeçalho da auditoria
          doc.setFillColor(128, 0, 128);
          doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(
            `Auditoria #${index + 1} - ${audit.action || "N/A"}`,
            margin + 2,
            yPosition + 2
          );

          yPosition += 10;
          doc.setTextColor(0, 0, 0);

          // Detalhes da auditoria
          const auditDetails = [
            `Usuário: ${audit.user?.name || audit.user?.email || "N/A"}`,
            `Data: ${
              audit.timestamp
                ? new Date(audit.timestamp).toLocaleString("pt-BR")
                : "N/A"
            }`,
            `Ação: ${audit.action || "N/A"}`,
            `Detalhes: ${JSON.stringify(audit.details || {}) || "N/A"}`,
          ];

          auditDetails.forEach((detail) => {
            addText(`  ${detail}`, 10, "normal");
          });

          yPosition += 5;
        });
      }

      // 8. RODAPÉ
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        doc.text(
          `Gerado por OAE Revisor em ${new Date().toLocaleString("pt-BR")}`,
          margin,
          pageHeight - 10
        );
      }

      // Salva o PDF
      const fileName = `Relatorio_Obra_${appState.work.codigo || "SemCodigo"}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      console.log("PDF gerado com sucesso:", fileName);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF: " + error.message);
    }
  },

  /**
   * Carrega a biblioteca jsPDF dinamicamente
   */
  async loadJsPDF() {
    return new Promise((resolve, reject) => {
      if (window.jspdf) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  // --- WORK MANAGEMENT ---
  async showWorksModal() {
    try {
      await WorkManager.loadAllWorks(); // Atualiza cache
    } catch (error) {
      console.error("Error loading works:", error);
      alert("⚠️ Erro ao carregar obras. Tente novamente.");
      return;
    }

    // Remove modal anterior se existir para evitar empilhamento
    const existingModal = document.getElementById("worksManagementModal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "worksManagementModal";

    const works = WorkManager.getFilteredWorks();
    const stats = WorkManager.getGeneralStats();
    const authors = WorkManager.getUniqueAuthors();
    const tags = WorkManager.getUniqueTags();

    let html = `
            <div class="modal" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3 class="modal-title">📂 Gerenciamento Avançado de Obras</h3>
                    <div style="display:flex; gap:8px; align-items:center;">
                      <button class="btn btn-secondary" onclick="MultiPeerSync.requestWorksSync()" title="Procurar obras em nós online">🔄 Sincronizar Obras</button>
                      <button class="modal-close" onclick="document.getElementById('worksManagementModal').remove()">×</button>
                    </div>
                </div>
                <div class="modal-body">
                    <!-- Informações do Usuário -->
                    <div class="section">
                        <div id="worksUserInfo"></div>
                    </div>
                    
                    <!-- Estatísticas Gerais -->
                    <div class="section">
                        <div class="section-title">📊 Estatísticas Gerais</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px;">
                            <div style="text-align: center; padding: 15px; background: var(--bg-secondary); border-radius: 6px;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${
                                  stats.total
                                }</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">Total de Obras</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: var(--bg-secondary); border-radius: 6px;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">${
                                  stats.byStatus.completed || 0
                                }</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">Concluídas</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: var(--bg-secondary); border-radius: 6px;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--warning);">${
                                  stats.byStatus.in_progress || 0
                                }</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">Em Andamento</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: var(--bg-secondary); border-radius: 6px;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger);">${
                                  stats.public
                                }</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">Públicas</div>
                            </div>
                        </div>
                    </div>

                    <!-- Filtros Avançados -->
                    <div class="section">
                        <div class="section-title">🔍 Filtros Avançados</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                            <div class="form-field">
                                <label class="form-label">Busca Rápida</label>
                                <input type="text" class="form-input" id="filterSearch" placeholder="Código, nome ou avaliador..." oninput="UI.applyWorkFilters()">
                            </div>
                            <div class="form-field">
                                <label class="form-label">Autor</label>
                                <select class="form-input" id="filterAuthor" onchange="UI.applyWorkFilters()">
                                    <option value="">Todos os autores</option>
                                    ${authors
                                      .map(
                                        (author) =>
                                          `<option value="${author}">${author}</option>`
                                      )
                                      .join("")}
                                </select>
                            </div>
                            <div class="form-field">
                                <label class="form-label">Status</label>
                                <select class="form-input" id="filterStatus" onchange="UI.applyWorkFilters()">
                                    <option value="">Todos os status</option>
                                    <option value="cadastro">📝 Cadastro</option>
                                    <option value="publicado_avaliacao">📤 Publicado p/ Avaliação</option>
                                    <option value="em_avaliacao">🔍 Em Avaliação</option>
                                    <option value="pendente_retificacao">⚠️ Pendente Retificação</option>
                                    <option value="aprovado">✅ Aprovado</option>
                                </select>
                            </div>
                            <div class="form-field">
                                <label class="form-label">Tags</label>
                                <select class="form-input" id="filterTags" onchange="UI.applyWorkFilters()">
                                    <option value="">Todas as tags</option>
                                    ${tags
                                      .map(
                                        (tag) =>
                                          `<option value="${tag}">${tag}</option>`
                                      )
                                      .join("")}
                                </select>
                            </div>
                            <div class="form-field">
                                <label class="form-label">Período</label>
                                <div style="display: flex; gap: 5px;">
                                    <input type="date" class="form-input" id="filterDateFrom" onchange="UI.applyWorkFilters()" style="flex: 1;">
                                    <input type="date" class="form-input" id="filterDateTo" onchange="UI.applyWorkFilters()" style="flex: 1;">
                                </div>
                            </div>
                            <div class="form-field">
                                <label class="form-label">Visibilidade</label>
                                <select class="form-input" id="filterVisibility" onchange="UI.applyWorkFilters()">
                                    <option value="">Todas</option>
                                    <option value="public">Apenas Públicas</option>
                                    <option value="mine">Minhas Obras</option>
                                </select>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                            <button class="btn btn-success" onclick="UI.createNewWork()">➕ Nova Obra</button>
                            <button class="btn btn-info" onclick="UI.importSharedWork()">📤 Importar Obra</button>
                            <div style="width: 2px; background: var(--border-color); margin: 0 5px;"></div>
                            <button class="btn btn-secondary" onclick="UI.clearWorkFilters()">🗑️ Limpar Filtros</button>
                            <button class="btn btn-primary" onclick="UI.exportFilteredWorks()">📥 Exportar Filtradas</button>
                            <button class="btn btn-secondary" onclick="Export.all()">📥 Exportar Todas (Backup)</button>
                        </div>
                    </div>

                    <!-- Lista de Obras -->
                    <div class="section">
                        <div class="section-title">📋 Lista de Obras (${
                          works.length
                        } encontradas)</div>
                    </div>
                </div>
                <div class="modal-body" style="padding-top: 0;">
                    <table class="view-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nome da Obra</th>
                                <th>Lote</th>
                                <th>Avaliador</th>
                                <th>Status</th>
                                <th>Criação</th>
                                <th>Modificação</th>
                                <th>Autor</th>
                                <th>Visibilidade</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                              works.length === 0
                                ? '<tr><td colspan="10" style="text-align:center; padding: 40px;">Nenhuma obra encontrada com os filtros atuais.</td></tr>'
                                : ""
                            }
                            ${works
                              .map((w) => {
                                const metadata = w.work?.metadata || {};
                                const permissions =
                                  WorkManager.getUserPermissions(
                                    w.work?.codigo
                                  );
                                const statusColors = {
                                  cadastro: "#9b59b6",
                                  publicado_avaliacao: "#3498db",
                                  em_avaliacao: "#f39c12",
                                  pendente_retificacao: "#e74c3c",
                                  aprovado: "#27ae60",
                                };
                                const statusLabels = {
                                  cadastro: "📝 Cadastro",
                                  publicado_avaliacao: "📤 Publicado",
                                  em_avaliacao: "🔍 Em Avaliação",
                                  pendente_retificacao: "⚠️ Pendente",
                                  aprovado: "✅ Aprovado",
                                };

                                const lote = metadata.lote || "Sem Lote";

                                return `
                                    <tr>
                                        <td><strong>${
                                          w.work?.codigo || w.codigo
                                        }</strong></td>
                                        <td>${w.work?.nome || "-"}</td>
                                        <td>
                                          <span style="background: var(--bg-accent); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">
                                            ${lote}
                                          </span>
                                        </td>
                                        <td>${w.work?.avaliador || "-"}</td>
                                        <td>
                                            <span style="background: ${
                                              statusColors[metadata.status] || "#95a5a6"
                                            }; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; display: inline-block;">
                                              ${statusLabels[metadata.status] || "N/A"}
                                            </span>
                                        </td>
                                        <td style="font-size: 0.85rem;">${
                                          metadata.createdAt
                                            ? new Date(
                                                metadata.createdAt
                                              ).toLocaleDateString("pt-BR")
                                            : "-"
                                        }</td>
                                        <td style="font-size: 0.85rem;">${
                                          metadata.lastModifiedAt
                                            ? new Date(
                                                metadata.lastModifiedAt
                                              ).toLocaleDateString("pt-BR")
                                            : "-"
                                        }</td>
                                        <td style="font-size: 0.85rem; color: var(--text-muted);">${
                                          metadata.createdBy || "-"
                                        }</td>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                ${
                                                  metadata.isPublic
                                                    ? '<span style="color: var(--success); font-size: 0.85rem;">🌐 Pública</span>'
                                                    : '<span style="color: var(--text-muted); font-size: 0.85rem;">🔒 Privada</span>'
                                                }
                                                ${
                                                  permissions.canEdit
                                                    ? `<button
                                                        class="btn-${metadata.isPublic ? 'warning' : 'success'}"
                                                        style="padding: 2px 8px; font-size: 10px; white-space: nowrap;"
                                                        onclick="UI.toggleWorkVisibility('${w.work?.codigo || w.codigo}')"
                                                        title="${metadata.isPublic ? 'Tornar privada' : 'Tornar pública'}"
                                                      >
                                                        ${metadata.isPublic ? '🔒 Privar' : '🌐 Publicar'}
                                                      </button>`
                                                    : ""
                                                }
                                            </div>
                                        </td>
                                        <td style="display: flex; gap: 4px; flex-wrap: wrap;">
                                            ${
                                              permissions.canView
                                                ? `<button class="btn-success" style="padding: 2px 6px; font-size: 11px;" onclick="UI.loadWork('${
                                                    w.work?.codigo || w.codigo
                                                  }')" title="Abrir obra">📂</button>`
                                                : ""
                                            }
                                            ${
                                              permissions.canEdit
                                                ? `<button class="btn-warning" style="padding: 2px 6px; font-size: 11px;" onclick="UI.changeWorkStatus('${
                                                    w.work?.codigo || w.codigo
                                                  }')" title="Mudar status">🔄</button>`
                                                : ""
                                            }
                                            ${
                                              permissions.canEdit
                                                ? `<button class="btn-primary" style="padding: 2px 6px; font-size: 11px;" onclick="UI.editWorkMetadata('${
                                                    w.work?.codigo || w.codigo
                                                  }')" title="Editar metadados">✏️</button>`
                                                : ""
                                            }
                                            ${
                                              permissions.canShare
                                                ? `<button class="btn-secondary" style="padding: 2px 6px; font-size: 11px;" onclick="UI.shareWork('${
                                                    w.work?.codigo || w.codigo
                                                  }')" title="Compartilhar">🔗</button>`
                                                : ""
                                            }
                                            <button class="btn-info" style="padding: 2px 6px; font-size: 11px;" onclick="UI.viewWorkAudit('${
                                              w.work?.codigo || w.codigo
                                            }')" title="Ver auditoria">📋</button>
                                            <button class="btn-primary" style="padding: 2px 6px; font-size: 11px;" onclick="UI.exportSpecific('${
                                              w.work?.codigo || w.codigo
                                            }')" title="Exportar">📥</button>
                                            ${
                                              permissions.canDelete
                                                ? `<button class="btn-danger" style="padding: 2px 6px; font-size: 11px;" onclick="UI.deleteWorkWithConfirmation('${
                                                    w.work?.codigo || w.codigo
                                                  }')" title="Excluir">🗑️</button>`
                                                : ""
                                            }
                                        </td>
                                    </tr>
                                `;
                              })
                              .join("")}
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="document.getElementById('worksManagementModal').remove()">Fechar</button>
                </div>
            </div>`;

    modal.innerHTML = html;
    document.body.appendChild(modal);
  },

  async loadWork(codigo) {
    try {
      const data = await DB.loadObra(codigo);
      if (data) {
        Sync.syncFromDB(data);
        document.getElementById("worksManagementModal")?.remove();
        this.showToast(`✅ Obra "${codigo}" carregada com sucesso!`);

        // Atualiza título com status
        this.updateWorkTitle();
      }
    } catch (err) {
      console.error("Failed to load work:", err);
      alert("Erro ao carregar a obra.");
    }
  },

  async createNewWork() {
    if (
      confirm(
        "Deseja criar uma nova obra? Todas as alterações não salvas na obra atual serão perdidas."
      )
    ) {
      try {
        // Reset app state
        appState = getDefaultAppState();

        // Inicializar metadados para nova obra
        if (window.AuditSystem) {
          AuditSystem.initializeWorkMetadata();
        }

        // Limpar todos os campos do formulário no DOM
        document
          .querySelectorAll(
            "input.form-input, select.form-input, textarea.form-input"
          )
          .forEach((el) => {
            if (el.type === "checkbox" || el.type === "radio") {
              el.checked = false;
            } else {
              el.value = "";
            }
          });

        // Resetar tramos e outros componentes
        this.renderAll();

        // Notificar sucesso
        this.showToast("✨ Nova obra iniciada! O formulário foi limpo.");

        // Fechar modal se estiver aberto
        const modal = document.getElementById("worksManagementModal");
        if (modal) modal.remove();
      } catch (error) {
        console.error("Erro ao criar nova obra:", error);
        alert("Erro ao criar nova obra: " + error.message);
      }
    }
  },

  async updateWorkStatus(codigo, newStatus) {
    try {
      const work = WorkManager.worksCache.get(codigo);
      if (!work) {
        throw new Error("Obra não encontrada.");
      }

      // Inicializa metadata se não existir
      if (!work.work.metadata) {
        work.work.metadata = {
          createdBy: AuditSystem.getCurrentUser().email,
          createdAt: new Date().toISOString(),
          version: 1,
          isPublic: false,
          status: "draft",
          tags: [],
        };
      }

      // Atualiza status
      const oldStatus = work.work.metadata.status;
      work.work.metadata.status = newStatus;
      work.work.metadata.lastModifiedBy = AuditSystem.getCurrentUser().email;
      work.work.metadata.lastModifiedAt = new Date().toISOString();
      work.work.metadata.version += 1;

      // Registrar na auditoria
      if (window.AuditSystem) {
        AuditSystem.logChange("status_change", {
          from: oldStatus,
          to: newStatus,
          obra: codigo
        });
      }

      // Salva no IndexedDB
      await WorkManager.saveWork(work);

      // Atualiza cache
      WorkManager.updateWorkCache(codigo, work);

      // Mostra mensagem
      this.showToast(
        `✅ Status da obra "${codigo}" atualizado para "${newStatus}"!`
      );

      // Re-renderiza o modal para refletir as mudanças sem fechar se possível, 
      // mas showWorksModal remove e cria de novo, o que é seguro.
      this.showWorksModal();
    } catch (error) {
      console.error("Erro ao atualizar status da obra:", error);
      alert("Erro ao atualizar status: " + error.message);
    }
  },

  async deleteWorkWithConfirmation(codigo) {
    // Confirmação 1: Aviso básico
    const confirm1 = confirm(
      `⚠️ ATENÇÃO: Você está prestes a EXCLUIR PERMANENTEMENTE a obra "${codigo}".\n\nEsta ação NÃO PODERÁ ser desfeita!\n\nDeseja continuar?`
    );
    if (!confirm1) return;

    // Confirmação 2: Detalhes do impacto
    const work = WorkManager.worksCache.get(codigo);
    const obraInfo = work
      ? `\n• Nome: ${work.work?.nome || "N/A"}\n• Avaliador: ${
          work.work?.avaliador || "N/A"
        }\n• Criada em: ${
          work.work?.metadata?.createdAt
            ? new Date(work.work.metadata.createdAt).toLocaleDateString("pt-BR")
            : "N/A"
        }`
      : "";

    const confirm2 = confirm(
      `🚨 CONFIRMAÇÃO 2/3: Obra a ser excluída:\n${obraInfo}\n\nTodos os dados, inconsistências, mensagens e histórico serão PERDIDOS PARA SEMPRE.\n\nTem ABSOLUTA certeza que deseja continuar?`
    );
    if (!confirm2) return;

    // Confirmação 3: Digitação do código
    const codigoConfirm = prompt(
      `💀 CONFIRMAÇÃO FINAL 3/3: Para confirmar a exclusão PERMANENTE da obra "${codigo}",\ndigite exatamente o código da obra:`
    );

    if (codigoConfirm !== codigo) {
      alert("❌ Código não confere. Exclusão cancelada por segurança.");
      return;
    }

    try {
      const currentUser = AuthSystem.currentUser;

      // Se for a obra atual, limpar appState
      if (appState.work.codigo === codigo) {
        // Reset do state
        appState.work.codigo = "";
        appState.work.nome = "";
        appState.work.avaliador = "";
        // ... outros campos
        UI.renderAll();
      }

      // Registrar no audit trail ANTES de deletar
      if (work) {
        AuditSystem.logChange("work_deleted", {
          obra: codigo,
          nome: work.work?.nome,
          avaliador: work.work?.avaliador,
          metadata: work.work?.metadata,
          deletedBy: currentUser.email,
          deletedByName: currentUser.name,
          deletedByRole: currentUser.role,
          deletedAt: new Date().toISOString(),
        });
      }

      // Deletar do IndexedDB
      await WorkManager.deleteWork(codigo);

      // Log no console para debug
      console.log(`[DELETION LOG] Obra ${codigo} excluída por ${currentUser.name} (${currentUser.email}) em ${new Date().toLocaleString("pt-BR")}`);

      // Broadcast para todos os peers conectados
      if (window.MultiPeerSync && typeof MultiPeerSync.broadcastWorkDeleted === 'function') {
        MultiPeerSync.broadcastWorkDeleted(codigo, currentUser.email);
        console.log(`📡 [DELETE] Deleção de "${codigo}" enviada para peers`);
      }

      this.showToast(`🗑️ Obra "${codigo}" excluída PERMANENTEMENTE.`);
      this.showNotification(`Exclusão registrada no histórico de auditoria`, "info");

      document.getElementById("worksManagementModal")?.remove();

      // Aguarda um momento para o DOM limpar antes de reabrir o modal
      setTimeout(() => {
        this.showWorksModal(); // Refresh list
      }, 100);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Erro ao excluir obra: " + err.message);
    }
  },

  // Funções de filtros e gerenciamento
  applyWorkFilters() {
    const filters = {
      search: document.getElementById("filterSearch")?.value || "",
      author: document.getElementById("filterAuthor")?.value || "",
      status: document.getElementById("filterStatus")?.value || "",
      dateFrom: document.getElementById("filterDateFrom")?.value || null,
      dateTo: document.getElementById("filterDateTo")?.value || null,
      tags: document.getElementById("filterTags")?.value
        ? [document.getElementById("filterTags").value]
        : [],
      publicOnly:
        document.getElementById("filterVisibility")?.value === "public",
      mineOnly: document.getElementById("filterVisibility")?.value === "mine",
    };

    WorkManager.updateFilters(filters);

    // Recarrega a lista
    this.showWorksModal();
  },

  clearWorkFilters() {
    WorkManager.clearFilters();

    // Limpa campos do formulário
    document.getElementById("filterSearch").value = "";
    document.getElementById("filterAuthor").value = "";
    document.getElementById("filterStatus").value = "";
    document.getElementById("filterTags").value = "";
    document.getElementById("filterDateFrom").value = "";
    document.getElementById("filterDateTo").value = "";
    document.getElementById("filterVisibility").value = "";

    // Recarrega a lista
    this.showWorksModal();
  },

  exportFilteredWorks() {
    try {
      const data = WorkManager.exportFilteredWorks();
      const fileName = `OAE_Filtradas_${
        new Date().toISOString().split("T")[0]
      }.json`;
      Export.downloadFile(
        fileName,
        JSON.stringify(data, null, 2),
        "application/json"
      );
      this.showToast(`📥 ${data.total} obras exportadas com sucesso!`);
    } catch (err) {
      console.error("Export filtered failed:", err);
      alert("Erro ao exportar obras filtradas.");
    }
  },

  async viewWorkAudit(codigo) {
    try {
      const work = WorkManager.worksCache.get(codigo);
      if (!work) {
        alert("Obra não encontrada.");
        return;
      }

      // Carrega obra temporariamente para gerar relatório
      const tempState = JSON.parse(JSON.stringify(appState));
      Sync.syncFromDB(work);

      const auditReport = AuditSystem.exportAuditReport();

      // Restaura state original
      appState = tempState;

      // Cria modal com relatório de auditoria
      const modal = document.createElement("div");
      modal.className = "modal-backdrop show";
      modal.id = "auditReportModal";

      const html = `
              <div class="modal" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                  <div class="modal-header">
                      <h3 class="modal-title">📋 Relatório de Auditoria - ${codigo}</h3>
                      <button class="modal-close" onclick="document.getElementById('auditReportModal').remove()">×</button>
                  </div>
                  <div class="modal-body">
                      <div class="section">
                          <div class="section-title">📊 Estatísticas</div>
                          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px;">
                              <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                                  <div style="font-size: 1.2rem; font-weight: 700;">${
                                    auditReport.statistics.totalChanges
                                  }</div>
                                  <div style="font-size: 0.8rem; color: var(--text-muted);">Total de Alterações</div>
                              </div>
                              <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                                  <div style="font-size: 1.2rem; font-weight: 700;">${
                                    auditReport.statistics.uniqueUsers
                                  }</div>
                                  <div style="font-size: 0.8rem; color: var(--text-muted);">Usuários Únicos</div>
                              </div>
                              <div style="text-align: center; padding: 10px; background: var(--bg-secondary); border-radius: 4px;">
                                  <div style="font-size: 1.2rem; font-weight: 700;">${
                                    auditReport.statistics.version
                                  }</div>
                                  <div style="font-size: 0.8rem; color: var(--text-muted);">Versão</div>
                              </div>
                          </div>
                      </div>

                      <div class="section">
                          <div class="section-title">📅 Informações Gerais</div>
                          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                              <div><strong>Criado por:</strong> ${
                                auditReport.obra.avaliador
                              }</div>
                              <div><strong>Criado em:</strong> ${
                                auditReport.metadata?.createdAt
                                  ? new Date(
                                      auditReport.metadata.createdAt
                                    ).toLocaleString("pt-BR")
                                  : "N/A"
                              }</div>
                              <div><strong>Última modificação:</strong> ${
                                auditReport.metadata?.lastModifiedAt
                                  ? new Date(
                                      auditReport.metadata.lastModifiedAt
                                    ).toLocaleString("pt-BR")
                                  : "N/A"
                              }</div>
                              <div><strong>Status:</strong> ${
                                auditReport.metadata?.status || "N/A"
                              }</div>
                          </div>
                      </div>

                      <div class="section">
                          <div class="section-title">📝 Histórico de Alterações (Últimas 50)</div>
                          <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: 4px;">
                              <table style="width: 100%; font-size: 0.85rem;">
                                  <thead style="position: sticky; top: 0; background: var(--bg-secondary);">
                                      <tr>
                                          <th style="padding: 8px; text-align: left;">Data/Hora</th>
                                          <th style="padding: 8px; text-align: left;">Usuário</th>
                                          <th style="padding: 8px; text-align: left;">Papel (Role)</th>
                                          <th style="padding: 8px; text-align: left;">Ação</th>
                                          <th style="padding: 8px; text-align: left;">Detalhes</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      ${auditReport.auditTrail
                                        .slice(-50)
                                        .reverse()
                                        .map(
                                          (entry) => `
                                          <tr style="border-bottom: 1px solid var(--border);">
                                              <td style="padding: 8px;">${new Date(
                                                entry.timestamp
                                              ).toLocaleString("pt-BR")}</td>
                                              <td style="padding: 8px;">
                                                  <div>${
                                                    entry.user.name
                                                  }</div>
                                                  <div style="font-size: 0.7rem; color: var(--text-muted);">${
                                                    entry.user.email
                                                  }</div>
                                              </td>
                                              <td style="padding: 8px;">
                                                  <span class="badge ${
                                                    entry.user.role === "admin"
                                                      ? "badge-error"
                                                      : entry.user.role ===
                                                        "revisor"
                                                      ? "badge-primary"
                                                      : "badge-secondary"
                                                  }" style="font-size: 0.7rem;">
                                                      ${
                                                        entry.user.role ||
                                                        "Geral"
                                                      }
                                                  </span>
                                              </td>
                                              <td style="padding: 8px;">
                                                  <span style="font-weight: 500;">${
                                                    entry.action
                                                  }</span>
                                              </td>
                                              <td style="padding: 8px; font-family: monospace; font-size: 0.8rem;">
                                                  ${
                                                    typeof entry.details ===
                                                    "string"
                                                      ? entry.details
                                                      : JSON.stringify(
                                                          entry.details
                                                        )
                                                  }
                                              </td>
                                          </tr>
                                      `
                                        )
                                        .join("")}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
                  <div class="modal-footer">
                      <button class="btn btn-primary" onclick="UI.exportAuditReport('${codigo}')">📥 Exportar Relatório</button>
                      <button class="btn btn-secondary" onclick="document.getElementById('auditReportModal').remove()">Fechar</button>
                  </div>
              </div>`;

      modal.innerHTML = html;
      document.body.appendChild(modal);
    } catch (err) {
      console.error("Error viewing audit:", err);
      alert("Erro ao carregar relatório de auditoria.");
    }
  },

  exportAuditReport(codigo) {
    try {
      const work = WorkManager.worksCache.get(codigo);
      if (!work) return;

      const tempState = JSON.parse(JSON.stringify(appState));
      Sync.syncFromDB(work);

      const auditReport = AuditSystem.exportAuditReport();
      appState = tempState;

      const fileName = `Audit_${codigo}_${
        new Date().toISOString().split("T")[0]
      }.json`;
      Export.downloadFile(
        fileName,
        JSON.stringify(auditReport, null, 2),
        "application/json"
      );

      this.showToast(`📥 Relatório de auditoria exportado!`);
    } catch (err) {
      console.error("Export audit failed:", err);
      alert("Erro ao exportar relatório de auditoria.");
    }
  },

  /**
   * Abre modal para editar metadados da obra (status, tags, etc.)
   */
  async editWorkMetadata(codigo) {
    try {
      const work = WorkManager.worksCache.get(codigo);
      if (!work) {
        alert("Obra não encontrada.");
        return;
      }

      // Inicializa metadata se não existir
      if (!work.work.metadata) {
        work.work.metadata = {
          createdBy: AuthSystem.currentUser.email,
          createdAt: new Date().toISOString(),
          lastModifiedBy: AuthSystem.currentUser.email,
          lastModifiedAt: new Date().toISOString(),
          sharedWith: [],
          isPublic: false,
          version: 1,
          tags: [],
          status: "draft",
        };
      }

      const metadata = work.work.metadata;

      // Modal HTML
      const modal = document.createElement("div");
      modal.className = "modal-backdrop show";
      modal.id = "editMetadataModal";

      modal.innerHTML = `
        <div class="modal" style="max-width: 600px;">
          <div class="modal-header">
            <h3 class="modal-title">✏️ Editar Metadados - ${codigo}</h3>
            <button class="modal-close" onclick="document.getElementById('editMetadataModal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label class="form-label">📊 Status da Obra</label>
              <select class="form-input" id="editStatus">
                <option value="draft" ${metadata.status === "draft" ? "selected" : ""}>📝 Rascunho</option>
                <option value="in_progress" ${metadata.status === "in_progress" ? "selected" : ""}>⏳ Em Andamento</option>
                <option value="completed" ${metadata.status === "completed" ? "selected" : ""}>✅ Concluída</option>
                <option value="archived" ${metadata.status === "archived" ? "selected" : ""}>📦 Arquivada</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">🌐 Visibilidade</label>
              <select class="form-input" id="editVisibility">
                <option value="false" ${!metadata.isPublic ? "selected" : ""}>🔒 Privada (apenas você)</option>
                <option value="true" ${metadata.isPublic ? "selected" : ""}>🌐 Pública (todos os usuários)</option>
              </select>
            </div>

            <div class="form-field">
              <label class="form-label">🏷️ Tags (separadas por vírgula)</label>
              <input type="text" class="form-input" id="editTags" value="${(metadata.tags || []).join(", ")}" placeholder="urgente, revisão, complexa">
            </div>

            <div class="section" style="margin-top: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 6px;">
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                <div><strong>Criado por:</strong> ${metadata.createdBy || "-"}</div>
                <div><strong>Criado em:</strong> ${metadata.createdAt ? new Date(metadata.createdAt).toLocaleString("pt-BR") : "-"}</div>
                <div><strong>Última modificação:</strong> ${metadata.lastModifiedAt ? new Date(metadata.lastModifiedAt).toLocaleString("pt-BR") : "-"}</div>
                <div><strong>Versão:</strong> ${metadata.version || 1}</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('editMetadataModal').remove()">Cancelar</button>
            <button class="btn btn-primary" onclick="UI.saveWorkMetadata('${codigo}')">💾 Salvar</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    } catch (error) {
      console.error("Error editing metadata:", error);
      alert("Erro ao editar metadados: " + error.message);
    }
  },

  /**
   * Salva as alterações nos metadados da obra
   */
  async saveWorkMetadata(codigo) {
    try {
      const work = WorkManager.worksCache.get(codigo);
      if (!work) {
        alert("Obra não encontrada.");
        return;
      }

      const status = document.getElementById("editStatus").value;
      const isPublic = document.getElementById("editVisibility").value === "true";
      const tagsInput = document.getElementById("editTags").value;
      const tags = tagsInput ? tagsInput.split(",").map(t => t.trim()).filter(t => t) : [];

      // Atualiza metadata
      work.work.metadata.status = status;
      work.work.metadata.isPublic = isPublic;
      work.work.metadata.tags = tags;
      work.work.metadata.lastModifiedBy = AuthSystem.currentUser.email;
      work.work.metadata.lastModifiedAt = new Date().toISOString();
      work.work.metadata.version += 1;

      // Salva no IndexedDB
      await WorkManager.saveWork(work);

      // Atualiza cache
      WorkManager.updateWorkCache(codigo, work);

      // Fecha modal
      document.getElementById("editMetadataModal").remove();

      // Mostra mensagem
      this.showToast(`✅ Metadados da obra "${codigo}" atualizados!`);

      // Atualiza a lista
      this.showWorksModal();
    } catch (error) {
      console.error("Error saving metadata:", error);
      alert("Erro ao salvar metadados: " + error.message);
    }
  },

  /**
   * Alterna a visibilidade da obra entre pública e privada
   */
  async toggleWorkVisibility(codigo) {
    try {
      const work = WorkManager.worksCache.get(codigo);
      if (!work) {
        alert("Obra não encontrada.");
        return;
      }

      // Inicializa metadata se não existir
      if (!work.work.metadata) {
        work.work.metadata = {
          createdBy: AuditSystem.getCurrentUser().email,
          createdAt: new Date().toISOString(),
          lastModifiedBy: AuditSystem.getCurrentUser().email,
          lastModifiedAt: new Date().toISOString(),
          sharedWith: [],
          isPublic: false,
          version: 1,
          tags: [],
          status: "draft",
        };
      }

      // Alterna o status
      const newStatus = !work.work.metadata.isPublic;
      const statusText = newStatus ? "pública" : "privada";

      if (confirm(`Deseja tornar esta obra ${statusText}?\n\n${newStatus ? '🌐 Pública: Qualquer usuário cadastrado poderá visualizar esta obra.' : '🔒 Privada: Apenas você terá acesso a esta obra.'}`)) {
        // Inverte o status
        work.work.metadata.isPublic = newStatus;
        work.work.metadata.lastModifiedBy = AuditSystem.getCurrentUser().email;
        work.work.metadata.lastModifiedAt = new Date().toISOString();
        work.work.metadata.version += 1;

        // Registrar na auditoria
        if (window.AuditSystem) {
          AuditSystem.logChange("visibility_toggle", {
            isPublic: newStatus,
            obra: codigo
          });
        }

        // Salva no IndexedDB
        await WorkManager.saveWork(work);

        // Atualiza cache
        WorkManager.updateWorkCache(codigo, work);

        // Sincroniza com peers conectados (para que outros vejam a obra publicada)
        const hasPeers = window.MultiPeerSync && MultiPeerSync.hasConnections();

        if (hasPeers) {
          MultiPeerSync.broadcastWorkUpdated(work);
          this.showNotification(`✅ Obra sincronizada com ${MultiPeerSync.getNetworkStats().connectedPeers} usuário(s) online!`, "success");
        } else if (newStatus) {
          // Se tornou pública MAS não há peers conectados, avisa o usuário
          this.showNotification(
            `⚠️ ATENÇÃO: Obra marcada como pública, mas NENHUM usuário está conectado no momento.\n\n` +
            `Para que outros vejam esta obra, você precisa:\n` +
            `1️⃣ Conectar-se com outros usuários via aba Mensagens > Gerenciar Rede\n` +
            `2️⃣ OU compartilhar manualmente usando o botão 🔗 Compartilhar`,
            "warning"
          );
        }

        // Mostra mensagem
        const statusLabel = newStatus ? "Pública" : "Privada";
        const icon = newStatus ? "🌐" : "🔒";
        this.showToast(`${icon} Obra "${codigo}" agora está ${statusLabel}!`);

        // Atualiza a lista
        this.showWorksModal();
      }
    } catch (error) {
      console.error("Erro ao alterar visibilidade da obra:", error);
      alert("Erro ao alterar visibilidade: " + error.message);
    }
  },

  async shareWork(codigo) {
    try {
      // Carrega a obra do banco
      const obraData = await DB.loadObra(codigo);
      if (!obraData) {
        this.showNotification("Obra não encontrada", "error");
        return;
      }

      // Cria modal de compartilhamento
      const modal = document.createElement("div");
      modal.className = "modal-backdrop show";
      modal.id = "shareWorkModal";

      const shareData = {
        version: "1.0",
        type: "oae-work-share",
        timestamp: new Date().toISOString(),
        sharedBy: AuthSystem.currentUser?.email || "unknown",
        work: obraData,
      };

      const jsonString = JSON.stringify(shareData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const fileName = `OAE_${codigo}_${new Date().toISOString().split('T')[0]}.json`;

      modal.innerHTML = `
        <div class="modal" style="max-width: 700px;">
          <div class="modal-header">
            <h2>🔗 Compartilhar Obra</h2>
            <button class="modal-close" onclick="document.getElementById('shareWorkModal').remove()">×</button>
          </div>
          <div class="modal-body" style="padding: 30px;">
            <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 5px;">Obra:</div>
              <div style="font-weight: 600; font-size: 1.1rem;">${obraData.work.codigo} - ${obraData.work.nome}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 4px;">
                <div style="font-size: 0.9rem; color: #1976d2; line-height: 1.6;">
                  <strong>💡 Como compartilhar (Arquivo):</strong><br>
                  1. Baixe o arquivo JSON desta obra<br>
                  2. Envie o arquivo para outro usuário (email, pendrive, etc)<br>
                  3. O outro usuário deve importar usando "📥 Importar" no gerenciador de obras
                </div>

                <div style="text-align: center; margin-top: 12px;">
                  <button class="btn btn-success" style="padding: 10px 18px; font-size: 0.95rem;" onclick="UI.downloadShareFile('${url}', '${fileName}')">
                    📥 Baixar Arquivo
                  </button>
                </div>
              </div>

              <div style="background: #e8f5e9; border-left: 4px solid #2e7d32; padding: 15px; border-radius: 4px;">
                <div style="font-size: 0.9rem; color: #1b5e20; line-height: 1.6;">
                  <strong>💡 Como compartilhar (Link):</strong><br>
                  Gere um link compartilhável que permite importar esta obra rapidamente.
                </div>

                <div style="margin-top: 12px;">
                  <textarea id="workShareLinkText" readonly style="width:100%; height:70px; font-family:monospace; font-size:0.8rem; resize:none; background: var(--bg-primary); border:1px solid var(--border); padding:8px;">Gerando link...</textarea>
                </div>

                <div style="display:flex; gap:8px; margin-top:12px; justify-content:flex-end;">
                  <button class="btn btn-primary" onclick="(async ()=>{ const link = await SyncMethods.generateWorkShareLink('${obraData.work.codigo}'); document.getElementById('workShareLinkText').value = link; navigator.clipboard.writeText(link).then(()=>alert('✅ Link copiado!')) })()">🔗 Gerar & Copiar</button>
                  <button class="btn btn-secondary" onclick="(async ()=>{ const link = await SyncMethods.generateWorkShareLink('${obraData.work.codigo}'); if(navigator.share){ try{ await navigator.share({ title: 'Obra OAE', text: 'Abra este link para importar a obra OAE', url:link }); }catch(e){ alert('Compartilhamento cancelado ou falhou'); } } else { alert('Navegador não suporta Web Share API. O link foi copiado para a área de transferência.'); navigator.clipboard.writeText(link);} })()">📤 Compartilhar</button>
                </div>

                <div style="margin-top:12px; font-size:0.8rem; color:var(--text-muted);">⚠️ Atenção: O link contém os dados da obra. Compartilhe apenas com pessoas autorizadas.</div>
              </div>
            </div>

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 4px; margin-top: 6px;">
              <div style="font-size: 0.85rem; color: #856404;">
                <strong>⚠️ Nota:</strong> O método de arquivo funciona offline e é ideal para envio por email/pen drive; o link é prático para importação rápida via navegador.
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('shareWorkModal').remove()">Fechar</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    } catch (error) {
      console.error("Erro ao compartilhar obra:", error);
      this.showNotification("Erro ao preparar compartilhamento: " + error.message, "error");
    }
  },

  downloadShareFile(url, fileName) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showNotification("Arquivo baixado com sucesso!", "success");
  },

  /**
   * Importa obra compartilhada de arquivo JSON
   */
  importSharedWork() {
    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "importWorkModal";

    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h2>📤 Importar Obra Compartilhada</h2>
          <button class="modal-close" onclick="document.getElementById('importWorkModal').remove()">×</button>
        </div>
        <div class="modal-body" style="padding: 30px;">
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <div style="font-size: 0.9rem; color: #1976d2; line-height: 1.6;">
              <strong>💡 Como importar:</strong><br>
              1. Selecione o arquivo JSON que você recebeu<br>
              2. O sistema validará os dados<br>
              3. Escolha se deseja sobrescrever caso a obra já exista<br>
              4. A obra será importada para seu banco de dados local
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; font-weight: 600;">
              Selecione o arquivo JSON:
            </label>
            <input
              type="file"
              id="importFileInput"
              accept=".json"
              style="width: 100%; padding: 10px; border: 2px dashed var(--border-color); border-radius: 8px; cursor: pointer;"
            />
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="overwriteExisting" style="width: 18px; height: 18px;">
              <span style="font-size: 0.9rem;">Sobrescrever obra se já existir</span>
            </label>
          </div>

          <div id="importPreview" style="display: none; background: var(--bg-secondary); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px;">Prévia da obra:</div>
            <div id="importPreviewContent" style="font-size: 0.95rem;"></div>
          </div>

          <div id="importStatus" style="display: none; padding: 12px; border-radius: 4px; margin-bottom: 20px;"></div>

          <hr style="margin: 20px 0;" />

          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; margin-bottom: 8px;">🔗 Importar via Link</div>
            <input id="importWorkLinkInput" class="form-input" placeholder="Cole o link de compartilhamento da obra aqui..." style="width: 100%;" />
            <div id="importWorkLinkStatus" style="margin-top: 8px; font-size: 0.85rem; color: var(--text-muted);">Cole um link com o parâmetro <code>?shareWork=...</code> ou apenas o trecho codificado.</div>
            <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px;">
              <button class="btn btn-success" onclick="SyncMethods.processWorkLinkImport()">🔗 Importar Obra via Link</button>
            </div>
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="document.getElementById('importWorkModal').remove()">
              Cancelar
            </button>
            <button class="btn btn-primary" id="btnConfirmImport" disabled>
              📥 Importar Obra
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handler do input de arquivo
    const fileInput = document.getElementById("importFileInput");
    const btnImport = document.getElementById("btnConfirmImport");
    let fileData = null;

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Valida estrutura
        if (data.type !== "oae-work-share" || !data.work) {
          throw new Error("Arquivo inválido. Este não é um arquivo de compartilhamento de obra válido.");
        }

        fileData = data;

        // Mostra preview
        const preview = document.getElementById("importPreview");
        const previewContent = document.getElementById("importPreviewContent");
        preview.style.display = "block";

        previewContent.innerHTML = `
          <strong>Código:</strong> ${data.work.work.codigo}<br>
          <strong>Nome:</strong> ${data.work.work.nome}<br>
          <strong>Avaliador:</strong> ${data.work.work.avaliador || "N/A"}<br>
          <strong>Compartilhado por:</strong> ${data.sharedBy}<br>
          <strong>Data:</strong> ${new Date(data.timestamp).toLocaleString("pt-BR")}
        `;

        btnImport.disabled = false;
      } catch (error) {
        this.showImportStatus("Erro ao ler arquivo: " + error.message, "error");
        btnImport.disabled = true;
      }
    });

    // Handler do botão de importar
    btnImport.onclick = async () => {
      if (!fileData) return;

      try {
        const overwrite = document.getElementById("overwriteExisting").checked;
        const codigo = fileData.work.work.codigo;

        // Verifica se já existe
        const existing = await DB.loadObra(codigo);
        if (existing && !overwrite) {
          this.showImportStatus(
            `❌ Obra ${codigo} já existe! Marque "Sobrescrever" para substituir.`,
            "warning"
          );
          return;
        }

        // Atualiza metadados da importação
        const currentUser = AuthSystem.currentUser;
        fileData.work.work.metadata.lastModifiedBy = currentUser.email;
        fileData.work.work.metadata.lastModifiedAt = new Date().toISOString();
        fileData.work.work.metadata.importedFrom = fileData.sharedBy;
        fileData.work.work.metadata.importedAt = new Date().toISOString();

        // Salva no banco
        await DB.saveObra(codigo, fileData.work);

        // Atualiza cache
        if (window.WorkManager) {
          await WorkManager.loadAllWorks();
        }

        this.showImportStatus(
          `✅ Obra ${codigo} importada com sucesso!`,
          "success"
        );

        setTimeout(() => {
          document.getElementById("importWorkModal").remove();
          this.showWorksModal();
          this.showNotification(`Obra ${codigo} importada com sucesso!`, "success");
        }, 1500);
      } catch (error) {
        console.error("Erro ao importar:", error);
        this.showImportStatus("Erro ao importar: " + error.message, "error");
      }
    };
  },

  showImportStatus(message, type) {
    const statusDiv = document.getElementById("importStatus");
    if (!statusDiv) return;

    const colors = {
      success: { bg: "#d4edda", border: "#28a745", text: "#155724" },
      error: { bg: "#f8d7da", border: "#dc3545", text: "#721c24" },
      warning: { bg: "#fff3cd", border: "#ffc107", text: "#856404" },
    };

    const color = colors[type] || colors.error;

    statusDiv.style.display = "block";
    statusDiv.style.background = color.bg;
    statusDiv.style.borderLeft = `4px solid ${color.border}`;
    statusDiv.style.color = color.text;
    statusDiv.innerHTML = `<div style="font-size: 0.9rem;">${message}</div>`;
  },

  disconnectPeer() {
    if (PeerSync.isPeerConnected()) {
      PeerSync.disconnect();
      document.getElementById("remotePeerInfo").textContent = "Nenhum";
      document.getElementById("connectionCode").textContent = "-";
      this.showNotification("Conexão encerrada", "info");
    }
  },

  copyConnectionCode() {
    const codeInput = document.getElementById("myConnectionCode");
    codeInput.select();
    document.execCommand("copy");
    this.showNotification(
      "Código copiado para área de transferência!",
      "success"
    );
  },

  showConnectionStatus(message, type) {
    const statusDiv = document.getElementById("connectionStatus");
    const statusText = document.getElementById("connectionStatusText");

    statusDiv.style.display = "block";
    statusText.textContent = message;

    // Define cor baseada no tipo
    const colors = {
      connecting: "var(--warning)",
      success: "var(--success)",
      error: "var(--danger)",
      info: "var(--primary)",
    };

    statusDiv.style.background = colors[type] || "var(--bg-secondary)";
    statusDiv.style.color = "white";
  },

  handleTyping() {
    if (!this.typingTimeout) {
      // Envia indicador de digitação
      if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
        MultiPeerSync.broadcastTyping(true);
      }
    }

    // Limpa timeout anterior
    clearTimeout(this.typingTimeout);

    // Define novo timeout para parar de digitar
    this.typingTimeout = setTimeout(() => {
      if (window.MultiPeerSync && MultiPeerSync.hasConnections()) {
        MultiPeerSync.broadcastTyping(false);
      }
      this.typingTimeout = null;
    }, 1000);
  },

  showNotification(message, type = "info") {
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = message;
      toast.className = `toast ${type}`;
      toast.style.display = "block";

      setTimeout(() => {
        toast.style.display = "none";
      }, 3000);
    }
  },

  // --- MULTI-PEER UI FUNCTIONS ---

  showUserSetupModal() {
    const modal = document.getElementById("userSetupModal");
    modal.classList.add("show");

    // Preenche com dados salvos se existirem
    const savedEmail = localStorage.getItem("oae-user-email");
    const savedName = localStorage.getItem("oae-user-name");

    if (savedEmail) document.getElementById("userEmail").value = savedEmail;
    if (savedName) document.getElementById("userName").value = savedName;
  },

  closeUserSetupModal() {
    document.getElementById("userSetupModal").classList.remove("show");
  },

  async saveUserSetup() {
    const email = document.getElementById("userEmail").value.trim();
    const name = document.getElementById("userName").value.trim();

    if (!email || !name) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      await MultiPeerSync.init(email, name);
      this.closeUserSetupModal();
      this.updateNetworkUI();
      this.showNotification("Identidade configurada com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao configurar identidade:", error);
      this.showNotification("Erro ao configurar identidade", "error");
    }
  },

  showNetworkModal() {
    const modal = document.getElementById("networkModal");
    modal.classList.add("show");
    this.updateNetworkModal();
  },

  closeNetworkModal() {
    document.getElementById("networkModal").classList.remove("show");
  },

  /**
   * Modal de conexão rápida com guia passo a passo
   */
  showQuickConnectModal() {
    const isConfigured = window.MultiPeerSync && MultiPeerSync.userId;
    const hasConnections = window.MultiPeerSync && MultiPeerSync.hasConnections();

    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "quickConnectModal";

    modal.innerHTML = `
      <div class="modal" style="max-width: 700px;">
        <div class="modal-header">
          <h2>🔗 Guia de Conexão P2P</h2>
          <button class="modal-close" onclick="document.getElementById('quickConnectModal').remove()">×</button>
        </div>
        <div class="modal-body" style="padding: 30px;">
          <!-- Status Atual -->
          <div style="background: ${hasConnections ? 'var(--success)' : 'var(--danger)'}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 10px;">
              ${hasConnections ? '🟢' : '🔴'}
            </div>
            <div style="font-size: 1.2rem; font-weight: 600;">
              ${hasConnections ? `✅ ${MultiPeerSync.getNetworkStats().connectedPeers} Usuário(s) Conectado(s)` : '❌ Nenhum Usuário Conectado'}
            </div>
            ${!hasConnections ? '<div style="font-size: 0.9rem; margin-top: 5px;">Siga os passos abaixo para conectar</div>' : ''}
          </div>

          ${!isConfigured ? `
            <!-- Passo 1: Configurar Identidade -->
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
              <div style="font-weight: 600; margin-bottom: 10px; color: #856404;">
                ⚠️ PASSO 1: Configure sua identidade primeiro
              </div>
              <button class="btn btn-warning" onclick="UI.showUserSetupModal(); document.getElementById('quickConnectModal').remove();" style="width: 100%;">
                👤 Configurar Minha Identidade
              </button>
            </div>
          ` : `
            <!-- Identidade Configurada -->
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
              <div style="font-weight: 600; color: #155724; margin-bottom: 5px;">✅ Sua identidade está configurada</div>
              <div style="font-size: 0.85rem; color: #155724;">${MultiPeerSync.userName} (${MultiPeerSync.userEmail})</div>
            </div>
          `}

          <!-- Guia Passo a Passo -->
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 15px; color: #1976d2;">
              📋 Como Conectar com Outros Usuários:
            </div>

            <div style="line-height: 1.8; color: #1976d2;">
              <div style="margin-bottom: 15px;">
                <strong>1️⃣ AMBOS os usuários devem configurar identidade</strong><br>
                <span style="font-size: 0.9rem;">Cada um clica em "👤 Configurar" na aba Mensagens</span>
              </div>

              <div style="margin-bottom: 15px;">
                <strong>2️⃣ Um usuário adiciona o email do outro</strong><br>
                <span style="font-size: 0.9rem;">Vá em "🔗 Gerenciar Rede" > Digite o email > "Adicionar Usuário"</span>
              </div>

              <div style="margin-bottom: 15px;">
                <strong>3️⃣ O outro usuário faz o mesmo</strong><br>
                <span style="font-size: 0.9rem;">Também deve adicionar o email do primeiro usuário</span>
              </div>

              <div style="margin-bottom: 15px;">
                <strong>4️⃣ Conexão automática acontece</strong><br>
                <span style="font-size: 0.9rem;">O indicador ficará 🟢 e mostrará "X online"</span>
              </div>
            </div>
          </div>

          <!-- Importante -->
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <div style="font-weight: 600; margin-bottom: 10px; color: #856404;">
              ⚠️ IMPORTANTE:
            </div>
            <ul style="margin: 0; padding-left: 20px; color: #856404; line-height: 1.6;">
              <li><strong>Ambos precisam adicionar um ao outro</strong> - não basta só um adicionar</li>
              <li><strong>Use emails exatos</strong> - igual ao usado na configuração</li>
              <li><strong>Ambos devem estar online</strong> - ao mesmo tempo no sistema</li>
              <li>A conexão é <strong>peer-to-peer</strong> - não depende de servidor</li>
            </ul>
          </div>

          <!-- Ações Rápidas -->
          <div style="display: flex; gap: 10px; justify-content: center;">
            ${isConfigured ? `
              <button class="btn btn-primary" onclick="UI.showNetworkModal(); document.getElementById('quickConnectModal').remove();" style="padding: 12px 24px;">
                🔗 Gerenciar Rede
              </button>
              ${hasConnections ? `
                <button class="btn btn-success" onclick="UI.forceSyncNow(); document.getElementById('quickConnectModal').remove();" style="padding: 12px 24px;">
                  🔄 Sincronizar Agora
                </button>
              ` : ''}
            ` : ''}
            <button class="btn btn-info" onclick="UI.showQuickShareGuide(); document.getElementById('quickConnectModal').remove();" style="padding: 12px 24px;">
              📤 Compartilhamento Manual
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('quickConnectModal').remove()">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  /**
   * Guia de compartilhamento manual alternativo
   */
  showQuickShareGuide() {
    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "quickShareGuideModal";

    modal.innerHTML = `
      <div class="modal" style="max-width: 650px;">
        <div class="modal-header">
          <h2>📤 Compartilhamento Manual de Obras</h2>
          <button class="modal-close" onclick="document.getElementById('quickShareGuideModal').remove()">×</button>
        </div>
        <div class="modal-body" style="padding: 30px;">
          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 15px; color: #1976d2;">
              💡 Quando usar compartilhamento manual:
            </div>
            <ul style="line-height: 1.8; color: #1976d2; margin: 0; padding-left: 20px;">
              <li>Quando os usuários <strong>não conseguem se conectar via P2P</strong></li>
              <li>Para enviar obras entre <strong>escritórios diferentes</strong></li>
              <li>Quando não há <strong>conexão simultânea</strong> possível</li>
              <li>Como <strong>backup</strong> mais confiável</li>
            </ul>
          </div>

          <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="font-weight: 600; font-size: 1rem; margin-bottom: 15px;">
              📥 Para ENVIAR uma obra:
            </div>
            <ol style="line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Abra o <strong>Gerenciador de Obras</strong></li>
              <li>Clique no botão <strong>🔗 Compartilhar</strong> na obra</li>
              <li>Baixe o arquivo <strong>.json</strong></li>
              <li>Envie por <strong>email, WhatsApp ou pendrive</strong></li>
            </ol>
          </div>

          <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="font-weight: 600; font-size: 1rem; margin-bottom: 15px;">
              📤 Para RECEBER uma obra:
            </div>
            <ol style="line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Abra o <strong>Gerenciador de Obras</strong></li>
              <li>Clique em <strong>📤 Importar Obra</strong></li>
              <li>Selecione o arquivo <strong>.json</strong> recebido</li>
              <li>Marque "Sobrescrever" se necessário</li>
              <li>Clique em <strong>Importar</strong></li>
            </ol>
          </div>

          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 4px;">
            <div style="font-weight: 600; color: #155724; margin-bottom: 8px;">
              ✅ Vantagens:
            </div>
            <ul style="margin: 0; padding-left: 20px; color: #155724; line-height: 1.6;">
              <li><strong>100% confiável</strong> - sempre funciona</li>
              <li><strong>Não depende de conexão</strong> - funciona offline</li>
              <li><strong>Funciona entre redes</strong> - qualquer local</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <button class="btn btn-primary" onclick="UI.showWorksModal(); document.getElementById('quickShareGuideModal').remove();" style="padding: 12px 30px;">
              📂 Abrir Gerenciador de Obras
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('quickShareGuideModal').remove()">Fechar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  updateNetworkModal() {
    if (!window.MultiPeerSync) return;

    const stats = MultiPeerSync.getNetworkStats();

    // Atualiza estatísticas
    document.getElementById("modalTotalPeers").textContent = stats.totalPeers;
    document.getElementById("modalConnectedPeers").textContent =
      stats.connectedPeers;

    // Atualiza lista de pares conhecidos
    const peersList = document.getElementById("knownPeersList");
    if (stats.knownPeers.length === 0) {
      peersList.innerHTML =
        '<p style="color: var(--text-muted); text-align: center;">Nenhum usuário adicionado</p>';
    } else {
      peersList.innerHTML = stats.knownPeers
        .map((peerId) => {
          const displayName = MultiPeerSync.getPeerDisplayName(peerId);
          const isConnected = MultiPeerSync.isConnectedTo(peerId);
          const statusColor = isConnected
            ? "var(--success)"
            : "var(--text-muted)";
          const statusText = isConnected ? "Conectado" : "Desconectado";

          return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg-tertiary); border-radius: 4px; margin-bottom: 5px;">
            <div>
              <div style="font-weight: 600;">${displayName}</div>
              <div style="font-size: 0.8rem; color: ${statusColor};">${statusText}</div>
            </div>
            <button class="btn btn-danger" onclick="UI.removePeer('${peerId}')" style="height: 24px; font-size: 0.7rem;">Remover</button>
          </div>
        `;
        })
        .join("");
    }
  },

  updateNetworkUI() {
    if (!window.MultiPeerSync) {
      // Usuário não configurado
      document.getElementById("userIdentity").textContent = "Não configurado";
      document.getElementById("networkStatusText").textContent = "Rede offline";
      document.getElementById("totalPeersCount").textContent = "0";
      document.getElementById("connectedPeersCount").textContent = "0";
      document.getElementById("syncStatus").textContent = "⏸";
      document.getElementById("connectedPeersList").style.display = "none";

      // Atualiza indicador do header
      const headerIndicator = document.getElementById("headerNetworkIndicator");
      const headerCount = document.getElementById("headerPeersCount");
      if (headerIndicator && headerCount) {
        headerIndicator.style.background = "var(--danger)";
        headerCount.textContent = "0 online";
      }
      return;
    }

    const stats = MultiPeerSync.getNetworkStats();

    // Atualiza identidade
    document.getElementById(
      "userIdentity"
    ).textContent = `${MultiPeerSync.userName} (${MultiPeerSync.userEmail})`;

    // Atualiza status da rede
    const hasConnections = stats.connectedPeers > 0;
    document.getElementById("networkStatus").className = `connection-status ${
      hasConnections ? "connected" : "disconnected"
    }`;
    document.getElementById("networkStatusText").textContent = hasConnections
      ? `${stats.connectedPeers} conectados`
      : "Rede offline";

    // Atualiza estatísticas
    document.getElementById("totalPeersCount").textContent = stats.totalPeers;
    document.getElementById("connectedPeersCount").textContent =
      stats.connectedPeers;
    document.getElementById("syncStatus").textContent = hasConnections
      ? "🔄"
      : "⏸";

    // Atualiza indicador do header
    const headerIndicator = document.getElementById("headerNetworkIndicator");
    const headerCount = document.getElementById("headerPeersCount");
    if (headerIndicator && headerCount) {
      headerIndicator.style.background = hasConnections ? "var(--success)" : "var(--danger)";
      headerCount.textContent = `${stats.connectedPeers} online`;
      headerCount.style.color = hasConnections ? "var(--success)" : "var(--text-muted)";
    }

    // Atualiza lista de conectados
    if (hasConnections) {
      document.getElementById("connectedPeersList").style.display = "block";
      const peersList = document.getElementById("peersList");
      peersList.innerHTML = stats.connections
        .map((peerId) => {
          const displayName = MultiPeerSync.getPeerDisplayName(peerId);
          return `
          <div style="display: flex; align-items: center; gap: 8px; padding: 6px; background: var(--bg-tertiary); border-radius: 4px;">
            <div class="connection-status connected" style="width: 8px; height: 8px;"></div>
            <span style="font-size: 0.85rem;">${displayName}</span>
          </div>
        `;
        })
        .join("");
    } else {
      document.getElementById("connectedPeersList").style.display = "none";
    }
  },

  async addPeerByEmail() {
    const email = document.getElementById("newPeerEmail").value.trim();

    if (!email) {
      alert("Digite o email do usuário");
      return;
    }

    try {
      const peerId = MultiPeerSync.generateUserId(email);
      const peerFullName = email.split("@")[0];

      MultiPeerSync.addKnownPeer(`oae-${peerId}`, peerFullName);

      document.getElementById("newPeerEmail").value = "";
      this.updateNetworkModal();
      this.updateNetworkUI();
      this.showNotification("Usuário adicionado à rede", "success");
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error);
      this.showNotification("Erro ao adicionar usuário", "error");
    }
  },

  removePeer(peerId) {
    if (confirm("Tem certeza que deseja remover este usuário da rede?")) {
      MultiPeerSync.removeKnownPeer(peerId);
      this.updateNetworkModal();
      this.updateNetworkUI();
      this.showNotification("Usuário removido da rede", "info");
    }
  },

  disconnectAll() {
    if (confirm("Tem certeza que deseja desconectar de todos os usuários?")) {
      MultiPeerSync.disconnect();
      this.updateNetworkUI();
      this.showNotification("Desconectado de todos os usuários", "info");
    }
  },

  /**
   * Força sincronização imediata com todos os nós conectados
   */
  async forceSyncNow() {
    // Verifica se PeerJS está bloqueado
    if (!window.Peer) {
      this.showTrackingPreventionWarning();
      return;
    }

    if (!window.MultiPeerSync || !MultiPeerSync.hasConnections()) {
      this.showNotification("⚠️ Nenhum usuário conectado. Sincronização P2P indisponível.", "warning");
      this.showQuickConnectModal();
      return;
    }

    try {
      this.showNotification("🔄 Sincronizando dados com usuários online...", "info");

      // Recarrega todas as obras do banco local
      if (window.WorkManager) {
        await WorkManager.loadAllWorks();
      }

      // Envia estado atual para todos os pares conectados
      if (window.MultiPeerSync) {
        await MultiPeerSync.broadcastFullState();
      }

      this.showNotification("✅ Sincronização concluída com sucesso!", "success");
      this.updateNetworkUI();
    } catch (error) {
      console.error("Erro na sincronização:", error);
      this.showNotification("❌ Erro ao sincronizar: " + error.message, "error");
    }
  },

  /**
   * Mostra aviso sobre Tracking Prevention bloqueando PeerJS
   */
  showTrackingPreventionWarning() {
    const modal = document.createElement("div");
    modal.className = "modal-backdrop show";
    modal.id = "trackingWarningModal";

    modal.innerHTML = `
      <div class="modal" style="max-width: 750px;">
        <div class="modal-header" style="background: var(--danger); color: white;">
          <h2>🚨 Sincronização P2P Bloqueada</h2>
          <button class="modal-close" onclick="document.getElementById('trackingWarningModal').remove()">×</button>
        </div>
        <div class="modal-body" style="padding: 30px;">
          <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 15px; color: #721c24;">
              ⚠️ Erro Detectado:
            </div>
            <div style="color: #721c24; line-height: 1.6;">
              O navegador está bloqueando a biblioteca PeerJS devido ao <strong>Tracking Prevention (Prevenção de Rastreamento)</strong>.
              <br><br>
              <strong>Diagnóstico:</strong><br>
              <div style="background: #fff; padding: 8px; display: block; border-radius: 4px; margin-top: 10px; font-size: 0.85rem; color: #721c24;">
                O navegador não conseguiu carregar o PeerJS — isso costuma ocorrer quando scripts de terceiros (ex.: CDN) são bloqueados por recursos de privacidade (Tracking Prevention). Para resolver, limpe o cache e recarregue; caso persista, use o método manual de compartilhamento.
              </div>
            </div>
          </div>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px; margin-bottom: 25px;">
            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 15px; color: #856404;">
              🔧 Solução Rápida - Desabilitar Tracking Prevention:
            </div>

            <div style="color: #856404; line-height: 1.8;">
              <strong>Microsoft Edge:</strong><br>
              1️⃣ Clique no ícone de <strong>🛡️ cadeado</strong> na barra de endereço<br>
              2️⃣ Clique em <strong>"Cookies e dados do site"</strong><br>
              3️⃣ Desative <strong>"Bloquear cookies de terceiros"</strong> para este site<br>
              4️⃣ Recarregue a página (F5)<br><br>

              <strong>OU no Menu:</strong><br>
              1️⃣ Menu ⋮ > <strong>Configurações</strong><br>
              2️⃣ <strong>Privacidade, pesquisa e serviços</strong><br>
              3️⃣ Em "Prevenção de rastreamento", escolha <strong>"Básico"</strong><br>
              4️⃣ Ou adicione este site em <strong>"Exceções"</strong><br>
              5️⃣ Recarregue a página
            </div>
          </div>

          <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 15px; color: #1976d2;">
              📤 Alternativa: Compartilhamento Manual
            </div>
            <div style="color: #1976d2; line-height: 1.6;">
              Se não puder desabilitar o Tracking Prevention, use o <strong>Compartilhamento Manual</strong>:
              <br><br>
              ✅ 100% confiável - sempre funciona<br>
              ✅ Não depende de P2P ou navegador<br>
              ✅ Funciona mesmo com bloqueios ativos<br>
              <br>
              <button class="btn btn-primary" onclick="UI.showQuickShareGuide(); document.getElementById('trackingWarningModal').remove();" style="width: 100%; padding: 12px;">
                📤 Ver Guia de Compartilhamento Manual
              </button>
            </div>
          </div>

          <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 4px;">
            <div style="font-weight: 600; color: #155724; margin-bottom: 8px;">
              ℹ️ Por que isso acontece?
            </div>
            <div style="color: #155724; font-size: 0.9rem; line-height: 1.6;">
              Navegadores modernos bloqueiam scripts de terceiros (como PeerJS hospedado no unpkg.com) para proteger sua privacidade.
              Como o OAE Revisor precisa de conexões P2P para sincronização em tempo real, é necessário permitir esse acesso.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('trackingWarningModal').remove()">Fechar</button>
          <button class="btn btn-success" onclick="UI.clearCacheAndReload()" style="background: var(--success);">
            🔄 Limpar cache e Recarregar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  updatePeerConnectionStatus(peerId, status) {
    // Atualiza UI quando status de conexão muda
    this.updateNetworkUI();
    if (document.getElementById("networkModal").classList.contains("show")) {
      this.updateNetworkModal();
    }
  },

  /**
   * Limpa cache via cache-bust e recarrega a página (usar quando Tracking Prevention bloqueou scripts externos)
   */
  clearCacheAndReload() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('cb', Date.now());
      window.location.replace(url.toString());
    } catch (e) {
      // fallback
      window.location.href = window.location.pathname + '?cb=' + Date.now();
    }
  },

  /**
   * Exibe uma mensagem toast temporária
   * @param {string} message - Mensagem a ser exibida
   * @param {number} duration - Duração em ms (padrão: 3000)
   */
  showToast(message, duration = 3000) {
    const toast = document.getElementById("toast");
    if (!toast) {
      console.warn("Toast element not found");
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    // Remove após o tempo especificado
    setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  },

  /**
   * Inicializa o toggle de lote (admin e avaliadores)
   */
  initLoteToggle() {
    const currentUser = AuthSystem.currentUser;
    const loteToggle = document.getElementById("loteToggle");

    if (!loteToggle) return;

    // Mostra toggle para Admin e Avaliadores
    const canViewAllLotes = currentUser?.role === "admin" || currentUser?.role === "avaliador";

    if (canViewAllLotes) {
      loteToggle.style.display = "flex";
      loteToggle.style.alignItems = "center";
    } else {
      loteToggle.style.display = "none";
    }
  },

  /**
   * Handler para mudança no filtro de lote
   */
  handleLoteFilterChange() {
    const select = document.getElementById("loteFilter");
    const selectedLote = select.value || null;

    WorkManager.updateFilters({ lote: selectedLote });

    // Atualiza a lista de obras se o modal estiver aberto
    if (document.getElementById("worksModal")?.classList.contains("show")) {
      this.showWorksModal();
    }

    const loteText = selectedLote || "Todos os Lotes";
    this.showNotification(`Filtro alterado: ${loteText}`, "info");
  },

  /**
   * Atualiza o título da obra no header com status e lote
   */
  updateWorkTitle() {
    const workTitleEl = document.getElementById("workTitle");
    if (!workTitleEl) return;

    const obra = appState.work;
    if (!obra || !obra.codigo) {
      workTitleEl.textContent = "";
      return;
    }

    const status = obra.metadata?.status || OBRA_STATUS.CADASTRO;
    const statusLabel = OBRA_STATUS_LABELS[status] || status;
    const lote = obra.metadata?.lote || "Sem Lote";

    workTitleEl.innerHTML = `
      <span style="color: var(--text-color);">${obra.codigo}</span>
      <span style="background: var(--bg-accent); padding: 2px 8px; margin-left: 10px; border-radius: 4px; font-size: 0.75rem;">
        ${lote}
      </span>
      <span style="background: var(--primary); color: white; padding: 2px 8px; margin-left: 5px; border-radius: 4px; font-size: 0.75rem;">
        ${statusLabel}
      </span>
    `;
  },

  /**
   * Exibe o histórico de edições da obra atual
   */
  showEditHistoryModal() {
    const obra = appState.work;
    if (!obra || !obra.codigo) {
      this.showNotification("Nenhuma obra carregada", "error");
      return;
    }

    // Busca histórico do banco de dados
    DB.getEditHistory(obra.codigo).then((history) => {
      this.renderEditHistoryModal(history, obra);
    }).catch((error) => {
      console.error("Erro ao carregar histórico:", error);
      this.showNotification("Erro ao carregar histórico", "error");
    });
  },

  /**
   * Renderiza o modal de histórico de edições
   */
  renderEditHistoryModal(history, obra) {
    // Calcular estatísticas
    const totalEdits = history.length;
    const uniqueUsers = [...new Set(history.map(h => h.userEmail))].length;
    const editsByUser = {};

    history.forEach(entry => {
      const email = entry.userEmail || 'Desconhecido';
      editsByUser[email] = (editsByUser[email] || 0) + 1;
    });

    const mostActiveUser = Object.entries(editsByUser).sort((a, b) => b[1] - a[1])[0];

    const modal = document.createElement("div");
    modal.id = "editHistoryModal";
    modal.className = "modal-backdrop show";
    modal.innerHTML = `
      <div class="modal" style="width: 85%; max-width: 1200px;">
        <div class="modal-header">
          <h2>📋 Histórico de Edições - ${obra.codigo}</h2>
          <button class="modal-close" onclick="document.getElementById('editHistoryModal').remove()">✖</button>
        </div>
        <div class="modal-body">
          <!-- Estatísticas -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 8px;">
            <div style="text-align: center;">
              <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">${totalEdits}</div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">Total de Edições</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 2rem; font-weight: 700; color: var(--success);">${uniqueUsers}</div>
              <div style="font-size: 0.85rem; color: var(--text-muted);">Usuários Diferentes</div>
            </div>
            ${mostActiveUser ? `
              <div style="text-align: center;">
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--warning);">${mostActiveUser[0]}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">Mais Ativo (${mostActiveUser[1]} edições)</div>
              </div>
            ` : ''}
          </div>

          <!-- Tabela de histórico -->
          <div style="max-height: 500px; overflow-y: auto;">
            ${this.renderEditHistoryTable(history)}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('editHistoryModal').remove()">
            Fechar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  /**
   * Publica/Envia obra para próxima etapa do workflow
   */
  async publicarObra() {
    const obra = appState.work;
    if (!obra || !obra.codigo) {
      this.showNotification("Nenhuma obra carregada", "error");
      return;
    }

    const currentUser = AuthSystem.currentUser;
    const currentStatus = obra.metadata?.status || OBRA_STATUS.CADASTRO;

    let newStatus, message, confirmMessage;

    // Define próximo status baseado no role e status atual
    if (currentUser.role === "inspetor") {
      if (currentStatus === OBRA_STATUS.CADASTRO || currentStatus === OBRA_STATUS.PENDENTE_RETIFICACAO) {
        newStatus = OBRA_STATUS.PUBLICADO_AVALIACAO;
        confirmMessage = "Tem certeza que deseja publicar esta obra para avaliação?";
        message = "Obra publicada para avaliação com sucesso!";
      } else {
        this.showNotification("Obra já foi publicada ou está em avaliação", "warning");
        return;
      }
    } else if (currentUser.role === "avaliador") {
      if (currentStatus === OBRA_STATUS.PUBLICADO_AVALIACAO || currentStatus === OBRA_STATUS.EM_AVALIACAO) {
        // Pergunta se aprova ou reprova
        const opcao = await this.showApprovalDialog();
        if (opcao === null) return; // Cancelou

        if (opcao === "aprovar") {
          newStatus = OBRA_STATUS.APROVADO;
          message = "Obra aprovada com sucesso!";
        } else {
          newStatus = OBRA_STATUS.PENDENTE_RETIFICACAO;
          message = "Obra enviada para retificação. O inspetor será notificado.";
        }
      } else {
        this.showNotification("Esta obra não está disponível para avaliação", "warning");
        return;
      }
    } else {
      this.showNotification("Apenas inspetores e avaliadores podem publicar obras", "error");
      return;
    }

    // Confirmação
    if (confirmMessage && !confirm(confirmMessage)) {
      return;
    }

    try {
      // Atualiza status
      obra.metadata.status = newStatus;
      obra.metadata.publishedBy = currentUser.email;
      obra.metadata.publishedAt = new Date().toISOString();

      // IMPORTANTE: Marca a obra como pública quando publicada
      // Isso garante que a obra seja visível para outros usuários
      if (newStatus === OBRA_STATUS.PUBLICADO_AVALIACAO ||
          newStatus === OBRA_STATUS.APROVADO ||
          newStatus === OBRA_STATUS.PENDENTE_RETIFICACAO) {
        obra.metadata.isPublic = true;
      }

      if (newStatus === OBRA_STATUS.APROVADO || newStatus === OBRA_STATUS.PENDENTE_RETIFICACAO) {
        obra.metadata.evaluatedBy = currentUser.email;
        obra.metadata.evaluatedAt = new Date().toISOString();
      }

      // Salva no banco
      await DB.saveObra(obra.codigo, {
        work: obra,
        errors: appState.errors,
        elementErrors: appState.elementErrors,
        anexoErrors: appState.anexoErrors,
        mensagens: appState.mensagens,
        completionStates: appState.completionStates,
        messageResponses: appState.messageResponses,
      });

      // Registra no audit trail
      if (window.AuditSystem) {
        AuditSystem.logChange("status_changed", {
          oldStatus: currentStatus,
          newStatus: newStatus,
          publishedBy: currentUser.email,
        });
      }

      this.showNotification(message, "success");

      // Verifica sincronização P2P
      const hasPeers = window.MultiPeerSync && MultiPeerSync.hasConnections();
      if (!hasPeers) {
        setTimeout(() => {
          this.showNotification(
            `⚠️ IMPORTANTE: Nenhum usuário conectado no momento!\n\n` +
            `A obra foi publicada LOCALMENTE, mas para que outros usuários vejam:\n` +
            `1️⃣ Conecte-se via aba Mensagens > Gerenciar Rede\n` +
            `2️⃣ OU use o botão 🔗 Compartilhar no Gerenciador de Obras`,
            "warning"
          );
        }, 1500);
      } else {
        // Força broadcast da obra atualizada
        if (window.MultiPeerSync) {
          await MultiPeerSync.broadcastWorkUpdated({
            work: obra,
            errors: appState.errors,
            elementErrors: appState.elementErrors,
            anexoErrors: appState.anexoErrors,
            mensagens: appState.mensagens,
          });

          // Também envia o link codificado para que os peers possam importar rapidamente
          try {
            const inviteLink = await SyncMethods.generateWorkShareLink(obra.codigo);
            const url = new URL(inviteLink);
            const encoded = url.searchParams.get('shareWork');
            if (encoded) {
              MultiPeerSync.broadcast({ type: 'work_share_link', payload: { encoded } });
            }
          } catch (e) {
            console.warn('Não foi possível gerar/enviar link de compartilhamento:', e);
          }
        }
        setTimeout(() => {
          this.showNotification(
            `✅ Obra sincronizada com ${MultiPeerSync.getNetworkStats().connectedPeers} usuário(s) online!`,
            "success"
          );
        }, 1000);
      }

      // Atualiza título com novo status
      this.updateWorkTitle();

      // Atualiza cache do WorkManager
      if (window.WorkManager) {
        await WorkManager.loadAllWorks();
      }
    } catch (error) {
      console.error("Erro ao publicar obra:", error);
      this.showNotification("Erro ao publicar obra: " + error.message, "error");
    }
  },

  /**
   * Exibe diálogo para avaliador aprovar ou reprovar obra
   */
  showApprovalDialog() {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "modal-backdrop show";
      modal.id = "approvalDialog";
      modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header">
            <h2>🔍 Avaliar Obra</h2>
          </div>
          <div class="modal-body" style="text-align: center; padding: 30px;">
            <p style="font-size: 1.1rem; margin-bottom: 30px;">
              Selecione a ação para esta obra:
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
              <button class="btn btn-success" id="btnAprovar" style="padding: 15px 30px; font-size: 1rem;">
                ✅ Aprovar
              </button>
              <button class="btn btn-danger" id="btnReprovar" style="padding: 15px 30px; font-size: 1rem;">
                ❌ Reprovar
              </button>
            </div>
            <button class="btn btn-secondary" id="btnCancelar" style="margin-top: 20px;">
              Cancelar
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById("btnAprovar").onclick = () => {
        modal.remove();
        resolve("aprovar");
      };

      document.getElementById("btnReprovar").onclick = () => {
        modal.remove();
        resolve("reprovar");
      };

      document.getElementById("btnCancelar").onclick = () => {
        modal.remove();
        resolve(null);
      };
    });
  },

  /**
   * Muda o status de uma obra diretamente da lista
   */
  async changeWorkStatus(codigo) {
    try {
      // Carrega a obra do banco
      const obraData = await DB.loadObra(codigo);
      if (!obraData) {
        this.showNotification("Obra não encontrada", "error");
        return;
      }

      const obra = obraData.work;
      const currentUser = AuthSystem.currentUser;
      const currentStatus = obra.metadata?.status || OBRA_STATUS.CADASTRO;

      // Define opções de status disponíveis baseado no role e status atual
      let statusOptions = [];

      if (currentUser.role === "admin") {
        // Admin pode mudar para qualquer status
        statusOptions = [
          { value: OBRA_STATUS.CADASTRO, label: "📝 Cadastro (Inspetor)" },
          { value: OBRA_STATUS.PUBLICADO_AVALIACAO, label: "📤 Publicado para Avaliação" },
          { value: OBRA_STATUS.EM_AVALIACAO, label: "🔍 Em Avaliação" },
          { value: OBRA_STATUS.PENDENTE_RETIFICACAO, label: "⚠️ Pendente de Retificação" },
          { value: OBRA_STATUS.APROVADO, label: "✅ Aprovado" },
        ];
      } else if (currentUser.role === "inspetor") {
        // Inspetor só pode publicar para avaliação
        if (currentStatus === OBRA_STATUS.CADASTRO || currentStatus === OBRA_STATUS.PENDENTE_RETIFICACAO) {
          statusOptions = [
            { value: currentStatus, label: OBRA_STATUS_LABELS[currentStatus] + " (Atual)" },
            { value: OBRA_STATUS.PUBLICADO_AVALIACAO, label: "📤 Publicar para Avaliação" },
          ];
        } else {
          this.showNotification("Você só pode publicar obras em Cadastro ou Pendente de Retificação", "warning");
          return;
        }
      } else if (currentUser.role === "avaliador") {
        // Avaliador pode aprovar ou reprovar
        if (currentStatus === OBRA_STATUS.PUBLICADO_AVALIACAO || currentStatus === OBRA_STATUS.EM_AVALIACAO) {
          statusOptions = [
            { value: currentStatus, label: OBRA_STATUS_LABELS[currentStatus] + " (Atual)" },
            { value: OBRA_STATUS.EM_AVALIACAO, label: "🔍 Marcar como Em Avaliação" },
            { value: OBRA_STATUS.APROVADO, label: "✅ Aprovar Obra" },
            { value: OBRA_STATUS.PENDENTE_RETIFICACAO, label: "⚠️ Reprovar - Pendente Retificação" },
          ];
        } else {
          this.showNotification("Você só pode avaliar obras publicadas para avaliação", "warning");
          return;
        }
      }

      // Mostra modal de seleção de status
      const newStatus = await this.showStatusSelectionDialog(obra, statusOptions, currentStatus);
      if (!newStatus || newStatus === currentStatus) return;

      // Atualiza status
      obra.metadata.status = newStatus;
      obra.metadata.lastModifiedAt = new Date().toISOString();
      obra.metadata.lastModifiedBy = currentUser.email;

      // Marca como pública quando publicada
      if (newStatus === OBRA_STATUS.PUBLICADO_AVALIACAO ||
          newStatus === OBRA_STATUS.APROVADO ||
          newStatus === OBRA_STATUS.PENDENTE_RETIFICACAO) {
        obra.metadata.isPublic = true;
      }

      // Atualiza campos específicos baseado no novo status
      if (newStatus === OBRA_STATUS.PUBLICADO_AVALIACAO) {
        obra.metadata.publishedBy = currentUser.email;
        obra.metadata.publishedAt = new Date().toISOString();
      }

      if (newStatus === OBRA_STATUS.APROVADO || newStatus === OBRA_STATUS.PENDENTE_RETIFICACAO) {
        obra.metadata.evaluatedBy = currentUser.email;
        obra.metadata.evaluatedAt = new Date().toISOString();
      }

      // Salva no banco
      await DB.saveObra(codigo, obraData);

      // Registra no audit trail
      if (window.AuditSystem) {
        AuditSystem.logChange("status_changed", {
          oldStatus: currentStatus,
          newStatus: newStatus,
          changedBy: currentUser.email,
        });
      }

      // Atualiza cache do WorkManager
      if (window.WorkManager) {
        await WorkManager.loadAllWorks();
      }

      this.showNotification(`Status atualizado para: ${OBRA_STATUS_LABELS[newStatus]}`, "success");

      // Recarrega a lista de obras
      this.showWorksModal();
    } catch (error) {
      console.error("Erro ao mudar status:", error);
      this.showNotification("Erro ao mudar status: " + error.message, "error");
    }
  },

  /**
   * Mostra diálogo de seleção de status
   */
  showStatusSelectionDialog(obra, statusOptions, currentStatus) {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "modal-backdrop show";
      modal.id = "statusSelectionDialog";

      const optionsHtml = statusOptions
        .map(
          (opt) =>
            `<option value="${opt.value}" ${opt.value === currentStatus ? "selected" : ""}>${opt.label}</option>`
        )
        .join("");

      modal.innerHTML = `
        <div class="modal" style="max-width: 550px;">
          <div class="modal-header">
            <h2>🔄 Mudar Status da Obra</h2>
          </div>
          <div class="modal-body" style="padding: 30px;">
            <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 5px;">Obra:</div>
              <div style="font-weight: 600; font-size: 1.1rem;">${obra.codigo} - ${obra.nome}</div>
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 600;">Selecione o novo status:</label>
              <select id="newStatusSelect" class="form-input" style="width: 100%; padding: 10px; font-size: 1rem;">
                ${optionsHtml}
              </select>
            </div>

            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
              <div style="font-size: 0.85rem; color: #856404;">
                <strong>⚠️ Atenção:</strong> Mudanças de status são registradas no histórico de auditoria e podem afetar a visibilidade da obra.
              </div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button class="btn btn-secondary" id="btnCancelarStatus">
                Cancelar
              </button>
              <button class="btn btn-primary" id="btnConfirmarStatus">
                Confirmar Mudança
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById("btnConfirmarStatus").onclick = () => {
        const selectedStatus = document.getElementById("newStatusSelect").value;
        modal.remove();
        resolve(selectedStatus);
      };

      document.getElementById("btnCancelarStatus").onclick = () => {
        modal.remove();
        resolve(null);
      };
    });
  },

  /**
   * Renderiza a tabela de histórico de edições
   */
  renderEditHistoryTable(history) {
    if (!history || history.length === 0) {
      return '<p style="text-align: center; color: var(--text-muted);">Nenhuma edição registrada.</p>';
    }

    // Ordena do mais recente para o mais antigo
    const sortedHistory = [...history].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    let html = `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
        <thead>
          <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--border-color);">
            <th style="padding: 10px; text-align: left;">Data/Hora</th>
            <th style="padding: 10px; text-align: left;">Usuário</th>
            <th style="padding: 10px; text-align: left;">Lote</th>
            <th style="padding: 10px; text-align: left;">Ação</th>
            <th style="padding: 10px; text-align: left;">Detalhes</th>
          </tr>
        </thead>
        <tbody>
    `;

    sortedHistory.forEach((entry, index) => {
      const date = new Date(entry.timestamp);
      const formattedDate = date.toLocaleDateString('pt-BR');
      const formattedTime = date.toLocaleTimeString('pt-BR');
      const userLote = entry.userLote || 'N/A';

      const changes = entry.changes || {};
      let detailsHtml = '';
      let actionLabel = entry.action || 'save';

      // Formata ação
      if (actionLabel === 'save') {
        actionLabel = '💾 Salvou';
      } else if (actionLabel === 'status_changed') {
        actionLabel = '🔄 Mudou Status';
      } else if (actionLabel === 'create') {
        actionLabel = '➕ Criou';
      }

      // Formata detalhes
      if (changes.type === 'created') {
        detailsHtml = `<span style="color: var(--success); font-weight: 600;">✨ Obra criada</span>`;
      } else if (changes.type === 'updated' && changes.modifiedFields && changes.modifiedFields.length > 0) {
        const fieldCount = changes.modifiedFields.length;
        detailsHtml = `
          <div style="margin-bottom: 5px;">
            <strong style="color: var(--primary);">Alterou ${fieldCount} campo${fieldCount > 1 ? 's' : ''}:</strong>
          </div>
          <div style="max-height: 100px; overflow-y: auto; background: var(--bg-primary); padding: 5px; border-radius: 4px;">
            ${changes.modifiedFields.map(field => `<div style="font-size: 0.8rem; color: var(--text-muted);">• ${field}</div>`).join('')}
          </div>
        `;
      } else if (changes.type === 'updated') {
        detailsHtml = `<span style="color: var(--warning);">✏️ Obra atualizada</span>`;
      } else {
        detailsHtml = `<code style="font-size: 0.75rem;">${JSON.stringify(changes)}</code>`;
      }

      const bgColor = index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)';

      html += `
        <tr style="background: ${bgColor}; border-bottom: 1px solid var(--border-color);">
          <td style="padding: 8px;">
            <div>${formattedDate}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">${formattedTime}</div>
          </td>
          <td style="padding: 8px;">
            <div>${entry.userName || entry.userEmail || 'Desconhecido'}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${entry.userEmail || ''}</div>
          </td>
          <td style="padding: 8px;">
            <span style="background: var(--bg-accent); padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">
              ${userLote}
            </span>
          </td>
          <td style="padding: 8px;">
            <span style="color: var(--primary);">${actionLabel}</span>
          </td>
          <td style="padding: 8px; font-size: 0.85rem;">
            ${detailsHtml}
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    return html;
  },
};
