import { injectStaticComponents, setActiveNavTab } from './components.js';
import { initJogosTemplates, renderFilterTabs, renderGamesList } from './render-jogos.js';

async function init() {
    await injectStaticComponents();
    setActiveNavTab();

    await initJogosTemplates();
    renderFilterTabs();
    renderGamesList();
}

init().catch(err => {
    console.error('Erro a iniciar a página de jogos:', err);
});