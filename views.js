/* views.js – die fünf Tabs (Start, Training, Wochenplan, Fortschritt, Profil) und ihre Bausteine.
 * Wird vor app.js geladen. Zustand (plan, done, log, settings …) und Aktionen liegen in app.js,
 * alle Texte in texts.js. Jede render*-Funktion füllt #view und liefert { title, back? }.
 */
'use strict';

// ---------- Symbole ----------
const SVG = (cls, d) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICON = {
  moon: SVG('i-fill', '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  check: SVG('i-line', '<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  up: SVG('i-line', '<path d="M6 15l6-6 6 6"/>'),
  down: SVG('i-line', '<path d="M6 9l6 6 6-6"/>'),
  prev: SVG('i-line', '<path d="M15 6l-6 6 6 6"/>'),
  next: SVG('i-line', '<path d="M9 6l6 6-6 6"/>'),
};

// ---------- Gemeinsame Bausteine ----------
/** Übungsbild: eigenes Bild (Feld `image`) oder SVG-Illustration. */
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
const equipIcons = (keys) => `<span class="icons" role="img" aria-label="${esc(keys.map((k) => EQUIPMENT[k]).join(', '))}">${keys.map((k) => Illu.icon(k)).join('')}</span>`;
const uniqueEquip = (list) => [...new Set(list.flatMap((e) => e.equipment))];
const mins = (secs) => Math.max(1, Math.round(secs / 60));
const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const thumbs = (list, n = 4) => `<div class="thumbs">${list.slice(0, n).map((e) => `<span class="illu thumb">${illo(e)}</span>`).join('')}${list.length > n ? `<span class="more">+${list.length - n}</span>` : ''}</div>`;

/** „Heute", „Gestern" oder „Mo., 2. Nov." für einen Tagesschlüssel. */
function dateLabel(key) {
  const diff = Math.round((parseKey(dayKey(new Date())) - parseKey(key)) / 864e5);
  if (diff === 0) return T.today;
  if (diff === 1) return T.yesterday;
  return parseKey(key).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Übungszeile; plain = ohne Antippen (z. B. im Verlauf). */
function exRow({ ex, replaced, missing }, n, plain = false) {
  const tag = plain ? 'div' : 'button';
  return `<li><${tag} class="exrow"${plain ? '' : ` data-act="ex" data-id="${ex.id}"`}>
    <span class="num">${n + 1}</span>
    <span class="illu thumb">${illo(ex)}</span>
    <span class="exrow-text"><strong>${esc(ex.name)}</strong>
      <small>${GROUPS[ex.group]} · ${ex.equipment.map((k) => EQUIPMENT[k]).join(', ')}</small>
      ${replaced ? `<small class="sub">${T.substituteFor(esc(replaced.name))}</small>` : ''}
      ${missing ? `<small class="miss">${T.noSubstitute}</small>` : ''}
    </span></${tag}></li>`;
}

const restBody = () => `<div class="rest-body">${ICON.moon}<div><strong>${T.rest.title}</strong><p>${T.rest.text}</p></div></div>`;
const toggle = (attrs, on, label) => `<label class="row"><span>${label}</span><span class="switch"><input type="checkbox" ${attrs}${on ? ' checked' : ''}><i></i></span></label>`;
const numInput = (key, label, min, max, unit) => `<label class="row"><span>${label}</span>
  <span class="num-input"><input type="number" inputmode="numeric" min="${min}" max="${max}" value="${settings[key]}" data-chg="num" data-k="${key}">${unit}</span></label>`;

/** Filter-Chips (Muskelgruppe, Equipment) für Bibliothek und Auswahl-Dialog. */
function filterChips(state, act) {
  const row = (key, entries) => `<div class="chips">${entries.map(([v, label]) =>
    `<button class="chip${state[key] === v ? ' on' : ''}" data-act="${act}" data-k="${key}" data-v="${v}">${label}</button>`).join('')}</div>`;
  return row('group', [['alle', T.lib.allGroups], ...Object.entries(GROUPS)])
    + row('equip', [['alle', T.lib.allEquip], ...Object.entries(EQUIPMENT).map(([k, l]) => [k, Illu.icon(k) + l])]);
}
const searchBox = (state, name) => `<input type="search" class="search" data-in="${name}" value="${esc(state.q)}" placeholder="${T.lib.search}" aria-label="${T.lib.search}" enterkeyhint="search">`;
const exMatches = (s, e) => (s.group === 'alle' || e.group === s.group) && (s.equip === 'alle' || e.equipment.includes(s.equip))
  && e.name.toLowerCase().includes(s.q.trim().toLowerCase());
const exCard = (e, act, note = '', disabled = false) => `<button class="card-ex${available(e) ? '' : ' na'}" data-act="${act}" data-id="${e.id}"${disabled ? ' disabled' : ''}>
  <span class="illu">${illo(e)}</span><strong>${esc(e.name)}</strong>
  <small class="muted">${GROUPS[e.group]}</small>
  <span class="icons">${e.equipment.map((k) => Illu.icon(k)).join('')}</span>${note ? `<small class="note">${note}</small>` : ''}</button>`;

/** Workout-Karte (Tagesworkout oder Kurzeinheit). */
function workoutCard({ title, sub, list, btn, isDone, isToday }) {
  return `<article class="day wcard${isToday ? ' today' : ''}">
    <header class="day-head"><div>
      <h3>${esc(title)}${isToday ? ` <span class="badge">${T.today}</span>` : ''}</h3><p class="muted">${sub}</p></div>
      ${isDone ? `<span class="check" role="img" aria-label="${T.done}">${ICON.check}</span>` : ''}</header>
    ${thumbs(list)}
    <div class="eqrow">${equipIcons(uniqueEquip(list))}</div>
    <details><summary>${T.training.allEx}</summary><ul class="exlist slim">${list.map((ex, n) => `<li><button class="exrow" data-act="ex" data-id="${ex.id}">
      <span class="num">${n + 1}</span><span class="exrow-text"><strong>${esc(ex.name)}</strong><small>${GROUPS[ex.group]}</small></span></button></li>`).join('')}</ul></details>
    ${btn}</article>`;
}

// =====================================================================
// TAB START
// =====================================================================
function renderStart() {
  const now = new Date(), wd = weekday(now), day = plan[wd], isDone = Boolean(done[dayKey(now)]);
  const st = stats(), name = profile.name.trim();

  let hero;
  if (day.type === 'training') {
    const list = resolveDay(day).map((r) => r.ex);
    let hint = '';
    if (settings.reminder && !isDone) {
      const late = now.getHours() * 60 + now.getMinutes() >= toMinutes(settings.reminder);
      hint = `<p class="hint">${late ? T.start.reminderLate(settings.reminder) : T.start.reminderAt(settings.reminder)}</p>`;
    }
    hero = `<article class="hero">
      <p class="eyebrow">${isDone ? T.start.heroDone : T.start.heroToday}</p>
      <h2>${esc(day.focus)}</h2>
      <ul class="meta"><li>${T.minutes(mins(workoutSecs(list.length)))}</li><li>${T.exercises(list.length)}</li><li>${equipIcons(uniqueEquip(list))}</li></ul>
      ${thumbs(list)}
      <button class="btn primary big wide" data-act="start-day" data-i="${wd}">${isDone ? T.again : T.start.startBtn}</button>
      ${hint}</article>`;
  } else {
    hero = `<article class="hero rest"><p class="eyebrow">${T.start.heroRest}</p>${restBody()}</article>`;
  }

  const reached = st.weekDays >= profile.weekGoal, pct = Math.min(100, Math.round((st.weekDays / profile.weekGoal) * 100));
  const goalChips = Object.keys(T.goals).filter((g) => profile.goals[g]).map((g) => `<span class="pill">${T.goals[g]}</span>`).join('');
  const goal = `<section class="card goal${reached ? ' reached' : ''}">
    <div class="goal-head"><strong>${T.start.weekGoal}</strong><span>${T.start.goalOf(st.weekDays, profile.weekGoal)}</span></div>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${profile.weekGoal}" aria-valuenow="${Math.min(st.weekDays, profile.weekGoal)}"><i style="width:${pct}%"></i></div>
    <p class="muted">${reached ? T.start.goalReached : T.start.goalLeft(profile.weekGoal - st.weekDays)}</p>
    ${goalChips ? `<div class="pills">${goalChips}</div>` : ''}</section>`;

  const strip = weekDates().map((d, i) => {
    const k = dayKey(d), isRest = plan[i].type === 'rest';
    return `<a class="wd${i === wd ? ' today' : ''}${done[k] ? ' done' : ''}${isRest ? ' rest' : ''}" href="#/wochenplan/${i}"
      aria-label="${T.days[i]}, ${done[k] ? T.done : isRest ? T.rest.short : T.start.open}">
      <span>${T.daysShort[i]}</span><b>${d.getDate()}</b><i>${done[k] ? ICON.check : isRest ? ICON.moon : ''}</i></a>`;
  }).join('');

  const recent = log.map((e, i) => [e, i]).slice(-5).reverse();
  const recentHtml = recent.length
    ? `<ul class="recents">${recent.map(([e, i]) => `<li><button class="recent" data-act="log" data-i="${i}">
        <span class="r-date">${dateLabel(e.key)}</span>
        <span class="r-main"><strong>${esc(e.focus || T.workout)}</strong><small class="muted">${T.exercises((e.ex || []).length)}</small></span>
        <span class="r-dur">${T.min(mins(e.secs))}</span></button></li>`).join('')}</ul>`
    : `<p class="empty">${T.start.noRecent}</p>`;

  const tiles = Object.entries(GROUPS).map(([g, label]) => {
    const rep = EXERCISES.find((e) => e.group === g && available(e)) || EXERCISES.find((e) => e.group === g);
    return `<button class="tile" data-act="area" data-g="${g}"><span class="illu">${illo(rep)}</span><strong>${label}</strong></button>`;
  }).join('');

  view.innerHTML = `
    <header class="hello"><p class="muted">${now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h2>${T.greeting(now.getHours())}${name ? `, ${esc(name)}` : ''}</h2></header>
    ${hero}${goal}
    <section><h3 class="sec">${T.start.week}</h3><div class="strip">${strip}</div></section>
    <section><h3 class="sec">${T.start.recent}</h3>${recentHtml}</section>
    <section><h3 class="sec">${T.start.areas}</h3><div class="tiles">${tiles}</div></section>
    <section><h3 class="sec">${T.start.progress}</h3><div class="stats">
      <div class="stat"><b>${st.current}</b><span>${T.stat.streak}</span></div>
      <div class="stat"><b>${st.weekDays}/${profile.weekGoal}</b><span>${T.stat.weekWorkouts}</span></div>
      <div class="stat"><b>${st.totalMinutes}</b><span>${T.stat.totalMinutes}</span></div></div></section>`;
  return { title: T.tabs.start };
}

// =====================================================================
// TAB TRAINING (Workouts · Übungen · Pläne)
// =====================================================================
const SEGS = ['workouts', 'uebungen', 'plaene'];
const lib = { group: 'alle', equip: 'alle', q: '' };

function renderTraining(sub, arg, fresh) {
  const seg = SEGS.includes(sub) ? sub : 'workouts';
  if (fresh && seg === 'uebungen' && GROUPS[arg]) Object.assign(lib, { group: arg, equip: 'alle', q: '' }); // Aufruf aus einer Kachel
  const body = { workouts: trainWorkouts, uebungen: trainLibrary, plaene: trainPlans }[seg]();
  view.innerHTML = `<nav class="seg" aria-label="${T.training.segLabel}">${SEGS.map((s) =>
    `<a href="#/training/${s}"${s === seg ? ' class="on" aria-current="page"' : ''}>${T.training.segs[s]}</a>`).join('')}</nav>${body}`;
  return { title: T.tabs.training };
}

function trainWorkouts() {
  const today = weekday(new Date()), dates = weekDates();
  const days = plan.map((d, i) => {
    if (d.type !== 'training') return '';
    const list = resolveDay(d).map((r) => r.ex);
    return workoutCard({
      title: d.focus, sub: `${T.days[i]} · ${T.exercises(list.length)} · ${T.minutes(mins(workoutSecs(list.length)))}`, list,
      btn: `<button class="btn primary wide" data-act="start-day" data-i="${i}">${T.start.startBtn}</button>`,
      isDone: Boolean(done[dayKey(dates[i])]), isToday: i === today,
    });
  }).join('');
  const quick = Object.keys(GROUPS).map((g) => {
    const list = quickList(g);
    if (!list.length) return `<article class="day"><h3>${T.training.only(GROUPS[g])}</h3><p class="muted">${T.training.noEquip}</p></article>`;
    return workoutCard({
      title: T.training.only(GROUPS[g]), sub: `${T.exercises(list.length)} · ${T.minutes(mins(workoutSecs(list.length)))}`, list,
      btn: `<button class="btn primary wide" data-act="start-quick" data-g="${g}">${T.start.startBtn}</button>`,
    });
  }).join('');
  return `<h3 class="sec">${T.training.planDays(esc(planName()))}</h3>
    ${days ? `<div class="days">${days}</div>` : `<p class="empty">${T.training.noDays}</p>`}
    <h3 class="sec">${T.training.quick}</h3><p class="muted">${T.training.quickHint(QUICK_COUNT)}</p><div class="days">${quick}</div>`;
}

const libResults = () => {
  const list = EXERCISES.filter((e) => exMatches(lib, e));
  return `<p class="muted small">${T.lib.count(list.length)}</p>`
    + (list.length ? `<div class="grid">${list.map((e) => exCard(e, 'ex', available(e) ? '' : T.lib.noEquip)).join('')}</div>` : `<p class="empty">${T.lib.none}</p>`);
};
const trainLibrary = () => `${searchBox(lib, 'lib')}${filterChips(lib, 'lib-filter')}<div id="lib-results">${libResults()}</div>`;

function trainPlans() {
  const rows = plans.map((p) => {
    const active = p.id === activePlan, n = p.days.filter((d) => d.type === 'training').length;
    return `<li class="plan${active ? ' on' : ''}"><div class="plan-main"><strong>${esc(p.name)}</strong>
        <small class="muted">${T.plans.summary(n)}</small></div>
      <div class="plan-actions">${active ? `<span class="badge">${T.plans.active}</span>` : `<button class="btn" data-act="plan-switch" data-id="${p.id}">${T.plans.use}</button>`}
        <button class="btn ghost" data-act="plan-rename" data-id="${p.id}">${T.plans.rename}</button>
        ${active ? '' : `<button class="btn danger" data-act="plan-delete" data-id="${p.id}">${T.plans.delete}</button>`}</div></li>`;
  }).join('');
  const overview = plan.map((d, i) => `<li><span class="muted">${T.daysShort[i]}</span> ${d.type === 'rest' ? `<span class="muted">${T.rest.short}</span>` : esc(d.focus)}</li>`).join('');
  return `<section class="panel"><h3>${T.plans.current}: ${esc(planName())}</h3>
      <ul class="plain">${overview}</ul>
      <div class="stack"><a class="btn" href="#/wochenplan">${T.plans.edit}</a>
        <button class="btn" data-act="shuffle">${T.plans.shuffle}</button>
        <p class="muted small">${T.plans.shuffleHint}</p></div></section>
    <section class="panel"><h3>${T.plans.saved}</h3><ul class="plans">${rows}</ul>
      <div class="stack"><button class="btn primary" data-act="plan-save">${T.plans.saveAs}</button></div></section>`;
}

// =====================================================================
// TAB WOCHENPLAN (Übersicht + Tag bearbeiten)
// =====================================================================
const pick = { day: 0, pos: 0, group: 'alle', equip: 'alle', q: '' };
const otherDays = (id, i) => plan.map((d, j) => (j !== i && d.type === 'training' && d.exercises.includes(id) ? j : -1)).filter((j) => j >= 0);

function renderPlanTab(sub) {
  const i = sub === undefined ? -1 : Number(sub);
  if (Number.isInteger(i) && i >= 0 && i < 7) return renderDayEdit(i);

  const today = weekday(new Date()), dates = weekDates(), dups = duplicates();
  const dupBox = dups.length ? `<section class="notice"><strong>${T.rules.dupTitle}</strong><ul class="plain">${dups.map(([id, days]) =>
    `<li>${esc(EX[id].name)} <span class="muted">(${days.map((d) => T.daysShort[d]).join(', ')})</span></li>`).join('')}</ul></section>` : '';
  const cards = plan.map((d, i) => {
    const head = `<header class="day-head"><div><h2>${T.days[i]}${i === today ? ` <span class="badge">${T.today}</span>` : ''}</h2>
      <p class="muted">${dates[i].toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} · ${d.type === 'rest' ? T.rest.short : esc(d.focus)}</p></div>
      <span class="chev">${ICON.next}</span></header>`;
    if (d.type === 'rest') return `<a class="day rest daylink" href="#/wochenplan/${i}">${head}</a>`;
    const issues = dayIssues(d);
    return `<a class="day daylink${i === today ? ' today' : ''}" href="#/wochenplan/${i}">${head}
      ${issues.length ? `<ul class="issues">${issues.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
      <div class="tgrid">${resolveDay(d).map(({ ex }) => `<span class="tcell"><span class="illu">${illo(ex)}</span><small>${esc(ex.name)}</small></span>`).join('')}</div></a>`;
  }).join('');

  view.innerHTML = `
    <section class="panel"><h3>${T.plan.reminder}</h3>
      <label class="row"><span>${T.plan.reminderTime}</span>
        <span class="num-input"><input type="time" value="${settings.reminder}" data-chg="reminder" aria-label="${T.plan.reminderTime}">
        ${settings.reminder ? `<button class="btn ghost" data-act="reminder-clear">${T.plan.reminderClear}</button>` : ''}</span></label>
      <p class="muted small">${T.plan.reminderNote}</p></section>
    ${dupBox}
    <div class="days">${cards}</div>
    <button class="btn ghost wide shuffle" data-act="shuffle">${T.plans.shuffle}</button>`;
  return { title: T.tabs.wochenplan };
}

function renderDayEdit(i) {
  const d = plan[i];
  const typeRow = `<label class="row"><span>${T.plan.dayType}</span><select data-chg="daytype" data-i="${i}">
    <option value="training"${d.type === 'training' ? ' selected' : ''}>${T.plan.training}</option>
    <option value="rest"${d.type === 'rest' ? ' selected' : ''}>${T.rest.short}</option></select></label>`;
  const swapOpts = T.days.map((n, j) => (j === i ? '' : `<option value="${j}">${n} · ${plan[j].type === 'rest' ? T.rest.short : esc(plan[j].focus)}</option>`)).join('');
  const swap = `<section class="panel"><h3>${T.plan.swap}</h3><div class="row-inline">
    <select id="swap-target" aria-label="${T.plan.swap}">${swapOpts}</select>
    <button class="btn" data-act="swap" data-i="${i}">${T.plan.swapBtn}</button></div></section>`;

  if (d.type === 'rest') {
    view.innerHTML = `<section class="panel">${typeRow}</section><article class="day rest">${restBody()}</article>${swap}`;
    return { title: T.days[i], back: '#/wochenplan' };
  }
  const issues = dayIssues(d);
  const rows = d.exercises.map((id, n) => {
    const ex = EX[id], also = otherDays(id, i);
    return `<li class="editrow">
      <button class="exrow" data-act="replace" data-i="${i}" data-n="${n}">
        <span class="num">${n + 1}</span><span class="illu thumb">${illo(ex)}</span>
        <span class="exrow-text"><strong>${esc(ex.name)}</strong><small>${GROUPS[ex.group]}</small>
          ${also.length ? `<small class="sub">${T.plan.alsoOn(also.map((j) => T.daysShort[j]).join(', '))}</small>` : ''}
          ${available(ex) ? '' : `<small class="sub">${T.plan.noEquipNow}</small>`}
          <small class="act">${T.plan.replace}</small></span></button>
      <button class="icon-btn" data-act="move" data-i="${i}" data-n="${n}" data-d="-1" aria-label="${T.plan.up}"${n === 0 ? ' disabled' : ''}>${ICON.up}</button>
      <button class="icon-btn" data-act="move" data-i="${i}" data-n="${n}" data-d="1" aria-label="${T.plan.down}"${n === d.exercises.length - 1 ? ' disabled' : ''}>${ICON.down}</button></li>`;
  }).join('');
  view.innerHTML = `
    <section class="panel">${typeRow}<p class="muted">${esc(d.focus)} · ${T.exercises(d.exercises.length)} · ${T.minutes(mins(workoutSecs(d.exercises.length)))}</p></section>
    ${issues.length ? `<section class="notice"><ul class="plain">${issues.map((t) => `<li>${t}</li>`).join('')}</ul></section>` : ''}
    <ul class="editlist">${rows}</ul>
    ${swap}
    <button class="btn primary big wide" data-act="start-day" data-i="${i}">${T.start.startBtn}</button>`;
  return { title: T.days[i], back: '#/wochenplan' };
}

/** Auswahl-Dialog „Übung ersetzen". */
function pickResults() {
  const d = plan[pick.day], cur = d.exercises[pick.pos];
  const list = EXERCISES.filter((e) => exMatches(pick, e));
  if (!list.length) return `<p class="empty">${T.lib.none}</p>`;
  return `<div class="grid">${list.map((e) => {
    const inDay = e.id !== cur && d.exercises.includes(e.id), also = otherDays(e.id, pick.day);
    const note = e.id === cur ? T.picker.current : inDay ? T.picker.inDay : also.length ? T.plan.alsoOn(also.map((j) => T.daysShort[j]).join(', ')) : !available(e) ? T.lib.noEquip : '';
    return exCard(e, 'pick', note, inDay);
  }).join('')}</div>`;
}
function renderPicker() {
  $('#picker-body').innerHTML = `<h2>${T.picker.title}</h2>
    <p class="muted">${T.days[pick.day]} · ${T.picker.pos(pick.pos + 1)}</p>
    ${searchBox(pick, 'pick')}${filterChips(pick, 'pick-filter')}<div id="pick-results">${pickResults()}</div>`;
}

// =====================================================================
// TAB FORTSCHRITT
// =====================================================================
const prog = { metric: 'workouts', span: 'week', month: 0 };

/** Werte für das Balkendiagramm: letzte 8 Wochen oder 6 Monate. */
function chartSeries() {
  const now = new Date(), val = (b) => (!b ? 0 : prog.metric === 'workouts' ? b.workouts : Math.round(b.secs / 60));
  if (prog.span === 'week') {
    const b = bucketBy(weekKey);
    return Array.from({ length: 8 }, (_, k) => {
      const ws = addDays(now, -weekday(now) - 7 * (7 - k));
      return { label: ws.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' }), value: val(b[dayKey(ws)]) };
    });
  }
  const b = bucketBy(monthKey);
  return Array.from({ length: 6 }, (_, k) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (5 - k), 1);
    return { label: m.toLocaleDateString('de-DE', { month: 'short' }), value: val(b[monthKey(m)]) };
  });
}

/** Einfaches Balkendiagramm als SVG (ohne Bibliothek). */
function barChart(series, aria) {
  const W = 320, H = 176, padB = 26, padT = 24, n = series.length, max = Math.max(1, ...series.map((s) => s.value));
  const slot = (W - 16) / n, bw = Math.min(30, slot * 0.62);
  const bars = series.map((s, i) => {
    const h = s.value ? Math.max(4, Math.round(((H - padB - padT) * s.value) / max)) : 0;
    const x = 8 + slot * i + (slot - bw) / 2, y = H - padB - h;
    return `${h ? `<rect class="cbar${i === n - 1 ? ' now' : ''}" x="${x.toFixed(1)}" y="${y}" width="${bw.toFixed(1)}" height="${h}" rx="5"/><text class="bv" x="${(x + bw / 2).toFixed(1)}" y="${y - 6}">${s.value}</text>` : ''}
      <text class="bl" x="${(x + bw / 2).toFixed(1)}" y="${H - 8}">${s.label}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}"><line class="axis" x1="8" y1="${H - padB}" x2="${W - 8}" y2="${H - padB}"/>${bars}</svg>`;
}

function groupShare() {
  const count = {}; let total = 0;
  log.forEach((e) => (e.ex || []).forEach((id) => {
    const g = EX[id]?.group;
    if (g) { count[g] = (count[g] || 0) + (e.n || 1); total += e.n || 1; }
  }));
  return Object.keys(GROUPS).map((g) => ({ g, pct: total ? Math.round((100 * (count[g] || 0)) / total) : 0 })).sort((a, b) => b.pct - a.pct);
}

function calendar() {
  const now = new Date(), m = new Date(now.getFullYear(), now.getMonth() + prog.month, 1), todayKey = dayKey(now);
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const cells = Array(weekday(m)).fill('<span></span>');
  for (let d = 1; d <= days; d++) {
    const date = new Date(m.getFullYear(), m.getMonth(), d), k = dayKey(date);
    const cls = [done[k] && 'done', k === todayKey && 'today', plan[weekday(date)].type === 'rest' && 'rest'].filter(Boolean).join(' ');
    cells.push(`<span class="cal-d ${cls}"${done[k] ? ` aria-label="${d}. ${T.cal.trained}"` : ''}>${d}</span>`);
  }
  return `<div class="cal-head"><button class="icon-btn" data-act="cal" data-d="-1" aria-label="${T.cal.prev}">${ICON.prev}</button>
      <strong>${m.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</strong>
      <button class="icon-btn" data-act="cal" data-d="1" aria-label="${T.cal.next}"${prog.month >= 0 ? ' disabled' : ''}>${ICON.next}</button></div>
    <div class="cal">${T.daysShort.map((d) => `<span class="cal-w">${d}</span>`).join('')}${cells.join('')}</div>`;
}

function renderProgress() {
  const st = stats(), series = chartSeries();
  const unit = prog.metric === 'workouts' ? T.prog.workouts : T.prog.minutes;
  const chip = (k, v, label) => `<button class="chip${prog[k] === v ? ' on' : ''}" data-act="prog" data-k="${k}" data-v="${v}">${label}</button>`;
  const rec = (label, value) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`;

  const share = groupShare(), hasShare = share.some((s) => s.pct);
  const shareHtml = hasShare ? `<ul class="shares">${share.map((s) => `<li><span>${GROUPS[s.g]}</span><span class="bar"><i style="width:${s.pct}%"></i></span><b>${s.pct} %</b></li>`).join('')}</ul>`
    : `<p class="empty">${T.prog.noData}</p>`;

  const loadRow = (e) => {
    const best = bestLoad(e.id), n = (loads[e.id] || []).length;
    return `<li><button class="exrow" data-act="ex" data-id="${e.id}"><span class="illu thumb">${illo(e)}</span>
      <span class="exrow-text"><strong>${esc(e.name)}</strong><small>${best ? `${T.load.best}: ${fmtLoad(best)} · ${T.prog.entries(n)}` : T.prog.noEntry}</small></span></button></li>`;
  };
  const weighted = EXERCISES.filter((e) => loadKind(e));
  const withData = weighted.filter((e) => loads[e.id]?.length);

  view.innerHTML = `
    <section><h3 class="sec">${T.prog.records}</h3><div class="stats two">
      ${rec(T.stat.streak, st.current)}${rec(T.prog.longestStreak, st.longest)}
      ${rec(T.prog.bestWeek, st.bestWeek)}${rec(T.prog.totalWorkouts, st.total)}
      ${rec(T.stat.totalMinutes, st.totalMinutes)}${rec(T.prog.weekMinutes, st.weekMinutes)}</div></section>
    <section class="panel chartbox"><h3>${T.prog.chart}</h3>
      <div class="chips">${chip('metric', 'workouts', T.prog.workouts)}${chip('metric', 'minutes', T.prog.minutes)}
        ${chip('span', 'week', T.prog.weeks)}${chip('span', 'month', T.prog.months)}</div>
      ${barChart(series, `${unit} ${prog.span === 'week' ? T.prog.perWeek : T.prog.perMonth}: ${series.map((s) => `${s.label} ${s.value}`).join(', ')}`)}
      <p class="muted small">${unit} ${prog.span === 'week' ? T.prog.perWeek : T.prog.perMonth}</p></section>
    <section class="panel"><h3>${T.prog.groups}</h3>${shareHtml}</section>
    <section class="panel"><h3>${T.prog.calendar}</h3>${calendar()}</section>
    <section class="panel"><h3>${T.prog.loads}</h3><p class="muted small">${T.prog.loadsHint}</p>
      ${withData.length ? `<ul class="exlist">${withData.map(loadRow).join('')}</ul>` : ''}
      <details><summary>${withData.length ? T.prog.moreEx : T.prog.pickEx}</summary>
        <ul class="exlist">${weighted.filter((e) => !withData.includes(e)).map(loadRow).join('')}</ul></details></section>`;
  return { title: T.tabs.fortschritt };
}

// =====================================================================
// TAB PROFIL
// =====================================================================
function renderProfile() {
  const goalToggles = Object.entries(T.goals).map(([k, l]) => toggle(`data-chg="goal" data-k="${k}"`, profile.goals[k], l)).join('');
  view.innerHTML = `
    <section class="panel"><h3>${T.profile.personal}</h3>
      <label class="row"><span>${T.profile.name}</span>
        <input type="text" class="field" value="${esc(profile.name)}" maxlength="30" autocomplete="given-name" enterkeyhint="done" data-chg="name"></label>
      <label class="row"><span>${T.profile.weight}</span>
        <span class="num-input"><input type="number" inputmode="decimal" min="20" max="400" step="0.1" value="${profile.weight}" placeholder="–" data-chg="weight">kg</span></label></section>
    <section class="panel"><h3>${T.profile.goals}</h3>
      <p class="muted small">${T.profile.goalsHint}</p>${goalToggles}
      <label class="row"><span>${T.profile.weekGoal}</span><select data-chg="weekGoal">${[1, 2, 3, 4, 5, 6, 7].map((n) =>
        `<option value="${n}"${n === profile.weekGoal ? ' selected' : ''}>${T.profile.daysPerWeek(n)}</option>`).join('')}</select></label></section>
    <section class="panel"><h3>${T.profile.equipment}</h3><p class="muted small">${T.profile.equipHint}</p>
      ${Object.entries(EQUIPMENT).map(([k, l]) => toggle(`data-chg="equip" data-k="${k}"`, settings.equipment[k] !== false, Illu.icon(k) + l)).join('')}</section>
    <section class="panel"><h3>${T.profile.timer}</h3>
      ${numInput('work', T.profile.work, 5, 120, 's')}${numInput('rest', T.profile.rest, 0, 120, 's')}
      ${numInput('rounds', T.profile.rounds, 1, 20, '')}${numInput('restBetween', T.profile.restBetween, 0, 300, 's')}
      <p class="muted small">${T.profile.timerNote(mins(workoutSecs(8)))}</p></section>
    <section class="panel"><h3>${T.profile.sound}</h3>
      ${toggle('data-chg="flag" data-k="sound"', settings.sound, T.profile.beeps)}
      ${toggle('data-chg="flag" data-k="voice"', settings.voice, T.profile.voice)}
      ${toggle('data-chg="flag" data-k="keepAwake"', settings.keepAwake, T.profile.keepAwake)}</section>
    <section class="panel"><h3>${T.profile.days}</h3>
      ${plan.map((d, i) => `<label class="row"><span>${T.days[i]}</span><select data-chg="daytype" data-i="${i}">
        <option value="training"${d.type === 'training' ? ' selected' : ''}>${T.plan.training}</option>
        <option value="rest"${d.type === 'rest' ? ' selected' : ''}>${T.rest.short}</option></select></label>`).join('')}</section>
    <section class="panel stack"><h3>${T.profile.data}</h3><p class="muted small">${T.profile.dataHint}</p>
      <button class="btn" data-act="export">${T.profile.export}</button>
      <label class="btn file">${T.profile.import}<input type="file" accept=".json,application/json" data-chg="import"></label>
      <button class="btn ghost" data-act="reset-plan">${T.profile.resetPlan}</button>
      <button class="btn danger" data-act="reset-progress">${T.profile.resetProgress}</button>
      <button class="btn danger" data-act="reset-all">${T.profile.resetAll}</button></section>
    <p class="muted small center">${T.profile.version(SCHEMA)}</p>`;
  return { title: T.tabs.profil };
}
