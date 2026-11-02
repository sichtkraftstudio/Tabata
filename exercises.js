/* exercises.js – Übungsdatenbank, Equipment und Standard-Wochenplan.
 *
 * Eine Übung:
 *   id         eindeutiger Schlüssel (wird im Plan referenziert)
 *   name       Anzeigename
 *   group      Muskelgruppe: brust | ruecken | schultern | arme | bauch
 *   equipment  Liste von Schlüsseln aus EQUIPMENT
 *   desc       kurze Ausführungsbeschreibung
 *   tip        optional: Kernpunkte, wenn die Illustration vereinfacht ist
 *   image      optional: Bildpfad (z. B. "img/liegestuetze.webp") – ersetzt die SVG-Illustration.
 *              Fehlt die Datei, zeigt die App automatisch wieder die SVG.
 *   pose       Daten für die Vektor-Illustration (Renderer: illustrations.js)
 *
 * Pose-Format – alle Winkel in Grad und absolut (0 = nach unten, 90 = nach rechts,
 * 180 = nach oben, -90 = nach links). Die Figur schaut nach rechts.
 *   view     'side' (Profil), 'front' (von vorn) oder 'top' (von oben)
 *   frames   [Start, Ende] – eine Pose genügt für statische Haltungen
 *            x, y    Hüfte im 200×200-Feld (Boden y = 178, Mattenoberkante y = 174)
 *            t, h    Richtung Torso (Hüfte → Schulter) und Kopf
 *            a1, a2  Arme [Oberarm, Unterarm] (side: a1 = vorderer, a2 = hinterer Arm)
 *            l1, l2  Beine [Oberschenkel, Unterschenkel]
 *            statt Winkeln geht { ik: [x, y], bend: ±1 } → Hand/Fuß wird dort platziert
 *   props    mat | matTop | chair {x, flip} | door {anchor} |
 *            db {at: 'h1'|'h2'|'mid', style: 'end'|'bar'} | band {pts, w, behind}
 *   arrows   Bewegungspfeile { p: [x1, y1, (cx, cy,) x2, y2], both }
 *   zoom, ts (Torso-Länge, Vorbeuge von vorn), headTop, armsBehind
 */

const EQUIPMENT = {
  stuhl: 'Stuhl',
  matte: 'Fitnessmatte',
  kurzhanteln: 'Kurzhanteln',
  dumbbell: 'Dumbbell',
  bandKurz: 'Kurzes Theraband',
  bandLang: 'Langes Theraband',
};

const GROUPS = { brust: 'Brust', ruecken: 'Rücken', schultern: 'Schultern', arme: 'Arme', bauch: 'Bauch' };

// ---------- wiederverwendbare Posen ----------
const STAND = { x: 95, y: 100, t: 180, l1: [3, 0], l2: [-3, 0] };
const FRONT = { x: 100, y: 100, t: 180, l1: [-4, -2], l2: [4, 2] };
const SUPINE = { x: 110, y: 161, t: -90, h: -93 }; // Rückenlage, Kopf links
const KNEES_UP = { l1: { ik: [150, 168] }, l2: { ik: [146, 168] } };
const PUSH_TOP = { x: 105, y: 133, t: 117, h: 115, a1: { ik: [146, 168] }, a2: { ik: [141, 168] }, l1: [-63, -63], l2: [-64, -64] };
const PUSH_LOW = { x: 111, y: 155, t: 102, h: 100, a1: { ik: [146, 168] }, a2: { ik: [141, 168] }, l1: [-78, -78], l2: [-79, -79] };
const HINGE = { x: 85, y: 104, t: 130, h: 122, l1: { ik: [104, 169] }, l2: { ik: [97, 169] } };
const CURL = [{ ...STAND, a1: [2, 4], a2: [5, 7] }, { ...STAND, a1: [6, 150], a2: [9, 148] }];
const CURL_ARROW = [{ p: [118, 106, 138, 86, 121, 62] }];
const PUSH_ARROW = [{ p: [184, 108, 184, 142], both: true }];
const MAT = { type: 'mat' };
const DBS = (style) => [{ type: 'db', at: 'h1', style }, { type: 'db', at: 'h2', style }];

const EXERCISES = [
  // ---------- Montag ----------
  {
    id: 'liegestuetze', name: 'Liegestütze', group: 'brust', equipment: ['matte'],
    desc: 'Hände schulterbreit, Körper bildet eine gerade Linie. Brust kontrolliert Richtung Boden senken und kraftvoll hochdrücken.',
    pose: { frames: [PUSH_TOP, PUSH_LOW], props: [MAT], arrows: PUSH_ARROW },
  },
  {
    id: 'bizepsCurls', name: 'Bizeps Curls', group: 'arme', equipment: ['kurzhanteln'],
    desc: 'Aufrecht stehen, Ellbogen eng am Körper. Hanteln mit nach vorn zeigenden Handflächen zur Schulter beugen und langsam senken.',
    pose: { frames: CURL, props: DBS('end'), arrows: CURL_ARROW },
  },
  {
    id: 'crunches', name: 'Crunches', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Füße aufgestellt. Schultern mit angespanntem Bauch vom Boden lösen, der untere Rücken bleibt am Boden.',
    pose: {
      frames: [
        { ...SUPINE, ...KNEES_UP, a1: [90, 90], a2: [88, 88] },
        { ...SUPINE, ...KNEES_UP, t: -122, h: -140, a1: [102, 100], a2: [100, 98] },
      ],
      props: [MAT], arrows: [{ p: [36, 148, 30, 122, 48, 106] }],
    },
  },
  {
    id: 'trizepsDips', name: 'Trizeps Dips am Stuhl', group: 'arme', equipment: ['stuhl'],
    desc: 'Hände an der Stuhlkante, Finger nach vorn. Ellbogen nach hinten beugen, Hüfte nah am Stuhl absenken und wieder hochdrücken.',
    tip: 'Schultern weg von den Ohren. Stuhl gegen eine Wand stellen.',
    pose: {
      frames: [
        { x: 82, y: 119, t: 178, h: 180, a1: { ik: [67, 133] }, a2: { ik: [64, 133] }, l1: { ik: [132, 169] }, l2: { ik: [127, 169] } },
        { x: 84, y: 144, t: 173, h: 176, a1: { ik: [67, 133] }, a2: { ik: [64, 133] }, l1: { ik: [132, 169] }, l2: { ik: [127, 169] } },
      ],
      props: [{ type: 'chair', x: 22 }], arrows: [{ p: [46, 62, 46, 104], both: true }],
    },
  },
  {
    id: 'brustFliegenBand', name: 'Brust Fliegen mit Theraband', group: 'brust', equipment: ['bandLang'],
    desc: 'Band hinter dem Rücken auf Brusthöhe, Enden in den Händen. Arme weit öffnen und vor der Brust zusammenführen.',
    tip: 'Ellbogen leicht gebeugt, die Bewegung kommt aus der Brust.',
    pose: {
      view: 'front',
      frames: [{ ...FRONT, a1: [-95, -102], a2: [95, 102] }, { ...FRONT, a1: [-22, 68], a2: [22, -68] }],
      props: [{ type: 'band', pts: ['h1', 's1', 's2', 'h2'], w: 3.5, behind: true }],
      arrows: [{ p: [30, 78, 36, 104, 68, 110] }, { p: [170, 78, 164, 104, 132, 110] }],
    },
  },
  {
    id: 'plank', name: 'Plank', group: 'bauch', equipment: ['matte'],
    desc: 'Unterarme unter den Schultern, Körper gerade von Kopf bis Ferse. Bauch und Po fest anspannen und halten.',
    pose: { frames: [{ x: 101, y: 150, t: 104, h: 100, a1: [0, 90], a2: [2, 92], l1: [-76, -76], l2: [-77, -77] }], props: [MAT] },
  },
  {
    id: 'hammerCurls', name: 'Hammer Curls', group: 'arme', equipment: ['kurzhanteln'],
    desc: 'Handflächen zeigen zueinander (Hammergriff). Ellbogen am Körper, Hanteln zur Schulter beugen und kontrolliert senken.',
    pose: { frames: CURL, props: DBS('bar'), arrows: CURL_ARROW },
  },
  {
    id: 'beinhebenLiegend', name: 'Beinheben liegend', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Hände neben dem Po. Gestreckte Beine bis senkrecht heben und langsam absenken, ohne den Boden zu berühren.',
    tip: 'Der untere Rücken bleibt am Boden.',
    pose: {
      frames: [
        { ...SUPINE, x: 100, a1: [88, 88], a2: [86, 86], l1: [95, 95], l2: [97, 97] },
        { ...SUPINE, x: 100, a1: [88, 88], a2: [86, 86], l1: [178, 178], l2: [176, 176] },
      ],
      props: [MAT], arrows: [{ p: [172, 138, 168, 98, 128, 88] }],
    },
  },

  // ---------- Dienstag ----------
  {
    id: 'rudernVorgebeugt', name: 'Rudern vorgebeugt', group: 'ruecken', equipment: ['kurzhanteln'],
    desc: 'Knie leicht gebeugt, Oberkörper mit geradem Rücken vorneigen. Hanteln zum Bauchnabel ziehen, Schulterblätter zusammen.',
    pose: {
      frames: [{ ...HINGE, a1: [2, 0], a2: [4, 2] }, { ...HINGE, a1: [-72, -2], a2: [-70, 0] }],
      props: DBS('end'), arrows: [{ p: [130, 130, 130, 108, 108, 98] }],
    },
  },
  {
    id: 'russianTwists', name: 'Russian Twists', group: 'bauch', equipment: ['matte', 'dumbbell'],
    desc: 'Sitzen, Oberkörper leicht zurückgelehnt, Füße angehoben. Hantel mit beiden Händen von einer Hüftseite zur anderen führen.',
    tip: 'Rotation aus dem Oberkörper, Rücken gerade, Blick folgt der Hantel.',
    pose: {
      view: 'front',
      frames: [
        { x: 100, y: 164, t: 172, h: 176, a1: { ik: [72, 152] }, a2: { ik: [78, 154] }, l1: [-150, -25], l2: [150, 25] },
        { x: 100, y: 164, t: 188, h: 184, a1: { ik: [122, 154] }, a2: { ik: [128, 152] }, l1: [-150, -25], l2: [150, 25] },
      ],
      props: [MAT, { type: 'db', at: 'h1', style: 'bar' }], arrows: [{ p: [62, 70, 100, 50, 138, 70], both: true }],
    },
  },
  {
    id: 'rudernSitzendBand', name: 'Rudern sitzend mit Theraband', group: 'ruecken', equipment: ['matte', 'bandLang'],
    desc: 'Sitzen mit gestreckten Beinen, Band um die Füße. Enden zum Bauch ziehen, Ellbogen nah am Körper, Brust raus.',
    pose: {
      frames: [
        { x: 52, y: 166, t: 170, h: 168, a1: [68, 74], a2: [66, 72], l1: [89, 89], l2: [90, 90] },
        { x: 52, y: 166, t: 184, h: 182, a1: [-14, 88], a2: [-12, 86], l1: [89, 89], l2: [90, 90] },
      ],
      props: [MAT, { type: 'band', pts: ['h1', 'f1'], w: 3.5 }], arrows: [{ p: [114, 118, 84, 118] }],
    },
  },
  {
    id: 'bizepsCurlsBandKurz', name: 'Bizeps Curls mit kurzem Band', group: 'arme', equipment: ['bandKurz'],
    desc: 'Mit einem Fuß in die Bandschlaufe stellen. Ellbogen am Körper fixieren und das Band zur Schulter beugen.',
    pose: { frames: CURL, props: [{ type: 'band', pts: ['h1', 'f1'], w: 6 }], arrows: CURL_ARROW },
  },
  {
    id: 'bicycleCrunches', name: 'Bicycle Crunches', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Hände am Hinterkopf. Abwechselnd Ellbogen zum gegenüberliegenden Knie führen, das andere Bein strecken.',
    tip: 'Nicht am Kopf ziehen, die Rotation kommt aus dem Bauch.',
    pose: {
      frames: [
        { x: 105, y: 161, t: -118, h: -132, a1: { ik: [47, 127], bend: 1 }, a2: { ik: [50, 124], bend: 1 }, l1: [-158, 96], l2: [100, 100] },
        { x: 105, y: 161, t: -118, h: -132, a1: { ik: [47, 127], bend: 1 }, a2: { ik: [50, 124], bend: 1 }, l1: [100, 100], l2: [-158, 96] },
      ],
      props: [MAT],
    },
  },
  {
    id: 'trizepsKickbacks', name: 'Trizeps Kickbacks', group: 'arme', equipment: ['kurzhanteln'],
    desc: 'Oberkörper vorgeneigt, Oberarme eng am Körper. Unterarme nach hinten strecken, nur der Ellbogen bewegt sich.',
    pose: {
      frames: [{ ...HINGE, t: 125, h: 118, a1: [-58, 0], a2: [-56, 2] }, { ...HINGE, t: 125, h: 118, a1: [-58, -62], a2: [-56, -60] }],
      props: DBS('bar'), arrows: [{ p: [102, 128, 80, 134, 70, 114] }],
    },
  },
  {
    id: 'superman', name: 'Superman', group: 'ruecken', equipment: ['matte'],
    desc: 'Bauchlage, Arme nach vorn gestreckt. Arme, Brust und Beine gleichzeitig leicht anheben, kurz halten und ablegen.',
    tip: 'Blick zum Boden, Nacken lang.',
    pose: {
      zoom: 0.85,
      frames: [
        { x: 94, y: 161, t: 90, h: 93, a1: [96, 96], a2: [97, 97], l1: [-87, -87], l2: [-88, -88] },
        { x: 94, y: 161, t: 100, h: 108, a1: [112, 112], a2: [113, 113], l1: [-101, -101], l2: [-100, -100] },
      ],
      props: [MAT], arrows: [{ p: [188, 150, 188, 124] }, { p: [12, 150, 12, 124] }],
    },
  },
  {
    id: 'mountainClimbers', name: 'Mountain Climbers', group: 'bauch', equipment: ['matte'],
    desc: 'Hoher Stütz, Hände unter den Schultern. Knie im Wechsel zügig Richtung Brust ziehen, die Hüfte bleibt tief.',
    pose: {
      frames: [{ ...PUSH_TOP, l1: { ik: [121, 158] }, l2: [-63, -63] }, { ...PUSH_TOP, l1: [-64, -64], l2: { ik: [118, 158] } }],
      props: [MAT],
    },
  },

  // ---------- Mittwoch ----------
  {
    id: 'schulterdruecken', name: 'Schulterdrücken', group: 'schultern', equipment: ['kurzhanteln'],
    desc: 'Hanteln auf Schulterhöhe, Ellbogen unter den Händen. Über den Kopf strecken und kontrolliert zurück auf Schulterhöhe.',
    pose: {
      view: 'front', zoom: 0.85,
      frames: [{ ...FRONT, a1: [-90, -178], a2: [90, 178] }, { ...FRONT, a1: [-166, -174], a2: [166, 174] }],
      props: DBS('bar'), arrows: [{ p: [36, 70, 36, 30] }, { p: [164, 70, 164, 30] }],
    },
  },
  {
    id: 'seitheben', name: 'Seitheben', group: 'schultern', equipment: ['kurzhanteln'],
    desc: 'Arme leicht gebeugt seitlich bis auf Schulterhöhe heben und langsam senken. Schultern tief, kein Schwung.',
    pose: {
      view: 'front',
      frames: [{ ...FRONT, a1: [-8, -10], a2: [8, 10] }, { ...FRONT, a1: [-86, -90], a2: [86, 90] }],
      props: DBS('end'), arrows: [{ p: [66, 136, 36, 126, 28, 92] }, { p: [134, 136, 164, 126, 172, 92] }],
    },
  },
  {
    id: 'trizepsUeberkopf', name: 'Trizeps Überkopf Drücken', group: 'arme', equipment: ['dumbbell'],
    desc: 'Hantel mit beiden Händen über dem Kopf. Unterarme hinter den Kopf senken, Oberarme bleiben neben den Ohren, wieder strecken.',
    tip: 'Ellbogen zeigen nach oben, Bauch fest.',
    pose: {
      view: 'front', zoom: 0.85, armsBehind: true,
      frames: [
        { ...FRONT, a1: { ik: [96, 34], bend: 1 }, a2: { ik: [104, 34], bend: -1 } },
        { ...FRONT, a1: { ik: [97, 3] }, a2: { ik: [103, 3] } },
      ],
      props: [{ type: 'db', at: 'mid', behind: true }], arrows: [{ p: [150, 52, 150, 14] }],
    },
  },
  {
    id: 'facePulls', name: 'Face Pulls mit Theraband', group: 'schultern', equipment: ['bandLang'],
    desc: 'Band auf Kopfhöhe vor dir befestigen (z. B. Türanker). Enden Richtung Gesicht ziehen, Ellbogen hoch und weit nach außen.',
    tip: 'Am Ende Schulterblätter zusammenziehen.',
    pose: {
      frames: [{ ...STAND, x: 72, a1: [96, 96], a2: [97, 97] }, { ...STAND, x: 72, a1: [-96, 122], a2: [-94, 120] }],
      props: [{ type: 'door', anchor: [185, 52] }, { type: 'band', pts: ['h1', [185, 52]], w: 3.5 }],
      arrows: [{ p: [162, 34, 130, 34] }],
    },
  },
  {
    id: 'seitstuetz', name: 'Seitlicher Unterarmstütz', group: 'bauch', equipment: ['matte'],
    desc: 'Seitlich auf dem Unterarm stützen, Ellbogen unter der Schulter. Hüfte anheben und den Körper gerade halten. Seite zur Hälfte wechseln.',
    pose: { view: 'front', frames: [{ x: 99, y: 143, t: 110, h: 108, a1: [180, 180], a2: [0, 90], l1: [-71, -71], l2: [-73, -73] }], props: [MAT] },
  },
  {
    id: 'konzentrationsCurls', name: 'Konzentrations Curls am Stuhl', group: 'arme', equipment: ['stuhl', 'dumbbell'],
    desc: 'Auf der Stuhlkante sitzen, Ellbogen innen am Oberschenkel abstützen. Hantel langsam zur Schulter beugen und senken. Arm zur Hälfte wechseln.',
    pose: {
      frames: [
        { x: 56, y: 130, t: 146, h: 140, a1: [0, 6], a2: { ik: [94, 127] }, l1: [84, 0], l2: [82, -2] },
        { x: 56, y: 130, t: 146, h: 140, a1: [0, 152], a2: { ik: [94, 127] }, l1: [84, 0], l2: [82, -2] },
      ],
      props: [{ type: 'chair', x: 20 }, { type: 'db', at: 'h1' }], arrows: [{ p: [106, 150, 120, 128, 106, 104] }],
    },
  },
  {
    id: 'deadBug', name: 'Dead Bug', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Arme senkrecht, Beine 90 Grad angewinkelt. Gegengleich einen Arm und das andere Bein strecken, zurück, Seite wechseln.',
    tip: 'Der untere Rücken bleibt fest am Boden.',
    pose: {
      zoom: 0.85,
      frames: [
        { ...SUPINE, a1: [180, 180], a2: [178, 178], l1: [180, 90], l2: [178, 88] },
        { ...SUPINE, a1: [-100, -100], a2: [178, 178], l1: [180, 90], l2: [100, 100] },
      ],
      props: [MAT],
    },
  },
  {
    id: 'liegestuetzeKnie', name: 'Liegestütze auf Knien', group: 'brust', equipment: ['matte'],
    desc: 'Wie Liegestütze, aber auf den Knien. Gerade Linie von Knie bis Kopf, Brust kontrolliert zum Boden senken.',
    pose: {
      frames: [
        { x: 99, y: 143, t: 129, h: 126, a1: { ik: [136, 168] }, a2: { ik: [131, 168] }, l1: [-51, -135], l2: [-52, -133] },
        { x: 105, y: 155, t: 107, h: 104, a1: { ik: [136, 168] }, a2: { ik: [131, 168] }, l1: [-73, -135], l2: [-74, -133] },
      ],
      props: [MAT], arrows: [{ p: [172, 110, 172, 142], both: true }],
    },
  },

  // ---------- Donnerstag ----------
  {
    id: 'brustdrueckenLiegend', name: 'Brustdrücken liegend', group: 'brust', equipment: ['matte', 'kurzhanteln'],
    desc: 'Rückenlage, Füße aufgestellt. Hanteln über der Brust strecken und senken, bis die Oberarme den Boden berühren.',
    pose: {
      frames: [
        { ...SUPINE, ...KNEES_UP, a1: { ik: [72, 136] }, a2: { ik: [70, 138] } },
        { ...SUPINE, ...KNEES_UP, a1: { ik: [70, 106] }, a2: { ik: [68, 106] } },
      ],
      props: [MAT, ...DBS('end')], arrows: [{ p: [46, 132, 46, 104] }],
    },
  },
  {
    id: 'situps', name: 'Sit ups', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Füße aufgestellt. Oberkörper komplett aufrichten und langsam Wirbel für Wirbel wieder ablegen.',
    pose: {
      frames: [
        { ...SUPINE, ...KNEES_UP, a1: [90, 90], a2: [88, 88] },
        { ...SUPINE, ...KNEES_UP, t: -188, h: -196, a1: [94, 92], a2: [92, 90] },
      ],
      props: [MAT], arrows: [{ p: [36, 146, 38, 108, 80, 94] }],
    },
  },
  {
    id: 'diamantLiegestuetze', name: 'Diamant Liegestütze', group: 'brust', equipment: ['matte'],
    desc: 'Hände unter der Brust, Daumen und Zeigefinger bilden eine Raute. Ellbogen eng am Körper beugen und hochdrücken.',
    tip: 'Trainiert Brust und Trizeps. Zu schwer? Auf den Knien ausführen.',
    pose: {
      frames: [{ ...PUSH_TOP, a1: { ik: [140, 168] }, a2: { ik: [138, 168] } }, { ...PUSH_LOW, a1: { ik: [140, 168] }, a2: { ik: [138, 168] } }],
      props: [MAT], arrows: PUSH_ARROW,
    },
  },
  {
    id: 'beinheberScheren', name: 'Beinheber Scheren', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Beine gestreckt knapp über dem Boden. Beine im Wechsel in kleinen Scherenbewegungen auf und ab führen.',
    pose: {
      frames: [
        { ...SUPINE, x: 100, h: -96, a1: [86, 86], a2: [85, 85], l1: [116, 116], l2: [100, 100] },
        { ...SUPINE, x: 100, h: -96, a1: [86, 86], a2: [85, 85], l1: [100, 100], l2: [116, 116] },
      ],
      props: [MAT], arrows: [{ p: [186, 118, 186, 150], both: true }],
    },
  },
  {
    id: 'brustdrueckenBand', name: 'Brustdrücken stehend mit Theraband', group: 'brust', equipment: ['bandLang'],
    desc: 'Band um den oberen Rücken legen, Enden auf Brusthöhe. Arme nach vorn strecken und langsam zurückführen.',
    pose: {
      frames: [
        { ...STAND, l1: [14, 4], l2: [-12, -4], a1: { ik: [113, 68] }, a2: { ik: [111, 70] } },
        { ...STAND, l1: [14, 4], l2: [-12, -4], a1: { ik: [150, 62] }, a2: { ik: [148, 64] } },
      ],
      props: [{ type: 'band', pts: ['h1', { k: 's1', dx: -16, dy: 6 }], w: 3.5, behind: true }],
      arrows: [{ p: [126, 44, 156, 44] }],
    },
  },
  {
    id: 'bizepsCurlsBandLang', name: 'Bizeps Curls mit langem Band', group: 'arme', equipment: ['bandLang'],
    desc: 'Mit beiden Füßen mittig auf das Band stellen. Enden mit Ellbogen am Körper zur Schulter beugen.',
    pose: {
      frames: CURL,
      props: [{ type: 'band', pts: ['h1', 'f1'], w: 3.5 }, { type: 'band', pts: ['h2', 'f2'], w: 3.5, behind: true }],
      arrows: CURL_ARROW,
    },
  },
  {
    id: 'plankSchulter', name: 'Plank mit Schulterberührung', group: 'bauch', equipment: ['matte'],
    desc: 'Hoher Stütz, Füße etwas breiter. Im Wechsel mit einer Hand die gegenüberliegende Schulter berühren, Hüfte ruhig halten.',
    pose: { frames: [PUSH_TOP, { ...PUSH_TOP, a1: { ik: [138, 124] } }], props: [MAT] },
  },

  // ---------- Freitag ----------
  {
    id: 'rudernEinarmig', name: 'Einarmiges Rudern', group: 'ruecken', equipment: ['dumbbell', 'stuhl'],
    desc: 'Eine Hand auf dem Stuhl, Rücken gerade. Hantel mit der freien Hand zur Hüfte ziehen, Ellbogen eng. Seite zur Hälfte wechseln.',
    pose: {
      frames: [
        { x: 70, y: 104, t: 112, h: 106, a1: [0, 0], a2: { ik: [140, 133] }, l1: { ik: [98, 169] }, l2: { ik: [38, 169] } },
        { x: 70, y: 104, t: 112, h: 106, a1: [-68, -2], a2: { ik: [140, 133] }, l1: { ik: [98, 169] }, l2: { ik: [38, 169] } },
      ],
      props: [{ type: 'chair', x: 132, flip: true }, { type: 'db', at: 'h1', style: 'bar' }],
      arrows: [{ p: [124, 140, 122, 114, 100, 104] }],
    },
  },
  {
    id: 'reverseCurls', name: 'Reverse Curls', group: 'arme', equipment: ['kurzhanteln'],
    desc: 'Hanteln im Obergriff (Handrücken oben). Ellbogen am Körper, zur Schulter beugen und langsam senken. Stärkt auch die Unterarme.',
    pose: { frames: CURL, props: DBS('end'), arrows: CURL_ARROW },
  },
  {
    id: 'latZugBand', name: 'Lat Zug mit Theraband', group: 'ruecken', equipment: ['bandLang'],
    desc: 'Band über dem Kopf gespannt halten. Ellbogen nach unten neben den Körper ziehen, Band hinter den Kopf, wieder strecken.',
    tip: 'Schulterblätter nach unten ziehen, Brust raus.',
    pose: {
      view: 'front', zoom: 0.85,
      frames: [{ ...FRONT, a1: [-160, -166], a2: [160, 166] }, { ...FRONT, a1: [-40, -172], a2: [40, 172] }],
      props: [{ type: 'band', pts: ['h1', 'h2'], w: 3.5, behind: true }],
      arrows: [{ p: [30, 28, 30, 66] }, { p: [170, 28, 170, 66] }],
    },
  },
  {
    id: 'trizepsPushdown', name: 'Trizeps Pushdown mit Theraband', group: 'arme', equipment: ['bandLang'],
    desc: 'Band oben an der Tür befestigen. Ellbogen am Körper, Unterarme nach unten strecken und kontrolliert zurückführen.',
    pose: {
      frames: [{ ...STAND, x: 88, a1: [4, 128], a2: [6, 126] }, { ...STAND, x: 88, a1: [4, 6], a2: [6, 8] }],
      props: [{ type: 'door', anchor: [185, 14] }, { type: 'band', pts: ['h1', [185, 14]], w: 3.5 }],
      arrows: [{ p: [124, 74, 126, 112] }],
    },
  },
  {
    id: 'beinhebenStuhl', name: 'Beinheben auf dem Stuhl', group: 'bauch', equipment: ['stuhl'],
    desc: 'Auf der Stuhlkante sitzen, Hände an der Sitzfläche, leicht zurücklehnen. Knie zur Brust ziehen und die Beine wieder strecken.',
    pose: {
      frames: [
        { x: 58, y: 130, t: -170, h: -174, a1: { ik: [66, 134] }, a2: { ik: [63, 134] }, l1: [97, 94], l2: [95, 92] },
        { x: 58, y: 130, t: -170, h: -174, a1: { ik: [66, 134] }, a2: { ik: [63, 134] }, l1: [148, 30], l2: [146, 28] },
      ],
      props: [{ type: 'chair', x: 18 }], arrows: [{ p: [150, 108, 136, 86, 108, 88] }],
    },
  },
  {
    id: 'hollowHold', name: 'Hollow Hold', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Arme über dem Kopf. Schultern und gestreckte Beine anheben, der Körper bildet eine flache Schale. Halten.',
    tip: 'Der untere Rücken bleibt fest am Boden.',
    pose: { zoom: 0.85, frames: [{ x: 100, y: 160, t: -112, h: -118, a1: [-106, -106], a2: [-105, -105], l1: [106, 106], l2: [105, 105] }], props: [MAT] },
  },
  {
    id: 'reverseFlys', name: 'Reverse Flys', group: 'ruecken', equipment: ['kurzhanteln'],
    desc: 'Oberkörper weit vorgebeugt, Rücken gerade. Arme leicht gebeugt seitlich bis auf Schulterhöhe öffnen und langsam senken.',
    tip: 'Ansicht von vorn auf den vorgebeugten Oberkörper. Bewegung aus den Schulterblättern.',
    pose: {
      view: 'front', ts: 0.6, headTop: true,
      frames: [{ ...FRONT, l1: [-6, 4], l2: [6, -4], a1: [-4, -6], a2: [4, 6] }, { ...FRONT, l1: [-6, 4], l2: [6, -4], a1: [-82, -88], a2: [82, 88] }],
      props: DBS('end'), arrows: [{ p: [70, 150, 40, 140, 30, 104] }, { p: [130, 150, 160, 140, 170, 104] }],
    },
  },
  {
    id: 'scheibenwischer', name: 'Scheibenwischer', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Arme seitlich, Beine senkrecht nach oben. Beine geschlossen langsam zu einer Seite senken, zurück, andere Seite.',
    tip: 'Ansicht von oben. Die Schultern bleiben am Boden.',
    pose: {
      view: 'top',
      frames: [
        { x: 100, y: 110, t: 178, h: 180, a1: [-90, -90], a2: [90, 90], l1: [-52, -52], l2: [-46, -46] },
        { x: 100, y: 110, t: 182, h: 180, a1: [-90, -90], a2: [90, 90], l1: [46, 46], l2: [52, 52] },
      ],
      props: [{ type: 'matTop' }], arrows: [{ p: [50, 176, 100, 196, 150, 176], both: true }],
    },
  },
];

/* Wochenplan: Index 0 = Montag … 6 = Sonntag. type 'training' oder 'rest'. */
const DEFAULT_PLAN = [
  { type: 'training', focus: 'Brust & Arme', exercises: ['liegestuetze', 'bizepsCurls', 'crunches', 'trizepsDips', 'brustFliegenBand', 'plank', 'hammerCurls', 'beinhebenLiegend'] },
  { type: 'training', focus: 'Rücken & Bauch', exercises: ['rudernVorgebeugt', 'russianTwists', 'rudernSitzendBand', 'bizepsCurlsBandKurz', 'bicycleCrunches', 'trizepsKickbacks', 'superman', 'mountainClimbers'] },
  { type: 'training', focus: 'Schultern & Arme', exercises: ['schulterdruecken', 'seitheben', 'trizepsUeberkopf', 'facePulls', 'seitstuetz', 'konzentrationsCurls', 'deadBug', 'liegestuetzeKnie'] },
  { type: 'training', focus: 'Brust & Bauch', exercises: ['brustdrueckenLiegend', 'situps', 'diamantLiegestuetze', 'beinheberScheren', 'brustdrueckenBand', 'bizepsCurlsBandLang', 'plankSchulter', 'trizepsDips'] },
  { type: 'training', focus: 'Rücken & Arme', exercises: ['rudernEinarmig', 'reverseCurls', 'latZugBand', 'trizepsPushdown', 'beinhebenStuhl', 'hollowHold', 'reverseFlys', 'scheibenwischer'] },
  { type: 'rest', focus: 'Erholung', exercises: [] },
  { type: 'rest', focus: 'Erholung', exercises: [] },
];
