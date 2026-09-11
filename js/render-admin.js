import { supabase } from './supabase-client.js';
import { EQUIPAS, JOGOS, FASE_LABEL, CAMPO_LABEL, carregarDados } from './data.js';
import { resolverEquipaJogo } from './stats.js';

/**
 * A "seed" original de cada jogo da fase final (ex: id 12 é sempre
 * "1º do Grupo A vs 1º do Grupo B", independentemente de estar ou não
 * atualmente a mostrar uma equipa manual). Guardamos isto aqui, fora
 * da base de dados, para o dropdown "Automático" saber sempre para
 * onde voltar mesmo depois de uma atribuição manual — a BD só guarda
 * UM dos dois (id direto OU seed), nunca os dois ao mesmo tempo.
 */
const SEEDS_FASE_FINAL = {
    10: { casa: { grupo: 'A', posicao: 3 }, fora: { grupo: 'B', posicao: 3 } },
    11: { casa: { grupo: 'A', posicao: 2 }, fora: { grupo: 'B', posicao: 2 } },
    12: { casa: { grupo: 'A', posicao: 1 }, fora: { grupo: 'B', posicao: 1 } },
    13: { casa: { grupo: 'B', posicao: 3 }, fora: { grupo: 'C', posicao: 3 } },
    14: { casa: { grupo: 'B', posicao: 2 }, fora: { grupo: 'C', posicao: 2 } },
    15: { casa: { grupo: 'B', posicao: 1 }, fora: { grupo: 'C', posicao: 1 } },
    16: { casa: { grupo: 'A', posicao: 3 }, fora: { grupo: 'C', posicao: 3 } },
    17: { casa: { grupo: 'A', posicao: 2 }, fora: { grupo: 'C', posicao: 2 } },
    18: { casa: { grupo: 'A', posicao: 1 }, fora: { grupo: 'C', posicao: 1 } },
};

function isFaseFinal(fase) {
    return fase.startsWith('liga_');
}

/**
 * Constrói o payload a enviar ao Supabase a partir dos valores já
 * lidos do formulário (não mexe no DOM — por isso é fácil de testar
 * isoladamente). "seletores" é null para jogos de grupo (equipas
 * fixas, não editáveis aqui).
 */
export function construirPayloadJogo(jogoId, valores, seletores) {
    // Um jogo "a decorrer" tem sempre um resultado (nem que seja 0-0) —
    // nunca fica com o marcador vazio no ecrã.
    const golosCasaBruto = valores.estado === 'a_decorrer' && (valores.golosCasa === '' || valores.golosCasa == null)
        ? 0
        : valores.golosCasa;
    const golosForaBruto = valores.estado === 'a_decorrer' && (valores.golosFora === '' || valores.golosFora == null)
        ? 0
        : valores.golosFora;

    const payload = {
        estado: valores.estado,
        golos_casa: golosCasaBruto === '' || golosCasaBruto == null ? null : Number(golosCasaBruto),
        golos_fora: golosForaBruto === '' || golosForaBruto == null ? null : Number(golosForaBruto),
        minuto: valores.minuto === '' || valores.minuto == null ? null : Number(valores.minuto),
    };

    if (seletores) {
        const seeds = SEEDS_FASE_FINAL[jogoId];

        if (seletores.casa === 'auto') {
            payload.equipa_casa_id = null;
            payload.seed_casa_grupo = seeds.casa.grupo;
            payload.seed_casa_posicao = seeds.casa.posicao;
        } else {
            payload.equipa_casa_id = Number(seletores.casa);
            payload.seed_casa_grupo = null;
            payload.seed_casa_posicao = null;
        }

        if (seletores.fora === 'auto') {
            payload.equipa_fora_id = null;
            payload.seed_fora_grupo = seeds.fora.grupo;
            payload.seed_fora_posicao = seeds.fora.posicao;
        } else {
            payload.equipa_fora_id = Number(seletores.fora);
            payload.seed_fora_grupo = null;
            payload.seed_fora_posicao = null;
        }
    }

    return payload;
}

function opcoesEquipas(idSelecionado) {
    return EQUIPAS.map(eq =>
        `<option value="${eq.id}" ${Number(idSelecionado) === eq.id ? 'selected' : ''}>${eq.nome}</option>`
    ).join('');
}

function linhaJogoHTML(jogo) {
    const casa = resolverEquipaJogo(jogo.equipa_casa);
    const fora = resolverEquipaJogo(jogo.equipa_fora);
    const editavel = isFaseFinal(jogo.fase);

    let seletorCasaHTML = `<span class="admin-team-fixed">${casa.nome}</span>`;
    let seletorForaHTML = `<span class="admin-team-fixed">${fora.nome}</span>`;

    if (editavel) {
        const seeds = SEEDS_FASE_FINAL[jogo.id];
        const casaEhAuto = typeof jogo.equipa_casa !== 'number';
        const foraEhAuto = typeof jogo.equipa_fora !== 'number';

        seletorCasaHTML = `
            <select data-field="casa" class="admin-select">
                <option value="auto" ${casaEhAuto ? 'selected' : ''}>Automático (${seeds.casa.posicao}º Grupo ${seeds.casa.grupo})</option>
                ${opcoesEquipas(casaEhAuto ? null : jogo.equipa_casa)}
            </select>`;

        seletorForaHTML = `
            <select data-field="fora" class="admin-select">
                <option value="auto" ${foraEhAuto ? 'selected' : ''}>Automático (${seeds.fora.posicao}º Grupo ${seeds.fora.grupo})</option>
                ${opcoesEquipas(foraEhAuto ? null : jogo.equipa_fora)}
            </select>`;
    }

    return `
    <div class="admin-game-row" data-jogo-id="${jogo.id}" data-editavel="${editavel}">
        <div class="admin-game-meta">
            <span class="fase-chip">${FASE_LABEL[jogo.fase] ?? jogo.fase}</span>
            <span class="result-time">${jogo.hora} · ${CAMPO_LABEL[jogo.campo] ?? ('Campo ' + jogo.campo)}</span>
        </div>

        <div class="admin-team-row">
            ${seletorCasaHTML}
            <input type="number" min="0" data-field="golos_casa" value="${jogo.golos_casa ?? ''}" class="admin-golos-input" placeholder="–">
        </div>
        <div class="admin-team-row">
            ${seletorForaHTML}
            <input type="number" min="0" data-field="golos_fora" value="${jogo.golos_fora ?? ''}" class="admin-golos-input" placeholder="–">
        </div>

        <div class="admin-controls-row">
            <select data-field="estado" class="admin-select">
                <option value="agendado" ${jogo.estado === 'agendado' ? 'selected' : ''}>Agendado</option>
                <option value="a_decorrer" ${jogo.estado === 'a_decorrer' ? 'selected' : ''}>A decorrer</option>
                <option value="terminado" ${jogo.estado === 'terminado' ? 'selected' : ''}>Terminado</option>
            </select>
            <input type="number" min="0" data-field="minuto" value="${jogo.minuto ?? ''}" class="admin-minuto-input" placeholder="Min.">
            <button type="button" class="admin-btn admin-btn-guardar" data-action="guardar">Guardar</button>
        </div>
        <p class="admin-status" data-role="status"></p>
    </div>`;
}

async function guardarLinha(jogoId, row) {
    const statusEl = row.querySelector('[data-role="status"]');
    statusEl.textContent = 'A guardar…';
    statusEl.className = 'admin-status';

    const valores = {
        estado: row.querySelector('[data-field="estado"]').value,
        golosCasa: row.querySelector('[data-field="golos_casa"]').value,
        golosFora: row.querySelector('[data-field="golos_fora"]').value,
        minuto: row.querySelector('[data-field="minuto"]').value,
    };

    const seletorCasaEl = row.querySelector('select[data-field="casa"]');
    const seletorForaEl = row.querySelector('select[data-field="fora"]');
    const seletores = seletorCasaEl
        ? { casa: seletorCasaEl.value, fora: seletorForaEl.value }
        : null;

    const payload = construirPayloadJogo(jogoId, valores, seletores);
    const { error } = await supabase.from('jogos').update(payload).eq('id', jogoId);

    if (error) {
        statusEl.textContent = 'Erro: ' + error.message;
        statusEl.classList.add('admin-status-erro');
        return;
    }

    statusEl.textContent = 'Guardado ✓';
    statusEl.classList.add('admin-status-ok');

    // Atualiza os dados locais para o resto da app (Home, Jogos,
    // Classificação) já refletir isto sem esperar pelo próximo polling.
    await carregarDados();
}

function renderLoginForm(container) {
    container.innerHTML = `
        <div class="admin-card">
            <p class="section-note">Acesso reservado à organização.</p>
            <form id="adminLoginForm" class="admin-login-form">
                <input type="email" id="adminEmail" placeholder="Email" autocomplete="username" required>
                <input type="password" id="adminPassword" placeholder="Palavra-passe" autocomplete="current-password" required>
                <button type="submit" class="admin-btn">Entrar</button>
                <p id="adminLoginErro" class="admin-erro" style="display:none;"></p>
            </form>
        </div>`;

    const form = container.querySelector('#adminLoginForm');
    const erroEl = container.querySelector('#adminLoginErro');

    form.addEventListener('submit', async e => {
        e.preventDefault();
        erroEl.style.display = 'none';

        const email = container.querySelector('#adminEmail').value.trim();
        const password = container.querySelector('#adminPassword').value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            erroEl.textContent = 'Não foi possível entrar: ' + error.message;
            erroEl.style.display = 'block';
            return;
        }

        await renderAdmin();
    });
}

function renderAdminPanel(container) {
    container.innerHTML = `
        <div class="admin-toolbar">
            <span class="section-note">Sessão iniciada.</span>
            <button type="button" class="admin-btn admin-btn-secundario" id="adminLogout">Sair</button>
        </div>
        <div id="adminGamesList">${JOGOS.map(linhaJogoHTML).join('')}</div>`;

    container.querySelector('#adminLogout').addEventListener('click', async () => {
        await supabase.auth.signOut();
        await renderAdmin();
    });

    container.querySelectorAll('.admin-game-row').forEach(row => {
        const jogoId = Number(row.dataset.jogoId);
        row.querySelector('[data-action="guardar"]').addEventListener('click', () => guardarLinha(jogoId, row));

        // Assim que se marca o jogo como "a decorrer", os campos de
        // golos já mostram 0-0 em vez de ficarem vazios (só na UI —
        // o construirPayloadJogo garante o mesmo ao gravar).
        const estadoSelect = row.querySelector('[data-field="estado"]');
        estadoSelect.addEventListener('change', () => {
            if (estadoSelect.value !== 'a_decorrer') return;
            const golosCasaInput = row.querySelector('[data-field="golos_casa"]');
            const golosForaInput = row.querySelector('[data-field="golos_fora"]');
            if (golosCasaInput.value === '') golosCasaInput.value = '0';
            if (golosForaInput.value === '') golosForaInput.value = '0';
        });
    });
}

export async function renderAdmin() {
    const container = document.getElementById('adminRoot');
    if (!container) return;

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        renderLoginForm(container);
    } else {
        renderAdminPanel(container);
    }
}