/* =====================================================================
   ANIMAÇÕES DE RENDER
   Pequeno helper para dar uma entrada suave (fade + slide) aos elementos
   que são inseridos dinamicamente (cartões, linhas, etc.), com um
   "stagger" ligeiro entre eles para não parecer tudo a aparecer de
   repente. Nada disto corre se o utilizador preferir menos movimento
   (prefers-reduced-motion), ver css/style.css.
   ===================================================================== */

const STEP_MS = 45;   // atraso entre cada item consecutivo
const MAX_STEPS = 6;  // a partir daqui deixa de aumentar o atraso

/**
 * Marca um elemento para entrar com animação, com um atraso
 * proporcional à sua posição na lista (index).
 */
export function animateIn(el, index = 0) {
    if (!el) return;
    el.classList.add('animate-in');
    el.style.animationDelay = `${Math.min(index, MAX_STEPS) * STEP_MS}ms`;
}
