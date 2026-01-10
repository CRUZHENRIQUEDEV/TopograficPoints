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
    },

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });

        // Role switching
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                appState.role = btn.dataset.role;
                this.updateRoleUI();
            });
        });

        // Tramos change
        document.getElementById('numTramosGlobal').addEventListener('change', (e) => {
            const num = parseInt(e.target.value) || 1;
            Sync.updateTramos(num);
        });

        // Tramo switch refresh families
        document.getElementById('bulkTramo')?.addEventListener('change', () => this.renderFamilies());
    },

    updateRoleUI() {
        document.body.setAttribute('data-role', appState.role);
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.role === appState.role);
        });
        
        // Visual toggle for evaluator-only elements
        const evalOnly = document.querySelectorAll('.evaluator-only');
        evalOnly.forEach(el => el.style.display = appState.role === 'avaliador' ? 'block' : 'none');
    },

    renderAll() {
        this.renderTramosTable();
        this.renderElementsList();
        this.renderAspects();
        this.renderFunctionalDeficiencies();
        this.renderAttachments();
        this.renderMessages();
        this.updateReport();
        this.updateFieldVisuals();
        this.updateTabBadges();
    },

    // --- TRAMOS TABLE ---
    renderTramosTable() {
        const container = document.getElementById('tramosCaracContainer');
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
                            <input type="text" class="form-input" id="t_${id}_tipo" data-tramo-field="${id}_tipo" value="${appState.work.tramos[id]?.tipo || ''}">
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_tipo', 'Tipo Estrutura (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td>
                        <div class="field-wrapper">
                            <select class="form-input" id="t_${id}_sistema" data-tramo-field="${id}_sistema">
                                <option value="">Selecione</option>
                                ${CONSTRUCTION_SYSTEMS.map(sys =>
                                    `<option ${appState.work.tramos[id]?.sistema === sys ? 'selected' : ''}>${sys}</option>`
                                ).join('')}
                            </select>
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_sistema', 'Sistema Construtivo (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td>
                        <div class="field-wrapper">
                            <input type="text" class="form-input" id="t_${id}_ext" data-tramo-field="${id}_ext" value="${appState.work.tramos[id]?.ext || ''}">
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_ext', 'Extensão (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td>
                        <div class="field-wrapper">
                            <input type="text" class="form-input" id="t_${id}_min" data-tramo-field="${id}_min" value="${appState.work.tramos[id]?.min || ''}">
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_min', 'H Min (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td>
                        <div class="field-wrapper">
                            <input type="text" class="form-input" id="t_${id}_max" data-tramo-field="${id}_max" value="${appState.work.tramos[id]?.max || ''}">
                            <button class="error-btn" onclick="UI.openErrorModal('t_${id}_max', 'H Max (Tramo ${label})')">⚠</button>
                        </div>
                    </td>
                    <td>
                        <div class="field-wrapper">
                            <input type="text" class="form-input" id="t_${id}_cont" data-tramo-field="${id}_cont" value="${appState.work.tramos[id]?.cont || ''}">
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
        document.querySelectorAll('[data-tramo-field]').forEach(el => {
            el.addEventListener('input', (e) => {
                const [id, field] = e.target.dataset.tramoField.split('_');
                if (!appState.work.tramos[id]) appState.work.tramos[id] = {};
                appState.work.tramos[id][field] = e.target.value;
                AutoSave.trigger();
            });
        });

        // Update bulk tramo select (incluindo C para elementos)
        const bulkSelect = document.getElementById('bulkTramo');
        let bulkHtml = '';
        for (let i = 1; i <= num; i++) bulkHtml += `<option value="${i}">${i}</option>`;
        bulkHtml += `<option value="C">C (Complementar)</option>`;
        bulkSelect.innerHTML = bulkHtml;
    },

    // --- ELEMENTS ---
    renderFamilies(filterRegion = null) {
        const select = document.getElementById('bulkFamilia');
        let html = '<option value="">Selecione</option>';
        const bulkTramo = document.getElementById('bulkTramo')?.value;
        const regionSelect = document.getElementById('bulkRegiaoFiltro');
        const regionContainer = regionSelect?.closest('.form-field');

        if (bulkTramo === 'C') {
            // Se for tramo C, bloquear região como 'Complementar'
            if (regionSelect) {
                // Adiciona opção complementar se não existir
                if (![...regionSelect.options].some(o => o.value === 'Complementar')) {
                    const opt = new Option('Complementar', 'Complementar');
                    regionSelect.add(opt);
                }
                regionSelect.value = 'Complementar';
                regionSelect.disabled = true;
            }
            
            COMPLEMENTARY_ELEMENTS.forEach(element => {
                html += `<option value="${element}">${element}</option>`;
            });
        } else {
            // Comportamento normal para tramos numéricos
            if (regionSelect) {
                regionSelect.disabled = false;
                // Remove opção complementar se existir
                const compOpt = [...regionSelect.options].find(o => o.value === 'Complementar');
                if (compOpt) regionSelect.remove(compOpt.index);
                if (regionSelect.value === 'Complementar') regionSelect.value = '';
            }
            
            const regions = filterRegion ? [filterRegion] : Object.keys(ELEMENT_FAMILIES);
            regions.forEach(region => {
                html += `<optgroup label="${region}">`;
                ELEMENT_FAMILIES[region].forEach(element => {
                    html += `<option value="${element}">${element}</option>`;
                });
                html += `</optgroup>`;
            });
        }

        select.innerHTML = html;
    },

    filterElementsByRegion() {
        const filterValue = document.getElementById('bulkRegiaoFiltro').value;
        UI.renderFamilies(filterValue || null);
    },

    renderElementErrorTypes() {
        const select = document.getElementById('bulkErro');
        let html = '<option value="">Selecione</option>';

        ELEMENT_ERROR_TYPES.forEach(tipo => {
            html += `<option>${tipo}</option>`;
        });

        select.innerHTML = html;
    },

    addBulkElements() {
        const tramo = document.getElementById('bulkTramo').value;
        const familia = document.getElementById('bulkFamilia').value;
        const erro = document.getElementById('bulkErro').value;
        const obs = document.getElementById('bulkObs').value;

        if (!tramo) { alert('Selecione um tramo.'); return; }
        if (!familia) { alert('Selecione uma família de elemento.'); return; }
        if (!erro) { alert('Selecione uma inconsistência.'); return; }

        // Auto-detectar região pela família selecionada
        let regiao = '';
        if (tramo === 'C') {
            regiao = 'Complementar';
        } else {
            for (const [reg, elementos] of Object.entries(ELEMENT_FAMILIES)) {
                if (elementos.includes(familia)) {
                    regiao = reg;
                    break;
                }
            }
        }

        if (!regiao) {
            alert('Não foi possível determinar a região deste elemento.');
            return;
        }

        appState.elementErrors.push({
            id: 'elem_' + Date.now() + Math.random(),
            tramo, regiao, familia, erro, obs,
            responses: []
        });

        document.getElementById('bulkObs').value = '';
        this.renderElementsList();
        this.updateReport();
        this.updateTabBadges();
        AutoSave.trigger();
    },

    renderElementsList() {
        const container = document.getElementById('elementsContainer');
        if (appState.elementErrors.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum erro de elemento apontado.</p>';
            return;
        }

        // Group by tramo
        const grouped = {};
        appState.elementErrors.forEach(err => {
            if (!grouped[err.tramo]) grouped[err.tramo] = [];
            grouped[err.tramo].push(err);
        });

        let html = '';
        Object.keys(grouped).sort().forEach(tramo => {
            html += `
                <div class="section">
                    <div class="section-title">📦 Tramo ${tramo}</div>
                    <div class="elements-grid">
                        ${grouped[tramo].map(e => `
                            <div class="message-card" id="elem_card_${e.id}">
                                <div class="message-header">
                                    <span><strong>${e.regiao}</strong> | ${e.familia}</span>
                                    <div class="evaluator-only" style="display: ${appState.role === 'avaliador' ? 'flex' : 'none'}; gap: 5px;">
                                        <button class="btn btn-secondary" style="padding: 2px 8px;" onclick="UI.editElementError('${e.id}')">✏️</button>
                                        <button class="btn btn-danger" style="padding: 2px 8px;" onclick="UI.removeElementError('${e.id}')">×</button>
                                    </div>
                                </div>
                                <div style="color: var(--danger); font-weight: 600; font-size: 0.9rem; margin-bottom: 5px;">${e.erro}</div>
                                ${e.obs ? `<div style="font-size: 0.85rem; color: var(--text-secondary); border-left: 2px solid var(--border); padding-left: 10px; margin: 10px 0;">${e.obs}</div>` : ''}
                                
                                <div class="inspector-section">
                                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 5px;">RESPOSTAS DA INSPEÇÃO:</div>
                                    <div id="responses_${e.id}">
                                        ${e.responses.map(r => `
                                            <div style="font-size: 0.8rem; background: var(--bg-tertiary); padding: 5px 10px; border-radius: 4px; margin-bottom: 4px;">
                                                <strong>Inspetor:</strong> ${r.text} <small>(${r.date})</small>
                                            </div>
                                        `).join('')}
                                    </div>
                                    <div class="inspector-only" style="display: ${appState.role === 'inspetor' ? 'flex' : 'none'}; gap: 5px; margin-top: 10px;">
                                        <input type="text" class="form-input no-btn" style="padding: 5px 10px; font-size: 0.8rem;" id="resp_input_${e.id}" placeholder="Escrever resposta...">
                                        <button class="btn btn-primary" style="padding: 5px 15px;" onclick="UI.addResponse('${e.id}')">Enviar</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        });
        container.innerHTML = html;
    },

    removeElementError(id) {
        appState.elementErrors = appState.elementErrors.filter(e => e.id !== id);
        this.renderElementsList();
        this.updateReport();
        this.updateTabBadges();
        AutoSave.trigger();
    },

    editElementError(id) {
    const elem = appState.elementErrors.find(e => e.id === id);
    if (!elem) return;

    const card = document.getElementById('elem_card_' + id);
    if (!card) return;

    const renderEditOptions = (currentTramo) => {
        let regiaoHtml = '';
        let familiaHtml = '<option value="">Selecione</option>';

        if (currentTramo === 'C') {
            regiaoHtml = `<option value="Complementar" selected>Complementar</option>`;
            COMPLEMENTARY_ELEMENTS.forEach(el => {
                familiaHtml += `<option value="${el}" ${elem.familia === el ? 'selected' : ''}>${el}</option>`;
            });
        } else {
            const regioes = ['Apoio', 'Superestrutura', 'Transição'];
            regiaoHtml = regioes.map(r =>
                `<option value="${r}" ${elem.regiao === r ? 'selected' : ''}>${r}</option>`
            ).join('');

            Object.keys(ELEMENT_FAMILIES).forEach(region => {
                familiaHtml += `<optgroup label="${region}">`;
                ELEMENT_FAMILIES[region].forEach(el => {
                    familiaHtml += `<option value="${el}" ${elem.familia === el ? 'selected' : ''}>${el}</option>`;
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
        tramoOptions.push(`<option value="${i}" ${elem.tramo == i ? 'selected' : ''}>${i}</option>`);
    }
    tramoOptions.push(`<option value="C" ${elem.tramo === 'C' ? 'selected' : ''}>C (Complementar)</option>`);

    // Build options for erro
    const erroOptions = ELEMENT_ERROR_TYPES.map(tipo =>
        `<option ${elem.erro === tipo ? 'selected' : ''}>${tipo}</option>`
    ).join('');

    card.innerHTML = `
        <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px;">
            <div style="font-weight: 700; margin-bottom: 10px; color: var(--primary);">✏️ Editando Elemento</div>
            <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="form-field">
                    <label class="form-label">Tramo</label>
                    <select class="form-input no-btn" id="edit_tramo_${id}">${tramoOptions.join('')}</select>
                </div>
                <div class="form-field">
                    <label class="form-label">Região</label>
                    <select class="form-input no-btn" id="edit_regiao_${id}">${initial.regiaoHtml}</select>
                </div>
                <div class="form-field" style="grid-column: span 2;">
                    <label class="form-label">Família de Elemento</label>
                    <select class="form-input no-btn" id="edit_familia_${id}" style="max-height: 150px;">${initial.familiaHtml}</select>
                </div>
                <div class="form-field" style="grid-column: span 2;">
                    <label class="form-label">Inconsistência</label>
                    <select class="form-input no-btn" id="edit_erro_${id}">${erroOptions}</select>
                </div>
                <div class="form-field" style="grid-column: span 2;">
                    <label class="form-label">Observação</label>
                    <textarea class="form-input no-btn" id="edit_obs_${id}" style="height: 80px;">${elem.obs || ''}</textarea>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="UI.renderElementsList()">Cancelar</button>
                <button class="btn btn-primary" onclick="UI.updateElementError('${id}')">💾 Salvar</button>
            </div>
        </div>
    `;

    // Add listener for tramo change in edit view
    document.getElementById(`edit_tramo_${id}`).addEventListener('change', (e) => {
        const tramoVal = e.target.value;
        const options = renderEditOptions(tramoVal);
        const regiaoSelect = document.getElementById(`edit_regiao_${id}`);
        const familiaSelect = document.getElementById(`edit_familia_${id}`);
        regiaoSelect.innerHTML = options.regiaoHtml;
        familiaSelect.innerHTML = options.familiaHtml;
        regiaoSelect.disabled = (tramoVal === 'C');
    });
    
    // Disable region if initially C
    if (elem.tramo === 'C') document.getElementById(`edit_regiao_${id}`).disabled = true;
    },

    updateElementError(id) {
        const elem = appState.elementErrors.find(e => e.id === id);
        if (!elem) return;

        elem.tramo = document.getElementById('edit_tramo_' + id).value;
        elem.regiao = document.getElementById('edit_regiao_' + id).value;
        elem.familia = document.getElementById('edit_familia_' + id).value;
        elem.erro = document.getElementById('edit_erro_' + id).value;
        elem.obs = document.getElementById('edit_obs_' + id).value;

        this.renderElementsList();
        this.updateReport();
        AutoSave.trigger();
    },

    addResponse(id) {
        const input = document.getElementById('resp_input_' + id);
        const text = input.value.trim();
        if (!text) return;

        const err = appState.elementErrors.find(e => e.id === id);
        if (err) {
            err.responses.push({
                text,
                date: new Date().toLocaleString('pt-BR')
            });
            input.value = '';
            this.renderElementsList();
            AutoSave.trigger();
        }
    },

    // --- ASPECTS ---
    renderAspects() {
        const container = document.getElementById('aspectosContainer');
        if (!container) return;

        if (appState.work.aspects.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum aspecto especial registrado.</p>';
            return;
        }

        container.innerHTML = `
            <table class="view-table">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th style="width: 150px;">Sigla</th>
                        <th>Comentário</th>
                        <th style="width: 50px;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${appState.work.aspects.map(a => `
                        <tr>
                            <td>${a.desc}</td>
                            <td>${a.sigla}</td>
                            <td>
                                <input type="text" class="form-input no-btn" value="${a.comment || ''}" 
                                    oninput="UI.updateAspectComment('${a.id}', this.value)" placeholder="Adicionar nota...">
                            </td>
                            <td>
                                <button class="btn btn-danger" style="padding: 2px 8px;" onclick="UI.removeAspect('${a.id}')">×</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    openAspectModal() {
        const select = document.getElementById('modalAspectSelect');
        select.innerHTML = '<option value="">Selecione</option>' + 
            SPECIAL_ASPECTS.map(s => `<option value="${s.desc}">${s.desc}</option>`).join('');
        
        document.getElementById('aspectModal').style.display = 'flex';
    },

    closeAspectModal() {
        document.getElementById('aspectModal').style.display = 'none';
        document.getElementById('modalAspectSelect').value = '';
    },

    addAspectFromModal() {
        const desc = document.getElementById('modalAspectSelect').value;
        if (!desc) return;

        const info = SPECIAL_ASPECTS.find(s => s.desc === desc);
        const id = 'aspect_' + Date.now();

        appState.work.aspects.push({
            id,
            desc: info.desc,
            sigla: info.sigla,
            comment: ""
        });

        this.closeAspectModal();
        this.renderAspects();
        AutoSave.trigger();
    },

    updateAspectComment(id, value) {
        const aspect = appState.work.aspects.find(a => a.id === id);
        if (aspect) {
            aspect.comment = value;
            AutoSave.trigger();
        }
    },

    removeAspect(id) {
        appState.work.aspects = appState.work.aspects.filter(a => a.id !== id);
        this.renderAspects();
        AutoSave.trigger();
    },

    // --- FUNCTIONAL DEFICIENCIES ---
    renderFunctionalDeficiencies() {
        const container = document.getElementById('deficienciasContainer');
        if (!container) return;

        if (appState.work.functionalDeficiencies.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhuma deficiência funcional registrada.</p>';
            return;
        }

        container.innerHTML = `
            <table class="view-table">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th style="width: 150px;">Unidade</th>
                        <th style="width: 100px;">Valor/Qtd</th>
                        <th style="width: 50px;">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${appState.work.functionalDeficiencies.map(d => `
                        <tr>
                            <td>${d.desc}</td>
                            <td>${d.unit}</td>
                            <td>
                                <input type="number" class="form-input no-btn" value="${d.value || 0}" 
                                    onchange="UI.updateDeficValue('${d.id}', this.value)">
                            </td>
                            <td>
                                <button class="btn btn-danger" style="padding: 2px 8px;" onclick="UI.removeDefic('${d.id}')">×</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    openDeficModal() {
        const select = document.getElementById('modalDeficSelect');
        select.innerHTML = '<option value="">Selecione</option>' + 
            FUNCTIONAL_DEFICIENCIES.map(d => `<option value="${d.desc}">${d.desc}</option>`).join('');
        
        document.getElementById('deficModal').style.display = 'flex';
    },

    closeDeficModal() {
        document.getElementById('deficModal').style.display = 'none';
        document.getElementById('modalDeficSelect').value = '';
    },

    addDeficFromModal() {
        const desc = document.getElementById('modalDeficSelect').value;
        if (!desc) return;

        const info = FUNCTIONAL_DEFICIENCIES.find(f => f.desc === desc);
        const id = 'defic_' + Date.now();

        appState.work.functionalDeficiencies.push({
            id,
            desc: info.desc,
            unit: info.unit,
            value: 0
        });

        this.closeDeficModal();
        this.renderFunctionalDeficiencies();
        AutoSave.trigger();
    },

    updateDeficValue(id, value) {
        const defic = appState.work.functionalDeficiencies.find(d => d.id === id);
        if (defic) {
            defic.value = value;
            AutoSave.trigger();
        }
    },

    removeDefic(id) {
        appState.work.functionalDeficiencies = appState.work.functionalDeficiencies.filter(d => d.id !== id);
        this.renderFunctionalDeficiencies();
        AutoSave.trigger();
    },

    // --- ATTACHMENTS ---
    addAnexoError() {
        const nome = document.getElementById('anexoNome').value.trim();
        const tipo = document.getElementById('anexoTipo').value;
        const inconsist = document.getElementById('anexoTipoErro').value;
        const obs = document.getElementById('anexoObs').value.trim();

        if (!nome) return;

        appState.anexoErrors.push({
            id: 'anexo_' + Date.now(),
            nome, tipo, inconsist, obs
        });

        document.getElementById('anexoNome').value = '';
        document.getElementById('anexoObs').value = '';
        this.renderAttachments();
        this.updateReport();
        this.updateTabBadges();
        AutoSave.trigger();
    },

    renderAttachments() {
        const container = document.getElementById('attachmentsContainer');
        if (appState.anexoErrors.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Nenhum erro de anexo apontado.</p>';
            return;
        }

        container.innerHTML = `
            <div class="section-title">🔴 Erros em Anexos/Fotos</div>
            <div class="elements-grid">
                ${appState.anexoErrors.map(e => `
                    <div class="message-card">
                        <div class="message-header">
                            <span><strong>${e.tipo}:</strong> ${e.nome}</span>
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-secondary" style="padding: 2px 8px;" onclick="UI.openEditAnexo('${e.id}')">✎</button>
                                <button class="btn btn-danger" style="padding: 2px 8px;" onclick="UI.removeAnexoError('${e.id}')">×</button>
                            </div>
                        </div>
                        <div style="color: var(--danger); font-size: 0.85rem; font-weight: 600;">${e.inconsist}</div>
                        ${e.obs ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">${e.obs}</div>` : ''}
                    </div>
                `).join('')}
            </div>`;
    },

    removeAnexoError(id) {
        appState.anexoErrors = appState.anexoErrors.filter(e => e.id !== id);
        this.renderAttachments();
        this.updateReport();
        this.updateTabBadges();
        AutoSave.trigger();
    },

    // --- MESSAGES ---
    addMensagem() {
        const input = document.getElementById('novaMensagem');
        const text = input.value.trim();
        if (!text) return;

        appState.mensagens.push({
            id: 'msg_' + Date.now(),
            author: appState.role === 'avaliador' ? 'Auditor/Avaliador' : 'Inspetor de Campo',
            text,
            date: new Date().toLocaleString('pt-BR')
        });

        input.value = '';
        this.renderMessages();
        AutoSave.trigger();
    },

    renderMessages() {
        const container = document.getElementById('mensagensContainer');

        // Convert all errors to message format
        const allMessages = [];

        // Add field errors as messages
        Object.values(appState.errors).forEach(err => {
            const typesText = err.types.join('; ');
            allMessages.push({
                id: err.id,
                type: 'field',
                text: `Campo [${err.label}]: ${typesText}${err.obs ? ' - ' + err.obs : ''}`,
                author: appState.work.avaliador || 'Avaliador',
                role: 'Avaliador',
                date: new Date().toLocaleString('pt-BR'),
                isOwn: true
            });
        });

        // Add element errors as messages
        appState.elementErrors.forEach(err => {
            allMessages.push({
                id: err.id,
                type: 'element',
                text: `Tramo ${err.tramo} - ${err.regiao} | ${err.familia}: ${err.erro}${err.obs ? ' - ' + err.obs : ''}`,
                author: appState.work.avaliador || 'Avaliador',
                role: 'Avaliador',
                date: new Date().toLocaleString('pt-BR'),
                isOwn: true
            });
        });

        // Add anexo errors as messages
        appState.anexoErrors.forEach(err => {
            allMessages.push({
                id: err.id,
                type: 'anexo',
                text: `Anexo [${err.nome}]: ${err.inconsist}${err.obs ? ' - ' + err.obs : ''}`,
                author: appState.work.avaliador || 'Avaliador',
                role: 'Avaliador',
                date: new Date().toLocaleString('pt-BR'),
                isOwn: true
            });
        });

        // Add custom messages
        appState.mensagens.forEach(m => {
            allMessages.push({
                id: m.id,
                type: 'message',
                text: m.text,
                author: m.author,
                role: m.author.includes('Auditor') ? 'Avaliador' : 'Inspetor',
                date: m.date,
                isOwn: m.author.includes('Auditor') || m.author.includes('Avaliador')
            });
        });

        if (allMessages.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Nenhuma inconsistência ou mensagem registrada.</p>';
            this.updateMessageCounters(0, 0, 0);
            return;
        }

        let totalCount = 0;
        let pendingCount = 0;
        let completedCount = 0;

        const html = allMessages.map(msg => {
            const isCompleted = appState.completionStates.get(msg.id) || false;
            const savedResponse = appState.messageResponses.get(msg.id);

            if (msg.isOwn) {
                totalCount++;
                if (isCompleted) completedCount++;
                else pendingCount++;
            }

            const cardClasses = msg.isOwn ? 'message-card own-message' : 'message-card other-message';
            const completedClass = (msg.isOwn && isCompleted) ? ' completed' : '';

            return `
                <div class="${cardClasses}${completedClass}" data-message-id="${msg.id}">
                    <div class="message-header">
                        ${msg.isOwn ? `
                            <div class="checkbox-container">
                                <input type="checkbox" class="message-checkbox"
                                    ${isCompleted ? 'checked' : ''}
                                    onchange="UI.toggleCompletion('${msg.id}')">
                            </div>
                        ` : ''}
                        <div class="message-content">
                            <div class="message-text">${msg.text}</div>
                            <div class="message-meta">
                                <div>
                                    <strong>${msg.author}</strong> - ${msg.role}<br>
                                    <small>${msg.date}</small>
                                </div>
                                ${msg.isOwn ? `
                                    <span style="background: ${isCompleted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)'};
                                          color: ${isCompleted ? 'var(--success)' : 'var(--warning)'};
                                          padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                        ${isCompleted ? '✅ Corrigido' : '⏳ Pendente'}
                                    </span>
                                ` : `
                                    <span style="background: rgba(100, 116, 139, 0.2); color: var(--text-muted);
                                          padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                        📤 Sua Mensagem
                                    </span>
                                `}
                            </div>
                            ${msg.isOwn ? `
                                <div class="response-section" style="margin-top: 15px;">
                                    ${savedResponse ? `
                                        <div class="saved-response">
                                            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 5px;">
                                                RESPOSTA DA INSPEÇÃO:
                                            </div>
                                            <div style="font-size: 0.9rem; line-height: 1.5; margin-bottom: 8px;">${savedResponse.text}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">
                                                <small>${savedResponse.date}</small>
                                            </div>
                                            <div class="inspector-only" style="display: ${appState.role === 'inspetor' ? 'flex' : 'none'}; gap: 8px; margin-top: 10px;">
                                                <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.85rem;"
                                                    onclick="UI.editResponse('${msg.id}')">✏️ Editar</button>
                                                <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 0.85rem;"
                                                    onclick="UI.copyResponse('${msg.id}')">📋 Copiar</button>
                                            </div>
                                        </div>
                                    ` : `
                                        <div class="inspector-only" style="display: ${appState.role === 'inspetor' ? 'block' : 'none'};">
                                            <textarea class="response-textarea" id="response_input_${msg.id}"
                                                placeholder="Escrever resposta..."></textarea>
                                            <button class="btn btn-primary" style="margin-top: 8px; padding: 6px 16px;"
                                                onclick="UI.saveResponse('${msg.id}')">💾 Salvar Resposta</button>
                                        </div>
                                    `}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
        this.updateMessageCounters(totalCount, pendingCount, completedCount);
    },

    updateMessageCounters(total, pending, completed) {
        document.getElementById('msgsTotalCount').textContent = total;
        document.getElementById('msgsPendingCount').textContent = pending;
        document.getElementById('msgsCompletedCount').textContent = completed;
    },

    toggleCompletion(id) {
        const currentState = appState.completionStates.get(id) || false;
        appState.completionStates.set(id, !currentState);
        this.renderMessages();
        AutoSave.trigger();
    },

    saveResponse(id) {
        const textarea = document.getElementById('response_input_' + id);
        const text = textarea.value.trim();
        if (!text) {
            alert('Digite uma resposta antes de salvar.');
            return;
        }

        appState.messageResponses.set(id, {
            text,
            date: new Date().toLocaleString('pt-BR')
        });

        this.renderMessages();
        AutoSave.trigger();
    },

    editResponse(id) {
        const savedResponse = appState.messageResponses.get(id);
        if (!savedResponse) return;

        const card = document.querySelector(`[data-message-id="${id}"]`);
        if (!card) return;

        const responseSection = card.querySelector('.saved-response');
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
        const textarea = document.getElementById('edit_response_' + id);
        const text = textarea.value.trim();
        if (!text) {
            alert('Digite uma resposta antes de salvar.');
            return;
        }

        appState.messageResponses.set(id, {
            text,
            date: new Date().toLocaleString('pt-BR')
        });

        this.renderMessages();
        AutoSave.trigger();
    },

    copyResponse(id) {
        const savedResponse = appState.messageResponses.get(id);
        if (!savedResponse) return;

        navigator.clipboard.writeText(savedResponse.text).then(() => {
            alert('Resposta copiada para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            alert('Não foi possível copiar a resposta.');
        });
    },

    // --- ERROR MODAL ---
    openErrorModal(fieldId, fieldLabel) {
        appState.currentField = fieldId;
        const fieldEl = document.getElementById(fieldId) || document.getElementById('f_' + fieldId);
        const valor = fieldEl ? (fieldEl.value || '(vazio)') : '(vazio)';

        const existing = appState.errors[fieldId];
        
        const modalBody = document.getElementById('modalBody');
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
                    ${this.getErrorTypes(fieldId).map(t => `
                        <label style="display: flex; gap: 10px; align-items: center; padding: 10px; background: var(--bg-tertiary); border-radius: 4px; cursor: pointer;">
                            <input type="checkbox" name="err_tipo" value="${t}" ${existing?.types?.includes(t) ? 'checked' : ''}>
                            <span style="font-size: 14px;">${t}</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <div class="form-field">
                <label class="form-label">Observação detalhada</label>
                <textarea class="form-input no-btn" id="modalObs" style="height: 80px;">${existing?.obs || ''}</textarea>
            </div>
        `;

        document.getElementById('btnRemoveError').style.display = existing ? 'block' : 'none';
        document.getElementById('errorModal').classList.add('show');
    },

    getErrorTypes(fieldId) {
        // Determine category - check for tramo fields first
        if (fieldId.startsWith('tramo_')) {
            return ERROR_TYPES.tramos;
        }

        // Check if field has a mapped category
        const category = FIELD_CATEGORIES[fieldId] || 'default';
        return ERROR_TYPES[category];
    },

    closeErrorModal() {
        document.getElementById('errorModal').classList.remove('show');
    },

    applyError() {
        const fieldId = appState.currentField;
        const types = Array.from(document.querySelectorAll('input[name="err_tipo"]:checked')).map(i => i.value);
        const obs = document.getElementById('modalObs').value.trim();

        if (types.length === 0 && !obs) {
            this.clearFieldError();
            return;
        }

        const labelMatch = document.querySelector(`button[onclick*="'${fieldId}'"]`).getAttribute('onclick').match(/'([^']+)',\s*'([^']+)'/);
        const label = labelMatch ? labelMatch[2] : 'Campo';

        appState.errors[fieldId] = {
            id: fieldId,
            label,
            value: (document.getElementById(fieldId) || document.getElementById('f_'+fieldId))?.value || '(vazio)',
            types,
            obs
        };

        this.closeErrorModal();
        this.updateFieldVisuals();
        this.updateReport();
        this.updateTabBadges();
        AutoSave.trigger();
    },

    clearFieldError() {
        delete appState.errors[appState.currentField];
        this.closeErrorModal();
        this.updateFieldVisuals();
        this.updateReport();
        this.updateTabBadges();
        AutoSave.trigger();
    },

    updateFieldVisuals() {
        document.querySelectorAll('.error-btn').forEach(btn => {
            const onclick = btn.getAttribute('onclick');
            if (!onclick) return;
            const match = onclick.match(/'([^']+)'/);
            if (match) {
                const fieldId = match[1];
                btn.classList.toggle('has-error', !!appState.errors[fieldId]);
            }
        });
    },

    // --- TAB BADGES ---
    updateTabBadges() {
        // Remove all existing badges
        document.querySelectorAll('.tab-badge').forEach(b => b.remove());

        // Count errors per tab
        const tabCounts = {
            ident: 0,
            carac: 0,
            elem: 0,
            aspect: 0,
            defic: 0,
            rotas: 0,
            obs: 0,
            anexos: 0
        };

        // Count field errors
        Object.keys(appState.errors).forEach(fieldId => {
            // Check for tramos
            if (fieldId.startsWith('tramo_')) {
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
                    const badge = document.createElement('span');
                    badge.className = 'tab-badge';
                    badge.textContent = count;
                    tabBtn.style.position = 'relative';
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
        report += `OAE: ${work.nome || 'N/A'}\n`;
        report += `CÓDIGO: ${work.codigo || 'N/A'}\n`;
        report += `AUDITOR: ${work.avaliador || 'N/A'}\n`;
        report += `DATA: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
        report += `════════════════════════════════════════════\n\n`;

        // Organizar erros por aba
        const errorsByTab = {
            'IDENTIFICAÇÃO': [],
            'CARACTERÍSTICAS FUNCIONAIS': [],
            'ASPECTOS ESPECIAIS': [],
            'DEFICIÊNCIAS FUNCIONAIS': [],
            'ROTAS ALTERNATIVAS': [],
            'OBSERVAÇÕES': []
        };

        // Classificar field errors por aba
        Object.keys(errors).forEach(key => {
            const e = errors[key];
            let tabName = 'OUTROS';

            if (key.startsWith('tramo_')) {
                tabName = 'CARACTERÍSTICAS FUNCIONAIS';
            } else if (TAB_FIELD_MAP.ident.includes(key)) {
                tabName = 'IDENTIFICAÇÃO';
            } else if (TAB_FIELD_MAP.carac.includes(key)) {
                tabName = 'CARACTERÍSTICAS FUNCIONAIS';
            } else if (TAB_FIELD_MAP.aspect.includes(key)) {
                tabName = 'ASPECTOS ESPECIAIS';
            } else if (TAB_FIELD_MAP.defic.includes(key)) {
                tabName = 'DEFICIÊNCIAS FUNCIONAIS';
            } else if (TAB_FIELD_MAP.rotas.includes(key)) {
                tabName = 'ROTAS ALTERNATIVAS';
            } else if (TAB_FIELD_MAP.obs.includes(key)) {
                tabName = 'OBSERVAÇÕES';
            }

            if (!errorsByTab[tabName]) errorsByTab[tabName] = [];
            errorsByTab[tabName].push(e);
        });

        // Imprimir erros por aba
        Object.keys(errorsByTab).forEach(tabName => {
            const tabErrors = errorsByTab[tabName];
            if (tabErrors.length > 0) {
                report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                report += `📋 ${tabName}\n`;
                report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

                tabErrors.forEach((e, idx) => {
                    report += `${idx + 1}. Campo: ${e.label}\n`;
                    report += `   Valor Atual: ${e.value}\n`;
                    if (e.types.length) report += `   Motivo: ${e.types.join('; ')}\n`;
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
            elemErrors.forEach(e => {
                if (!elemsByTramo[e.tramo]) elemsByTramo[e.tramo] = [];
                elemsByTramo[e.tramo].push(e);
            });

            // Ordenar tramos (C no final)
            const tramos = Object.keys(elemsByTramo).sort((a, b) => {
                if (a === 'C') return 1;
                if (b === 'C') return -1;
                return parseInt(a) - parseInt(b);
            });

            tramos.forEach(tramo => {
                report += `╔═══ TRAMO ${tramo} ═══════════════════════════════════╗\n\n`;

                elemsByTramo[tramo].forEach((e, idx) => {
                    report += `  ${idx + 1}. Região: ${e.regiao}\n`;
                    report += `     Elemento: ${e.familia}\n`;
                    report += `     Inconsistência: ${e.erro}\n`;
                    if (e.obs) report += `     Observação: ${e.obs}\n`;
                    if (e.responses.length) {
                        report += `     Respostas da Inspeção:\n`;
                        e.responses.forEach(r => report += `       → ${r.text} (${r.date})\n`);
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

        const total = Object.keys(errors).length + elemErrors.length + anexoErrors.length + 
                      work.functionalDeficiencies.length + work.aspects.length;
        document.getElementById('totalErrorBadge').textContent = total;
        document.getElementById('reportText').value = report;
    },

    copyReport() {
        const text = document.getElementById('reportText').value;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('button[onclick="UI.copyReport()"]');
            const original = btn.innerHTML;
            btn.innerHTML = '✓ Copiado!';
            setTimeout(() => btn.innerHTML = original, 2000);
        });
    },

    clearAll() {
        if (confirm('Deseja limpar todos os apontamentos desta obra?')) {
            appState.errors = {};
            appState.elementErrors = [];
            appState.anexoErrors = [];
            this.renderAll();
            this.updateTabBadges();
            AutoSave.trigger();
        }
    },

    async saveToDatabase() {
        if (!appState.work.codigo) {
            alert('⚠️ Por favor, informe o código da obra antes de salvar no banco de dados.');
            return;
        }

        try {
            await DB.saveObra(appState.work.codigo, {
                work: appState.work,
                errors: appState.errors,
                elementErrors: appState.elementErrors,
                anexoErrors: appState.anexoErrors,
                mensagens: appState.mensagens,
                completionStates: appState.completionStates,
                messageResponses: appState.messageResponses
            });

            this.showToast(`✅ Obra "${appState.work.codigo}" salva com sucesso no banco de dados!`);
            console.log('Manual save to database successful:', appState.work.codigo);
        } catch (err) {
            console.error('Save to database failed:', err);
            alert('❌ Erro ao salvar no banco de dados: ' + err.message);
        }
    },

    showExportModal() {
        Export.all(); // Shortcut for now
    },

    // --- WORK MANAGEMENT ---
    async showWorksModal() {
        const works = await DB.listAllWorks();
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop show';
        modal.id = 'worksManagementModal';
        
        let html = `
            <div class="modal" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">📂 Gerenciar Obras Salvas</h3>
                    <button class="modal-close" onclick="document.getElementById('worksManagementModal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 20px;">
                        <button class="btn btn-secondary" onclick="Export.all()">📥 Exportar Todas (Backup)</button>
                    </div>
                    <table class="view-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nome da Obra</th>
                                <th>Avaliador</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${works.length === 0 ? '<tr><td colspan="4" style="text-align:center">Nenhuma obra salva.</td></tr>' : ''}
                            ${works.map(w => `
                                <tr>
                                    <td><strong>${w.work?.codigo || w.codigo}</strong></td>
                                    <td>${w.work?.nome || '-'}</td>
                                    <td>${w.work?.avaliador || '-'}</td>
                                    <td style="display: flex; gap: 8px;">
                                        <button class="btn-success" style="padding: 4px 8px; font-size: 12px; border-radius: 4px;" onclick="UI.loadWork('${w.work?.codigo || w.codigo}')">Abrir</button>
                                        <button class="btn-primary" style="padding: 4px 8px; font-size: 12px; border-radius: 4px;" onclick="UI.exportSpecific('${w.work?.codigo || w.codigo}')">Exportar</button>
                                        <button class="btn-danger" style="padding: 4px 8px; font-size: 12px; border-radius: 4px;" onclick="UI.deleteWork('${w.work?.codigo || w.codigo}')">Excluir</button>
                                    </td>
                                </tr>
                            `).join('')}
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
                document.getElementById('worksManagementModal')?.remove();
                this.showToast(`✅ Obra "${codigo}" carregada com sucesso!`);
            }
        } catch (err) {
            console.error('Failed to load work:', err);
            alert('Erro ao carregar a obra.');
        }
    },

    async deleteWork(codigo) {
        if (!confirm(`Tem certeza que deseja excluir permanentemente a obra "${codigo}"?`)) return;
        
        try {
            // Se for a obra atual, limpar appState
            if (appState.work.codigo === codigo) {
                // Poderia resetar o state aqui se desejado
            }
            
            // Deletar do IndexedDB
            const transaction = DB.db.transaction(['obras'], 'readwrite');
            const store = transaction.objectStore('obras');
            store.delete(codigo);
            
            this.showToast(`🗑️ Obra "${codigo}" excluída.`);
            document.getElementById('worksManagementModal')?.remove();
            this.showWorksModal(); // Refresh list
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Erro ao excluir obra.');
        }
    },

    async exportSpecific(codigo) {
        try {
            const data = await DB.loadObra(codigo);
            if (!data) return;
            
            const fileName = `OAE_${codigo}_${new Date().toISOString().split('T')[0]}.json`;
            Export.downloadFile(fileName, JSON.stringify(data, null, 2), 'application/json');
        } catch (err) {
            console.error('Export specific failed:', err);
            alert('Erro ao exportar obra.');
        }
    },

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message; // Changed from msg to message
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};
