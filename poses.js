/* poses.js – Start- (a) und Endposition (b) jeder Übung für figure.js.
 * Schlüssel = Übungs-ID aus exercises.js. Seitenansicht, Blick nach rechts; view:'front' = Vorderansicht.
 * Winkel in Grad: 0 unten, 90 vorn, 180 oben, 270 hinten.
 * Gliedmaßen: { fk:[Oberteil, Unterteil] } oder { ik:[x,y], bend:±1 } (Ziel, z. B. Hand am Boden). */
const POSES = (() => {
  'use strict';

  const deg = (r) => (r * 180) / Math.PI;
  const rad = (d) => (d * Math.PI) / 180;

  // ---------- Grundhaltungen ----------
  const stand = { hip: [112, 77], torso: 0, leg: { ik: [112, 135], bend: -1 } };
  const S = (arm, o = {}) => ({ ...stand, arm, ...o });
  const hinge = (t, arm, o = {}) => ({ hip: [88, 82], torso: t, leg: { ik: [112, 135], bend: -1 }, arm, ...o });

  // Rücken liegend: Kopf rechts, Füße links
  const sup = (o = {}) => ({ hip: [96, 127], torso: 90, head: 88, leg: { fk: [270, 270] }, arm: { fk: [270, 270] }, foot: 180, ...o });
  const supBent = (o = {}) => ({ hip: [92, 127], torso: 90, head: 88, leg: { fk: [235, 325] }, foot: 90, arm: { fk: [270, 270] }, ...o });
  // Bauch liegend
  const prone = (o = {}) => ({ hip: [96, 126], torso: 90, head: 90, leg: { fk: [270, 270] }, foot: 270, arm: { fk: [90, 90] }, ...o });
  // Vierfüßler
  const quad = (o = {}) => ({ hip: [96, 103], torso: 80, head: 75, leg: { fk: [0, 270] }, foot: 270, arm: { ik: [136, 138], bend: 1 }, ...o });
  // Brücke: Füße am Boden, Schultern liegen; up = Becken angehoben
  const bridge = (up, o = {}) => ({
    hip: up ? [92, 108] : [92, 127], torso: up ? 116 : 90, head: up ? 100 : 88,
    leg: { ik: [52, 132], bend: 1 }, foot: 90, arm: { fk: [270, 270] }, ...o,
  });
  // Sitzen auf dem Boden, Beine gestreckt
  const sit = (o = {}) => ({ hip: [86, 127], torso: 0, leg: { fk: [90, 90] }, foot: 180, arm: { fk: [0, 0] }, ...o });

  // Körperlinie vom Fuß T zur Schulter S (Liegestütz, Plank): Hüfte liegt auf der Linie.
  const line = (T, Sh, o = {}) => {
    const dx = Sh[0] - T[0], dy = Sh[1] - T[1], d = Math.hypot(dx, dy), u = [dx / d, dy / d];
    const ang = deg(Math.atan2(u[0], -u[1]));
    return { hip: [T[0] + 59.8 * u[0], T[1] + 59.8 * u[1]], torso: ang, head: ang, leg: { ik: T, bend: -1 }, foot: 20, ...o };
  };
  const slope = (a) => [40 + 99.8 * Math.cos(rad(a)), 132 - 99.8 * Math.sin(rad(a))];
  const plank = (a, hand, o = {}) => line([40, 132], slope(a), { arm: { ik: hand, bend: 1 }, ...o });
  const pushup = (a) => plank(a, [slope(26)[0], 133.5]);
  const elbowPlank = (a) => line([40, 132], slope(a), { arm: { fk: [0, 90] } });
  const kneePlank = (a, hand) => {
    const c = Math.cos(rad(a)), s = Math.sin(rad(a));
    const knee = [72, 130], hip = [knee[0] + 30 * c, knee[1] - 30 * s];
    return { hip, torso: 90 - a, head: 90 - a, leg: { fk: [a - 90, 255] }, foot: 270, arm: { ik: hand, bend: 1 } };
  };

  const chairAt = (x, back) => ({ x, back });

  // ---------- Arm-Bausteine ----------
  const down = { fk: [0, 0] };
  const curlA = { fk: [4, 0] }, curlB = { fk: [6, 155] };
  const pressA = { fk: [28, 172] }, pressB = { fk: [180, 180] };
  const rowA = { fk: [0, 0] }, rowB = { fk: [-125, -10] };

  const P = {
    // ---------- Brust ----------
    liegestuetze: { mat: true, a: pushup(26), b: pushup(10) },
    liegestuetzeKnie: { mat: true, a: kneePlank(26, [117, 133.5]), b: kneePlank(10, [117, 133.5]) },
    diamantLiegestuetze: { mat: true, a: pushup(26), b: pushup(10) },
    weiteLiegestuetze: { mat: true, a: pushup(26), b: pushup(10) },
    schraegLiegestuetze: {
      chair: chairAt(112, 1),
      a: line([40, 132], [118, 66], { arm: { ik: [118, 112], bend: 1 } }),
      b: line([40, 132], [128, 88], { arm: { ik: [118, 112], bend: 1 } }),
    },
    brustFliegenBand: { view: 'front', band: 'hands', a: { arm: { fk: [88, 84] } }, b: { arm: { fk: [40, 8] } } },
    brustdrueckenBand: {
      band: [14, 48],
      a: S({ fk: [-25, 95] }), b: S({ fk: [90, 90] }),
    },
    brustdrueckenLiegend: { mat: true, db: true, a: sup({ arm: { fk: [180, 180] } }), b: sup({ arm: { fk: [100, 185] } }) },
    hantelPresseEng: { mat: true, db: true, a: sup({ arm: { fk: [180, 180] } }), b: sup({ arm: { fk: [150, 190] } }) },
    fliegenKurzhanteln: { mat: true, db: true, a: sup({ arm: { fk: [180, 180] } }), b: sup({ arm: { fk: [120, 160] } }) },
    pulloverHantel: { mat: true, db: true, a: supBent({ arm: { fk: [180, 180] } }), b: supBent({ arm: { fk: [100, 100] } }) },

    // ---------- Arme ----------
    bizepsCurls: { db: true, a: S(curlA), b: S(curlB) },
    hammerCurls: { db: true, a: S(curlA), b: S(curlB) },
    reverseCurls: { db: true, a: S(curlA), b: S(curlB) },
    zottmanCurls: { db: true, a: S(curlA), b: S(curlB) },
    bizepsCurlsBandKurz: { band: 'foot', a: S(curlA), b: S(curlB) },
    bizepsCurlsBandLang: { band: 'foot', a: S(curlA), b: S(curlB) },
    hammerCurlsBand: { band: 'foot', a: S(curlA), b: S(curlB) },
    konzentrationsCurls: {
      db: true, chair: chairAt(62, -1),
      a: { hip: [84, 106], torso: 45, leg: { fk: [90, 0] }, arm: { fk: [25, 15] } },
      b: { hip: [84, 106], torso: 45, leg: { fk: [90, 0] }, arm: { fk: [25, 150] } },
    },
    trizepsKickbacks: { db: true, a: hinge(65, { fk: [-65, 5] }), b: hinge(65, { fk: [-65, -65] }) },
    trizepsUeberkopf: { db: true, a: S({ fk: [180, 340] }), b: S({ fk: [180, 180] }) },
    trizepsUeberkopfBand: { band: 'foot', a: S({ fk: [180, 340] }), b: S({ fk: [180, 180] }) },
    trizepsPushdown: { band: [150, -12], a: S({ fk: [5, 100] }), b: S({ fk: [5, 5] }) },
    schaedelbrecher: { mat: true, db: true, a: sup({ arm: { fk: [180, 180] } }), b: sup({ arm: { fk: [180, 30] } }) },
    trizepsDips: {
      chair: chairAt(44, -1),
      a: { hip: [90, 106], torso: -6, leg: { ik: [146, 135], bend: -1 }, arm: { ik: [76, 112], bend: 1 } },
      b: { hip: [90, 126], torso: -6, leg: { ik: [146, 135], bend: -1 }, arm: { ik: [76, 112], bend: 1 } },
    },

    // ---------- Schultern ----------
    schulterdruecken: { db: true, a: S(pressA), b: S(pressB) },
    schulterdrueckenBand: { band: 'foot', a: S(pressA), b: S(pressB) },
    arnoldPress: { view: 'front', db: true, a: { arm: { fk: [15, 175] } }, b: { arm: { fk: [165, 175] } } },
    seitheben: { view: 'front', db: true, a: { arm: { fk: [4, 4] } }, b: { arm: { fk: [88, 88] } } },
    seithebenBand: { view: 'front', band: 'feet', a: { arm: { fk: [4, 4] } }, b: { arm: { fk: [88, 88] } } },
    frontheben: { db: true, a: S(down), b: S({ fk: [90, 90] }) },
    shrugs: { db: true, a: S(down), b: S(down, { sho: 7 }) },
    reverseFlys: { view: 'front', db: true, a: { lean: 0.45, arm: { fk: [4, 4] } }, b: { lean: 0.45, arm: { fk: [88, 88] } } },
    facePulls: {
      band: [212, 37],
      a: S({ ik: [155, 37], bend: 1 }),
      b: S({ ik: [122, 44], bend: 1 }),
    },
    pikeLiegestuetze: {
      mat: true,
      a: { hip: [84, 78], torso: 108, head: 120, leg: { ik: [60, 132], bend: -1 }, foot: 20, arm: { ik: [128, 134], bend: 1 } },
      b: { hip: [84, 78], torso: 128, head: 135, leg: { ik: [60, 132], bend: -1 }, foot: 20, arm: { ik: [128, 134], bend: 1 } },
    },

    // ---------- Rücken ----------
    rudernVorgebeugt: { db: true, a: hinge(65, rowA), b: hinge(65, rowB) },
    rudernAufBand: { band: 'foot', a: hinge(60, rowA), b: hinge(60, rowB) },
    rudernEinarmig: {
      db: true, chair: chairAt(146, 1),
      a: { hip: [86, 88], torso: 75, leg: { ik: [112, 135], bend: -1 }, arm: rowA, armF: { ik: [150, 112], bend: 1 } },
      b: { hip: [86, 88], torso: 75, leg: { ik: [112, 135], bend: -1 }, arm: rowB, armF: { ik: [150, 112], bend: 1 } },
    },
    rudernSitzendBand: {
      mat: true, band: 'foot',
      a: sit({ arm: { fk: [90, 90] } }), b: sit({ arm: { fk: [-20, 90] } }),
    },
    latZugBand: { band: [150, -12], a: S({ fk: [165, 170] }), b: S({ fk: [335, 120] }) },
    bandPullApart: { view: 'front', band: 'hands', a: { arm: { fk: [30, 10] } }, b: { arm: { fk: [88, 88] } } },
    kreuzhebenRumaenisch: {
      db: true,
      a: S(down),
      b: { hip: [86, 88], torso: 75, leg: { ik: [112, 135], bend: -1 }, arm: down },
    },
    superman: {
      mat: true,
      a: prone(),
      b: prone({ torso: 78, head: 72, arm: { fk: [125, 125] }, leg: { fk: [240, 240] } }),
    },
    yHeben: { mat: true, a: prone(), b: prone({ torso: 82, head: 76, arm: { fk: [135, 135] } }) },
    rudernBauchlage: {
      mat: true, db: true,
      a: prone({ torso: 80, head: 70, arm: { fk: [90, 90] } }),
      b: prone({ torso: 80, head: 70, arm: { fk: [235, 330] } }),
    },
    birdDog: {
      mat: true,
      a: quad({ legF: { fk: [0, -90] } }),
      b: quad({ arm: { ik: [178, 98], bend: 1 }, legF: { fk: [-90, -90] } }),
    },

    // ---------- Bauch ----------
    crunches: {
      mat: true,
      a: supBent({ head: 84, arm: { ik: 'head', bend: -1 } }),
      b: supBent({ torso: 56, head: 52, arm: { ik: 'head', bend: -1 } }),
    },
    situps: {
      mat: true,
      a: supBent({ arm: { ik: 'head', bend: -1 } }),
      b: supBent({ torso: 10, head: 8, arm: { ik: 'head', bend: -1 } }),
    },
    bicycleCrunches: {
      mat: true,
      a: supBent({ torso: 62, head: 58, arm: { ik: 'head', bend: -1 }, leg: { fk: [150, 245] }, legF: { fk: [262, 262] } }),
      b: supBent({ torso: 62, head: 58, arm: { ik: 'head', bend: -1 }, leg: { fk: [262, 262] }, legF: { fk: [150, 245] } }),
    },
    beinhebenLiegend: { mat: true, a: sup({ leg: { fk: [180, 180] } }), b: sup({ leg: { fk: [262, 262] } }) },
    beinheberScheren: {
      mat: true,
      a: sup({ leg: { fk: [205, 205] }, legF: { fk: [250, 250] } }),
      b: sup({ leg: { fk: [250, 250] }, legF: { fk: [205, 205] } }),
    },
    flutterKicks: {
      mat: true,
      a: sup({ leg: { fk: [252, 252] }, legF: { fk: [262, 262] } }),
      b: sup({ leg: { fk: [262, 262] }, legF: { fk: [252, 252] } }),
    },
    scheibenwischer: { mat: true, a: sup({ leg: { fk: [200, 200] } }), b: sup({ leg: { fk: [160, 160] } }) },
    hollowHold: {
      mat: true,
      a: sup({ arm: { fk: [90, 90] } }),
      b: sup({ torso: 74, head: 70, arm: { fk: [110, 110] }, leg: { fk: [252, 252] } }),
    },
    deadBug: {
      mat: true,
      a: sup({ arm: { fk: [180, 180] }, leg: { fk: [180, 270] }, legF: { fk: [180, 270] } }),
      b: sup({ arm: { fk: [100, 100] }, leg: { fk: [180, 270] }, legF: { fk: [262, 262] } }),
    },
    russianTwists: {
      mat: true, db: true,
      a: { hip: [100, 125], torso: -30, leg: { fk: [135, 45] }, foot: 90, arm: { fk: [60, 70] } },
      b: { hip: [100, 125], torso: -30, leg: { fk: [135, 45] }, foot: 90, arm: { fk: [100, 110] } },
    },
    plank: { mat: true, a: elbowPlank(12.7), b: elbowPlank(12.7) },
    seitstuetz: { mat: true, a: elbowPlank(9), b: elbowPlank(13) },
    plankStuhl: {
      chair: chairAt(112, 1),
      a: line([40, 132], [118, 66], { arm: { ik: [118, 112], bend: 1 } }),
      b: line([40, 132], [118, 66], { arm: { ik: [118, 112], bend: 1 } }),
    },
    plankSchulter: {
      mat: true,
      a: plank(26, [130, 133.5], { armF: { ik: [130, 133.5], bend: 1 } }),
      b: plank(26, [122, 40], { armF: { ik: [130, 133.5], bend: 1 } }),
    },
    mountainClimbers: {
      mat: true,
      a: plank(26, [130, 133.5], { legF: { ik: [96, 122], bend: -1 }, footF: 20 }),
      b: { ...plank(26, [130, 133.5], { legF: { ik: [40, 132], bend: -1 }, footF: 20 }), leg: { ik: [96, 122], bend: -1 } },
    },
    beinhebenStuhl: {
      chair: chairAt(56, -1),
      a: { hip: [80, 105], torso: -12, leg: { fk: [140, -15] }, foot: 90, arm: down },
      b: { hip: [80, 105], torso: -12, leg: { fk: [100, 95] }, foot: 180, arm: down },
    },
    holzhackerBand: {
      band: [150, -12],
      a: S({ fk: [165, 170] }), b: S({ fk: [25, 30] }, { torso: 20, hip: [106, 80] }),
    },

    // ---------- Laufen ----------
    lauf: {
      a: { hip: [112, 80], torso: 10, leg: { fk: [100, 10] }, legF: { fk: [-30, -75] }, arm: { fk: [-45, 25] }, armF: { fk: [55, 120] }, foot: 90 },
      b: { hip: [112, 80], torso: 10, leg: { fk: [-30, -75] }, legF: { fk: [100, 10] }, arm: { fk: [55, 120] }, armF: { fk: [-45, 25] }, foot: 90 },
    },

    // ---------- Unterer Rücken (BACK in exercises.js) ----------
    beckenkippen: { mat: true, a: bridge(false), b: bridge(false, { hip: [92, 123], torso: 98, head: 92 }) },
    beckenheben: { mat: true, a: bridge(false), b: bridge(true) },
    beckenhebenMarsch: {
      mat: true,
      a: bridge(true, { leg: { fk: [261.5, 340.7] }, legF: { ik: [52, 132], bend: 1 } }),
      b: bridge(true, { leg: { fk: [190, 245] }, legF: { ik: [52, 132], bend: 1 } }),
    },
    beckenhebenEinbein: {
      mat: true,
      a: bridge(true, { legF: { fk: [261.5, 340.7] } }),
      b: bridge(true, { legF: { fk: [244, 244] } }),
    },
    hueftstrecken: {
      mat: true,
      a: quad({ leg: { fk: [0, -90] }, legF: { fk: [0, -90] } }),
      b: quad({ leg: { fk: [-95, -180] }, legF: { fk: [0, -90] } }),
    },
    schwimmer: {
      mat: true,
      a: prone({ armF: { fk: [90, 90] }, legF: { fk: [270, 270] } }),
      b: prone({ torso: 86, head: 80, arm: { fk: [125, 125] }, armF: { fk: [90, 90] }, legF: { fk: [240, 240] } }),
    },
    goodMorningBand: {
      band: 'foot',
      a: S({ ik: 'head', bend: -1 }),
      b: hinge(62, { ik: 'head', bend: -1 }),
    },

    // ---------- Dehnen ----------
    dehnBrust: { a: S({ fk: [-5, -5] }), b: S({ fk: [-70, -70] }, { torso: -4 }) },
    dehnSchulter: { a: S({ fk: [50, 50] }, { armF: { fk: [0, 0] } }), b: S({ fk: [90, 90] }, { armF: { fk: [75, 165] } }) },
    dehnTrizeps: { a: S({ fk: [165, 280] }, { armF: { fk: [0, 0] } }), b: S({ fk: [175, 300] }, { armF: { fk: [150, 235] } }) },
    dehnNacken: { a: S(down, { head: 0 }), b: S(down, { head: 35 }) },
    dehnKatzeKuh: { mat: true, a: quad({ torso: 82, head: 35 }), b: quad({ torso: 98, head: 125 }) },
    dehnKind: {
      mat: true,
      a: { hip: [85, 118], torso: 10, head: 10, leg: { fk: [64, 270] }, foot: 270, arm: { fk: [20, 20] } },
      b: { hip: [85, 118], torso: 80, head: 85, leg: { fk: [64, 270] }, foot: 270, arm: { fk: [70, 75] } },
    },
    dehnHueftbeuger: {
      mat: true,
      a: { hip: [96, 104], torso: 0, leg: { ik: [136, 135], bend: -1 }, legF: { ik: [58, 128], bend: -1 }, footF: 270, arm: down },
      b: { hip: [108, 108], torso: 0, leg: { ik: [136, 135], bend: -1 }, legF: { ik: [58, 128], bend: -1 }, footF: 270, arm: down },
    },
    dehnBeinrueck: {
      mat: true,
      a: sit({ legF: { fk: [235, 325] }, arm: { ik: [128, 112], bend: 1 } }),
      b: sit({ torso: 55, head: 60, legF: { fk: [235, 325] }, arm: { ik: [150, 126], bend: 1 } }),
    },
  };

  return P;
})();
