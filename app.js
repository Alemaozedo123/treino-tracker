'use strict';

/* ---------- programa (do PDF: treino-faixas) ---------- */
const PROGRAM = [
  { id: 1, name: 'Upper 1', ex: [
    { n: 'Barbell OHP',              s: 3, lo: 6,  hi: 10 },
    { n: 'Weighted Pull-up',         s: 3, lo: 6,  hi: 10 },
    { n: 'Parallel Bar Dip',         s: 3, lo: 6,  hi: 10 },
    { n: 'Machine Lat. Raise',       s: 3, lo: 10, hi: 15 },
    { n: 'Cable Overhead Tri. Ext.', s: 3, lo: 10, hi: 15 },
    { n: 'EZ Preacher Curl',         s: 3, lo: 10, hi: 15 },
  ]},
  { id: 2, name: 'Lower', ex: [
    { n: 'Bulgarian Split Squat',    s: 3, lo: 6,  hi: 10 },
    { n: 'Weighted Hyperextension',  s: 3, lo: 10, hi: 15 },
    { n: 'Leg Extension',            s: 3, lo: 10, hi: 15 },
    { n: 'Smith Calf Raise',         s: 4, lo: 10, hi: 15 },
    { n: 'Reverse Incline Crunch',   s: 3, lo: 10, hi: 15 },
  ]},
  { id: 3, name: 'Upper 2', ex: [
    { n: 'Lying Cable Lat. Raise',   s: 4, lo: 10, hi: 15 },
    { n: 'Plate-Loaded Row (Flat)',  s: 3, lo: 6,  hi: 10 },
    { n: 'Incline DB Press',         s: 3, lo: 6,  hi: 10 },
    { n: 'Seated DB Incline Curl',   s: 3, lo: 10, hi: 15 },
    { n: 'Lying DB Tricep Ext.',     s: 3, lo: 10, hi: 15 },
  ]},
  { id: 4, name: 'Full Body', ex: [
    { n: 'Pendulum Squat',              s: 4, lo: 6,  hi: 10 },
    { n: 'Seated Leg Curl',             s: 3, lo: 10, hi: 15 },
    { n: 'Cable Straight-arm Pulldown', s: 3, lo: 10, hi: 15 },
    { n: 'DB Hammer Curl',              s: 3, lo: 10, hi: 15 },
    { n: 'Cable Rope Extension',        s: 3, lo: 10, hi: 15 },
    { n: 'Kneeling Cable Crunch',       s: 3, lo: 10, hi: 15 },
  ]},
];

const dayById = id => PROGRAM.find(d => d.id === id);

/* ---------- armazenamento ---------- */
const LS_LOGS = 'treino.logs.v1';
const LS_ACTIVE = 'treino.active.v1';

const read = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? fb : v; } catch (e) { return fb; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

let logs = read(LS_LOGS, []);       // sessoes finalizadas, mais recente primeiro
let active = read(LS_ACTIVE, null); // sessao em andamento

const saveLogs = () => write(LS_LOGS, logs);
const saveActive = () => { try { active ? write(LS_ACTIVE, active) : localStorage.removeItem(LS_ACTIVE); } catch (e) {} };

/* ---------- helpers ---------- */
const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => (v === '' || v === null || v === undefined) ? null : Number(v);
const fmtW = w => (w === null || w === undefined) ? '—' : (Number.isInteger(w) ? w : w.toFixed(1)) + 'kg';

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' · ' +
         d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function daysAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff <= 0) return 'hoje';
  if (diff === 1) return 'ontem';
  return 'há ' + diff + ' dias';
}

/** Ultima sessao registrada desse dia de treino. */
const lastLogOfDay = day => logs.find(l => l.day === day) || null;

/** Series registradas do exercicio na ultima sessao desse dia. */
function lastSets(day, exIdx) {
  const l = lastLogOfDay(day);
  if (!l) return null;
  const arr = (l.sets[exIdx] || []).filter(s => s.w !== null || s.r !== null);
  return arr.length ? arr : null;
}

/** Bateu o topo da faixa em todas as series -> hora de subir a carga. */
function readyToProgress(day, exIdx) {
  const d = dayById(day);
  if (!d) return false;
  const meta = d.ex[exIdx];
  if (!meta) return false;
  const prev = lastSets(day, exIdx);
  if (!prev || prev.length < meta.s) return false;
  return prev.every(s => s.r !== null && s.r >= meta.hi && s.w !== null);
}

/** Proximo dia sugerido: rotaciona 1 -> 2 -> 3 -> 4 -> 1 a partir do ultimo treino. */
function nextDay() {
  if (!logs.length) return 1;
  const i = PROGRAM.findIndex(d => d.id === logs[0].day);
  return PROGRAM[(i + 1) % PROGRAM.length].id;
}

/* ---------- roteamento ---------- */
let tab = 'home';
let screen = { name: 'home' };

function go(s) {
  screen = s;
  window.scrollTo(0, 0);
  render();
}

/* ---------- render ---------- */
function render() {
  const view = $('#view');
  const deep = screen.name === 'session' || screen.name === 'logDetail' || screen.name === 'exercise';
  $('#backBtn').hidden = !deep;

  document.querySelectorAll('.tabbar button').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));

  if (screen.name === 'session') {
    $('#title').textContent = 'Dia ' + screen.day + ' · ' + dayById(screen.day).name;
    view.innerHTML = viewSession();
  } else if (screen.name === 'logDetail') {
    $('#title').textContent = 'Sessão';
    view.innerHTML = viewLogDetail(screen.id);
  } else if (screen.name === 'exercise') {
    $('#title').textContent = screen.ex;
    view.innerHTML = viewExercise(screen.ex);
  } else if (tab === 'history') {
    $('#title').textContent = 'Histórico';
    view.innerHTML = viewHistory();
  } else if (tab === 'progress') {
    $('#title').textContent = 'Progresso';
    view.innerHTML = viewProgress();
  } else {
    $('#title').textContent = 'Treino';
    view.innerHTML = viewHome();
  }
}

/* ---------- tela: home ---------- */
function viewHome() {
  const next = nextDay();
  let h = '';

  if (active) {
    const d = dayById(active.day);
    const total = d.ex.reduce((a, e) => a + e.s, 0);
    const done = countDone(active.sets);
    h += '<div class="card" style="border-color:var(--accent)">' +
      '<div class="row spread"><h3>Treino em andamento</h3><span class="badge">' + done + '/' + total + ' séries</span></div>' +
      '<p class="muted small" style="margin:6px 0 12px">Dia ' + d.id + ' · ' + esc(d.name) + ' — iniciado ' + daysAgo(active.start) + '</p>' +
      '<button class="btn" data-go-session="' + d.id + '">Continuar</button></div>';
  }

  h += '<p class="muted small" style="margin:2px 0 12px">Compostos 6–10 reps · Isoladores 10–15 reps</p>';

  PROGRAM.forEach(d => {
    const last = lastLogOfDay(d.id);
    const isNext = !active && d.id === next;
    let ups = 0;
    d.ex.forEach((e, i) => { if (readyToProgress(d.id, i)) ups++; });
    h += '<button class="day-btn ' + (isNext ? 'next' : '') + '" data-go-session="' + d.id + '">' +
      '<span class="k">Dia ' + d.id + (isNext ? ' · próximo' : '') + '</span>' +
      '<span class="n">' + esc(d.name) + '</span>' +
      '<span class="muted small">' + d.ex.length + ' exercícios · ' +
      (last ? 'último ' + daysAgo(last.start) : 'nunca treinado') + '</span>' +
      (ups ? '<span class="badge" style="margin-left:8px">↑ ' + ups + ' carga' + (ups > 1 ? 's' : '') + '</span>' : '') +
      '</button>';
  });

  h += '<div class="card"><h3>Progressão</h3><p class="muted small" style="margin-top:6px">' +
    'Quando fizer o topo da faixa em <b>todas</b> as séries, aumente a carga e volte para o início da faixa. ' +
    'O app marca <span class="badge">↑ carga</span> sozinho quando isso acontecer.</p></div>';
  return h;
}

function countDone(sets) {
  let n = 0;
  Object.keys(sets).forEach(k => sets[k].forEach(s => { if (s.done) n++; }));
  return n;
}

/* ---------- tela: sessao ---------- */
function startSession(day) {
  if (active && active.day !== day &&
      !confirm('Já existe um treino em andamento (Dia ' + active.day + '). Descartar e começar o Dia ' + day + '?')) return;
  if (!active || active.day !== day) {
    const d = dayById(day);
    const sets = {};
    d.ex.forEach((e, i) => {
      sets[i] = [];
      for (let k = 0; k < e.s; k++) sets[i].push({ w: null, r: null, done: false });
    });
    active = { day: day, start: new Date().toISOString(), sets: sets, note: '' };
    saveActive();
  }
  go({ name: 'session', day: day });
}

function viewSession() {
  const d = dayById(screen.day);
  const totalSets = d.ex.reduce((a, e) => a + e.s, 0);
  const doneSets = countDone(active.sets);
  let h = '<div class="row spread" style="margin-bottom:12px">' +
    '<span class="muted small">' + doneSets + '/' + totalSets + ' séries concluídas</span>' +
    '<span class="muted small">' + daysAgo(active.start) + '</span></div>';

  d.ex.forEach((e, i) => {
    const rows = active.sets[i];
    const prev = lastSets(screen.day, i);
    const up = readyToProgress(screen.day, i);
    const allDone = rows.every(r => r.done);

    h += '<section class="ex ' + (allDone ? 'done' : '') + '">' +
      '<div class="ex-head"><div class="row spread"><span class="name">' + esc(e.n) + '</span>' +
      (up ? '<span class="tag up">↑ subir carga</span>' : '') + '</div>' +
      '<div class="meta">' + e.s + ' séries · ' + e.lo + '–' + e.hi + ' reps' +
      (prev ? ' · anterior: ' + prev.map(p => fmtW(p.w) + '×' + (p.r === null ? '—' : p.r)).join(', ') : '') +
      '</div></div>' +
      '<table><thead><tr><th>Sér.</th><th>Peso (kg)</th><th>Reps</th><th>✓</th><th></th></tr></thead><tbody>';

    rows.forEach((r, si) => {
      const p = prev && prev[si];
      const hitTop = r.r !== null && r.r >= e.hi;
      h += '<tr class="' + (r.done ? 'ok' : '') + '">' +
        '<td>' + (si + 1) + '</td>' +
        '<td><input type="number" inputmode="decimal" step="0.5" min="0" data-f="w" data-e="' + i + '" data-s="' + si + '"' +
          ' value="' + (r.w === null ? '' : r.w) + '" placeholder="' + (p && p.w !== null ? p.w : '–') + '">' +
          (p ? '<span class="prev">' + fmtW(p.w) + '</span>' : '') + '</td>' +
        '<td><input type="number" inputmode="numeric" step="1" min="0" data-f="r" data-e="' + i + '" data-s="' + si + '"' +
          ' value="' + (r.r === null ? '' : r.r) + '" placeholder="' + (p && p.r !== null ? p.r : e.lo + '–' + e.hi) + '"' +
          (hitTop ? ' style="border-color:var(--accent)"' : '') + '>' +
          (p ? '<span class="prev">' + (p.r === null ? '—' : p.r) + ' reps</span>' : '') + '</td>' +
        '<td><button class="chk ' + (r.done ? 'on' : '') + '" data-chk="' + i + ':' + si + '" aria-label="Concluir série">✓</button></td>' +
        '<td class="timer-cell"><button data-timer="1" aria-label="Iniciar descanso">⏱</button></td>' +
        '</tr>';
    });

    h += '</tbody></table></section>';
  });

  h += '<div class="card"><h3>Notas</h3>' +
    '<textarea class="note" id="noteBox" placeholder="Como foi o treino, dores, ajustes…">' + esc(active.note || '') + '</textarea></div>';
  h += '<button class="btn" id="finishBtn" style="margin-bottom:10px">Finalizar treino</button>';
  h += '<button class="btn secondary" id="discardBtn">Descartar treino</button>';
  return h;
}

function finishSession() {
  let any = false;
  Object.keys(active.sets).forEach(k => active.sets[k].forEach(s => {
    if (s.done || s.w !== null || s.r !== null) any = true;
  }));
  if (!any) { alert('Registre pelo menos uma série antes de finalizar.'); return; }
  logs.unshift({
    id: 'l' + Date.now(), day: active.day, start: active.start,
    end: new Date().toISOString(), sets: active.sets, note: active.note,
  });
  saveLogs();
  active = null; saveActive();
  stopRest();
  tab = 'history';
  go({ name: 'home' });
}

/* ---------- tela: historico ---------- */
function viewHistory() {
  if (!logs.length) {
    return '<div class="empty"><div class="big">📓</div>Nenhum treino registrado ainda.<br>' +
           '<span class="small">Comece pela aba Treinar.</span></div>';
  }
  let h = '<p class="muted small" style="margin:2px 0 12px">' + logs.length + ' treino' +
          (logs.length > 1 ? 's' : '') + ' registrado' + (logs.length > 1 ? 's' : '') + '</p>';
  logs.forEach(l => {
    const d = dayById(l.day);
    if (!d) return;
    let done = 0, vol = 0;
    Object.keys(l.sets).forEach(k => l.sets[k].forEach(s => {
      if (s.done) done++;
      vol += (s.w || 0) * (s.r || 0);
    }));
    h += '<button class="hist" data-log="' + l.id + '">' +
      '<span class="d">' + fmtDate(l.start) + ' · ' + daysAgo(l.start) + '</span>' +
      '<div class="t">Dia ' + d.id + ' · ' + esc(d.name) + '</div>' +
      '<span class="muted small">' + done + ' séries · volume ' + Math.round(vol).toLocaleString('pt-BR') + ' kg</span>' +
      '</button>';
  });
  return h;
}

function viewLogDetail(id) {
  const l = logs.find(x => x.id === id);
  if (!l) return '<div class="empty">Sessão não encontrada.</div>';
  const d = dayById(l.day);
  let h = '<div class="card"><h3>Dia ' + d.id + ' · ' + esc(d.name) + '</h3>' +
          '<p class="muted small" style="margin-top:4px">' + fmtDate(l.start) + '</p></div>';
  d.ex.forEach((e, i) => {
    const rows = (l.sets[i] || []).filter(s => s.w !== null || s.r !== null);
    if (!rows.length) return;
    h += '<section class="ex"><div class="ex-head"><span class="name">' + esc(e.n) + '</span>' +
      '<div class="meta">' + rows.map(r => fmtW(r.w) + ' × ' + (r.r === null ? '—' : r.r)).join('  ·  ') +
      '</div></div></section>';
  });
  if (l.note) {
    h += '<div class="card"><h3>Notas</h3><p class="muted small" style="margin-top:6px;white-space:pre-wrap">' +
         esc(l.note) + '</p></div>';
  }
  h += '<button class="btn secondary" data-del-log="' + l.id + '">Apagar esta sessão</button>';
  return h;
}

/* ---------- tela: progresso ---------- */
/** Melhor serie (maior peso) do exercicio em cada sessao, da mais antiga para a mais nova. */
function seriesFor(exName) {
  const out = [];
  logs.slice().reverse().forEach(l => {
    const d = dayById(l.day);
    if (!d) return;
    const i = d.ex.findIndex(e => e.n === exName);
    if (i < 0) return;
    const sets = (l.sets[i] || []).filter(s => s.w !== null);
    if (!sets.length) return;
    const best = sets.reduce((a, b) => (b.w > a.w ? b : a));
    out.push({ date: l.start, w: best.w, r: best.r });
  });
  return out;
}

function viewProgress() {
  if (!logs.length) {
    return '<div class="empty"><div class="big">📈</div>Sem dados ainda.<br>' +
           '<span class="small">Registre alguns treinos para ver a evolução.</span></div>';
  }
  let h = '';
  PROGRAM.forEach(d => {
    const items = d.ex.map(e => ({ e: e, s: seriesFor(e.n) })).filter(x => x.s.length);
    if (!items.length) return;
    h += '<h3 style="margin:14px 0 8px;font-size:14px;color:var(--muted)">Dia ' + d.id + ' · ' + esc(d.name) + '</h3>';
    items.forEach(it => {
      const s = it.s;
      const delta = s[s.length - 1].w - s[0].w;
      const lastR = s[s.length - 1].r;
      h += '<button class="hist" data-ex="' + esc(it.e.n) + '">' +
        '<div class="t">' + esc(it.e.n) + '</div>' +
        '<span class="muted small">' + fmtW(s[s.length - 1].w) + ' × ' + (lastR === null ? '—' : lastR) +
        ' · ' + s.length + ' sessão' + (s.length > 1 ? 'es' : '') +
        (delta ? ' · <span style="color:' + (delta > 0 ? 'var(--accent)' : 'var(--danger)') + '">' +
                 (delta > 0 ? '+' : '') + fmtW(delta) + '</span>' : '') +
        '</span></button>';
    });
  });
  return h || '<div class="empty">Sem dados ainda.</div>';
}

function viewExercise(name) {
  const s = seriesFor(name);
  if (!s.length) return '<div class="empty">Sem dados para ' + esc(name) + '.</div>';
  const ws = s.map(x => x.w);
  const max = Math.max.apply(null, ws);
  const min = Math.min.apply(null, ws);
  const span = Math.max(max - min, max * 0.15, 1);

  let h = '<div class="card"><h3>' + esc(name) + '</h3>' +
    '<p class="muted small" style="margin-top:4px">Maior peso por sessão · ' + s.length +
    ' registro' + (s.length > 1 ? 's' : '') + '</p><div class="bars">' +
    s.slice(-18).map((x, i, a) =>
      '<i class="' + (i === a.length - 1 ? 'last' : '') + '" style="height:' +
      Math.round(12 + ((x.w - min) / span) * 88) + '%" title="' + fmtW(x.w) + '"></i>').join('') +
    '</div><div class="row spread muted small"><span>' + fmtW(min) + '</span><span>' + fmtW(max) + '</span></div></div>';

  h += '<div class="card"><h3>Sessões</h3>';
  s.slice().reverse().forEach(x => {
    h += '<div class="row spread" style="padding:8px 0;border-top:1px solid var(--line)">' +
      '<span class="muted small">' + fmtDate(x.date) + '</span>' +
      '<span><b>' + fmtW(x.w) + '</b> × ' + (x.r === null ? '—' : x.r) + '</span></div>';
  });
  h += '</div>';
  return h;
}

/* ---------- timer de descanso ---------- */
let restId = null, restLeft = 0;

function paintRest() {
  $('#restTime').textContent =
    String(Math.floor(restLeft / 60)).padStart(2, '0') + ':' + String(restLeft % 60).padStart(2, '0');
}

function startRest(sec) {
  restLeft = sec;
  $('#restBar').hidden = false;
  paintRest();
  clearInterval(restId);
  restId = setInterval(() => {
    restLeft--;
    paintRest();
    if (restLeft <= 0) { stopRest(); beep(); }
  }, 1000);
}

function stopRest() {
  clearInterval(restId);
  restId = null;
  $('#restBar').hidden = true;
}

function beep() {
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start(); o.stop(ctx.currentTime + 0.65);
  } catch (e) {}
}

/* ---------- eventos ---------- */
$('#view').addEventListener('input', e => {
  const t = e.target;
  if (t.matches('input[data-f]')) {
    if (!active) return;
    active.sets[t.dataset.e][t.dataset.s][t.dataset.f] = num(t.value);
    saveActive();
  } else if (t.id === 'noteBox') {
    if (!active) return;
    active.note = t.value;
    saveActive();
  }
});

document.addEventListener('click', e => {
  const chk = e.target.closest('[data-chk]');
  if (chk && active) {
    const parts = chk.dataset.chk.split(':');
    const i = Number(parts[0]), si = Number(parts[1]);
    const set = active.sets[i][si];
    set.done = !set.done;
    if (set.done) {
      // completa o que faltou com a referencia da sessao anterior
      const prev = lastSets(active.day, i);
      if (set.w === null && prev && prev[si]) set.w = prev[si].w;
      if (set.r === null) set.r = dayById(active.day).ex[i].lo;
      startRest(120);
    }
    saveActive();
    render();
    return;
  }
  if (e.target.closest('[data-timer]')) { startRest(120); return; }
  if (e.target.id === 'finishBtn') { finishSession(); return; }
  if (e.target.id === 'discardBtn') {
    if (confirm('Descartar este treino? Nada será salvo.')) {
      active = null; saveActive(); tab = 'home'; go({ name: 'home' });
    }
    return;
  }
  const s = e.target.closest('[data-go-session]');
  if (s) { startSession(Number(s.dataset.goSession)); return; }
  const l = e.target.closest('[data-log]');
  if (l) { go({ name: 'logDetail', id: l.dataset.log }); return; }
  const x = e.target.closest('[data-ex]');
  if (x) { go({ name: 'exercise', ex: x.dataset.ex }); return; }
  const del = e.target.closest('[data-del-log]');
  if (del && confirm('Apagar esta sessão do histórico?')) {
    logs = logs.filter(y => y.id !== del.dataset.delLog);
    saveLogs();
    go({ name: 'home' });
  }
});

document.querySelectorAll('.tabbar button').forEach(b => b.addEventListener('click', () => {
  tab = b.dataset.tab;
  go({ name: 'home' });
}));

$('#backBtn').addEventListener('click', () => go({ name: 'home' }));
$('#restMinus').addEventListener('click', () => { restLeft = Math.max(5, restLeft - 30); paintRest(); });
$('#restPlus').addEventListener('click', () => { restLeft += 30; paintRest(); });
$('#restStop').addEventListener('click', stopRest);

/* ---------- ajustes / backup ---------- */
const sheet = $('#sheet');
$('#menuBtn').addEventListener('click', () => sheet.showModal());
$('#closeSheet').addEventListener('click', () => sheet.close());

$('#exportBtn').addEventListener('click', () => {
  const payload = { v: 1, exportedAt: new Date().toISOString(), logs: logs, active: active };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'treino-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('#importBtn').addEventListener('click', () => $('#importFile').click());

$('#importFile').addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.logs)) throw new Error('formato inválido');
      if (!confirm('Importar ' + data.logs.length + ' treino(s)? Isso substitui os dados atuais.')) return;
      logs = data.logs;
      active = data.active || null;
      saveLogs(); saveActive(); sheet.close();
      tab = 'home';
      go({ name: 'home' });
    } catch (err) {
      alert('Arquivo inválido: ' + err.message);
    }
  };
  reader.readAsText(f);
  e.target.value = '';
});

$('#wipeBtn').addEventListener('click', () => {
  if (!confirm('Apagar TODOS os treinos deste aparelho? Não dá para desfazer.')) return;
  logs = []; active = null;
  saveLogs(); saveActive(); sheet.close();
  tab = 'home';
  go({ name: 'home' });
});

/* ---------- boot ---------- */
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
