import { EQUIPAS } from './data.js';
import { loadTemplate } from './components.js';
import { setCrest, squadForTeam } from './team-utils.js';
import { statsForTeam, minutosPorGolo } from './stats.js';
import { animateIn } from './animate.js';

let tplTeamCard;

export async function initEquipasTemplates() {
    tplTeamCard = await loadTemplate('components/team-card.html', 'tpl-team-card');
}

const FILTROS_GRUPO = [
    { chave: 'todos', label: 'Todos' },
    { chave: 'A', label: 'Grupo A' },
    { chave: 'B', label: 'Grupo B' },
    { chave: 'C', label: 'Grupo C' },
];

let filtroAtivo = 'todos';

export function renderTeamsFilterTabs() {
    const wrap = document.getElementById('teamsFilterTabs');
    wrap.innerHTML = FILTROS_GRUPO.map(f =>
        `<div class="filter-tab ${f.chave === filtroAtivo ? 'active' : ''}" data-filtro="${f.chave}">${f.label}</div>`
    ).join('');

    wrap.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            filtroAtivo = tab.dataset.filtro;
            renderTeamsFilterTabs();
            renderTeamsList();
        });
    });
}

function preencherPlantel(container, equipaId) {
    container.innerHTML = '';
    squadForTeam(equipaId).forEach(jogador => {
        const item = document.createElement('span');
        item.className = 'squad-item';
        item.textContent = jogador.nome;
        container.appendChild(item);
    });
}

export function renderTeamsList() {
    const list = document.getElementById('teamsList');
    list.innerHTML = '';

    const equipasFiltradas = EQUIPAS.filter(e => filtroAtivo === 'todos' || e.grupo === filtroAtivo);

    equipasFiltradas.forEach((eq, i) => {
        const stats = statsForTeam(eq.id);
        const minPg = minutosPorGolo(stats);

        const frag = tplTeamCard.content.cloneNode(true);
        animateIn(frag.firstElementChild, i);
        setCrest(frag.querySelector('[data-slot="crest"]'), eq);
        frag.querySelector('[data-slot="nome"]').textContent = eq.nome;
        frag.querySelector('[data-slot="grupo"]').textContent = `Grupo ${eq.grupo}`;
        frag.querySelector('[data-slot="golos"]').textContent = stats.gm;
        frag.querySelector('[data-slot="minpg"]').textContent = minPg === null ? '—' : `${minPg}'`;
        frag.querySelector('[data-slot="jogos"]').textContent = stats.j;
        preencherPlantel(frag.querySelector('[data-slot="squad"]'), eq.id);

        list.appendChild(frag);
    });
}