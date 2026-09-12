import { EQUIPAS, JOGADORES, STAFF_TECNICO } from './data.js';

export function equipa(id) { return EQUIPAS.find(e => e.id === id); }

/**
 * Devolve o plantel de uma equipa, ordenado por número da camisola.
 */
export function squadForTeam(id) {
    return JOGADORES.filter(j => j.equipa_id === id).sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Devolve a equipa técnica (treinadores, delegados, etc.) de uma equipa.
 */
export function staffForTeam(id) {
    return STAFF_TECNICO.filter(s => s.equipa_id === id).sort((a, b) => a.nome.localeCompare(b.nome));
}

/**
 * Preenche um contentor com uma imagem, com fallback automático para
 * texto (iniciais, sigla, etc.) caso a imagem não exista ou falhe.
 * Usado tanto para escudos de equipas como para logos de patrocinadores.
 */
export function setImageWithFallback(container, src, alt, fallbackText) {
    container.innerHTML = '';

    if (!src) {
        // Sem imagem (ex: equipa ainda "por decidir") — mostra logo o
        // texto de fallback, sem tentar carregar nada.
        container.textContent = fallbackText;
        return;
    }

    const img = document.createElement('img');
    img.className = 'crest-img';
    img.src = src;
    img.alt = alt;
    img.addEventListener('error', () => { container.textContent = fallbackText; }, { once: true });
    // Fade suave assim que a imagem termina de carregar, em vez de
    // aparecer de repente assim que o browser a desenha.
    img.addEventListener('load', () => { img.classList.add('loaded'); }, { once: true });
    container.appendChild(img);
}

/**
 * Preenche um contentor de escudo com a imagem da equipa.
 * Se a imagem não existir/falhar, cai automaticamente para as iniciais.
 */
export function setCrest(container, eq) {
    setImageWithFallback(container, eq.escudo_url, eq.nome, eq.iniciais);
}