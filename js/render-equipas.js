import { EQUIPAS } from './data.js';
import { loadTemplate } from './components.js';
import { setCrest, squadForTeam, staffForTeam } from './team-utils.js';
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

function preencherLista(container, itens, textoVazio) {
    container.innerHTML = '';

    if (!itens.length) {
        const vazio = document.createElement('p');
        vazio.className = 'empty-note';
        vazio.textContent = textoVazio;
        container.appendChild(vazio);
        return;
    }

    itens.forEach(item => {
        const chip = document.createElement('span');
        chip.className = 'squad-item';
        chip.textContent = item.nome;
        container.appendChild(chip);
    });
}

function ligarSeparadoresPlantel(cardEl) {
    const tabs = cardEl.querySelectorAll('.squad-tab');
    const listaPlantel = cardEl.querySelector('[data-slot="squad"]');
    const listaStaff = cardEl.querySelector('[data-slot="staff"]');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const mostrarStaff = tab.dataset.squadTab === 'staff';
            listaPlantel.hidden = mostrarStaff;
            listaStaff.hidden = !mostrarStaff;
        });
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
        preencherLista(frag.querySelector('[data-slot="squad"]'), squadForTeam(eq.id), 'Ainda não há plantel registado.');
        preencherLista(frag.querySelector('[data-slot="staff"]'), staffForTeam(eq.id), 'Ainda não há equipa técnica registada.');
        ligarSeparadoresPlantel(frag.firstElementChild);

        list.appendChild(frag);
    });
}