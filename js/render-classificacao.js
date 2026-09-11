import {
    calcularClassificacao,
    calcularClassificacaoFinal,
    todosGruposTerminados,
} from './stats.js';
import { loadTemplate } from './components.js';
import { setCrest } from './team-utils.js';
import { animateIn } from './animate.js';

let tplStandingsRow;

export async function initClassificacaoTemplates() {
    tplStandingsRow = await loadTemplate('components/standings-row.html', 'tpl-standings-row');
}

const GRUPOS = ['A', 'B', 'C'];

const LIGAS_FINAIS = [
    { fase: 'liga_campeoes', label: 'Liga dos Campeões' },
    { fase: 'liga_europa', label: 'Liga Europa' },
    { fase: 'liga_conferencia', label: 'Liga Conferência' },
];

let animIndex = 0;

function criarCardClassificacao(tabela) {
    const card = document.createElement('div');
    card.className = 'standings-card';

    const table = document.createElement('table');
    table.className = 'standings';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Equipa</th>
                <th>J</th>
                <th>V</th>
                <th>E</th>
                <th>D</th>
                <th>DG</th>
                <th>Pts</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');

    tabela.forEach(row => {
        const frag = tplStandingsRow.content.cloneNode(true);
        animateIn(frag.firstElementChild, animIndex++);
        setCrest(frag.querySelector('[data-slot="crest"]'), row.equipa);
        frag.querySelector('[data-slot="nome"]').textContent = row.equipa.nome;
        frag.querySelector('[data-slot="j"]').textContent = row.j;
        frag.querySelector('[data-slot="v"]').textContent = row.v;
        frag.querySelector('[data-slot="e"]').textContent = row.e;
        frag.querySelector('[data-slot="d"]').textContent = row.d;
        const dg = row.gm - row.gs;
        frag.querySelector('[data-slot="dg"]').textContent = (dg > 0 ? '+' : '') + dg;
        frag.querySelector('[data-slot="pts"]').textContent = row.pts;
        tbody.appendChild(frag);
    });

    card.appendChild(table);
    return card;
}

export function renderClassificacaoCompleta() {
    const wrap = document.getElementById('standingsWrap');
    wrap.innerHTML = '';
    animIndex = 0;

    // ---- Fase de grupos (sempre disponível) ----
    GRUPOS.forEach(grupo => {
        const bloco = document.createElement('div');
        bloco.className = 'group-block';

        const titulo = document.createElement('div');
        titulo.className = 'group-block-title';
        titulo.textContent = `Grupo ${grupo}`;
        bloco.appendChild(titulo);

        bloco.appendChild(criarCardClassificacao(calcularClassificacao(grupo)));
        wrap.appendChild(bloco);
    });

    // ---- Fase final (só quando os 3 grupos terminarem) ----
    const finalBloco = document.createElement('div');
    finalBloco.className = 'group-block';

    const finalTitulo = document.createElement('div');
    finalTitulo.className = 'group-block-title final';
    finalTitulo.textContent = 'Fase Final';
    finalBloco.appendChild(finalTitulo);

    if (!todosGruposTerminados()) {
        const aviso = document.createElement('p');
        aviso.className = 'section-note';
        aviso.textContent = 'Os apurados para a Liga dos Campeões, Liga Europa e Liga '
            + 'Conferência ficam definidos assim que a fase de grupos terminar.';
        finalBloco.appendChild(aviso);
    } else {
        LIGAS_FINAIS.forEach(({ fase, label }) => {
            const subTitulo = document.createElement('div');
            subTitulo.className = 'sub-group-title';
            subTitulo.textContent = label;
            finalBloco.appendChild(subTitulo);
            finalBloco.appendChild(criarCardClassificacao(calcularClassificacaoFinal(fase)));
        });
    }

    wrap.appendChild(finalBloco);
}
