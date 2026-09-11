import { injectStaticComponents } from './components.js';
import { registerRoute, startRouter, refreshCurrentRoute } from './router.js';
import { carregarDados, subscreverAtualizacoes } from './data.js';
import {
    initRenderTemplates,
    renderLiveCard,
    renderNextGames,
    renderResults,
    renderGroupTabs,
    renderStandings,
} from './render.js';
import { initJogosTemplates, renderFilterTabs, renderGamesList } from './render-jogos.js';
import { initEquipasTemplates, renderTeamsFilterTabs, renderTeamsList } from './render-equipas.js';
import { initPatrocinadoresTemplates, renderSponsors } from './render-patrocinadores.js';
import { initClassificacaoTemplates, renderClassificacaoCompleta } from './render-classificacao.js';
import { renderAdmin } from './render-admin.js';

// Rede de segurança: mesmo que a ligação em tempo real caia por algum
// motivo (rede instável), isto garante que os dados nunca ficam
// desatualizados por mais do que isto. O tempo real (abaixo) é que
// trata da maioria das atualizações, quase instantaneamente.
const INTERVALO_ATUALIZACAO_MS = 60000;

function mostrarEstadoInicial(mensagem) {
    const outlet = document.getElementById('viewOutlet');
    if (outlet) outlet.innerHTML = `<p class="empty-note">${mensagem}</p>`;
}

// Junta um pequeno "debounce": se vários jogos forem gravados quase ao
// mesmo tempo, isto evita disparar um recarregamento por cada um,
// juntando-os todos numa única atualização.
let debounceTimer = null;
function atualizarDados() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
        try {
            await carregarDados();
            await refreshCurrentRoute();
        } catch (err) {
            // Falha silenciosa: mantém os últimos dados válidos no ecrã
            // em vez de partir a página por causa de uma atualização
            // automática que falhou.
            console.error('Erro a atualizar dados:', err);
        }
    }, 300);
}

async function init() {
    // 1. Componentes fixos (header, footer) — só uma vez, não mudam
    //    entre rotas.
    await injectStaticComponents();

    // 2. Primeiro carregamento dos dados do Supabase. Enquanto isto não
    //    responde, mostra uma mensagem em vez de deixar a página vazia.
    mostrarEstadoInicial('A carregar dados do torneio…');
    try {
        await carregarDados();
    } catch (err) {
        console.error('Erro a carregar dados do Supabase:', err);
        mostrarEstadoInicial(
            'Não foi possível carregar os dados do torneio. Verifica a ligação à internet e tenta recarregar a página.'
        );
        return; // não faz sentido continuar sem dados
    }

    // 3. Regista as views da app. Cada uma diz que fragmento HTML
    //    carregar e o que fazer assim que esse fragmento está no DOM.
    registerRoute('/', {
        view: 'views/home.html',
        title: 'Coimbrões Youth Cup 2026',
        onMount: async () => {
            await initRenderTemplates();
            renderLiveCard();
            renderNextGames();
            renderResults();
            renderGroupTabs();
            renderStandings();
        },
    });

    registerRoute('/jogos', {
        view: 'views/jogos.html',
        title: 'Jogos — Coimbrões Youth Cup 2026',
        onMount: async () => {
            await initJogosTemplates();
            renderFilterTabs();
            renderGamesList();
        },
    });

    registerRoute('/equipas', {
        view: 'views/equipas.html',
        title: 'Equipas — Coimbrões Youth Cup 2026',
        onMount: async () => {
            await initEquipasTemplates();
            renderTeamsFilterTabs();
            renderTeamsList();
        },
    });

    registerRoute('/classificacao', {
        view: 'views/classificacao.html',
        title: 'Classificação — Coimbrões Youth Cup 2026',
        onMount: async () => {
            await initClassificacaoTemplates();
            renderClassificacaoCompleta();
        },
    });

    registerRoute('/patrocinadores', {
        view: 'views/patrocinadores.html',
        title: 'Patrocinadores — Coimbrões Youth Cup 2026',
        onMount: async () => {
            await initPatrocinadoresTemplates();
            renderSponsors();
        },
    });

    // Sem link no header de propósito — acede-se diretamente por
    // #/admin. Exige login (Supabase Auth); ver render-admin.js.
    registerRoute('/admin', {
        view: 'views/admin.html',
        title: 'Admin — Coimbrões Youth Cup 2026',
        onMount: async () => {
            await renderAdmin();
        },
    });

    // 4. Arranca o router: renderiza a rota atual e passa a ouvir
    //    mudanças de hash (navegação sem recarregar a página).
    await startRouter();

    // 5. Tempo real: assim que um jogo é alterado no Supabase (ex: o
    //    admin marca um golo), a app atualiza-se sozinha em segundos —
    //    não é preciso dar refresh nem esperar por nenhum intervalo.
    subscreverAtualizacoes(atualizarDados);

    // 6. Rede de segurança (ver comentário acima da constante).
    if (INTERVALO_ATUALIZACAO_MS) {
        setInterval(atualizarDados, INTERVALO_ATUALIZACAO_MS);
    }
}

init().catch(err => {
    console.error('Erro a iniciar a app:', err);
});