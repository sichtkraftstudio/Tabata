/* illustrations.js – Equipment-Icons (24×24, Strichstil). */
const Illu = (() => {
  'use strict';

  const ICONS = {
    stuhl: '<path d="M7 3v10M7 13h10M7 13v8M17 13v8M7 8h6"/>',
    matte: '<rect x="2.5" y="13" width="14" height="6" rx="1.5"/><circle cx="18.5" cy="13.5" r="3.5"/>',
    kurzhanteln: '<path d="M7 7h10M4 5v4M7 4v6M17 4v6M20 5v4M7 17h10M4 15v4M7 14v6M17 14v6M20 15v4"/>',
    dumbbell: '<path d="M7 12h10M3.5 9.5v5M7 7v10M17 7v10M20.5 9.5v5"/>',
    bandKurz: '<rect x="4" y="8" width="16" height="8" rx="4"/>',
    bandLang: '<path d="M2 15c3-7 5-7 7 0s4 7 7 0 4-4 6-3"/>',
  };
  const icon = (id) =>
    `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id] || ''}</svg>`;

  return { icon };
})();
