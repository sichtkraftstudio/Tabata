/* figure.js – animierte Figuren, die Start- und Endposition einer Übung zeigen.
 * Seitenansicht (Standard) oder Vorderansicht (view:'front'). Posen stehen in poses.js.
 * Winkel: 0° = nach unten, 90° = nach vorn (rechts), 180° = nach oben, 270° = nach hinten. */
const Fig = (() => {
  'use strict';

  const L = { thigh: 30, shin: 30, torso: 40, upper: 22, fore: 22, neck: 12 };
  const FLOOR = 138, SEAT = 112;
  const rad = (d) => (d * Math.PI) / 180;
  const dir = (a) => [Math.sin(rad(a)), Math.cos(rad(a))];
  const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
  const lerp = (a, b, t) => a + (b - a) * t;

  // Zwei-Knochen-IK: liefert [Gelenk, Endpunkt] von s zum Ziel g; bend wählt die Beugerichtung.
  function ik(s, g, l1, l2, bend) {
    const dx = g[0] - s[0], dy = g[1] - s[1], d = Math.hypot(dx, dy) || 1e-6;
    const dd = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
    const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
    const ux = dx / d, uy = dy / d;
    return [[s[0] + ux * a - uy * h * bend, s[1] + uy * a + ux * h * bend], [s[0] + ux * dd, s[1] + uy * dd]];
  }

  // Zwischenpose: Zahlen, Punkte und Gliedmaßen (fk/ik) werden einzeln gemischt.
  function mix(a, b, t) {
    if (typeof a === 'number') return lerp(a, b, t);
    if (Array.isArray(a)) return a.map((v, i) => mix(v, b[i], t));
    if (a && typeof a === 'object') {
      const o = {};
      for (const k in { ...b, ...a }) {
        o[k] = a[k] === undefined || b[k] === undefined || k === 'bend' || typeof a[k] === 'string' ? a[k] ?? b[k] : mix(a[k], b[k], t);
      }
      return o;
    }
    return a;
  }

  // ---------- Seitenansicht ----------
  function skeleton(p) {
    const hip = p.hip;
    const sh = add(add(hip, [Math.sin(rad(p.torso)), -Math.cos(rad(p.torso))], L.torso), [0, -(p.sho || 0)]);
    const hd = p.head ?? p.torso * 0.65;
    const head = add(sh, [Math.sin(rad(hd)), -Math.cos(rad(hd))], L.neck);
    const limb = (s, spec, l1, l2) => {
      if (spec.fk) { const j = add(s, dir(spec.fk[0]), l1); return [s, j, add(j, dir(spec.fk[1]), l2)]; }
      const [j, e] = ik(s, spec.ik === 'head' ? head : spec.ik, l1, l2, spec.bend);
      return [s, j, e];
    };
    const off = (pts, dx) => pts.map((q) => [q[0] + dx, q[1]]);
    const arm = limb(sh, p.arm, L.upper, L.fore), leg = limb(hip, p.leg, L.thigh, L.shin);
    return {
      hip, sh, head, arm, leg,
      armF: p.armF ? limb(sh, p.armF, L.upper, L.fore) : off(arm, -3),
      legF: p.legF ? limb(hip, p.legF, L.thigh, L.shin) : off(leg, -4),
      foot: p.foot ?? 90, footF: p.footF ?? p.foot ?? 90,
    };
  }

  // ---------- Vorderansicht ----------
  function skeletonF(p) {
    const cx = 120, hy = 77, lean = p.lean ?? 1, sy = hy - L.torso * lean;
    const sl = [cx - 13, sy], sr = [cx + 13, sy];
    const arm = (s, sign, spec) => {
      const j = add(s, [sign * Math.sin(rad(spec.fk[0])), Math.cos(rad(spec.fk[0]))], L.upper);
      return [s, j, add(j, [sign * Math.sin(rad(spec.fk[1])), Math.cos(rad(spec.fk[1]))], L.fore)];
    };
    const sp = p.spread ?? 7;
    return {
      sl, sr, head: [cx, sy - (lean < 0.8 ? 6 : 14)],
      armL: arm(sl, -1, p.arm), armR: arm(sr, 1, p.arm),
      legL: [[cx - 7, hy], [cx - 7 - sp, 135]], legR: [[cx + 7, hy], [cx + 7 + sp, 135]],
      hip: [cx, hy],
    };
  }

  const path = (pts) => 'M' + pts.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L');
  const footPath = (leg, ang) => path([leg[2], add(leg[2], dir(ang), 9)]);
  const set = (n, d) => n && n.setAttribute('d', d);

  function bandTarget(ex, sk) {
    if (ex.band === 'foot') return sk.leg[2];
    return ex.band;
  }

  function draw(nodes, ex, sk) {
    set(nodes.armF, path(sk.armF));
    set(nodes.legF, path(sk.legF));
    set(nodes.footF, footPath(sk.legF, sk.footF));
    set(nodes.torso, path([sk.hip, sk.sh]));
    set(nodes.leg, path(sk.leg));
    set(nodes.foot, footPath(sk.leg, sk.foot));
    nodes.head.setAttribute('cx', sk.head[0]); nodes.head.setAttribute('cy', sk.head[1]);
    set(nodes.arm, path(sk.arm));
    if (nodes.dbN) {
      nodes.dbN.setAttribute('cx', sk.arm[2][0]); nodes.dbN.setAttribute('cy', sk.arm[2][1]);
      nodes.dbF.setAttribute('cx', sk.armF[2][0]); nodes.dbF.setAttribute('cy', sk.armF[2][1]);
    }
    if (nodes.band) set(nodes.band, path([sk.arm[2], bandTarget(ex, sk)]));
  }

  function drawF(nodes, ex, sk) {
    set(nodes.legL, path(sk.legL)); set(nodes.legR, path(sk.legR));
    set(nodes.torso, path([[sk.hip[0], sk.hip[1]], [(sk.sl[0] + sk.sr[0]) / 2, sk.sl[1]]]));
    set(nodes.sh, path([sk.sl, sk.sr]));
    nodes.head.setAttribute('cx', sk.head[0]); nodes.head.setAttribute('cy', sk.head[1]);
    set(nodes.armL, path(sk.armL)); set(nodes.armR, path(sk.armR));
    if (nodes.dbL) {
      nodes.dbL.setAttribute('cx', sk.armL[2][0]); nodes.dbL.setAttribute('cy', sk.armL[2][1]);
      nodes.dbR.setAttribute('cx', sk.armR[2][0]); nodes.dbR.setAttribute('cy', sk.armR[2][1]);
    }
    if (nodes.band) {
      set(nodes.band, ex.band === 'feet'
        ? path([sk.armL[2], sk.legL[1]]) + path([sk.armR[2], sk.legR[1]])
        : path([sk.armL[2], sk.armR[2]]));
    }
  }

  const chairSvg = (c) => {
    const x2 = c.x + 34, bx = c.back < 0 ? c.x : x2;
    return `<path class="f-prop" d="M${c.x} ${SEAT}H${x2}M${c.x + 2} ${SEAT}V${FLOOR}M${x2 - 2} ${SEAT}V${FLOOR}M${bx} ${SEAT}V${SEAT - 36}"/>`;
  };

  const SVG = (ex) => {
    const head = `<svg class="fig" viewBox="0 -16 240 166" role="img" aria-label="${ex.label || ''}">
    <line class="f-floor" x1="10" x2="230" y1="${FLOOR}" y2="${FLOOR}"/>
    ${ex.mat ? '<rect class="f-mat" x="22" y="134" width="196" height="5" rx="2.5"/>' : ''}
    ${ex.chair ? chairSvg(ex.chair) : ''}`;
    if (ex.view === 'front') {
      return `${head}
    <path class="f-limb leg" data-k="legL"/><path class="f-limb leg" data-k="legR"/>
    <path class="f-torso" data-k="torso"/><path class="f-sh" data-k="sh"/>
    <circle class="f-head" data-k="head" r="9.5"/>
    <path class="f-limb arm" data-k="armL"/><path class="f-limb arm" data-k="armR"/>
    ${ex.band ? '<path class="f-band" data-k="band"/>' : ''}
    ${ex.db ? '<circle class="f-db" data-k="dbL" r="5.5"/><circle class="f-db" data-k="dbR" r="5.5"/>' : ''}
  </svg>`;
    }
    return `${head}
    ${ex.band ? '<path class="f-band" data-k="band"/>' : ''}
    ${ex.db ? '<circle class="f-db" data-k="dbF" r="5.5"/>' : ''}
    <path class="f-limb far" data-k="armF"/><path class="f-limb far" data-k="legF"/><path class="f-foot far" data-k="footF"/>
    <path class="f-torso" data-k="torso"/>
    <path class="f-limb leg" data-k="leg"/><path class="f-foot" data-k="foot"/>
    <circle class="f-head" data-k="head" r="9.5"/>
    <path class="f-limb arm" data-k="arm"/>
    ${ex.db ? '<circle class="f-db" data-k="dbN" r="5.5"/>' : ''}
  </svg>`;
  };

  const grab = (host) => {
    const nodes = {};
    host.querySelectorAll('[data-k]').forEach((n) => { nodes[n.dataset.k] = n; });
    return nodes;
  };
  const render = (nodes, ex, p) => {
    const pose = mix(ex.a, ex.b, p);
    if (ex.view === 'front') drawF(nodes, ex, skeletonF(pose)); else draw(nodes, ex, skeleton(pose));
  };

  // Statisches Bild (p = 0 Start, 1 Ende)
  function still(host, ex, p) {
    host.innerHTML = SVG(ex);
    render(grab(host), ex, p);
  }

  // Animation: weiche Bewegung mit kurzer Pause an beiden Enden; liefert eine Stopp-Funktion.
  // Bei „Bewegung reduzieren“ erscheinen stattdessen Start und Ende nebeneinander.
  function play(host, ex, period = 2600) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      host.innerHTML = '<div class="fig-pair"><div></div><div></div></div>';
      const [s, e] = host.querySelectorAll('.fig-pair > div');
      still(s, ex, 0); still(e, ex, 1);
      return () => {};
    }
    still(host, ex, 0);
    const nodes = grab(host);
    let raf = 0;
    const frame = (now) => {
      const wave = 0.5 - 0.5 * Math.cos((2 * Math.PI * now) / period);
      render(nodes, ex, Math.min(Math.max((wave - 0.08) / 0.84, 0), 1));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  // Figur zu einer Übungs-ID anzeigen (Stopp-Funktion oder null, wenn keine Pose vorhanden ist).
  function show(host, id, label) {
    const ex = (typeof POSES !== 'undefined') && POSES[id];
    if (!ex) { host.innerHTML = ''; return null; }
    return play(host, { ...ex, label });
  }

  return { still, play, show };
})();
