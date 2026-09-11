import { PATROCINADORES, TIER_LABEL, TIER_ORDER } from './data.js';
import { loadTemplate } from './components.js';
import { setImageWithFallback } from './team-utils.js';
import { animateIn } from './animate.js';

let tplSponsorCard;

export async function initPatrocinadoresTemplates() {
    tplSponsorCard = await loadTemplate('components/sponsor-card.html', 'tpl-sponsor-card');
}

export function renderSponsors() {
    const wrap = document.getElementById('sponsorsWrap');
    wrap.innerHTML = '';

    let index = 0;

    TIER_ORDER.forEach(tier => {
        const doTier = PATROCINADORES.filter(p => p.tier === tier);
        if (!doTier.length) return;

        const tierBlock = document.createElement('div');
        tierBlock.className = 'sponsor-tier';
        tierBlock.dataset.tier = tier;

        const title = document.createElement('div');
        title.className = 'sponsor-tier-title';
        title.textContent = TIER_LABEL[tier];
        tierBlock.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'sponsors-grid';

        doTier.forEach(p => {
            const frag = tplSponsorCard.content.cloneNode(true);
            animateIn(frag.firstElementChild, index++);
            setImageWithFallback(
                frag.querySelector('[data-slot="logo"]'),
                p.logo_url,
                p.nome,
                p.nome.slice(0, 3).toUpperCase()
            );
            frag.querySelector('[data-slot="nome"]').textContent = p.nome;
            grid.appendChild(frag);
        });

        tierBlock.appendChild(grid);
        wrap.appendChild(tierBlock);
    });
}
