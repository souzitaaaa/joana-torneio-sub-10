/* =====================================================================
   ROUTER (SPA, sem build tools)
   Em vez de cada página ser um ficheiro .html separado (com recarga
   completa do browser ao navegar), o index.html passa a ser a única
   "shell": tem o header/footer fixos e um <main id="viewOutlet">
   onde o conteúdo de cada "view" é injetado.

   A navegação usa o hash da URL (#/  ,  #/jogos, ...) porque assim
   funciona em qualquer servidor estático sem configuração extra
   (ao contrário de rotas com history.pushState, que precisam de um
   redirect no servidor para qualquer caminho cair sempre no index.html).

   Cada view é registada com:
     - path:    o hash que a ativa (ex: '/jogos')
     - view:    caminho do ficheiro HTML do fragmento (ex: 'views/jogos.html')
     - title:   título da página (opcional)
     - onMount: função (pode ser async) chamada depois do fragmento
                estar no DOM — é aqui que os módulos de render fazem
                o seu trabalho (carregar templates, preencher dados).
   ===================================================================== */

import { loadHTML, setActiveNavTab } from './components.js';

const routes = [];
let currentRoute = null;

export function registerRoute(path, config) {
    routes.push({ path, ...config });
}

function currentPath() {
    const hash = location.hash.replace(/^#/, '');
    return hash || '/';
}

function findRoute(path) {
    return routes.find(r => r.path === path) || routes.find(r => r.path === '/');
}

async function renderRoute() {
    const outlet = document.getElementById('viewOutlet');
    if (!outlet) return;

    const route = findRoute(currentPath());
    currentRoute = route;

    outlet.innerHTML = await loadHTML(route.view);

    outlet.classList.remove('view-enter');
    void outlet.offsetWidth;
    outlet.classList.add('view-enter');

    if (route.title) document.title = route.title;
    setActiveNavTab();

    if (route.onMount) await route.onMount();

    window.scrollTo(0, 0);
}

export function startRouter() {
    window.addEventListener('hashchange', renderRoute);
    return renderRoute();
}

export async function refreshCurrentRoute() {
    if (currentRoute?.onMount) await currentRoute.onMount();
}