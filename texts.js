/* texts.js – alle sichtbaren Texte der App an einer Stelle (Deutsch).
 * Funktionen liefern Texte mit Zahlen oder Namen; HTML wird hier nicht verwendet. */
'use strict';

const T = {
  days: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  daysShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  tabs: { start: 'Start', training: 'Training', wochenplan: 'Wochenplan', fortschritt: 'Fortschritt', profil: 'Profil' },

  today: 'Heute', yesterday: 'Gestern', done: 'Erledigt', again: 'Nochmal trainieren', workout: 'Workout',
  min: (n) => `${n} Min`,
  minutes: (n) => `ca. ${n} Min`,
  exercises: (n) => `${n} ${n === 1 ? 'Übung' : 'Übungen'}`,
  substituteFor: (name) => `Ersatz für ${name}`,
  noSubstitute: 'Equipment fehlt, kein Ersatz gefunden',
  greeting: (h) => (h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 17 ? 'Guten Tag' : h < 22 ? 'Guten Abend' : 'Gute Nacht'),

  goals: { oberkoerper: 'Besserer Oberkörper', bauch: 'Besserer Bauch' },
  stat: { streak: 'Tage Streak', weekWorkouts: 'Trainings diese Woche', totalMinutes: 'Trainingsminuten gesamt' },

  rest: {
    title: 'Ruhetag · Erholung',
    text: 'Kein Training, der Körper regeneriert. Optional: 10 bis 20 Minuten leichte Mobilisation oder ein entspannter Spaziergang.',
    short: 'Ruhetag',
  },

  start: {
    startBtn: 'Training starten', heroToday: 'Dein Training heute', heroDone: 'Heute erledigt', heroRest: 'Heute ist Ruhetag',
    reminderAt: (t) => `Erinnerung: Training geplant um ${t} Uhr`,
    reminderLate: (t) => `Dein Training war für ${t} Uhr geplant. Leg jetzt los!`,
    weekGoal: 'Wochenziel', goalOf: (a, b) => `${a} von ${b} Trainingstagen`,
    goalReached: 'Wochenziel erreicht. Stark!',
    goalLeft: (n) => (n === 1 ? 'Noch 1 Trainingstag bis zum Ziel.' : `Noch ${n} Trainingstage bis zum Ziel.`),
    open: 'offen', week: 'Deine Woche', recent: 'Zuletzt trainiert', noRecent: 'Noch kein Training abgeschlossen. Leg heute los!',
  },

  training: {
    segLabel: 'Trainingsbereiche', segs: { workouts: 'Workouts', uebungen: 'Übungen', plaene: 'Pläne' },
    planDays: (name) => `Plan: ${name}`, noDays: 'Dein Plan hat keine Trainingstage.',
    allEx: 'Alle Übungen anzeigen',
  },

  lib: {
    search: 'Übung suchen', allGroups: 'Alle Muskeln', allEquip: 'Alles Equipment',
    count: (n) => `${n} ${n === 1 ? 'Übung' : 'Übungen'}`, none: 'Keine Übung gefunden.', noEquip: 'Equipment aus',
  },

  plans: {
    defaultName: 'Mein Plan', current: 'Aktueller Plan', edit: 'Im Wochenplan bearbeiten', shuffle: 'Plan neu mischen',
    shuffleHint: 'Mischt alle Trainingstage neu: mindestens 2 Arm- und 2 Bauchübungen pro Tag, möglichst ohne Wiederholungen.',
    saved: 'Gespeicherte Pläne', saveAs: 'Aktuellen Plan als neuen Plan speichern',
    summary: (n) => `${n} Trainingstage`, active: 'Aktiv', use: 'Wechseln', rename: 'Umbenennen', delete: 'Löschen',
  },

  plan: {
    reminder: 'Erinnerung', reminderTime: 'Uhrzeit', reminderClear: 'Löschen',
    reminderNote: 'Die Erinnerung erscheint als Hinweis auf der Startseite. iPhone und iPad erlauben Web-Apps nur eingeschränkt Benachrichtigungen, daher gibt es keine Push-Meldung.',
    dayType: 'Tagestyp', training: 'Training', swap: 'Tag tauschen mit', swapBtn: 'Tauschen',
    alsoOn: (s) => `Auch am ${s}`, noEquipNow: 'Equipment aus, wird im Training ersetzt',
    replace: 'Ersetzen ›', up: 'Nach oben', down: 'Nach unten',
  },

  rules: {
    dupTitle: 'Diese Übungen kommen mehrfach in der Woche vor',
    fewArms: (n) => `Nur ${n} Armübung${n === 1 ? '' : 'en'}, mindestens 2 empfohlen`,
    fewAbs: (n) => `Nur ${n} Bauchübung${n === 1 ? '' : 'en'}, mindestens 2 empfohlen`,
  },

  picker: {
    title: 'Übung ersetzen', pos: (n) => `Position ${n}`, current: 'Aktuell', inDay: 'Schon an diesem Tag',
  },

  prog: {
    records: 'Bestleistungen', longestStreak: 'Längster Streak', bestWeek: 'Meiste Workouts pro Woche',
    totalWorkouts: 'Workouts gesamt', weekMinutes: 'Minuten diese Woche',
    chart: 'Statistik', workouts: 'Workouts', minutes: 'Minuten', weeks: 'Wochen', months: 'Monate',
    perWeek: 'pro Woche', perMonth: 'pro Monat',
    groups: 'Verteilung der Muskelgruppen', noData: 'Sobald du trainiert hast, siehst du hier die Verteilung.',
    calendar: 'Kalender', loads: 'Gewicht und Bandstärke',
    loadsHint: 'Trage in der Übung ein, mit welchem Gewicht oder welchem Band du trainierst. Hier siehst du deine Bestleistung.',
    entries: (n) => `${n} ${n === 1 ? 'Eintrag' : 'Einträge'}`, noEntry: 'Noch kein Eintrag',
    moreEx: 'Weitere Übungen', pickEx: 'Übung auswählen',
  },

  load: {
    best: 'Bestleistung', titleKg: 'Gewicht pro Hantel', titleBand: 'Bandstärke', none: 'Noch kein Eintrag.',
    save: 'Speichern', history: 'Verlauf', kg: 'kg', invalid: 'Bitte einen gültigen Wert eingeben.',
  },
  bands: ['Leicht', 'Mittel', 'Stark', 'Sehr stark'],

  cal: { trained: 'trainiert', prev: 'Voriger Monat', next: 'Nächster Monat' },

  profile: {
    personal: 'Persönliche Daten', name: 'Name', weight: 'Körpergewicht (optional)',
    goals: 'Ziele', goalsHint: 'Dein Fokus und dein Wochenziel erscheinen auf der Startseite.',
    weekGoal: 'Wochenziel', daysPerWeek: (n) => `${n} ${n === 1 ? 'Tag' : 'Tage'} pro Woche`,
    equipment: 'Equipment', equipHint: 'Deaktiviertes Equipment wird im Plan durch passende Ersatzübungen ersetzt.',
    timer: 'Timer', work: 'Belastung', rest: 'Pause', rounds: 'Runden pro Übung', restBetween: 'Pause zwischen Übungen',
    timerNote: (m) => `Ein Training mit 8 Übungen dauert so ca. ${m} Minuten.`,
    sound: 'Ton und Anzeige', beeps: 'Piepstöne', voice: 'Sprachansage', keepAwake: 'Bildschirm anlassen',
    beat: 'Beat in der Belastung', bpm: 'Tempo (BPM)', mixMusic: 'Eigene Musik weiterlaufen lassen',
    musicHint: 'Starte deine Musik vorher in Spotify oder Apple Music. Läuft sie nicht weiter oder sind die Töne stumm, schalte „Eigene Musik weiterlaufen lassen“ aus.',
    days: 'Trainings- und Ruhetage', data: 'Daten',
    dataHint: 'Alle Daten liegen nur auf diesem Gerät. Mit dem Export sicherst du sie als Datei.',
    export: 'Daten exportieren (JSON)', import: 'Daten importieren (JSON)',
    resetPlan: 'Standardplan wiederherstellen', resetProgress: 'Fortschritt löschen', resetAll: 'Alles zurücksetzen',
    version: (v) => `Tabata-App · Datenversion ${v}`,
  },


  data: {
    importConfirm: 'Importierte Daten ersetzen alle aktuellen Daten auf diesem Gerät. Fortfahren?',
    importError: 'Die Datei konnte nicht gelesen werden. Bitte eine Export-Datei dieser App wählen.',
    exportFailed: 'Der Export ist fehlgeschlagen.',
  },

  confirm: {
    shuffle: 'Neuen Wochenplan für alle Trainingstage erzeugen?',
    resetPlan: 'Standardplan wiederherstellen? Eigene Änderungen am aktuellen Plan gehen verloren.',
    resetProgress: 'Alle erledigten Trainings, den Verlauf und den Streak löschen?',
    resetAll: 'Wirklich ALLES zurücksetzen? Plan, Fortschritt, Profil und Einstellungen werden gelöscht.',
    deletePlan: (name) => `Plan „${name}" löschen?`,
    abort: 'Training wirklich abbrechen?',
  },
  prompt: { newPlan: 'Name für den neuen Plan:', rename: 'Neuer Name für den Plan:' },
  newPlanName: (n) => `Plan ${n}`,

  phase: { prep: 'Bereit machen', work: 'Belastung', rest: 'Pause', break: 'Pause · Als Nächstes' },
  wo: {
    exOf: (n, total) => `Übung ${n} von ${total}`, roundOf: (r, total) => `Runde ${r} von ${total}`,
    soon: 'Gleich geht es los', nextEx: 'Nächste Übung',
    start: 'Start', pause: 'Pause', resume: 'Weiter', finish: 'Fertig',
    doneTitle: 'Geschafft!', doneName: 'Training abgeschlossen',
    doneDesc: (n, m) => `${n} Übungen in ${m} Minuten. Stark!`,
  },
  say: {
    go: 'Los', start: (name) => `Los geht es. Erste Übung: ${name}`, next: (name) => `Pause. Als Nächstes: ${name}`,
    done: 'Geschafft. Super Training!',
  },
};
