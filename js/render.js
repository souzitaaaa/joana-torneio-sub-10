import { JOGOS, FASE_LABEL, CAMPO_LABEL } from './data.js';
import { loadTemplate } from './components.js';
import { setCrest } from './team-utils.js';
import { calcularClassificacao, resolverEquipaJogo } from './stats.js';
import { animateIn } from './animate.js';

// Templates carregados uma única vez (ver initRenderTemplates)
let tplLiveCard, tplNextCard, tplResultRow, tplStandingsRow;

export async function initRenderTemplates() {
    [tplLiveCard, tplNextCard, tplResultRow, tplStandingsRow] = await Promise.all([
        loadTemplate('components/live-card.html', 'tpl-live-card'),
        loadTemplate('components/next-card.html', 'tpl-next-card'),
        loadTemplate('components/result-row.html', 'tpl-result-row'),
        loadTemplate('components/standings-row.html', 'tpl-standings-row'),
    ]);
}

/* ---------- Cartão(ões) AO VIVO / próximo jogo em destaque ----------
   Como há 2 campos, pode haver mais de um jogo a decorrer ao mesmo
   tempo — por isso renderizamos um cartão por cada jogo com
   estado 'a_decorrer'. Se não houver nenhum, mostramos o próximo
   jogo agendado como fallback ("A seguir"). */
export function renderLiveCard() {
    const wrap = document.getElementById('liveCardWrap');
    wrap.innerHTML = '';

    const aDecorrer = JOGOS.filter(j => j.estado === 'a_decorrer');
    const jogosParaMostrar = aDecorrer.length
        ? aDecorrer
        // Sem jogos ao vivo: mostra os 2 próximos agendados (normalmente
        // um por campo), não só o primeiro.
        : JOGOS.filter(j => j.estado === 'agendado').slice(0, 2);

    jogosParaMostrar.forEach((jogo, i) => {
        const casa = resolverEquipaJogo(jogo.equipa_casa);
        const fora = resolverEquipaJogo(jogo.equipa_fora);
        const isLive = jogo.estado === 'a_decorrer';

        const frag = tplLiveCard.content.cloneNode(true);
        animateIn(frag.firstElementChild, i);
        const tag = frag.querySelector('[data-slot="tag"]');
        tag.dataset.live = String(isLive);
        frag.querySelector('[data-slot="dot"]').style.display = isLive ? '' : 'none';
        frag.querySelector('[data-slot="tag-text"]').textContent = isLive ? 'AO VIVO' : 'A SEGUIR';
        frag.querySelector('[data-slot="meta"]').textContent = `${FASE_LABEL[jogo.fase]} · ${CAMPO_LABEL[jogo.campo]}`;
        setCrest(frag.querySelector('[data-slot="crest-casa"]'), casa);
        setCrest(frag.querySelector('[data-slot="crest-fora"]'), fora);
        frag.querySelector('[data-slot="nome-casa"]').textContent = casa.nome;
        frag.querySelector('[data-slot="nome-fora"]').textContent = fora.nome;
        frag.querySelector('[data-slot="golos-casa"]').textContent = isLive ? jogo.golos_casa : '–';
        frag.querySelector('[data-slot="golos-fora"]').textContent = isLive ? jogo.golos_fora : '–';

        wrap.appendChild(frag);
    });
}

/* ---------- Próximos jogos (scroll horizontal) ---------- */
export function renderNextGames() {
    const scroll = document.getElementById('nextScroll');
    scroll.innerHTML = '';
    const proximos = JOGOS.filter(j => j.estado === 'agendado').slice(0, 5);

    proximos.forEach((j, i) => {
        const casa = resolverEquipaJogo(j.equipa_casa);
        const fora = resolverEquipaJogo(j.equipa_fora);

        const frag = tplNextCard.content.cloneNode(true);
        animateIn(frag.firstElementChild, i);
        frag.querySelector('[data-slot="fase"]').textContent = FASE_LABEL[j.fase];
        setCrest(frag.querySelector('[data-slot="crest-casa"]'), casa);
        setCrest(frag.querySelector('[data-slot="crest-fora"]'), fora);
        frag.querySelector('[data-slot="nome-casa"]').textContent = casa.nome;
        frag.querySelector('[data-slot="nome-fora"]').textContent = fora.nome;
        frag.querySelector('[data-slot="hora"]').textContent = j.hora;
        frag.querySelector('[data-slot="campo"]').textContent = CAMPO_LABEL[j.campo];

        scroll.appendChild(frag);
    });
}

/* ---------- Resultados terminados ---------- */
export function renderResults() {
    const list = document.getElementById('resultsList');
    list.innerHTML = '';
    // Só os 5 mais recentes, para a lista não crescer sem parar à
    // medida que o dia avança — mais recente primeiro.
    const terminados = JOGOS.filter(j => j.estado === 'terminado').slice(-5).reverse();

    if (!terminados.length) {
        list.innerHTML = '<p class="empty-note animate-in">Ainda não há resultados disponíveis.</p>';
        return;
    }

    terminados.forEach((j, i) => {
        const casa = resolverEquipaJogo(j.equipa_casa);
        const fora = resolverEquipaJogo(j.equipa_fora);
        const casaVence = j.golos_casa > j.golos_fora;
        const foraVence = j.golos_fora > j.golos_casa;

        const frag = tplResultRow.content.cloneNode(true);
        animateIn(frag.firstElementChild, i);
        frag.querySelector('[data-slot="fase"]').textContent = FASE_LABEL[j.fase];
        frag.querySelector('[data-slot="hora"]').textContent = `${j.hora} · ${CAMPO_LABEL[j.campo]}`;
        setCrest(frag.querySelector('[data-slot="crest-casa"]'), casa);
        setCrest(frag.querySelector('[data-slot="crest-fora"]'), fora);
        frag.querySelector('[data-slot="row-casa"]').classList.toggle('win', casaVence);
        frag.querySelector('[data-slot="row-fora"]').classList.toggle('win', foraVence);
        frag.querySelector('[data-slot="nome-casa"]').textContent = casa.nome;
        frag.querySelector('[data-slot="nome-fora"]').textContent = fora.nome;
        frag.querySelector('[data-slot="golos-casa"]').textContent = j.golos_casa;
        frag.querySelector('[data-slot="golos-fora"]').textContent = j.golos_fora;

        list.appendChild(frag);
    });
}

/* ---------- Classificação por grupo (resumo, na home) ---------- */
let grupoAtivo = 'A';

export function renderGroupTabs() {
    const tabs = document.getElementById('groupTabs');
    tabs.innerHTML = ['A', 'B', 'C'].map(g =>
        `<div class="g-tab ${g === grupoAtivo ? 'active' : ''}" data-grupo="${g}">Grupo ${g}</div>`
    ).join('');

    tabs.querySelectorAll('.g-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            grupoAtivo = tab.dataset.grupo;
            renderGroupTabs();
            renderStandings();
        });
    });
}

export function renderStandings() {
    const body = document.getElementById('standingsBody');
    body.innerHTML = '';
    const tabela = calcularClassificacao(grupoAtivo);

    tabela.forEach((row, i) => {
        const frag = tplStandingsRow.content.cloneNode(true);
        animateIn(frag.firstElementChild, i);
        setCrest(frag.querySelector('[data-slot="crest"]'), row.equipa);
        frag.querySelector('[data-slot="nome"]').textContent = row.equipa.nome;
        frag.querySelector('[data-slot="j"]').textContent = row.j;
        frag.querySelector('[data-slot="v"]').textContent = row.v;
        frag.querySelector('[data-slot="e"]').textContent = row.e;
        frag.querySelector('[data-slot="d"]').textContent = row.d;
        const dg = row.gm - row.gs;
        frag.querySelector('[data-slot="dg"]').textContent = (dg > 0 ? '+' : '') + dg;
        frag.querySelector('[data-slot="pts"]').textContent = row.pts;

        body.appendChild(frag);
    });
}