/* app.js – Kern der Tabata-PWA: Speicher mit Migration, Plan-Logik, Router, Aktionen, Dialoge, Timer.
 * Die Tabs (Ansichten) liegen in views.js, alle Texte in texts.js. */
'use strict';

const PREP = 10;        // Sekunden „Bereit machen" vor der ersten Übung
const SCHEMA = 2;       // Version der gespeicherten Daten (siehe migrate())
const DEFAULT_SETTINGS = {
  work: 20, rest: 10, rounds: 8, restBetween: 60, sound: true, voice: false, keepAwake: true, reminder: '',
  mixAudio: false,
  equipment: Object.fromEntries(Object.keys(EQUIPMENT).map((k) => [k, true])),
};
// Schwierigkeitsstufen: überschreiben Belastung, Pause, Runden und Pause zwischen den Übungen
const LEVELS = {
  leicht: { work: 20, rest: 20, rounds: 6, restBetween: 90 },
  mittel: { work: 20, rest: 10, rounds: 8, restBetween: 60 },
  schwer: { work: 30, rest: 10, rounds: 8, restBetween: 45 },
};
/** Passende Stufe zu den aktuellen Timer-Werten, sonst undefined (eigene Werte). */
const levelOf = () => Object.keys(LEVELS).find((k) => Object.keys(LEVELS[k]).every((f) => settings[f] === LEVELS[k][f]));
const DEFAULT_PROFILE ={ name: 'Dirk', weight: '', goals: { oberkoerper: true, bauch: true }, weekGoal: 5 };

const EX = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
const $ = (sel) => document.querySelector(sel);
const view = $('#view');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// ---------- Speicher (localStorage, fehlertolerant) ----------
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem('tabata.' + key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('tabata.' + key, JSON.stringify(value)); } catch { /* privater Modus o. Ä. */ }
  },
  keys() {
    try { return Object.keys(localStorage).filter((k) => k.startsWith('tabata.')); } catch { return []; }
  },
};

/** Prüft einen gespeicherten Wochenplan; ungültige Übungen fliegen raus, kaputte Pläne werden durch den Standard ersetzt. */
function cleanPlan(saved) {
  const valid = Array.isArray(saved) && saved.length === 7 && saved.every((d) => ['training', 'rest'].includes(d?.type));
  const days = valid ? saved : structuredClone(DEFAULT_PLAN);
  days.forEach((d) => { d.exercises = (d.exercises || []).filter((id) => EX[id]); });
  return days;
}

/** Datenversion 1 → 2: bestehende Schlüssel (settings, plan, done) bleiben unverändert, neue werden ergänzt. */
function migrate() {
  if (store.get('version', 1) >= SCHEMA) return;
  const days = cleanPlan(store.get('plan', null)), oldDone = store.get('done', {});
  if (!store.get('plans', null)) {
    store.set('plans', [{ id: 'p1', name: T.plans.defaultName, days }]);
    store.set('activePlan', 'p1');
  }
  if (!store.get('log', null)) { // v1 kannte nur „erledigt" pro Tag → Verlauf daraus ableiten
    store.set('log', Object.keys(oldDone).sort().map((key) => {
      const d = oldDone[key], src = days[d.day] || {};
      return { key, day: d.day, focus: src.focus || '', secs: d.secs || 0, n: d.count || 1, ex: src.exercises || [], kind: 'plan', migrated: true };
    }));
  }
  if (!store.get('profile', null)) store.set('profile', DEFAULT_PROFILE);
  store.set('plan', days);
  store.set('version', SCHEMA);
}
migrate();

const savedSettings = store.get('settings', {}), savedProfile = store.get('profile', {});
let settings = { ...DEFAULT_SETTINGS, ...savedSettings, equipment: { ...DEFAULT_SETTINGS.equipment, ...savedSettings.equipment } };
let profile = { ...DEFAULT_PROFILE, ...savedProfile, goals: { ...DEFAULT_PROFILE.goals, ...savedProfile.goals } };
profile.weekGoal = Math.min(7, Math.max(1, Number(profile.weekGoal) || 5));
let plan = cleanPlan(store.get('plan', null));
let plans = store.get('plans', []);
let activePlan = store.get('activePlan', 'p1');
let done = store.get('done', {});     // { 'YYYY-MM-DD': { day, secs, count } }
let log = store.get('log', []);       // Verlauf: [{ key, ts, day, focus, secs, n, ex: [ids], kind }]
let loads = store.get('loads', {});   // { übungsId: [{ d: 'YYYY-MM-DD', v: Zahl, k: 'kg' | 'band' }] }

const saveSettings = () => store.set('settings', settings);
const saveProfile = () => store.set('profile', profile);
/** Speichert den aktiven Plan und spiegelt ihn in die Liste der gespeicherten Pläne. */
function savePlan() {
  store.set('plan', plan);
  const p = plans.find((x) => x.id === activePlan);
  if (p) { p.days = structuredClone(plan); store.set('plans', plans); }
}
const planName = () => plans.find((p) => p.id === activePlan)?.name || T.plans.defaultName;

// ---------- Datum ----------
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const weekday = (d) => (d.getDay() + 6) % 7; // Montag = 0
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const weekDates = () => { const now = new Date(); return T.days.map((_, i) => addDays(now, i - weekday(now))); };
const weekKey = (d) => dayKey(addDays(d, -weekday(d)));
const monthKey = (d) => dayKey(d).slice(0, 7);

// ---------- Fortschritt ----------
const isOk = (d) => done[dayKey(d)] || plan[weekday(d)].type === 'rest';

/** Aktueller und längster Streak: Tage in Folge mit Training oder Ruhetag. Heute zählt erst, wenn erledigt. */
function streaks() {
  const keys = Object.keys(done).sort();
  if (!keys.length) return { current: 0, longest: 0 };
  const today = parseKey(dayKey(new Date()));
  let run = 0, longest = 0;
  for (const d = parseKey(keys[0]); d <= today; d.setDate(d.getDate() + 1)) {
    if (isOk(d)) longest = Math.max(longest, ++run);
    else if (d < today) run = 0; // heute noch offen bricht den Streak nicht
  }
  return { current: run, longest };
}

/** Summen pro Zeitraum: { schlüssel: { workouts, secs } }. */
function bucketBy(keyFn) {
  const out = {};
  for (const [key, v] of Object.entries(done)) {
    const b = (out[keyFn(parseKey(key))] ??= { workouts: 0, secs: 0 });
    b.workouts += v.count || 1;
    b.secs += v.secs || 0;
  }
  return out;
}

function stats() {
  const week = weekDates().map((d) => done[dayKey(d)]).filter(Boolean), all = Object.values(done);
  const sum = (list, f) => list.reduce((s, x) => s + f(x), 0);
  return {
    weekDays: week.length,
    weekMinutes: Math.round(sum(week, (x) => x.secs || 0) / 60),
    total: sum(all, (x) => x.count || 1),
    totalMinutes: Math.round(sum(all, (x) => x.secs || 0) / 60),
    bestWeek: Math.max(0, ...Object.values(bucketBy(weekKey)).map((w) => w.workouts)),
    ...streaks(),
  };
}

const workoutSecs = (n) => PREP + n * (settings.rounds * settings.work + (settings.rounds - 1) * settings.rest) + (n - 1) * settings.restBetween;

// ---------- Gewicht / Bandstärke pro Übung ----------
const loadKind = (ex) => (ex.equipment.some((k) => k.startsWith('band')) ? 'band'
  : ex.equipment.some((k) => k === 'kurzhanteln' || k === 'dumbbell') ? 'kg' : null);
const bestLoad = (id) => (loads[id] || []).reduce((b, x) => (!b || x.v > b.v ? x : b), null);
const fmtLoad = (l) => (l.k === 'band' ? T.bands[l.v - 1] : `${l.v.toLocaleString('de-DE')} ${T.load.kg}`);
function addLoad(id, v) {
  const list = (loads[id] ??= []), d = dayKey(new Date()), i = list.findIndex((x) => x.d === d);
  if (i >= 0) list[i].v = v; else list.push({ d, v, k: loadKind(EX[id]) });
  list.sort((a, b) => a.d.localeCompare(b.d));
  store.set('loads', loads);
}

// ---------- Equipment & Ersatzübungen ----------
const available = (ex) => ex.equipment.every((e) => settings.equipment[e] !== false);
const category = (g) => (g === 'arme' || g === 'bauch' ? g : 'oben'); // oben = Brust, Rücken, Schultern

function substitute(ex, used) {
  const same = (c) => c.group === ex.group, cat = (c) => category(c.group) === category(ex.group);
  const tests = [(c) => same(c) && !used.has(c.id), (c) => cat(c) && !used.has(c.id), same, cat];
  for (const test of tests) {
    const hit = EXERCISES.find((c) => c !== ex && available(c) && test(c));
    if (hit) return hit;
  }
  return null;
}

/** Übungen eines Tages, fehlendes Equipment wird durch passende Übungen ersetzt. */
function resolveDay(day) {
  const used = new Set(day.exercises);
  return day.exercises.map((id) => {
    const ex = EX[id];
    if (available(ex)) return { ex };
    const sub = substitute(ex, used);
    if (!sub) return { ex, missing: true };
    used.add(sub.id);
    return { ex: sub, replaced: ex };
  });
}

// ---------- Plan: mischen, bearbeiten, prüfen ----------
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Titel eines Tages aus den zwei häufigsten Oberkörper-Gruppen (sonst „… & Arme"). */
function focusOf(ids) {
  const count = {};
  ids.map((id) => EX[id]).filter((e) => e && category(e.group) === 'oben').forEach((e) => { count[e.group] = (count[e.group] || 0) + 1; });
  const top = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 2).map((g) => GROUPS[g]);
  return (top.length > 1 ? top : [...top, GROUPS.arme]).join(' & ');
}

/** 8 Übungen: 2 Arme, 2 Bauch, 4 Oberkörper – möglichst ohne Wiederholung innerhalb der Woche. */
function generateDay(used) {
  const today = new Set();
  const pool = (cat) => {
    const ok = EXERCISES.filter((e) => available(e) && category(e.group) === cat);
    return shuffle(ok.length ? ok : EXERCISES.filter((e) => category(e.group) === cat));
  };
  // Erst neue Übungen der Woche, dann Wiederholung aus anderen Tagen – nie doppelt am selben Tag
  const take = (cats) => {
    for (const test of [(e) => !used.has(e.id), (e) => !today.has(e.id)]) {
      for (const cat of cats) {
        const hit = pool(cat).find(test);
        if (hit) { used.add(hit.id); today.add(hit.id); return hit; }
      }
    }
    return pool(cats[0])[0];
  };
  const arms = [take(['arme']), take(['arme'])], abs = [take(['bauch']), take(['bauch'])];
  const lists = [[0, 1, 2, 3].map(() => take(['oben', 'arme'])), arms, abs];
  const out = [];
  while (lists.some((l) => l.length)) lists.forEach((l) => l.length && out.push(l.shift())); // abwechselnd mischen
  const ids = out.map((e) => e.id);
  return { exercises: ids, focus: focusOf(ids) };
}

function shufflePlan() {
  const used = new Set();
  plan = plan.map((d) => (d.type === 'training' ? { ...d, ...generateDay(used) } : d));
  savePlan();
}

function setDayType(i, type) {
  const day = plan[i];
  day.type = type;
  if (type === 'training' && !day.exercises.length) { // neuer Trainingstag → Übungen erzeugen
    Object.assign(day, generateDay(new Set(plan.flatMap((d) => (d.type === 'training' ? d.exercises : [])))));
  }
  savePlan();
}
function replaceExercise(i, pos, id) {
  const d = plan[i];
  d.exercises[pos] = id;
  d.focus = focusOf(d.exercises);
  savePlan();
}
function moveExercise(i, pos, dir) {
  const a = plan[i].exercises, j = pos + dir;
  if (j < 0 || j >= a.length) return;
  [a[pos], a[j]] = [a[j], a[pos]];
  savePlan();
}
function swapDays(i, j) { [plan[i], plan[j]] = [plan[j], plan[i]]; savePlan(); }

/** Regel: mindestens 2 Arm- und 2 Bauchübungen pro Trainingstag. */
function dayIssues(day) {
  if (day.type !== 'training') return [];
  const n = (g) => day.exercises.filter((id) => EX[id]?.group === g).length, out = [];
  if (n('arme') < 2) out.push(T.rules.fewArms(n('arme')));
  if (n('bauch') < 2) out.push(T.rules.fewAbs(n('bauch')));
  return out;
}
/** Übungen, die an mehreren Trainingstagen vorkommen: [[id, [Tagesindizes]], …] */
function duplicates() {
  const seen = {};
  plan.forEach((d, i) => d.type === 'training' && new Set(d.exercises).forEach((id) => (seen[id] ??= []).push(i)));
  return Object.entries(seen).filter(([, days]) => days.length > 1);
}

// ---------- Mehrere Pläne ----------
function savePlanAs(name) {
  const p = { id: 'p' + Date.now().toString(36), name, days: structuredClone(plan) };
  plans.push(p);
  activePlan = p.id;
  store.set('plans', plans);
  store.set('activePlan', activePlan);
}
function switchPlan(id) {
  const p = plans.find((x) => x.id === id);
  if (!p) return;
  plan = cleanPlan(structuredClone(p.days));
  activePlan = id;
  store.set('activePlan', id);
  store.set('plan', plan);
}

// ---------- Dialoge (Übungsdetails, Verlauf, Bereich) ----------
function showSheet(html) {
  $('#sheet-body').innerHTML = html;
  if (!$('#sheet').open) $('#sheet').showModal();
}
const closeDialogs = () => document.querySelectorAll('dialog[open]').forEach((d) => d.close());

/** Kleiner Verlauf der Einträge (Linie), bei weniger als 2 Einträgen nur der Wert. */
function spark(hist) {
  const h = hist.slice(-10);
  if (h.length < 2) return h.length ? `<p class="muted small">${dateLabel(h[0].d)}: ${fmtLoad(h[0])}</p>` : '';
  const vs = h.map((x) => x.v), lo = Math.min(...vs), span = (Math.max(...vs) - lo) || 1;
  const pts = h.map((x, i) => [8 + (i * 264) / (h.length - 1), 52 - ((x.v - lo) / span) * 44]);
  return `<svg class="spark" viewBox="0 0 280 60" role="img" aria-label="${T.load.history}"><polyline points="${pts.map((p) => p.join(',')).join(' ')}"/>
    ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5"/>`).join('')}</svg>
    <p class="muted small">${dateLabel(h[0].d)}: ${fmtLoad(h[0])} → ${dateLabel(h.at(-1).d)}: ${fmtLoad(h.at(-1))}</p>`;
}

function loadForm(ex) {
  const kind = loadKind(ex);
  if (!kind) return '';
  const hist = loads[ex.id] || [], best = bestLoad(ex.id);
  const input = kind === 'kg'
    ? `<input type="number" id="load-v" class="field" inputmode="decimal" min="0.5" max="200" step="0.5" placeholder="${T.load.kg}" aria-label="${T.load.titleKg}">`
    : `<select id="load-v" aria-label="${T.load.titleBand}">${T.bands.map((b, i) => `<option value="${i + 1}">${b}</option>`).join('')}</select>`;
  return `<section class="loadbox"><h3>${kind === 'kg' ? T.load.titleKg : T.load.titleBand}</h3>
    ${best ? `<p>${T.load.best}: <strong>${fmtLoad(best)}</strong></p>` : `<p class="muted">${T.load.none}</p>`}
    ${spark(hist)}
    <div class="row-inline">${input}<button class="btn primary" data-act="save-load" data-id="${ex.id}">${T.load.save}</button></div></section>`;
}

function openSheet(id) {
  const ex = EX[id];
  showSheet(`<h2>${esc(ex.name)}</h2><p class="muted">${GROUPS[ex.group]}</p>
    <div class="equip-list">${equipChips(ex)}</div><p>${esc(ex.desc)}</p>
    ${ex.tip ? `<p class="tip">${esc(ex.tip)}</p>` : ''}${loadForm(ex)}`);
}

function openLog(i) {
  const e = log[i], list = (e.ex || []).map((id) => EX[id]).filter(Boolean);
  const date = parseKey(e.key).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  showSheet(`<h2>${esc(e.focus || T.workout)}</h2>
    <p class="muted">${date} · ${T.min(mins(e.secs))} · ${T.exercises(list.length)}</p>
    ${list.length ? `<ul class="exlist left">${list.map((ex, n) => exRow({ ex }, n, true)).join('')}</ul>
      <button class="btn primary wide" data-act="repeat" data-i="${i}">${T.again}</button>` : ''}`);
}

// ---------- Daten: Export, Import, Zurücksetzen ----------
async function exportData() {
  const data = {};
  store.keys().forEach((k) => { data[k] = localStorage.getItem(k); });
  const text = JSON.stringify({ app: 'tabata', schema: SCHEMA, exported: new Date().toISOString(), data }, null, 2);
  const file = new File([text], `tabata-${dayKey(new Date())}.json`, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: file.name });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (obj?.app !== 'tabata' || typeof obj.data !== 'object') throw new Error('format');
      const entries = Object.entries(obj.data).filter(([k, v]) => k.startsWith('tabata.') && typeof v === 'string' && JSON.parse(v) !== undefined);
      if (!entries.length) throw new Error('leer');
      if (!confirm(T.data.importConfirm)) return;
      store.keys().forEach((k) => localStorage.removeItem(k));
      entries.forEach(([k, v]) => localStorage.setItem(k, v));
      location.reload(); // Zustand neu laden, Migration läuft bei Bedarf
    } catch { alert(T.data.importError); }
  };
  reader.readAsText(file);
}

function resetAll() { store.keys().forEach((k) => localStorage.removeItem(k)); location.reload(); }

// ---------- Aktionen (data-act) ----------
const ACT = {
  ex: (el) => openSheet(el.dataset.id),
  log: (el) => openLog(+el.dataset.i),
  'close-sheet': () => closeDialogs(),
  'start-day': (el) => { closeDialogs(); startDay(+el.dataset.i); },
  repeat: (el) => {
    const e = log[+el.dataset.i];
    closeDialogs();
    startWorkout((e.ex || []).map((id) => EX[id]).filter(Boolean), { day: e.day, title: e.focus || T.workout, label: e.focus, kind: e.kind });
  },
  'lib-filter': (el) => { lib[el.dataset.k] = el.dataset.v; render(); },
  'pick-filter': (el) => { pick[el.dataset.k] = el.dataset.v; renderPicker(); },
  replace: (el) => {
    Object.assign(pick, { day: +el.dataset.i, pos: +el.dataset.n, group: 'alle', equip: 'alle', q: '' });
    renderPicker();
    $('#picker').showModal();
  },
  pick: (el) => { replaceExercise(pick.day, pick.pos, el.dataset.id); $('#picker').close(); render(); },
  move: (el) => { moveExercise(+el.dataset.i, +el.dataset.n, +el.dataset.d); render(); },
  swap: (el) => {
    const target = +$('#swap-target').value;
    swapDays(+el.dataset.i, target);
    location.hash = `#/wochenplan/${target}`; // folgt dem getauschten Tag
  },
  'reminder-clear': () => { settings.reminder = ''; saveSettings(); render(); },
  level: (t) => { Object.assign(settings, LEVELS[t.dataset.v]); saveSettings(); render(); },
  'sound-test': () => { // Startton abspielen und Audio-Zustand anzeigen
    Sound.unlock();
    Sound.beep(660, 0.5);
    Sound.beep(990, 0.7, 0.14);
    $('#sound-info').textContent = T.profile.soundInfo(Sound.ctx?.state, navigator.audioSession?.type, settings.sound);  },
  shuffle: () => { if (confirm(T.confirm.shuffle)) { shufflePlan(); render(); } },
  'reset-plan': () => { if (confirm(T.confirm.resetPlan)) { plan = structuredClone(DEFAULT_PLAN); savePlan(); render(); } },
  'reset-progress': () => {
    if (!confirm(T.confirm.resetProgress)) return;
    done = {}; log = []; loads = {};
    store.set('done', done); store.set('log', log); store.set('loads', loads);
    render();
  },
  'reset-all': () => { if (confirm(T.confirm.resetAll)) resetAll(); },
  export: () => exportData().catch(() => alert(T.data.exportFailed)),
  'plan-save': () => {
    const name = prompt(T.prompt.newPlan, T.newPlanName(plans.length + 1))?.trim();
    if (name) { savePlanAs(name.slice(0, 40)); render(); }
  },
  'plan-switch': (el) => { switchPlan(el.dataset.id); render(); },
  'plan-rename': (el) => {
    const p = plans.find((x) => x.id === el.dataset.id), name = prompt(T.prompt.rename, p.name)?.trim();
    if (name) { p.name = name.slice(0, 40); store.set('plans', plans); render(); }
  },
  'plan-delete': (el) => {
    const p = plans.find((x) => x.id === el.dataset.id);
    if (p.id === activePlan || !confirm(T.confirm.deletePlan(p.name))) return;
    plans = plans.filter((x) => x !== p);
    store.set('plans', plans);
    render();
  },
  prog: (el) => { prog[el.dataset.k] = el.dataset.v; render(); },
  cal: (el) => { prog.month = Math.min(0, prog.month + +el.dataset.d); render(); },
  'save-load': (el) => {
    const raw = $('#load-v').value, v = loadKind(EX[el.dataset.id]) === 'band' ? parseInt(raw, 10) : parseFloat(raw.replace(',', '.'));
    if (!(v > 0)) return alert(T.load.invalid);
    addLoad(el.dataset.id, v);
    openSheet(el.dataset.id);
    render();
  },
};

// Änderungen an Formularfeldern (data-chg)
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const CHG = {
  name: (el) => { profile.name = el.value.trim().slice(0, 30); saveProfile(); },
  weight: (el) => { const v = parseFloat(el.value); profile.weight = v ? clamp(v, 20, 400) : ''; saveProfile(); },
  goal: (el) => { profile.goals[el.dataset.k] = el.checked; saveProfile(); },
  weekGoal: (el) => { profile.weekGoal = clamp(+el.value, 1, 7); saveProfile(); },
  equip: (el) => { settings.equipment[el.dataset.k] = el.checked; saveSettings(); },
  num: (el) => { settings[el.dataset.k] = clamp(parseInt(el.value, 10) || 0, +el.min, +el.max); saveSettings(); },
  flag: (el) => { settings[el.dataset.k] = el.checked; saveSettings(); },
  reminder: (el) => { settings.reminder = el.value; saveSettings(); },
  daytype: (el) => setDayType(+el.dataset.i, el.value),
  import: (el) => { if (el.files[0]) importData(el.files[0]); el.value = ''; },
};
// Eingabe während des Tippens (nur Ergebnisliste neu zeichnen, damit die Tastatur offen bleibt)
const INP = {
  lib: (el) => { lib.q = el.value; $('#lib-results').innerHTML = libResults(); },
  pick: (el) => { pick.q = el.value; $('#pick-results').innerHTML = pickResults(); },
};

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-act]');
  if (t) ACT[t.dataset.act]?.(t);
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (!el.dataset.chg) return;
  CHG[el.dataset.chg]?.(el);
  if (el.dataset.chg !== 'import') render();
});
document.addEventListener('input', (e) => INP[e.target.dataset.in]?.(e.target));

// Dialoge schließen: Hintergrund oder ✕
for (const id of ['#sheet', '#picker']) {
  $(id).addEventListener('click', (e) => { if (e.target === e.currentTarget || e.target.closest('.sheet-close')) e.currentTarget.close(); });
}

// ---------- Router (#/start, #/training, #/wochenplan, #/fortschritt, #/profil) ----------
const ROUTES = { start: renderStart, training: renderTraining, wochenplan: renderPlanTab, fortschritt: renderProgress, profil: renderProfile };

function parseHash() {
  const [tab, sub, arg] = location.hash.replace(/^#\/?/, '').split('/');
  return { tab: ROUTES[tab] ? tab : 'start', sub, arg };
}

/** Zeichnet die aktuelle Seite. fresh = Seitenwechsel (nach oben scrollen, sanfter Übergang). */
function render(fresh = false) {
  const { tab, sub, arg } = parseHash();
  const info = ROUTES[tab](sub, arg, fresh);
  $('#title').textContent = info.title;
  const back = $('#back');
  back.hidden = !info.back;
  if (info.back) back.href = info.back;
  document.querySelectorAll('.tabbar a').forEach((a) => {
    const on = a.dataset.tab === tab;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (fresh) {
    window.scrollTo(0, 0);
    view.classList.remove('page-in');
    void view.offsetWidth; // Animation neu starten
    view.classList.add('page-in');
  }
}
const route = () => render(true);

// ---------- Ton, Sprache, Bildschirm-Sperre ----------
const Sound = {
  ctx: null, until: 0, timer: 0,
  engage() { // Audio-Sitzung belegen; beim ersten Mal nur in einer Nutzeraktion möglich (iOS)
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!this.ctx && AC) this.ctx = new AC();
    // „playback": Töne kommen auch bei aktivem Stummschalter, laufende Musik pausiert.
    // „ambient": Töne mischen sich über die Musik, folgen aber dem Stummschalter.
    const session = navigator.audioSession;
    if (session) {
      try { session.type = settings.mixAudio ? 'ambient' : 'playback'; } catch { /* egal */ }
    } else if (!settings.mixAudio) { // älteres iOS: eine lautlose Endlosschleife hebt den Stummschalter auf
      this.el ||= Object.assign(new Audio('data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA'), { loop: true });
      this.el.play().catch(() => {});
    }
    this.ctx?.resume();
  },
  unlock() { this.engage(); this.hold(0.5); },
  /** Sitzung nur so lange halten, wie ein Ton klingt; danach freigeben, damit Spotify sofort weiterspielt. */
  hold(secs) {
    this.until = Math.max(this.until, Date.now() + secs * 1000);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.release(), this.until - Date.now());
  },
  release() { // Audio-Sitzung freigeben, damit Musik anderer Apps weiterlaufen kann
    this.el?.pause();
    try { if (navigator.audioSession) navigator.audioSession.type = 'auto'; } catch { /* egal */ }
  },
  beep(freq = 880, dur = 0.12, delay = 0) { // weicher Glockenton: Grundton plus zwei leise Obertöne
    if (!settings.sound || !this.ctx) return;
    this.engage();
    this.hold(delay + dur + 0.3);
    const t = this.ctx.currentTime + delay + 0.08, gain = this.ctx.createGain(); // 80 ms Vorlauf, bis die Sitzung steht
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    gain.connect(this.ctx.destination);
    [[1, 1], [2, 0.3], [3, 0.1]].forEach(([mult, amp]) => {
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.frequency.value = freq * mult;
      g.gain.value = amp;
      osc.connect(g).connect(gain);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
  },
};

function say(text) {
  if (!settings.voice || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  speechSynthesis.speak(u);
}

let wakeLock = null;
async function requestWakeLock() {
  try {
    if (settings.keepAwake && 'wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch { wakeLock = null; }
}
function releaseWakeLock() { wakeLock?.release().catch(() => {}); wakeLock = null; }

// ---------- Training (Timer) ----------
const W = { list: [], phases: [], i: 0, endAt: 0, left: 0, running: false, timer: 0, lastSec: 0, shown: null, meta: {}, startedAt: 0, finished: false };
const wo = (id) => document.getElementById('wo-' + id);
const RING = 2 * Math.PI * 54;

/** Ablauf: Vorbereitung, je Übung Runden aus Belastung/Pause, dazwischen lange Pause mit Vorschau. */
function buildPhases(list) {
  const s = settings, out = [{ type: 'prep', dur: PREP, ex: 0 }];
  list.forEach((_, e) => {
    for (let r = 1; r <= s.rounds; r++) {
      out.push({ type: 'work', dur: s.work, ex: e, round: r });
      if (r < s.rounds && s.rest > 0) out.push({ type: 'rest', dur: s.rest, ex: e, round: r });
    }
    if (e < list.length - 1 && s.restBetween > 0) out.push({ type: 'break', dur: s.restBetween, ex: e + 1 });
  });
  return out;
}

/** Trainingstag aus dem Plan starten. */
const startDay = (i) => startWorkout(resolveDay(plan[i]).map((r) => r.ex), { day: i, title: T.days[i], label: plan[i].focus, kind: 'plan' });

/** meta: { day, title, label, kind } – label landet im Verlauf. */
function startWorkout(list, meta) {
  if (!list.length) return;
  Object.assign(W, { meta, list, phases: buildPhases(list), i: 0, running: false, finished: false, startedAt: 0, shown: null, lastSec: 0 });
  // Fortschrittsbalken: ein Segment pro Übung, gefüllt nach Belastungs- und Pausenzeit
  W.total = list.map((_, e) => W.phases.reduce((s, p) => s + ((p.type === 'work' || p.type === 'rest') && p.ex === e ? p.dur : 0), 0));
  wo('bar').innerHTML = list.map(() => '<i><b></b></i>').join('');
  W.left = W.phases[0].dur * 1000;
  $('#workout').hidden = false;
  document.body.classList.add('noscroll');
  showPhase();
  drawTime(W.left);
  updateToggle();
}

function showPhase() {
  const ph = W.phases[W.i], ex = W.list[ph.ex];
  $('#workout').dataset.phase = ph.type;
  wo('phase').textContent = T.phase[ph.type];
  wo('ex').textContent = T.wo.exOf(ph.ex + 1, W.list.length);
  wo('round').textContent = ph.round ? T.wo.roundOf(ph.round, settings.rounds) : ph.type === 'prep' ? T.wo.soon : T.wo.nextEx;
  if (W.shown !== ex.id) { // Name, Beschreibung und Equipment nur bei Übungswechsel neu setzen
    W.shown = ex.id;
    wo('name').textContent = ex.name;
    wo('desc').textContent = ex.desc.split('. ')[0].replace(/\.$/, '') + '.'; // nur der erste Satz
    wo('equip').innerHTML = equipChips(ex);
  }
}

function drawBar(rem) {
  const segs = wo('bar').children, part = W.phases[W.i].dur - Math.max(0, rem) / 1000, spent = [];
  W.phases.forEach((p, k) => {
    if (p.type === 'work' || p.type === 'rest') spent[p.ex] = (spent[p.ex] || 0) + (k < W.i ? p.dur : k === W.i ? part : 0);
  });
  W.total.forEach((total, e) => { segs[e].firstChild.style.transform = `scaleX(${Math.min(1, (spent[e] || 0) / total)})`; });
}

function drawTime(rem) {
  drawBar(rem);
  const ph = W.phases[W.i];
  wo('time').textContent = Math.max(0, Math.ceil(rem / 1000));
  wo('ring').style.strokeDashoffset = RING * (1 - Math.max(0, rem) / (ph.dur * 1000));
  $('#workout').classList.toggle('warn', ph.type === 'work' && rem <= 3000);
}

function updateToggle() {
  wo('toggle').textContent = W.finished ? T.wo.finish : W.running ? T.wo.pause : W.startedAt ? T.wo.resume : T.wo.start;
  wo('skip').disabled = W.finished;
}

function enterPhase() {
  const ph = W.phases[W.i];
  showPhase();
  if (ph.type === 'work') {
    Sound.beep(660, 0.5); Sound.beep(990, 0.7, 0.14); // aufsteigend: los
    if (ph.round === 1) say(T.say.go);
  } else {
    Sound.beep(660, 0.5); Sound.beep(440, 0.7, 0.14); // absteigend: Pause
    if (ph.type === 'break') say(T.say.next(W.list[ph.ex].name));
  }
}

/** Nächste Phase; Endzeit wird fortgeschrieben, damit der Timer nicht driftet. */
function advance(fromNow) {
  if (W.i >= W.phases.length - 1) { finish(); return false; }
  W.i++;
  const dur = W.phases[W.i].dur * 1000;
  W.endAt = (fromNow ? Date.now() : W.endAt) + dur;
  W.left = dur;
  W.lastSec = 0;
  enterPhase();
  return true;
}

function tick() {
  let rem = W.endAt - Date.now();
  while (rem <= 0) { // holt auch Phasen nach, wenn die App im Hintergrund war
    if (!advance(false)) return;
    rem = W.endAt - Date.now();
  }
  const sec = Math.ceil(rem / 1000);
  if (W.lastSec && sec < W.lastSec && sec <= 3) Sound.beep(784, 0.2); // 3, 2, 1
  W.lastSec = sec;
  drawTime(rem);
}

function resume() {
  Sound.unlock();
  if (!W.startedAt) { W.startedAt = Date.now(); say(T.say.start(W.list[0].name)); }
  W.endAt = Date.now() + W.left;
  W.running = true;
  clearInterval(W.timer);
  W.timer = setInterval(tick, 100);
  requestWakeLock();
  updateToggle();
}

function pause() {
  W.left = Math.max(0, W.endAt - Date.now());
  W.running = false;
  clearInterval(W.timer);
  updateToggle();
}

function skip() {
  if (W.finished) return;
  if (W.running) return void advance(true);
  if (W.i >= W.phases.length - 1) return;
  W.i++;
  W.left = W.phases[W.i].dur * 1000;
  W.lastSec = 0;
  showPhase();
  drawTime(W.left);
}

/** Abschluss: Tag als erledigt markieren (Streak) und Eintrag im Verlauf speichern. */
function finish() {
  clearInterval(W.timer);
  Object.assign(W, { running: false, finished: true });
  const secs = Math.round((Date.now() - (W.startedAt || Date.now())) / 1000);
  const key = dayKey(new Date()), prev = done[key];
  done[key] = { day: W.meta.day, secs: (prev?.secs || 0) + secs, count: (prev?.count || 0) + 1 };
  store.set('done', done);
  log.push({ key, ts: Date.now(), day: W.meta.day, focus: W.meta.label || '', secs, n: 1, ex: W.list.map((e) => e.id), kind: W.meta.kind });
  store.set('log', log);

  $('#workout').dataset.phase = 'done';
  $('#workout').classList.remove('warn');
  wo('phase').textContent = T.wo.doneTitle;
  wo('ex').textContent = W.meta.title;
  wo('round').textContent = '';
  wo('name').textContent = T.wo.doneName;
  wo('desc').textContent = T.wo.doneDesc(W.list.length, Math.round(secs / 60));
  wo('equip').innerHTML = '';
  wo('time').textContent = '✓';
  wo('ring').style.strokeDashoffset = 0;
  [523, 659, 784, 1047].forEach((f, i) => Sound.beep(f, 0.6, i * 0.15)); // Dur-Akkord aufwärts
  drawBar(0);
  say(T.say.done);
  releaseWakeLock();
  updateToggle();
}

function closeWorkout() {
  clearInterval(W.timer);
  W.running = false;
  Sound.release();
  releaseWakeLock();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $('#workout').hidden = true;
  document.body.classList.remove('noscroll');
  render();
}

function abortWorkout() {
  if (W.finished || !W.startedAt) return closeWorkout();
  const wasRunning = W.running;
  if (wasRunning) pause();
  if (confirm(T.confirm.abort)) closeWorkout();
  else if (wasRunning) resume();
}

wo('toggle').addEventListener('click', () => (W.finished ? closeWorkout() : W.running ? pause() : resume()));
wo('skip').addEventListener('click', skip);
wo('abort').addEventListener('click', abortWorkout);
wo('close').addEventListener('click', abortWorkout);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && W.running) { tick(); requestWakeLock(); }
});

// ---------- Start ----------
window.addEventListener('hashchange', route);
render(true);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
