/* =====================================================================
   DADOS DO TORNEIO — agora vêm do Supabase em vez de estarem simulados
   aqui. Este ficheiro passa a ser o único sítio que sabe falar com a
   base de dados; todo o resto da app (stats.js, render*.js) continua a
   usar EQUIPAS/JOGOS/etc. exatamente como antes, sem saber de onde vêm.

   Como isto funciona (é a parte importante para quem for mexer aqui):
   EQUIPAS, JOGOS, JOGADORES, PATROCINADORES, FASE_LABEL, CAMPO_LABEL,
   TIER_LABEL e TIER_ORDER são "let", não "const". Quando carregarDados()
   os reatribui, todos os módulos que já fizeram
   `import { JOGOS } from './data.js'` passam a ver os valores novos
   automaticamente — não precisam de voltar a importar nada. Isto é uma
   "live binding" dos módulos ES6, não um truque frágil.
   ===================================================================== */

import { supabase } from './supabase-client.js';

export let EQUIPAS = [];
export let JOGOS = [];
export let JOGADORES = [];
export let PATROCINADORES = [];

export let FASE_LABEL = {};
export let CAMPO_LABEL = {};
export let TIER_LABEL = {};
export let TIER_ORDER = [];

// Preenchido a partir da tabela "fases" (coluna duracao_min) em vez de
// estar fixo aqui — ver duracaoJogo() mais abaixo.
const DURACAO_POR_FASE = {};

export function duracaoJogo(fase) {
    return DURACAO_POR_FASE[fase] ?? 30;
}

/**
 * Um jogo em Supabase guarda equipa_casa_id/equipa_fora_id (quando já
 * se sabe a equipa) OU seed_casa_grupo/seed_casa_posicao (quando ainda
 * não se sabe — jogos da fase final antes de os grupos terminarem).
 * A app inteira (stats.js, render*.js) espera um único campo
 * "equipa_casa"/"equipa_fora" que é OU um id (number) OU um objeto
 * { grupo, posicao } — é isso que esta função monta.
 */
function jogoDoSupabase(row) {
    return {
        id: row.id,
        fase: row.fase,
        campo: row.campo,
        hora: row.hora.slice(0, 5), // Supabase devolve "09:00:00", a app usa "09:00"
        equipa_casa: row.equipa_casa_id ?? { grupo: row.seed_casa_grupo, posicao: row.seed_casa_posicao },
        equipa_fora: row.equipa_fora_id ?? { grupo: row.seed_fora_grupo, posicao: row.seed_fora_posicao },
        golos_casa: row.golos_casa,
        golos_fora: row.golos_fora,
        estado: row.estado,
        minuto: row.minuto,
    };
}

/**
 * Vai buscar tudo ao Supabase e preenche EQUIPAS/JOGOS/etc. Chamar uma
 * vez no arranque da app (main.js) antes de registar as rotas, e
 * voltar a chamar sempre que quiseres atualizar os dados (ex: polling
 * periódico para ires vendo os resultados ao vivo).
 */
export async function carregarDados() {
    const [fases, campos, tiers, equipas, jogos, jogadores, patrocinadores] = await Promise.all([
        supabase.from('fases').select('*'),
        supabase.from('campos').select('*'),
        supabase.from('tiers_patrocinador').select('*').order('ordem'),
        supabase.from('equipas').select('*').order('id'),
        supabase.from('jogos').select('*').order('id'),
        supabase.from('jogadores').select('*').order('nome'),
        supabase.from('patrocinadores').select('*'),
    ]);

    const resultados = { fases, campos, tiers, equipas, jogos, jogadores, patrocinadores };
    for (const [nome, resultado] of Object.entries(resultados)) {
        if (resultado.error) {
            throw new Error(`Erro a carregar "${nome}" do Supabase: ${resultado.error.message}`);
        }
    }

    FASE_LABEL = Object.fromEntries(fases.data.map(f => [f.code, f.label]));
    fases.data.forEach(f => { DURACAO_POR_FASE[f.code] = f.duracao_min; });

    CAMPO_LABEL = Object.fromEntries(campos.data.map(c => [c.numero, c.nome]));

    TIER_LABEL = Object.fromEntries(tiers.data.map(t => [t.code, t.label]));
    TIER_ORDER = tiers.data.map(t => t.code);

    EQUIPAS = equipas.data;
    JOGOS = jogos.data.map(jogoDoSupabase);
    JOGADORES = jogadores.data;
    PATROCINADORES = patrocinadores.data;
}

/**
 * Liga-se ao Supabase Realtime e chama "callback" sempre que alguma
 * linha da tabela "jogos" for criada/alterada/apagada — normalmente
 * pelo admin, a atualizar um resultado. Não faz o refetch sozinho:
 * quem chamar isto é que decide o que fazer (tipicamente
 * carregarDados() + voltar a renderizar).
 */
export function subscreverAtualizacoes(callback) {
    supabase
        .channel('jogos-tempo-real')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jogos' }, callback)
        .subscribe();
}