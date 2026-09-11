/* =====================================================================
   CARREGADOR DE COMPONENTES / FRAGMENTOS
   Vanilla JS puro, sem build tools: os componentes (header, footer,
   cartões, linhas de tabela) e as views (js/router.js) ficam em
   ficheiros .html separados e são carregados via fetch().

   Nota: por causa do fetch(), o site tem de correr num servidor local
   (ex: `npx serve`, extensão "Live Server", ou o próprio Netlify em
   produção) — não funciona abrindo o index.html diretamente com
   file:// no browser, porque o fetch de ficheiros locais é bloqueado.
   ===================================================================== */

const cache = new Map();

async function fetchText(path) {
    if (cache.has(path)) return cache.get(path);
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Não foi possível carregar o componente: ${path}`);
    const text = await res.text();
    cache.set(path, text);
    return text;
}

/**
 * Injeta componentes estáticos (ex: header, footer) nos elementos
 * marcados com data-include="components/ficheiro.html".
 */
export async function injectStaticComponents(root = document) {
    const alvos = [...root.querySelectorAll('[data-include]')];
    await Promise.all(alvos.map(async el => {
        el.innerHTML = await fetchText(el.dataset.include);
        // Fade suave assim que o componente (header/footer) entra no DOM,
        // para não "aparecer" abruptamente.
        el.classList.add('comp-fade-in');
    }));
}

/**
 * Carrega um <template> de dentro de um ficheiro de componente
 * e devolve esse elemento <template> (pronto a clonar com .content.cloneNode(true)).
 */
export async function loadTemplate(path, templateId) {
    const key = `${path}#${templateId}`;
    if (cache.has(key)) return cache.get(key);

    const html = await fetchText(path);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const tpl = wrapper.querySelector(`#${templateId}`);
    if (!tpl) throw new Error(`Template #${templateId} não encontrado em ${path}`);

    cache.set(key, tpl);
    return tpl;
}

/**
 * Vai buscar um fragmento HTML (usado pelo router para carregar o
 * conteúdo de cada view). Passa pelo mesmo cache do fetchText.
 */
export async function loadHTML(path) {
    return fetchText(path);
}

/**
 * Marca como ativa a tab do cabeçalho correspondente à rota atual,
 * comparando o data-page de cada link com o hash da URL (#/, #/jogos, ...).
 * Chamar depois do router injetar a view (ou do header ser injetado).
 */
export function setActiveNavTab() {
    const rota = location.hash.replace(/^#/, '') || '/';

    document.querySelectorAll('.h-tab[data-page]').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === rota);
    });
}