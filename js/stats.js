import { EQUIPAS, JOGOS, duracaoJogo } from './data.js';

const GRUPOS_TORNEIO = ['A', 'B', 'C'];
const NUM_JOGOS_GRUPO = 3; // round-robin de 3 equipas = 3 jogos

/* ---------- Classificação por grupo ---------- */
export function calcularClassificacao(grupo) {
    const equipasGrupo = EQUIPAS.filter(e => e.grupo === grupo);
    const stats = {};
    equipasGrupo.forEach(e => stats[e.id] = { equipa: e, j: 0, v: 0, e: 0, d: 0, gm: 0, gs: 0, pts: 0 });

    JOGOS
        .filter(j => j.fase === 'grupo_' + grupo.toLowerCase() && j.estado === 'terminado')
        .forEach(j => {
            const casa = stats[j.equipa_casa];
            const fora = stats[j.equipa_fora];
            casa.j++; fora.j++;
            casa.gm += j.golos_casa; casa.gs += j.golos_fora;
            fora.gm += j.golos_fora; fora.gs += j.golos_casa;

            if (j.golos_casa > j.golos_fora) { casa.v++; casa.pts += 3; fora.d++; }
            else if (j.golos_fora > j.golos_casa) { fora.v++; fora.pts += 3; casa.d++; }
            else { casa.e++; fora.e++; casa.pts += 1; fora.pts += 1; }
        });

    // Critérios: pontos -> dif. golos -> golos marcados
    // (confronto direto e sorteio ficam para quando ligarmos ao Supabase,
    //  precisam de mais dados / regras de desempate mais finas)
    return Object.values(stats).sort((a, b) =>
        b.pts - a.pts || (b.gm - b.gs) - (a.gm - a.gs) || b.gm - a.gm
    );
}

/**
 * Um grupo só é considerado terminado quando os 3 jogos do
 * round-robin (todos-contra-todos, 3 equipas) estiverem "terminado".
 */
export function grupoTerminado(grupo) {
    const jogosGrupo = JOGOS.filter(j => j.fase === 'grupo_' + grupo.toLowerCase());
    return jogosGrupo.length >= NUM_JOGOS_GRUPO && jogosGrupo.every(j => j.estado === 'terminado');
}

export function todosGruposTerminados() {
    return GRUPOS_TORNEIO.every(grupoTerminado);
}

const LABEL_POSICAO = { 1: 'Vencedor', 2: '2º classificado', 3: '3º classificado' };

/**
 * Resolve uma "seed" (posição num grupo, ex: 1º classificado do
 * Grupo A) para a equipa real, assim que esse grupo terminar.
 * Enquanto o grupo não termina, devolve um objeto placeholder — tem
 * a mesma forma de uma equipa (id/nome/escudo_url/iniciais), por
 * isso funciona diretamente com setCrest() e o resto da UI.
 */
export function resolverSeed({ grupo, posicao }) {
    if (grupoTerminado(grupo)) {
        const linha = calcularClassificacao(grupo)[posicao - 1];
        if (linha) return linha.equipa;
    }
    return {
        id: null,
        nome: `${LABEL_POSICAO[posicao] || `${posicao}º`} — Grupo ${grupo}`,
        escudo_url: null,
        iniciais: '?',
        pendente: true,
    };
}

/**
 * Resolve o "lado" de um jogo (equipa_casa/equipa_fora), que tanto
 * pode ser um id direto (jogos de grupo) como uma seed (jogos das
 * ligas finais, ex: { grupo: 'A', posicao: 1 }).
 */
export function resolverEquipaJogo(ref) {
    if (typeof ref === 'number') return EQUIPAS.find(e => e.id === ref);
    return resolverSeed(ref);
}

function idResolvido(ref) {
    return typeof ref === 'number' ? ref : resolverSeed(ref).id;
}

/**
 * Estatísticas de uma equipa ao longo do torneio, a partir dos jogos
 * já terminados (grupo ou fase final — resolve as seeds das ligas
 * finais automaticamente). Usado na aba "Equipas".
 */
export function statsForTeam(id) {
    const stats = { j: 0, v: 0, e: 0, d: 0, gm: 0, gs: 0, pts: 0, minutos: 0 };

    JOGOS
        .filter(j => j.estado === 'terminado')
        .forEach(j => {
            const idCasa = idResolvido(j.equipa_casa);
            const idFora = idResolvido(j.equipa_fora);
            if (idCasa !== id && idFora !== id) return;

            const emCasa = idCasa === id;
            const pro = emCasa ? j.golos_casa : j.golos_fora;
            const contra = emCasa ? j.golos_fora : j.golos_casa;

            stats.j++;
            stats.minutos += duracaoJogo(j.fase);
            stats.gm += pro;
            stats.gs += contra;

            if (pro > contra) { stats.v++; stats.pts += 3; }
            else if (pro < contra) { stats.d++; }
            else { stats.e++; stats.pts += 1; }
        });

    return stats;
}

/**
 * Estatística "divertida" derivada: quantos minutos, em média, a
 * equipa demora a marcar um golo (minutos jogados / golos marcados).
 * Devolve null se ainda não marcou nenhum golo (evita divisão por 0).
 */
export function minutosPorGolo(stats) {
    if (!stats.gm) return null;
    return Math.round(stats.minutos / stats.gm);
}

/**
 * Classificação de uma liga final (Liga Campeões/Europa/Conferência).
 * Só faz sentido quando os 3 grupos já terminaram (todosGruposTerminados),
 * porque só aí se sabe quais são as 3 equipas apuradas para cada liga.
 */
const POSICAO_POR_LIGA = { liga_campeoes: 1, liga_europa: 2, liga_conferencia: 3 };

export function participantesLigaFinal(fase) {
    const posicao = POSICAO_POR_LIGA[fase];
    return GRUPOS_TORNEIO.map(grupo => resolverSeed({ grupo, posicao }));
}

export function calcularClassificacaoFinal(fase) {
    const stats = {};
    participantesLigaFinal(fase).forEach(eq => {
        if (eq.id != null) stats[eq.id] = { equipa: eq, j: 0, v: 0, e: 0, d: 0, gm: 0, gs: 0, pts: 0 };
    });

    JOGOS
        .filter(j => j.fase === fase && j.estado === 'terminado')
        .forEach(j => {
            const casa = stats[idResolvido(j.equipa_casa)];
            const fora = stats[idResolvido(j.equipa_fora)];
            if (!casa || !fora) return;

            casa.j++; fora.j++;
            casa.gm += j.golos_casa; casa.gs += j.golos_fora;
            fora.gm += j.golos_fora; fora.gs += j.golos_casa;

            if (j.golos_casa > j.golos_fora) { casa.v++; casa.pts += 3; fora.d++; }
            else if (j.golos_fora > j.golos_casa) { fora.v++; fora.pts += 3; casa.d++; }
            else { casa.e++; fora.e++; casa.pts += 1; fora.pts += 1; }
        });

    return Object.values(stats).sort((a, b) =>
        b.pts - a.pts || (b.gm - b.gs) - (a.gm - a.gs) || b.gm - a.gm
    );
}
