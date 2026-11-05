/* exercises.js – Übungsdatenbank, Equipment und Standard-Wochenplan.
 *
 * Eine Übung:
 *   id         eindeutiger Schlüssel (wird im Plan referenziert)
 *   name       Anzeigename
 *   group      Muskelgruppe: brust | ruecken | schultern | arme | bauch
 *   equipment  Liste von Schlüsseln aus EQUIPMENT
 *   desc       Ausführungsbeschreibung (im Training wird nur der erste Satz gezeigt)
 *   tip        optional: Kernpunkt, erscheint in den Übungsdetails
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

const EXERCISES = [
  // ---------- Montag ----------
  {
    id: 'liegestuetze', name: 'Liegestütze', group: 'brust', equipment: ['matte'],
    desc: 'Hände schulterbreit, Körper bildet eine gerade Linie. Brust kontrolliert Richtung Boden senken und kraftvoll hochdrücken.',
  },
  {
    id: 'bizepsCurls', name: 'Bizeps Curls', group: 'arme', equipment: ['kurzhanteln'],
    desc: 'Aufrecht stehen, Ellbogen eng am Körper. Hanteln mit nach vorn zeigenden Handflächen zur Schulter beugen und langsam senken.',
  },
  {
    id: 'crunches', name: 'Crunches', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Füße aufgestellt. Schultern mit angespanntem Bauch vom Boden lösen, der untere Rücken bleibt am Boden.',
  },
  {
    id: 'trizepsDips', name: 'Trizeps Dips am Stuhl', group: 'arme', equipment: ['stuhl'],
    desc: 'Hände an der Stuhlkante, Finger nach vorn. Ellbogen nach hinten beugen, Hüfte nah am Stuhl absenken und wieder hochdrücken.',
    tip: 'Schultern weg von den Ohren. Stuhl gegen eine Wand stellen.',
  },
  {
    id: 'brustFliegenBand', name: 'Brust Fliegen mit Theraband', group: 'brust', equipment: ['bandLang'],
    desc: 'Band hinter dem Rücken auf Brusthöhe, Enden in den Händen. Arme weit öffnen und vor der Brust zusammenführen.',
    tip: 'Ellbogen leicht gebeugt, die Bewegung kommt aus der Brust.',
  },
  {
    id: 'plank', name: 'Plank', group: 'bauch', equipment: ['matte'],
    desc: 'Unterarme unter den Schultern, Körper gerade von Kopf bis Ferse. Bauch und Po fest anspannen und halten.',
  },
  {
    id: 'hammerCurls', name: 'Hammer Curls', group: 'arme', equipment: ['kurzhanteln'],
    desc: 'Handflächen zeigen zueinander (Hammergriff). Ellbogen am Körper, Hanteln zur Schulter beugen und kontrolliert senken.',
  },
  {
    id: 'beinhebenLiegend', name: 'Beinheben liegend', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Hände neben dem Po. Gestreckte Beine bis senkrecht heben und langsam absenken, ohne den Boden zu berühren.',
    tip: 'Der untere Rücken bleibt am Boden.',
  },

  // ---------- Dienstag ----------
  {
    id: 'rudernVorgebeugt', name: 'Rudern vorgebeugt', group: 'ruecken', equipment: ['kurzhanteln'],
    desc: 'Knie leicht gebeugt, Oberkörper mit geradem Rücken vorneigen. Hanteln zum Bauchnabel ziehen, Schulterblätter zusammen.',
  },
  {
    id: 'russianTwists', name: 'Russian Twists', group: 'bauch', equipment: ['matte', 'dumbbell'],
    desc: 'Sitzen, Oberkörper leicht zurückgelehnt, Füße angehoben. Hantel mit beiden Händen von einer Hüftseite zur anderen führen.',
    tip: 'Rotation aus dem Oberkörper, Rücken gerade, Blick folgt der Hantel.',
  },
  {
    id: 'rudernSitzendBand', name: 'Rudern sitzend mit Theraband', group: 'ruecken', equipment: ['matte', 'bandLang'],
    desc: 'Sitzen mit gestreckten Beinen, Band um die Füße. Enden zum Bauch ziehen, Ellbogen nah am Körper, Brust raus.',
  },
  {
    id: 'bizepsCurlsBandKurz', name: 'Bizeps Curls mit kurzem Band', group: 'arme', equipment: ['bandKurz'],
    desc: 'Mit einem Fuß in die Bandschlaufe stellen. Ellbogen am Körper fixieren und das Band zur Schulter beugen.',
  },
  {
    id: 'bicycleCrunches', name: 'Bicycle Crunches', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Hände am Hinterkopf. Abwechselnd Ellbogen zum gegenüberliegenden Knie führen, das andere Bein strecken.',
    tip: 'Nicht am Kopf ziehen, die Rotation kommt aus dem Bauch.',
  },
  {
    id: 'trizepsKickbacks', name: 'Trizeps Kickbacks', group: 'arme', equipment: ['kurzhanteln'],
    desc: 'Oberkörper vorgeneigt, Oberarme eng am Körper. Unterarme nach hinten strecken, nur der Ellbogen bewegt sich.',
  },
  {
    id: 'superman', name: 'Superman', group: 'ruecken', equipment: ['matte'],
    desc: 'Bauchlage, Arme nach vorn gestreckt. Arme, Brust und Beine gleichzeitig leicht anheben, kurz halten und ablegen.',
    tip: 'Blick zum Boden, Nacken lang.',
  },
  {
    id: 'mountainClimbers', name: 'Mountain Climbers', group: 'bauch', equipment: ['matte'],
    desc: 'Hoher Stütz, Hände unter den Schultern. Knie im Wechsel zügig Richtung Brust ziehen, die Hüfte bleibt tief.',
  },

  // ---------- Mittwoch ----------
  {
    id: 'schulterdruecken', name: 'Schulterdrücken', group: 'schultern', equipment: ['kurzhanteln'],
    desc: 'Hanteln auf Schulterhöhe, Ellbogen unter den Händen. Über den Kopf strecken und kontrolliert zurück auf Schulterhöhe.',
  },
  {
    id: 'seitheben', name: 'Seitheben', group: 'schultern', equipment: ['kurzhanteln'],
    desc: 'Arme leicht gebeugt seitlich bis auf Schulterhöhe heben und langsam senken. Schultern tief, kein Schwung.',
  },
  {
    id: 'trizepsUeberkopf', name: 'Trizeps Überkopf Drücken', group: 'arme', equipment: ['dumbbell'],
    desc: 'Hantel mit beiden Händen über dem Kopf. Unterarme hinter den Kopf senken, Oberarme bleiben neben den Ohren, wieder strecken.',
    tip: 'Ellbogen zeigen nach oben, Bauch fest.',
  },
  {
    id: 'facePulls', name: 'Face Pulls mit Theraband', group: 'schultern', equipment: ['bandLang'],
    desc: 'Band auf Kopfhöhe vor dir befestigen (z. B. Türanker). Enden Richtung Gesicht ziehen, Ellbogen hoch und weit nach außen.',
    tip: 'Am Ende Schulterblätter zusammenziehen.',
  },
  {
    id: 'seitstuetz', name: 'Seitlicher Unterarmstütz', group: 'bauch', equipment: ['matte'],
    desc: 'Seitlich auf dem Unterarm stützen, Ellbogen unter der Schulter. Hüfte anheben und den Körper gerade halten. Seite zur Hälfte wechseln.',
  },
  {
    id: 'konzentrationsCurls', name: 'Konzentrations Curls am Stuhl', group: 'arme', equipment: ['stuhl', 'dumbbell'],
    desc: 'Auf der Stuhlkante sitzen, Ellbogen innen am Oberschenkel abstützen. Hantel langsam zur Schulter beugen und senken. Arm zur Hälfte wechseln.',
  },
  {
    id: 'deadBug', name: 'Dead Bug', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Arme senkrecht, Beine 90 Grad angewinkelt. Gegengleich einen Arm und das andere Bein strecken, zurück, Seite wechseln.',
    tip: 'Der untere Rücken bleibt fest am Boden.',
  },
  {
    id: 'liegestuetzeKnie', name: 'Liegestütze auf Knien', group: 'brust', equipment: ['matte'],
    desc: 'Wie Liegestütze, aber auf den Knien. Gerade Linie von Knie bis Kopf, Brust kontrolliert zum Boden senken.',
  },

  // ---------- Donnerstag ----------
  {
    id: 'brustdrueckenLiegend', name: 'Brustdrücken liegend', group: 'brust', equipment: ['matte', 'kurzhanteln'],
    desc: 'Rückenlage, Füße aufgestellt. Hanteln über der Brust strecken und senken, bis die Oberarme den Boden berühren.',
  },
  {
    id: 'situps', name: 'Sit ups', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Füße aufgestellt. Oberkörper komplett aufrichten und langsam Wirbel für Wirbel wieder ablegen.',
  },
  {
    id: 'diamantLiegestuetze', name: 'Diamant Liegestütze', group: 'brust', equipment: ['matte'],
    desc: 'Hände unter der Brust, Daumen und Zeigefinger bilden eine Raute. Ellbogen eng am Körper beugen und hochdrücken.',
    tip: 'Trainiert Brust und Trizeps. Zu schwer? Auf den Knien ausführen.',
  },
  {
    id: 'beinheberScheren', name: 'Beinheber Scheren', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Beine gestreckt knapp über dem Boden. Beine im Wechsel in kleinen Scherenbewegungen auf und ab führen.',
  },
  {
    id: 'brustdrueckenBand', name: 'Brustdrücken stehend mit Theraband', group: 'brust', equipment: ['bandLang'],
    desc: 'Band um den oberen Rücken legen, Enden auf Brusthöhe. Arme nach vorn strecken und langsam zurückführen.',
  },
  {
    id: 'bizepsCurlsBandLang', name: 'Bizeps Curls mit langem Band', group: 'arme', equipment: ['bandLang'],
    desc: 'Mit beiden Füßen mittig auf das Band stellen. Enden mit Ellbogen am Körper zur Schulter beugen.',
  },
  {
    id: 'plankSchulter', name: 'Plank mit Schulterberührung', group: 'bauch', equipment: ['matte'],
    desc: 'Hoher Stütz, Füße etwas breiter. Im Wechsel mit einer Hand die gegenüberliegende Schulter berühren, Hüfte ruhig halten.',
  },

  // ---------- Freitag ----------
  {
    id: 'rudernEinarmig', name: 'Einarmiges Rudern', group: 'ruecken', equipment: ['dumbbell', 'stuhl'],
    desc: 'Eine Hand auf dem Stuhl, Rücken gerade. Hantel mit der freien Hand zur Hüfte ziehen, Ellbogen eng. Seite zur Hälfte wechseln.',
  },
  {
    id: 'reverseCurls', name: 'Reverse Curls', group: 'arme', equipment: ['kurzhanteln'],
    desc: 'Hanteln im Obergriff (Handrücken oben). Ellbogen am Körper, zur Schulter beugen und langsam senken. Stärkt auch die Unterarme.',
  },
  {
    id: 'latZugBand', name: 'Lat Zug mit Theraband', group: 'ruecken', equipment: ['bandLang'],
    desc: 'Band über dem Kopf gespannt halten. Ellbogen nach unten neben den Körper ziehen, Band hinter den Kopf, wieder strecken.',
    tip: 'Schulterblätter nach unten ziehen, Brust raus.',
  },
  {
    id: 'trizepsPushdown', name: 'Trizeps Pushdown mit Theraband', group: 'arme', equipment: ['bandLang'],
    desc: 'Band oben an der Tür befestigen. Ellbogen am Körper, Unterarme nach unten strecken und kontrolliert zurückführen.',
  },
  {
    id: 'beinhebenStuhl', name: 'Beinheben auf dem Stuhl', group: 'bauch', equipment: ['stuhl'],
    desc: 'Auf der Stuhlkante sitzen, Hände an der Sitzfläche, leicht zurücklehnen. Knie zur Brust ziehen und die Beine wieder strecken.',
  },
  {
    id: 'hollowHold', name: 'Hollow Hold', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Arme über dem Kopf. Schultern und gestreckte Beine anheben, der Körper bildet eine flache Schale. Halten.',
    tip: 'Der untere Rücken bleibt fest am Boden.',
  },
  {
    id: 'reverseFlys', name: 'Reverse Flys', group: 'ruecken', equipment: ['kurzhanteln'],
    desc: 'Oberkörper weit vorgebeugt, Rücken gerade. Arme leicht gebeugt seitlich bis auf Schulterhöhe öffnen und langsam senken.',
    tip: 'Ansicht von vorn auf den vorgebeugten Oberkörper. Bewegung aus den Schulterblättern.',
  },
  {
    id: 'scheibenwischer', name: 'Scheibenwischer', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Arme seitlich, Beine senkrecht nach oben. Beine geschlossen langsam zu einer Seite senken, zurück, andere Seite.',
    tip: 'Ansicht von oben. Die Schultern bleiben am Boden.',
  },
];

/* Feste Abläufe für Laufen und Dehnen: nicht in der Übungsbibliothek, aber im Verlauf auffindbar (EX in app.js).
 * Kraft nutzt dieselben Übungen wie Tabata. group 'lauf' / 'dehnen' entspricht dem Schlüssel in T.mode. */
const RUN = {
  id: 'lauf', name: 'Laufen & Gehen', group: 'lauf', equipment: [],
  desc: 'Locker laufen, in den Pausen zügig gehen – im Wechsel, so wie es der Timer vorgibt.',
  tip: 'Du solltest dich beim Laufen noch unterhalten können.',
};
const STRETCHES = [
  { id: 'dehnBrust', name: 'Brust öffnen', desc: 'Hände hinter dem Rücken verschränken, Arme anheben und die Brust weit öffnen.' },
  { id: 'dehnSchulter', name: 'Schulter dehnen', desc: 'Einen Arm quer vor die Brust ziehen und halten, nach der Hälfte die Seite wechseln.' },
  { id: 'dehnTrizeps', name: 'Trizeps dehnen', desc: 'Ellbogen hinter den Kopf, mit der anderen Hand sanft drücken, nach der Hälfte die Seite wechseln.' },
  { id: 'dehnNacken', name: 'Nacken lockern', desc: 'Ohr langsam zur Schulter neigen, die andere Schulter locker lassen, nach der Hälfte die Seite wechseln.' },
  { id: 'dehnKatzeKuh', name: 'Katze und Kuh', desc: 'Im Vierfüßlerstand den Rücken abwechselnd rund und hohl machen, ruhig atmen.' },
  { id: 'dehnKind', name: 'Kindhaltung', desc: 'Gesäß auf die Fersen setzen, Arme nach vorn strecken, Stirn ablegen und tief atmen.' },
  { id: 'dehnHueftbeuger', name: 'Hüfte dehnen', desc: 'Ausfallschritt, hinteres Knie am Boden, Hüfte nach vorn schieben, nach der Hälfte die Seite wechseln.' },
  { id: 'dehnBeinrueck', name: 'Beinrückseite dehnen', desc: 'Im Sitzen ein Bein strecken, mit geradem Rücken nach vorn neigen, nach der Hälfte die Seite wechseln.' },
].map((e) => ({ group: 'dehnen', equipment: [], ...e }));
const ROUTINES = { lauf: [RUN], dehnen: STRETCHES };

/* Wochenplan: Index 0 = Montag … 6 = Sonntag. type 'training' oder 'rest'; bei Training optional mode (siehe T.mode, Standard 'tabata'). */
const DEFAULT_PLAN = [
  { type: 'training', focus: 'Brust & Arme', exercises: ['liegestuetze', 'bizepsCurls', 'crunches', 'trizepsDips', 'brustFliegenBand', 'plank', 'hammerCurls', 'beinhebenLiegend'] },
  { type: 'training', focus: 'Rücken & Bauch', exercises: ['rudernVorgebeugt', 'russianTwists', 'rudernSitzendBand', 'bizepsCurlsBandKurz', 'bicycleCrunches', 'trizepsKickbacks', 'superman', 'mountainClimbers'] },
  { type: 'training', focus: 'Schultern & Arme', exercises: ['schulterdruecken', 'seitheben', 'trizepsUeberkopf', 'facePulls', 'seitstuetz', 'konzentrationsCurls', 'deadBug', 'liegestuetzeKnie'] },
  { type: 'training', focus: 'Brust & Bauch', exercises: ['brustdrueckenLiegend', 'situps', 'diamantLiegestuetze', 'beinheberScheren', 'brustdrueckenBand', 'bizepsCurlsBandLang', 'plankSchulter', 'trizepsDips'] },
  { type: 'training', focus: 'Rücken & Arme', exercises: ['rudernEinarmig', 'reverseCurls', 'latZugBand', 'trizepsPushdown', 'beinhebenStuhl', 'hollowHold', 'reverseFlys', 'scheibenwischer'] },
  { type: 'rest', focus: 'Erholung', exercises: [] },
  { type: 'rest', focus: 'Erholung', exercises: [] },
];
