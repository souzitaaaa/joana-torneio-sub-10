import { JOGOS, FASE_LABEL, CAMPO_LABEL } from './data.js';
import { loadTemplate } from './components.js';
import { setCrest } from './team-utils.js';
import { resolverEquipaJogo } from './stats.js';
import { animateIn } from './animate.js';

let tplGameRow;

export async function initJogosTemplates() {
    tplGameRow = await loadTemplate('components/game-row.html', 'tpl-game-row');
}

const FILTROS = [
    { chave: 'todos', label: 'Todos' },
    { chave: 'grupo_a', label: 'Grupo A' },
    { chave: 'grupo_b', label: 'Grupo B' },
    { chave: 'grupo_c', label: 'Grupo C' },
    { chave: 'liga_campeoes', label: 'Liga Campeões' },
    { chave: 'liga_europa', label: 'Liga Europa' },
    { chave: 'liga_conferencia', label: 'Liga Conferência' },
];

let filtroAtivo = 'todos';

export function renderFilterTabs() {
    const wrap = document.getElementById('filterTabs');
    wrap.innerHTML = FILTROS.map(f =>
        `<div class="filter-tab ${f.chave === filtroAtivo ? 'active' : ''}" data-filtro="${f.chave}">${f.label}</div>`
    ).join('');

    wrap.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            filtroAtivo = tab.dataset.filtro;
            renderFilterTabs();
            renderGamesList();
        });
    });
}

export function renderGamesList() {
    const list = document.getElementById('gamesList');
    list.innerHTML = '';

    const jogosFiltrados = JOGOS
        .filter(j => filtroAtivo === 'todos' || j.fase === filtroAtivo)
        .sort((a, b) => a.hora.localeCompare(b.hora) || a.campo - b.campo);

    if (!jogosFiltrados.length) {
        list.innerHTML = '<p class="empty-note animate-in">Sem jogos para este filtro.</p>';
        return;
    }

    jogosFiltrados.forEach((j, i) => {
        const casa = resolverEquipaJogo(j.equipa_casa);
        const fora = resolverEquipaJogo(j.equipa_fora);
        const isLive = j.estado === 'a_decorrer';
        const isAgendado = j.estado === 'agendado';
        const casaVence = !isAgendado && j.golos_casa > j.golos_fora;
        const foraVence = !isAgendado && j.golos_fora > j.golos_casa;

        const frag = tplGameRow.content.cloneNode(true);
        animateIn(frag.firstElementChild, i);
        frag.querySelector('[data-slot="fase"]').textContent = FASE_LABEL[j.fase];

        const tempoEl = frag.querySelector('[data-slot="tempo"]');
        if (isLive) {
            tempoEl.innerHTML = `<span class="live-dot-inline"></span> AO VIVO · ${j.minuto}'`;
            tempoEl.classList.add('is-live');
        } else {
            tempoEl.textContent = `${j.hora} · ${CAMPO_LABEL[j.campo]}`;
        }

        setCrest(frag.querySelector('[data-slot="crest-casa"]'), casa);
        setCrest(frag.querySelector('[data-slot="crest-fora"]'), fora);
        frag.querySelector('[data-slot="row-casa"]').classList.toggle('win', casaVence);
        frag.querySelector('[data-slot="row-fora"]').classList.toggle('win', foraVence);
        frag.querySelector('[data-slot="nome-casa"]').textContent = casa.nome;
        frag.querySelector('[data-slot="nome-fora"]').textContent = fora.nome;
        frag.querySelector('[data-slot="golos-casa"]').textContent = isAgendado ? '–' : j.golos_casa;
        frag.querySelector('[data-slot="golos-fora"]').textContent = isAgendado ? '–' : j.golos_fora;

        list.appendChild(frag);
    });
}