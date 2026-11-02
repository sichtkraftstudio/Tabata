/* app.js – Logik der Tabata-PWA: Ansichten, Timer, Fortschritt, Einstellungen. */
'use strict';

const DAY_NAMES = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const PREP = 10; // Sekunden „Bereit machen" vor der ersten Übung
const DEFAULT_SETTINGS = {
  work: 20, rest: 10, rounds: 8, restBetween: 60, sound: true, voice: false,
  equipment: Object.fromEntries(Object.keys(EQUIPMENT).map((k) => [k, true])),
};

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
};

function loadPlan() {
  const saved = store.get('plan', null);
  const valid = Array.isArray(saved) && saved.length === 7 && saved.every((d) => ['training', 'rest'].includes(d?.type));
  const plan = valid ? saved : structuredClone(DEFAULT_PLAN);
  plan.forEach((d) => { d.exercises = (d.exercises || []).filter((id) => EX[id]); });
  return plan;
}

const saved = store.get('settings', {});
let settings = { ...DEFAULT_SETTINGS, ...saved, equipment: { ...DEFAULT_SETTINGS.equipment, ...saved.equipment } };
let plan = loadPlan();
let done = store.get('done', {});
const saveSettings = () => store.set('settings', settings);
const savePlan = () => store.set('plan', plan);

// ---------- Datum ----------
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const weekday = (d) => (d.getDay() + 6) % 7; // Montag = 0
function weekDates() {
  const now = new Date();
  return DAY_NAMES.map((_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekday(now) + i));
}

// ---------- Fortschritt ----------
/** Tage in Folge, an denen trainiert wurde oder Ruhetag war. Heute zählt erst, wenn erledigt. */
function streak() {
  const keys = Object.keys(done).sort();
  if (!keys.length) return 0;
  const ok = (d) => done[dayKey(d)] || plan[weekday(d)].type === 'rest';
  const d = new Date();
  if (!ok(d)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (dayKey(d) >= keys[0] && ok(d)) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function stats() {
  const week = weekDates().map((d) => done[dayKey(d)]).filter(Boolean);
  return {
    weekDone: week.length,
    weekPlanned: plan.filter((d) => d.type === 'training').length,
    minutes: Math.round(week.reduce((s, x) => s + x.secs, 0) / 60),
    streak: streak(),
  };
}

const workoutSecs = (n) => PREP + n * (settings.rounds * settings.work + (settings.rounds - 1) * settings.rest) + (n - 1) * settings.restBetween;

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

// ---------- Plan neu mischen ----------
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

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
  const count = {};
  out.filter((e) => category(e.group) === 'oben').forEach((e) => { count[e.group] = (count[e.group] || 0) + 1; });
  const top = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 2).map((g) => GROUPS[g]);
  return { exercises: out.map((e) => e.id), focus: (top.length > 1 ? top : [...top, 'Arme']).join(' & ') };
}

function shufflePlan() {
  const used = new Set();
  plan = plan.map((d) => (d.type === 'training' ? { ...d, ...generateDay(used) } : d));
  savePlan();
}

// ---------- Illustration (optional eigenes Bild mit SVG-Fallback) ----------
function illo(ex, animate = false) {
  return ex.image
    ? `<img src="${esc(ex.image)}" alt="${esc(ex.name)}" data-ex="${ex.id}" data-anim="${animate ? 1 : 0}">`
    : Illu.svg(ex, { animate });
}
document.addEventListener('error', (e) => { // Bild fehlt → SVG anzeigen
  const img = e.target;
  if (img.tagName === 'IMG' && img.dataset.ex) img.outerHTML = Illu.svg(EX[img.dataset.ex], { animate: img.dataset.anim === '1' });
}, true);

const equipChips = (ex) => ex.equipment.map((k) => `<span class="eq">${Illu.icon(k)}${EQUIPMENT[k]}</span>`).join('');

// ---------- Ansicht: Woche ----------
const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';

function exRow({ ex, replaced, missing }, n) {
  return `<li><button class="exrow" data-ex="${ex.id}">
    <span class="num">${n + 1}</span>
    <span class="illu thumb">${illo(ex)}</span>
    <span class="exrow-text"><strong>${esc(ex.name)}</strong>
      <small>${GROUPS[ex.group]} · ${ex.equipment.map((k) => EQUIPMENT[k]).join(', ')}</small>
      ${replaced ? `<small class="sub">Ersatz für ${esc(replaced.name)}</small>` : ''}
      ${missing ? '<small class="miss">Equipment fehlt, kein Ersatz gefunden</small>' : ''}
    </span></button></li>`;
}

function renderWeek() {
  const dates = weekDates(), today = weekday(new Date()), st = stats();
  const cards = plan.map((day, i) => {
    const isToday = i === today, isDone = Boolean(done[dayKey(dates[i])]);
    const date = dates[i].toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
    const head = `<header class="day-head"><div>
        <h2>${DAY_NAMES[i]}${isToday ? ' <span class="badge">Heute</span>' : ''}</h2>
        <p class="muted">${date}${day.type === 'training' ? ` · ${esc(day.focus || '')}` : ''}</p>
      </div>${isDone ? '<span class="check" aria-label="Erledigt">✓</span>' : ''}</header>`;
    if (day.type === 'rest') {
      return `<article class="day rest${isToday ? ' today' : ''}" id="tag-${i}">${head}
        <div class="rest-body">${MOON}<div><strong>Ruhetag · Erholung</strong>
        <p>Kein Training, der Körper regeneriert. Optional: 10 bis 20 Minuten leichte Mobilisation oder ein entspannter Spaziergang.</p></div></div></article>`;
    }
    const rows = resolveDay(day);
    return `<article class="day${isToday ? ' today' : ''}" id="tag-${i}">${head}
      <ul class="exlist">${rows.map(exRow).join('')}</ul>
      <button class="btn primary wide" data-start="${i}">${isDone ? 'Nochmal trainieren' : 'Training starten'} · ${Math.round(workoutSecs(rows.length) / 60)} Min</button>
    </article>`;
  }).join('');

  view.innerHTML = `
    <section class="stats">
      <div class="stat"><b>${st.weekDone}/${st.weekPlanned}</b><span>Trainings diese Woche</span></div>
      <div class="stat"><b>${st.streak}</b><span>Tage Streak</span></div>
      <div class="stat"><b>${st.minutes}</b><span>Minuten diese Woche</span></div>
    </section>
    <div class="days">${cards}</div>
    <button class="btn ghost wide shuffle" data-action="shuffle">Plan neu mischen</button>`;
}

// ---------- Ansicht: Übungsbibliothek ----------
const lib = { group: 'alle', equip: 'alle' };

function renderLibrary() {
  const chips = (key, entries) => `<div class="chips">${entries.map(([v, label]) =>
    `<button class="chip${lib[key] === v ? ' on' : ''}" data-filter="${key}" data-value="${v}">${label}</button>`).join('')}</div>`;
  const list = EXERCISES.filter((e) => (lib.group === 'alle' || e.group === lib.group) && (lib.equip === 'alle' || e.equipment.includes(lib.equip)));
  view.innerHTML = `
    ${chips('group', [['alle', 'Alle Muskeln'], ...Object.entries(GROUPS)])}
    ${chips('equip', [['alle', 'Alles Equipment'], ...Object.entries(EQUIPMENT).map(([k, l]) => [k, Illu.icon(k) + l])])}
    <p class="muted small">${list.length} Übungen</p>
    <div class="grid">${list.map((e) => `<button class="card-ex" data-ex="${e.id}">
      <span class="illu">${illo(e)}</span><strong>${esc(e.name)}</strong>
      <small class="muted">${GROUPS[e.group]}</small><span class="icons">${e.equipment.map(Illu.icon).join('')}</span>
    </button>`).join('')}</div>`;
}

// ---------- Ansicht: Einstellungen ----------
function renderSettings() {
  const num = (key, label, min, max, unit) => `<label class="row"><span>${label}</span>
    <span class="num-input"><input type="number" inputmode="numeric" min="${min}" max="${max}" value="${settings[key]}" data-setting="${key}">${unit}</span></label>`;
  const toggle = (attr, on, label) => `<label class="row"><span>${label}</span>
    <span class="switch"><input type="checkbox" ${attr}${on ? ' checked' : ''}><i></i></span></label>`;
  view.innerHTML = `
    <section class="panel"><h3>Timer</h3>
      ${num('work', 'Belastung', 5, 120, 's')}${num('rest', 'Pause', 0, 120, 's')}
      ${num('rounds', 'Runden pro Übung', 1, 20, '')}${num('restBetween', 'Pause zwischen Übungen', 0, 300, 's')}
      <p class="muted small">Ein Training mit 8 Übungen dauert so ca. ${Math.round(workoutSecs(8) / 60)} Minuten.</p></section>
    <section class="panel"><h3>Ton</h3>
      ${toggle('data-setting="sound"', settings.sound, 'Piepstöne')}${toggle('data-setting="voice"', settings.voice, 'Sprachansage')}</section>
    <section class="panel"><h3>Equipment</h3>
      <p class="muted small">Deaktiviertes Equipment wird im Plan durch passende Ersatzübungen ersetzt.</p>
      ${Object.entries(EQUIPMENT).map(([k, l]) => toggle(`data-equip="${k}"`, settings.equipment[k] !== false, Illu.icon(k) + l)).join('')}</section>
    <section class="panel"><h3>Trainings- und Ruhetage</h3>
      ${plan.map((d, i) => `<label class="row"><span>${DAY_NAMES[i]}</span><select data-daytype="${i}">
        <option value="training"${d.type === 'training' ? ' selected' : ''}>Training</option>
        <option value="rest"${d.type === 'rest' ? ' selected' : ''}>Ruhetag</option></select></label>`).join('')}</section>
    <section class="panel stack"><h3>Plan & Daten</h3>
      <button class="btn" data-action="shuffle">Plan neu mischen</button>
      <button class="btn ghost" data-action="reset-plan">Standardplan wiederherstellen</button>
      <button class="btn danger" data-action="reset-progress">Fortschritt löschen</button></section>`;
}

// ---------- Navigation ----------
const VIEWS = { woche: renderWeek, bibliothek: renderLibrary, einstellungen: renderSettings };
const TITLES = { woche: 'Wochenplan', bibliothek: 'Übungen', einstellungen: 'Einstellungen' };

function route() {
  const name = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'woche';
  $('#title').textContent = TITLES[name];
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.hash === '#' + name));
  VIEWS[name]();
}

function action(name) {
  if (name === 'shuffle') {
    if (!confirm('Neuen Wochenplan für alle Trainingstage erzeugen?')) return;
    shufflePlan();
  } else if (name === 'reset-plan') {
    if (!confirm('Standardplan wiederherstellen? Eigene Änderungen gehen verloren.')) return;
    plan = structuredClone(DEFAULT_PLAN);
    savePlan();
  } else if (name === 'reset-progress') {
    if (!confirm('Alle erledigten Trainings und den Streak löschen?')) return;
    done = {};
    store.set('done', done);
  }
  route();
}

view.addEventListener('click', (e) => {
  const t = e.target.closest('[data-ex],[data-start],[data-action],[data-filter]');
  if (!t) return;
  if (t.dataset.ex) openSheet(t.dataset.ex);
  else if (t.dataset.start) startWorkout(Number(t.dataset.start));
  else if (t.dataset.filter) { lib[t.dataset.filter] = t.dataset.value; renderLibrary(); }
  else action(t.dataset.action);
});

view.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.setting) {
    if (el.type === 'checkbox') settings[el.dataset.setting] = el.checked;
    else settings[el.dataset.setting] = Math.min(+el.max, Math.max(+el.min, parseInt(el.value, 10) || 0));
  } else if (el.dataset.equip) {
    settings.equipment[el.dataset.equip] = el.checked;
  } else if (el.dataset.daytype) {
    const day = plan[+el.dataset.daytype];
    day.type = el.value;
    if (day.type === 'training' && !day.exercises.length) { // neuer Trainingstag → Übungen erzeugen
      Object.assign(day, generateDay(new Set(plan.flatMap((d) => (d.type === 'training' ? d.exercises : [])))));
    }
    savePlan();
  }
  saveSettings();
  renderSettings();
});

// ---------- Übungsdetails ----------
function openSheet(id) {
  const ex = EX[id];
  $('#sheet-body').innerHTML = `<span class="illu big">${illo(ex, true)}</span>
    <h2>${esc(ex.name)}</h2><p class="muted">${GROUPS[ex.group]}</p>
    <div class="equip-list">${equipChips(ex)}</div><p>${esc(ex.desc)}</p>
    ${ex.tip ? `<p class="tip">${esc(ex.tip)}</p>` : ''}`;
  $('#sheet').showModal();
}
$('#sheet').addEventListener('click', (e) => { if (e.target === e.currentTarget || e.target.closest('.sheet-close')) e.currentTarget.close(); });

// ---------- Ton, Sprache, Bildschirm-Sperre ----------
const Sound = {
  ctx: null,
  unlock() { // muss in einer Nutzeraktion passieren (iOS)
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!this.ctx && AC) this.ctx = new AC();
    this.ctx?.resume();
  },
  beep(freq = 880, dur = 0.12, delay = 0) {
    if (!settings.sound || !this.ctx) return;
    const t = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
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
    if ('wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch { wakeLock = null; }
}
function releaseWakeLock() { wakeLock?.release().catch(() => {}); wakeLock = null; }

// ---------- Training (Timer) ----------
const W = { list: [], phases: [], i: 0, endAt: 0, left: 0, running: false, timer: 0, lastSec: 0, shown: null, day: 0, startedAt: 0, finished: false };
const wo = (id) => document.getElementById('wo-' + id);
const RING = 2 * Math.PI * 54;
const PHASE_LABEL = { prep: 'Bereit machen', work: 'Belastung', rest: 'Pause', break: 'Pause · Als Nächstes' };

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

function startWorkout(dayIdx) {
  const list = resolveDay(plan[dayIdx]).map((r) => r.ex);
  Object.assign(W, { day: dayIdx, list, phases: buildPhases(list), i: 0, running: false, finished: false, startedAt: 0, shown: null, lastSec: 0 });
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
  wo('phase').textContent = PHASE_LABEL[ph.type];
  wo('ex').textContent = `Übung ${ph.ex + 1} von ${W.list.length}`;
  wo('round').textContent = ph.round ? `Runde ${ph.round} von ${settings.rounds}` : ph.type === 'prep' ? 'Gleich geht es los' : 'Nächste Übung';
  if (W.shown !== ex.id) { // Illustration nur bei Übungswechsel neu setzen (Animation läuft weiter)
    W.shown = ex.id;
    wo('illu').innerHTML = illo(ex, true);
    wo('name').textContent = ex.name;
    wo('desc').textContent = ex.desc;
    wo('tip').textContent = ex.tip || '';
    wo('equip').innerHTML = equipChips(ex);
  }
}

function drawTime(rem) {
  const ph = W.phases[W.i];
  wo('time').textContent = Math.max(0, Math.ceil(rem / 1000));
  wo('ring').style.strokeDashoffset = RING * (1 - Math.max(0, rem) / (ph.dur * 1000));
  $('#workout').classList.toggle('warn', ph.type === 'work' && rem <= 3000);
}

function updateToggle() {
  wo('toggle').textContent = W.finished ? 'Fertig' : W.running ? 'Pause' : W.startedAt ? 'Weiter' : 'Start';
  wo('skip').disabled = W.finished;
}

function enterPhase() {
  const ph = W.phases[W.i];
  showPhase();
  if (ph.type === 'work') {
    Sound.beep(1320, 0.4);
    if (ph.round === 1) say('Los');
  } else {
    Sound.beep(660, 0.35);
    if (ph.type === 'break') say('Pause. Als Nächstes: ' + W.list[ph.ex].name);
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
  if (W.lastSec && sec < W.lastSec && sec <= 3) Sound.beep(880, 0.12); // 3, 2, 1
  W.lastSec = sec;
  drawTime(rem);
}

function resume() {
  Sound.unlock();
  if (!W.startedAt) { W.startedAt = Date.now(); say('Los geht es. Erste Übung: ' + W.list[0].name); }
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

function finish() {
  clearInterval(W.timer);
  Object.assign(W, { running: false, finished: true });
  const secs = Math.round((Date.now() - (W.startedAt || Date.now())) / 1000);
  const key = dayKey(new Date()), prev = done[key];
  done[key] = { day: W.day, secs: (prev?.secs || 0) + secs, count: (prev?.count || 0) + 1 };
  store.set('done', done);

  $('#workout').dataset.phase = 'done';
  $('#workout').classList.remove('warn');
  wo('phase').textContent = 'Geschafft!';
  wo('ex').textContent = DAY_NAMES[W.day];
  wo('round').textContent = '';
  wo('name').textContent = 'Training abgeschlossen';
  wo('desc').textContent = `${W.list.length} Übungen in ${Math.round(secs / 60)} Minuten. Stark!`;
  wo('tip').textContent = '';
  wo('equip').innerHTML = '';
  wo('time').textContent = '✓';
  wo('ring').style.strokeDashoffset = 0;
  [0, 0.2, 0.4].forEach((d) => Sound.beep(1320, 0.15, d));
  say('Geschafft. Super Training!');
  releaseWakeLock();
  updateToggle();
}

function closeWorkout() {
  clearInterval(W.timer);
  W.running = false;
  releaseWakeLock();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $('#workout').hidden = true;
  wo('illu').innerHTML = '';
  document.body.classList.remove('noscroll');
  route();
}

function abortWorkout() {
  if (W.finished || !W.startedAt) return closeWorkout();
  const wasRunning = W.running;
  if (wasRunning) pause();
  if (confirm('Training wirklich abbrechen?')) closeWorkout();
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
route();
if (weekday(new Date()) > 0) document.getElementById('tag-' + weekday(new Date()))?.scrollIntoView({ block: 'start' });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
