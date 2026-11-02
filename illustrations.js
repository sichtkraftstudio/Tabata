/* illustrations.js – flache Vektor-Illustrationen (SVG) für alle Übungen.
 *
 * Eine wiederverwendbare Figur wird aus Gelenkwinkeln aufgebaut: jedes Körpersegment
 * ist eine eigene, verschachtelte SVG-Gruppe (Hüfte → Torso → Oberarm → Unterarm …).
 * Die Posen kommen aus exercises.js. Bei zwei Posen wird per SMIL (animateTransform)
 * sanft zwischen Start und Ende gewechselt – ohne JavaScript-Schleife, also akkuschonend.
 */
const Illu = (() => {
  'use strict';

  // Einheitliche Farbpalette
  const C = {
    skin: '#e9b99a', skinFar: '#d09d7e',
    shirt: '#14b8a6', shirtFar: '#0f8f82',
    pants: '#0f766e', pantsFar: '#0b5a54',
    hair: '#3f3f4a', eye: '#334155', shoe: '#475569', shoeFar: '#334155',
    equip: '#f97316', equipDark: '#c2410c',
    grey: '#94a3b8', greyDark: '#64748b', greyLight: '#cbd5e1', matTop: '#d5dde7',
    arrow: '#1e293b', shadow: '#0f172a',
  };

  // Segmentlängen der Figur (Einheiten im 200×200-Feld)
  const L = { torso: 48, shoulder: 41, neck: 46, upper: 29, fore: 27, thigh: 37, shin: 36 };
  const STEPS = 16; // Stützstellen pro Animationszyklus
  const DUR = 2.4; // Sekunden für Hin- und Rückweg

  const rad = (d) => (d * Math.PI) / 180;
  const dir = (a) => [Math.sin(rad(a)), Math.cos(rad(a))];
  const angleOf = (dx, dy) => (Math.atan2(dx, dy) * 180) / Math.PI;
  const r1 = (n) => Math.round(n * 10) / 10;
  const lerp = (a, b, u) => a + (b - a) * u;
  const lerpAngle = (a, b, u) => a + (((((b - a) % 360) + 540) % 360) - 180) * u; // kürzester Weg

  /** Gelenke im Torso-Koordinatensystem (Ursprung = Hüfte, +y zeigt zur Schulter). */
  function joints(cfg) {
    const s = L.shoulder * cfg.ts;
    return cfg.view === 'side'
      ? { arm: [[0, s], [0, s]], leg: [[0, 0], [0, 0]] }
      : { arm: [[13, s], [-13, s]], leg: [[7, 0], [-7, 0]] };
  }

  /** Torso-lokale Koordinaten → Weltkoordinaten (entspricht translate(x,y) rotate(-t)). */
  function toWorld(st, [lx, ly]) {
    const s = Math.sin(rad(st.t)), c = Math.cos(rad(st.t));
    return [st.x + lx * c + ly * s, st.y - lx * s + ly * c];
  }

  /** Pose → absolute Winkel. { ik: [x, y] } wird per Zwei-Gelenk-IK gelöst. */
  function solve(p, cfg) {
    const st = { x: p.x, y: p.y, t: p.t, h: p.h ?? p.t };
    const J = joints(cfg);
    const limb = (spec = [0, 0], local, l1, l2, bend) => {
      if (Array.isArray(spec)) return spec;
      const [jx, jy] = toWorld(st, local);
      const [tx, ty] = spec.ik;
      const D = Math.min(Math.max(Math.hypot(tx - jx, ty - jy), Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.01);
      const alpha = (Math.acos((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D)) * 180) / Math.PI;
      const a = angleOf(tx - jx, ty - jy) + (spec.bend ?? bend) * alpha;
      const ex = jx + l1 * Math.sin(rad(a)), ey = jy + l1 * Math.cos(rad(a));
      return [a, angleOf(tx - ex, ty - ey)];
    };
    st.a1 = limb(p.a1, J.arm[0], L.upper, L.fore, -1);
    st.a2 = limb(p.a2, J.arm[1], L.upper, L.fore, -1);
    st.l1 = limb(p.l1, J.leg[0], L.thigh, L.shin, 1);
    st.l2 = limb(p.l2, J.leg[1], L.thigh, L.shin, 1);
    return st;
  }

  function mix(A, B, u) {
    const m = { x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), t: lerpAngle(A.t, B.t, u), h: lerpAngle(A.h, B.h, u) };
    for (const k of ['a1', 'a2', 'l1', 'l2']) m[k] = [lerpAngle(A[k][0], B[k][0], u), lerpAngle(A[k][1], B[k][1], u)];
    return m;
  }

  /** Start → Ende → Start mit Ease-in-out, als Liste von Zwischenposen. */
  function cycle(A, B) {
    return Array.from({ length: STEPS + 1 }, (_, i) => {
      const p = i / STEPS, tri = p < 0.5 ? p * 2 : 2 - p * 2;
      return mix(A, B, tri * tri * (3 - 2 * tri));
    });
  }

  /** Weltpositionen von Schultern (s1/s2), Händen (h1/h2) und Füßen (f1/f2) für Bänder & Co. */
  function fk(st, cfg) {
    const J = joints(cfg), P = {};
    const chain = (ang, local, l1, l2) => {
      const j = toWorld(st, local), d1 = dir(ang[0]), d2 = dir(ang[1]);
      const e = [j[0] + d1[0] * l1, j[1] + d1[1] * l1];
      return [j, [e[0] + d2[0] * l2, e[1] + d2[1] * l2]];
    };
    [P.s1, P.h1] = chain(st.a1, J.arm[0], L.upper, L.fore);
    [P.s2, P.h2] = chain(st.a2, J.arm[1], L.upper, L.fore);
    const foot = (ang, local) => {
      const [, k] = chain(ang, local, L.thigh, L.shin), a = rad(ang[1]);
      return [k[0] + 4 * Math.cos(a) + 2 * Math.sin(a), k[1] - 4 * Math.sin(a) + 2 * Math.cos(a)];
    };
    P.f1 = foot(st.l1, J.leg[0]);
    P.f2 = foot(st.l2, J.leg[1]);
    return P;
  }

  // ---------- Formen ----------
  const seg = (len, w, col, from = 0) =>
    `<line x1="0" y1="${from}" x2="0" y2="${len}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

  const HEAD_SIDE = seg(8, 9, C.skin, -3) +
    `<circle cx="3" cy="19" r="11" fill="${C.hair}"/><circle cx="-0.5" cy="17" r="10.3" fill="${C.skin}"/>` +
    `<circle cx="-10.9" cy="16.3" r="2.6" fill="${C.skin}"/><circle cx="2.8" cy="16" r="2.3" fill="${C.skinFar}"/>` +
    `<circle cx="-6" cy="18" r="1.3" fill="${C.eye}"/>`;
  const HEAD_FRONT = seg(8, 10, C.skin, -3) +
    `<circle cx="-10.2" cy="16" r="2.6" fill="${C.skin}"/><circle cx="10.2" cy="16" r="2.6" fill="${C.skin}"/>` +
    `<circle cx="0" cy="19.5" r="11" fill="${C.hair}"/><circle cx="0" cy="16.2" r="10.2" fill="${C.skin}"/>` +
    `<circle cx="-3.8" cy="17.5" r="1.3" fill="${C.eye}"/><circle cx="3.8" cy="17.5" r="1.3" fill="${C.eye}"/>`;
  const HEAD_TOP = seg(6, 10, C.skin, -3) + // vorgebeugt, von vorn: man sieht vor allem den Scheitel
    `<circle cx="0" cy="12" r="9" fill="${C.skin}"/><circle cx="0" cy="17" r="10.5" fill="${C.hair}"/>`;

  function dumbbell(style) {
    return style === 'bar' // Hantelachse quer zum Unterarm
      ? `<rect x="-12" y="-2" width="24" height="4" rx="2" fill="${C.equipDark}"/>` +
        `<rect x="-17" y="-7.5" width="7" height="15" rx="2.5" fill="${C.equip}"/><rect x="10" y="-7.5" width="7" height="15" rx="2.5" fill="${C.equip}"/>`
      : `<circle r="8.5" fill="${C.equip}"/><circle r="3.4" fill="${C.equipDark}"/>`; // Blick auf die Hantelscheibe
  }

  function armParts(far, held) {
    const skin = far ? C.skinFar : C.skin;
    return {
      upper: seg(L.upper, 10, skin) + seg(10, 12.5, far ? C.shirtFar : C.shirt),
      lower: seg(L.fore, 8.5, skin) + (held ? `<g transform="translate(0 ${L.fore})">${held}</g>` : '') +
        `<circle cx="0" cy="${L.fore}" r="5.3" fill="${skin}"/>`,
    };
  }

  function legParts(far, front) {
    const skin = far ? C.skinFar : C.skin, shoe = far ? C.shoeFar : C.shoe;
    const foot = front
      ? `<ellipse cx="0" cy="${L.shin + 3}" rx="5.5" ry="5" fill="${shoe}"/>`
      : `<line x1="0" y1="${L.shin + 1}" x2="9" y2="${L.shin + 2}" stroke="${shoe}" stroke-width="8" stroke-linecap="round"/>`;
    return { upper: seg(L.thigh, 13, skin) + seg(25, 15.5, far ? C.pantsFar : C.pants), lower: seg(L.shin, 11, skin) + foot };
  }

  const chair = (x, flip) =>
    `<rect x="${flip ? x + 40 : x}" y="92" width="6" height="52" rx="3" fill="${C.greyDark}"/>` +
    `<rect x="${x + 3}" y="143" width="5" height="35" rx="2" fill="${C.greyDark}"/><rect x="${x + 38}" y="143" width="5" height="35" rx="2" fill="${C.greyDark}"/>` +
    `<rect x="${x}" y="139" width="46" height="7" rx="3" fill="${C.grey}"/>`;

  const door = ([ax, ay]) =>
    `<rect x="181" y="4" width="14" height="174" rx="2" fill="${C.greyLight}" stroke="${C.grey}" stroke-width="2"/>` +
    `<circle cx="${ax}" cy="${ay}" r="3.5" fill="${C.greyDark}"/>`;

  function arrow({ p, both }) {
    const [x1, y1] = p, [x2, y2] = p.slice(-2), curve = p.length === 6;
    const d = curve ? `M${x1} ${y1} Q${p[2]} ${p[3]} ${x2} ${y2}` : `M${x1} ${y1} L${x2} ${y2}`;
    const head = (tx, ty, fx, fy) => {
      const n = Math.hypot(tx - fx, ty - fy) || 1, ux = (tx - fx) / n, uy = (ty - fy) / n;
      return `<path d="M${r1(tx)} ${r1(ty)} L${r1(tx - 9 * ux + 5 * uy)} ${r1(ty - 9 * uy - 5 * ux)} L${r1(tx - 9 * ux - 5 * uy)} ${r1(ty - 9 * uy + 5 * ux)}Z" fill="${C.arrow}"/>`;
    };
    const [ex, ey] = curve ? [p[2], p[3]] : [x1, y1];
    const [sx, sy] = curve ? [p[2], p[3]] : [x2, y2];
    return `<g opacity=".7"><path d="${d}" fill="none" stroke="${C.arrow}" stroke-width="3" stroke-linecap="round"/>` +
      head(x2, y2, ex, ey) + (both ? head(x1, y1, sx, sy) : '') + '</g>';
  }

  /** SVG-Markup einer Übung. animate=false liefert nur die Startpose (Thumbnails). */
  function svg(ex, { animate = false } = {}) {
    const cfg = { view: 'side', ts: 1, zoom: 1, props: [], arrows: [], ...ex.pose };
    const side = cfg.view === 'side';
    const frames = cfg.frames.map((p) => solve(p, cfg));
    const S = animate && frames.length > 1 ? cycle(frames[0], frames[1]) : [frames[0]];
    const J = joints(cfg);

    // Transform-Gruppe; ändern sich die Werte über die Zwischenposen, wird sie animiert
    const anim = (type, vals) => (vals.some((v) => v !== vals[0])
      ? `<animateTransform attributeName="transform" type="${type}" values="${vals.join(';')}" dur="${DUR}s" repeatCount="indefinite"/>` : '');
    const rot = (fn, inner) => {
      const v = S.map((s) => r1(fn(s)));
      return `<g transform="rotate(${v[0]})">${anim('rotate', v)}${inner}</g>`;
    };
    const held = (at) => cfg.props.filter((p) => p.type === 'db' && p.at === at).map((p) => dumbbell(p.style)).join('');

    // Gliedmaße: Gelenk verschieben, Oberteil relativ zum Torso drehen, Unterteil relativ zum Oberteil
    const limb = (key, local, parts, l1) =>
      `<g transform="translate(${r1(local[0])} ${r1(local[1])})">` +
      rot((s) => s.t - s[key][0], parts.upper + `<g transform="translate(0 ${l1})">` +
        rot((s) => s[key][0] - s[key][1], parts.lower) + '</g>') + '</g>';
    const arm = (i, far = false) => limb('a' + i, J.arm[i - 1], armParts(far, held('h' + i)), L.upper);
    const leg = (i, far = false) => limb('l' + i, J.leg[i - 1], legParts(far, !side), L.thigh);

    const Lt = L.torso * cfg.ts;
    const torso = side
      ? seg(38, 26, C.shirt, 8) + seg(6, 26.5, C.pants, 4)
      : `<rect x="-16" y="-6" width="32" height="${r1(Lt + 2)}" rx="12" fill="${C.shirt}"/><rect x="-15.5" y="-9" width="31" height="18" rx="8" fill="${C.pants}"/>`;
    const headShape = side ? HEAD_SIDE : cfg.headTop ? HEAD_TOP : HEAD_FRONT;
    const head = `<g transform="translate(0 ${r1(side ? L.neck : Lt - 2)})">${rot((s) => s.t - s.h, headShape)}</g>`;

    // Zeichenreihenfolge: hintere Gliedmaßen zuerst, vordere zuletzt
    const body = side
      ? [leg(2, true), arm(2, true), leg(1), torso, head, arm(1)]
      : cfg.armsBehind ? [arm(1), arm(2), leg(1), leg(2), torso, head] : [leg(1), leg(2), torso, head, arm(1), arm(2)];
    const tr = S.map((s) => `${r1(s.x)} ${r1(s.y)}`);
    const figure = `<g transform="translate(${tr[0]})">${anim('translate', tr)}${rot((s) => -s.t, body.join(''))}</g>`;

    // Equipment in Weltkoordinaten (Bänder folgen den Händen über alle Zwischenposen)
    const P = S.map((s) => fk(s, cfg));
    const pt = (ref, q) => (typeof ref === 'string' ? q[ref] : Array.isArray(ref) ? ref : [q[ref.k][0] + (ref.dx || 0), q[ref.k][1] + (ref.dy || 0)]);
    const world = (pr) => {
      if (pr.type === 'chair') return chair(pr.x, pr.flip);
      if (pr.type === 'door') return door(pr.anchor);
      if (pr.type === 'band') {
        const d = P.map((q) => 'M' + pr.pts.map((ref) => pt(ref, q).map(r1).join(' ')).join(' L'));
        const a = d.some((x) => x !== d[0]) ? `<animate attributeName="d" values="${d.join(';')}" dur="${DUR}s" repeatCount="indefinite"/>` : '';
        return `<path d="${d[0]}" fill="none" stroke="${C.equip}" stroke-width="${pr.w || 4}" stroke-linecap="round" stroke-linejoin="round">${a}</path>`;
      }
      if (pr.type === 'db' && pr.at === 'mid') { // eine Hantel mit beiden Händen gehalten
        const v = P.map((q) => `${r1((q.h1[0] + q.h2[0]) / 2)} ${r1((q.h1[1] + q.h2[1]) / 2)}`);
        return `<g transform="translate(${v[0]})">${anim('translate', v)}<g transform="rotate(90)">${dumbbell('bar')}</g></g>`;
      }
      return '';
    };
    const isBack = (p) => p.behind || p.type === 'chair' || p.type === 'door';
    const back = cfg.props.filter(isBack).map(world).join('');
    const fore = cfg.props.filter((p) => !isBack(p)).map(world).join('');

    const has = (t) => cfg.props.some((p) => p.type === t);
    const ground = (cfg.view === 'top' ? '' : `<ellipse cx="100" cy="178.5" rx="82" ry="4.5" fill="${C.shadow}" opacity=".08"/>`) +
      (has('mat') ? `<rect x="12" y="174" width="176" height="5" rx="2.5" fill="${C.grey}"/>` : '') +
      (has('matTop') ? `<rect x="26" y="8" width="148" height="184" rx="14" fill="${C.matTop}"/>` : '');
    const scene = back + figure + fore + cfg.arrows.map(arrow).join('');
    const zoomed = cfg.zoom !== 1 ? `<g transform="translate(100 174) scale(${cfg.zoom}) translate(-100 -174)">${scene}</g>` : scene;
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ex.name}">${ground}${zoomed}</svg>`;
  }

  // ---------- Equipment-Icons (24×24, Strichstil) ----------
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

  return { svg, icon };
})();
