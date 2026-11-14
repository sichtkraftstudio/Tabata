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

  // ---------- Weitere Übungen (damit sich in der Woche nichts wiederholt) ----------
  // Brust
  {
    id: 'schraegLiegestuetze', name: 'Liegestütze erhöht am Stuhl', group: 'brust', equipment: ['stuhl'],
    desc: 'Hände auf die Stuhlsitzfläche, Körper gerade von Kopf bis Ferse. Brust zur Stuhlkante senken und wieder wegdrücken.',
    tip: 'Stuhl gegen eine Wand stellen, damit er nicht wegrutscht.',
  },
  {
    id: 'fliegenKurzhanteln', name: 'Fliegende liegend', group: 'brust', equipment: ['matte', 'kurzhanteln'],
    desc: 'Rückenlage, Arme mit Hanteln über der Brust, Ellbogen leicht gebeugt. Arme weit öffnen und vor der Brust wieder zusammenführen.',
  },
  {
    id: 'pulloverHantel', name: 'Pullover mit Hantel', group: 'brust', equipment: ['matte', 'dumbbell'],
    desc: 'Rückenlage, Hantel mit beiden Händen über der Brust. Arme leicht gebeugt hinter den Kopf senken und wieder über die Brust heben.',
  },
  {
    id: 'weiteLiegestuetze', name: 'Weite Liegestütze', group: 'brust', equipment: ['matte'],
    desc: 'Hände deutlich breiter als die Schultern, Körper gerade. Brust zum Boden senken und kraftvoll wieder hochdrücken.',
  },
  {
    id: 'hantelPresseEng', name: 'Enges Brustdrücken', group: 'brust', equipment: ['matte', 'kurzhanteln'],
    desc: 'Rückenlage, Hanteln eng zusammen über der Brust, Ellbogen nah am Körper. Hanteln zur Brust senken und wieder nach oben drücken.',
  },
  // Rücken
  {
    id: 'bandPullApart', name: 'Band auseinanderziehen', group: 'ruecken', equipment: ['bandKurz'],
    desc: 'Aufrecht stehen, Band mit gestreckten Armen auf Brusthöhe halten. Band auseinanderziehen, bis die Schulterblätter zusammenkommen.',
    tip: 'Schultern bleiben unten, nicht zu den Ohren ziehen.',
  },
  {
    id: 'rudernAufBand', name: 'Rudern im Stand mit Theraband', group: 'ruecken', equipment: ['bandLang'],
    desc: 'Hüftbreit auf das Band stellen, Knie leicht gebeugt, Oberkörper vorneigen. Enden zum Bauch ziehen, Ellbogen eng am Körper.',
  },
  {
    id: 'kreuzhebenRumaenisch', name: 'Rumänisches Kreuzheben', group: 'ruecken', equipment: ['kurzhanteln'],
    desc: 'Hanteln vor den Oberschenkeln, Knie leicht gebeugt. Hüfte nach hinten schieben, Hanteln an den Beinen entlang senken und aufrichten.',
    tip: 'Rücken bleibt die ganze Zeit gerade.',
  },
  {
    id: 'birdDog', name: 'Vierfüßler Arm-Bein-Heben', group: 'ruecken', equipment: ['matte'],
    desc: 'Vierfüßlerstand, Rücken gerade. Gegenüberliegenden Arm und Bein strecken, kurz halten und im Wechsel die Seite tauschen.',
  },
  {
    id: 'rudernBauchlage', name: 'Rudern in Bauchlage', group: 'ruecken', equipment: ['matte', 'kurzhanteln'],
    desc: 'Auf dem Bauch liegen, Oberkörper leicht angehoben, Hanteln unter den Schultern. Ellbogen nach hinten ziehen, Schulterblätter zusammen.',
  },
  {
    id: 'yHeben', name: 'Y-Heben in Bauchlage', group: 'ruecken', equipment: ['matte'],
    desc: 'Auf dem Bauch liegen, Arme als Y schräg nach vorn gestreckt. Arme und Brust leicht vom Boden heben und langsam senken.',
  },
  // Schultern
  {
    id: 'frontheben', name: 'Frontheben', group: 'schultern', equipment: ['kurzhanteln'],
    desc: 'Aufrecht stehen, Hanteln vor den Oberschenkeln. Arme gestreckt bis auf Schulterhöhe nach vorn heben und langsam senken.',
  },
  {
    id: 'arnoldPress', name: 'Arnold Press', group: 'schultern', equipment: ['kurzhanteln'],
    desc: 'Hanteln vor der Brust, Handflächen zum Gesicht. Beim Hochdrücken die Hände nach außen drehen, oben strecken und zurückführen.',
  },
  {
    id: 'seithebenBand', name: 'Seitheben mit Theraband', group: 'schultern', equipment: ['bandLang'],
    desc: 'Auf das Band stellen, Enden in den Händen. Arme leicht gebeugt seitlich bis auf Schulterhöhe heben und kontrolliert senken.',
  },
  {
    id: 'schulterdrueckenBand', name: 'Schulterdrücken mit Theraband', group: 'schultern', equipment: ['bandLang'],
    desc: 'Auf das Band stellen, Hände auf Schulterhöhe. Arme nach oben strecken und langsam wieder auf Schulterhöhe senken.',
  },
  {
    id: 'pikeLiegestuetze', name: 'Pike Liegestütze', group: 'schultern', equipment: ['matte'],
    desc: 'Hüfte hoch, Körper bildet ein umgekehrtes V. Kopf zwischen den Armen Richtung Boden beugen und wieder hochdrücken.',
    tip: 'Leichter: Knie leicht beugen.',
  },
  {
    id: 'shrugs', name: 'Schulterheben', group: 'schultern', equipment: ['kurzhanteln'],
    desc: 'Aufrecht stehen, Hanteln neben dem Körper. Schultern gerade nach oben zu den Ohren ziehen, kurz halten und senken.',
  },
  // Arme
  {
    id: 'trizepsUeberkopfBand', name: 'Trizeps Überkopf mit kurzem Band', group: 'arme', equipment: ['bandKurz'],
    desc: 'Ein Bandende unter dem Fuß, anderes Ende mit beiden Händen hinter dem Kopf. Ellbogen nach oben strecken und wieder beugen.',
  },
  {
    id: 'zottmanCurls', name: 'Zottman Curls', group: 'arme', equipment: ['kurzhanteln'],
    desc: 'Hanteln mit Handflächen nach vorn zur Schulter beugen. Oben die Hände drehen und mit Blick nach unten langsam absenken.',
  },
  {
    id: 'schaedelbrecher', name: 'Trizeps Stirndrücken', group: 'arme', equipment: ['matte', 'kurzhanteln'],
    desc: 'Rückenlage, Hanteln über der Brust. Nur die Unterarme zur Stirn beugen und die Arme wieder strecken.',
    tip: 'Die Oberarme bleiben senkrecht und ruhig.',
  },
  {
    id: 'hammerCurlsBand', name: 'Hammer Curls mit Theraband', group: 'arme', equipment: ['bandLang'],
    desc: 'Auf das Band stellen, Handflächen zeigen zueinander. Ellbogen am Körper, Hände zur Schulter beugen und langsam senken.',
  },
  // Bauch
  {
    id: 'flutterKicks', name: 'Flutter Kicks', group: 'bauch', equipment: ['matte'],
    desc: 'Rückenlage, Beine gestreckt knapp über dem Boden. Beine im Wechsel schnell und klein auf und ab bewegen.',
    tip: 'Der untere Rücken bleibt am Boden.',
  },
  {
    id: 'holzhackerBand', name: 'Holzhacker mit Theraband', group: 'bauch', equipment: ['bandLang'],
    desc: 'Band hoch an einer Tür befestigen, seitlich stehen. Band mit beiden Händen diagonal nach unten ziehen, Oberkörper dreht mit.',
  },
  {
    id: 'plankStuhl', name: 'Plank am Stuhl', group: 'bauch', equipment: ['stuhl'],
    desc: 'Unterarme auf die Stuhlsitzfläche, Körper gerade von Kopf bis Ferse. Bauch und Po fest anspannen und halten.',
    tip: 'Leichter als der Plank am Boden.',
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

/* Rückenprogramm (unterer Rücken): eigene Übungen, bewusst nicht in EXERCISES, damit „Plan mischen" und die
 * Arm-/Bauch-Regeln sie nicht einbeziehen. Dazu kommen vorhandene Übungen (birdDog, deadBug, superman, …). */
const GROUP_BACK = 'Unterer Rücken';
const BACK = [
  {
    id: 'beckenkippen', name: 'Beckenkippen', equipment: ['matte'],
    desc: 'Auf dem Rücken liegen, Knie gebeugt, Füße am Boden. Bauch anspannen und die Lendenwirbelsäule sanft in die Matte drücken, dann wieder lösen.',
    tip: 'Kleine, langsame Bewegung. Die Atmung läuft ruhig weiter.',
  },
  {
    id: 'beckenheben', name: 'Beckenheben (Brücke)', equipment: ['matte'],
    desc: 'Auf dem Rücken, Füße hüftbreit aufgestellt. Becken anheben, bis Schultern, Hüfte und Knie eine Linie bilden, oben kurz halten und langsam absenken.',
    tip: 'Po fest anspannen und nicht ins Hohlkreuz fallen.',
  },
  {
    id: 'beckenhebenMarsch', name: 'Beckenheben mit Marschieren', equipment: ['matte'],
    desc: 'Brücke halten und abwechselnd ein Knie Richtung Brust heben. Das Becken bleibt dabei ruhig auf einer Höhe.',
    tip: 'Das Becken darf nicht zur Seite kippen.',
  },
  {
    id: 'beckenhebenEinbein', name: 'Beckenheben einbeinig', equipment: ['matte'],
    desc: 'Wie die Brücke, ein Bein gestreckt anheben. Becken gerade halten, pro Satz das Bein wechseln.',
    tip: 'Zu schwer? Erst das normale Beckenheben machen.',
  },
  {
    id: 'hueftstrecken', name: 'Hüftstrecken im Vierfüßler', equipment: ['matte'],
    desc: 'Im Vierfüßlerstand ein Knie gebeugt nach hinten oben drücken, Fuß zur Decke. Rücken bleibt gerade, pro Satz die Seite wechseln.',
    tip: 'Nicht ins Hohlkreuz kippen, die Bewegung kommt aus dem Po.',
  },
  {
    id: 'schwimmer', name: 'Schwimmer', equipment: ['matte'],
    desc: 'In Bauchlage Arme nach vorn, Beine gestreckt. Gegengleich einen Arm und das andere Bein leicht anheben und im Wechsel senken.',
    tip: 'Blick zum Boden, Nacken lang. Nur so hoch, wie es angenehm ist.',
  },
  {
    id: 'goodMorningBand', name: 'Good Morning mit Theraband', equipment: ['bandLang'],
    desc: 'Auf das Band stellen, Enden über die Schultern legen. Hüfte nach hinten schieben, Rücken gerade, Oberkörper nach vorn neigen und wieder aufrichten.',
    tip: 'Knie leicht gebeugt, die Bewegung kommt aus der Hüfte.',
  },
].map((e) => ({ group: 'unten', ...e }));

/* 3-Wochen-Programm: je Woche fünf Tagesgruppen à 3 Übungen. Die Trainingstage des Plans bekommen sie der Reihe nach.
 * Woche 1 Grundlagen, Woche 2 mit Brücke marschieren und Band, Woche 3 mit einbeinig und Kreuzheben. */
const BACK_PROGRAM = [
  [
    ['beckenkippen', 'beckenheben', 'birdDog'],
    ['dehnKatzeKuh', 'deadBug', 'hueftstrecken'],
    ['beckenheben', 'schwimmer', 'birdDog'],
    ['beckenkippen', 'deadBug', 'superman'],
    ['dehnKatzeKuh', 'beckenheben', 'hueftstrecken'],
  ],
  [
    ['beckenhebenMarsch', 'birdDog', 'deadBug'],
    ['goodMorningBand', 'hueftstrecken', 'superman'],
    ['beckenhebenEinbein', 'schwimmer', 'birdDog'],
    ['beckenhebenMarsch', 'deadBug', 'superman'],
    ['goodMorningBand', 'birdDog', 'schwimmer'],
  ],
  [
    ['kreuzhebenRumaenisch', 'beckenhebenEinbein', 'birdDog'],
    ['goodMorningBand', 'deadBug', 'schwimmer'],
    ['kreuzhebenRumaenisch', 'hueftstrecken', 'superman'],
    ['beckenhebenEinbein', 'beckenhebenMarsch', 'deadBug'],
    ['goodMorningBand', 'birdDog', 'superman'],
  ],
];

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
