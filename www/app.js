/* ===== Lebens-Admin: Oberfläche ===== */
const KEY = 'lebensadmin.v1';
const ICONS = {
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h4"/>',
  car: '<path d="M5 17h14v-4l-2-5H7l-2 5z"/><path d="M3 13h18"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  doc: '<path d="M7 3h8l4 4v14H7z"/><path d="M10 12h6M10 16h6"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  people: '<circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 20c0-2 1-3.5 2-4 2 0 4 1.5 4 4"/>',
  paw: '<circle cx="6" cy="10" r="2"/><circle cx="10" cy="5" r="2"/><circle cx="14" cy="5" r="2"/><circle cx="18" cy="10" r="2"/><path d="M12 11c-3 0-6 4-6 7 0 2 2 2 6 1 4 1 6 1 6-1 0-3-3-7-6-7z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  plane: '<path d="M2 16l20-8-4 12-6-4-4 4v-6"/>',
  flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 1 3 3 4 0-3-1-5 0-8z"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/>'
};
const svg = (name, extra) => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '>' + (ICONS[name] || '') + '</svg>';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/* ---------- Umgebung: Handy-App (Capacitor), Claude-Artifact oder Browser ---------- */
const CAP = window.Capacitor;
const NATIVE = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform());
const LN = NATIVE && CAP.Plugins ? CAP.Plugins.LocalNotifications : null;
const IN_ARTIFACT = !!(window.claude && window.claude.use);

/* ---------- Zustand ---------- */
function blank() { return { answers: {}, items: {}, custom: [], onboarded: false, example: false, notify: { on: true, hour: 9 } }; }
let S = blank();
try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign(blank(), JSON.parse(raw)); } catch (e) { }
let saveOk = true;
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); saveOk = true; } catch (e) { saveOk = false; } scheduleSync(); }

/* ---------- Echte Erinnerungen (nur in der Handy-App) ---------- */
let perm = 'unknown', syncTimer;
function scheduleSync() { if (!LN) return; clearTimeout(syncTimer); syncTimer = setTimeout(syncNotifications, 400); }
function hashId(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h) % 2000000000 + 1; }
function atHour(d, hour) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0); }
function leadWords(n) { return n === 0 ? 'heute' : n % 7 === 0 ? 'in ' + (n / 7) + (n === 7 ? ' Woche' : ' Wochen') : 'in ' + n + ' Tagen'; }
async function checkPerm() { if (!LN) return; try { perm = (await LN.checkPermissions()).display; } catch (e) { perm = 'unknown'; } }
async function askPerm() { if (!LN) return; try { perm = (await LN.requestPermissions()).display; } catch (e) { } S.notify.on = perm === 'granted'; save(); render(); }
async function syncNotifications() {
  if (!LN) return;
  try {
    const pend = await LN.getPending();
    if (pend.notifications && pend.notifications.length) await LN.cancel({ notifications: pend.notifications.map(n => ({ id: n.id })) });
    await checkPerm();
    if (!S.onboarded || !S.notify || !S.notify.on || perm !== 'granted') return;
    const now = new Date(), hour = S.notify.hour != null ? S.notify.hour : 9, list = [];
    entries().forEach(e => {
      if (!e.due || e.status === 'done') return;
      const lead = leadOf(e.item), id = e.item.id;
      const due = atHour(e.due, hour);
      if (lead > 0) { const r = atHour(addDays(e.due, -lead), hour); if (r > now) list.push({ id: hashId(id + ':r'), title: e.item.title, body: 'Fällig am ' + fmtDate(e.due) + ' – also ' + leadWords(lead) + '.', at: r, item: id }); }
      if (due > now) list.push({ id: hashId(id + ':d'), title: e.item.title, body: 'Heute fällig.', at: due, item: id });
      else { const t = atHour(addDays(new Date(), 1), hour); list.push({ id: hashId(id + ':o'), title: e.item.title, body: 'Überfällig seit ' + fmtDate(e.due) + '. Erledigt? Dann in der App abhaken.', at: t, item: id }); }
    });
    list.sort((x, y) => x.at - y.at);
    const top = list.slice(0, 60);
    if (top.length) await LN.schedule({ notifications: top.map(n => ({ id: n.id, title: n.title, body: n.body, schedule: { at: n.at, allowWhileIdle: true }, extra: { item: n.item } })) });
  } catch (e) { console.warn('Erinnerungen konnten nicht geplant werden', e); }
}
async function testNotification() {
  if (!LN) return;
  if (perm !== 'granted') await askPerm();
  if (perm !== 'granted') return;
  await LN.schedule({ notifications: [{ id: 7, title: 'Lebens-Admin', body: 'So sehen deine Erinnerungen aus.', schedule: { at: new Date(Date.now() + 5000) } }] });
  toast('Test-Erinnerung kommt in 5 Sekunden.'); render();
}

const UI = { view: S.onboarded ? 'home' : 'welcome', q: 0, draft: {}, sel: null, area: null, showHidden: false, confirm: null, toast: null, err: '', from: 'home' };

/* ---------- Einträge ---------- */
function customItem(c) {
  return { id: c.id, cat: c.cat || 'eigene', title: c.title, type: 'Eigene', mode: 'manual', months: () => c.months || 0, lead: c.lead != null ? c.lead : 7, ask: 'Nächster Termin', hint: c.note || '', custom: true, cond: () => true };
}
function allItems() { return CATALOG.concat(S.custom.map(customItem)); }
function getItem(id) { return allItems().find(i => i.id === id); }
function stOf(id) { return S.items[id] || {}; }
function leadOf(item) { const st = stOf(item.id); return st.lead != null ? st.lead : item.lead; }
function entries(includeHidden) {
  const a = S.answers;
  return allItems().filter(i => i.cond(a)).map(i => {
    const st = stOf(i.id); const r = computeDue(i, st, a);
    return { item: i, st, due: r.due, needsDate: r.needsDate, done: r.done, hidden: !!st.hidden, status: r.done ? 'done' : status(r.due, leadOf(i)) };
  }).filter(e => includeHidden || !e.hidden);
}
const catOf = id => CATS.find(c => c.id === id) || CATS[CATS.length - 1];
const byDue = (x, y) => (x.due || 0) - (y.due || 0);
function pillText(e) {
  if (e.status === 'missing') return 'Datum fehlt';
  if (e.status === 'done') return 'erledigt';
  return relText(e.due).replace('in ', '').replace('seit ', '') + (e.status === 'overdue' ? ' drüber' : '');
}
function subText(e) {
  const c = catOf(e.item.cat).name;
  if (e.status === 'missing') return c + ' · tippen und Datum eintragen';
  if (e.status === 'done') return c + ' · erledigt';
  return c + ' · ' + fmtDate(e.due);
}
function rowHTML(e) {
  return '<button class="row ' + e.status + '" data-act="open" data-id="' + esc(e.item.id) + '">' +
    '<span class="ico">' + svg(catOf(e.item.cat).icon) + '</span>' +
    '<span class="rowtext"><b>' + esc(e.item.title) + '</b><span>' + esc(subText(e)) + '</span></span>' +
    '<span class="pill num">' + esc(pillText(e)) + '</span></button>';
}

/* ---------- Fragen ---------- */
const QUESTIONS = [
  { key: 'birthYear', icon: 'user', kind: 'year', title: 'In welchem Jahr bist du geboren?', text: 'Davon hängen Ausweis-Gültigkeit und die Vorsorge-Termine der Krankenkasse ab.', min: 1920, max: new Date().getFullYear() - 16 },
  { key: 'gender', icon: 'heart', kind: 'choice', title: 'Für welche Vorsorge soll die App planen?', text: 'Manche Früherkennung gibt es nur für Frauen oder Männer.', options: [['w', 'Für Frauen'], ['m', 'Für Männer'], ['x', 'Keine Angabe', 'Dann nur Vorsorge für alle']] },
  { key: 'license', icon: 'card', kind: 'choice', title: 'Hast du einen Führerschein?', text: 'Alte Führerscheine müssen bis zu einer Frist umgetauscht werden.', options: [[true, 'Ja'], [false, 'Nein']] },
  { key: 'licenseYear', icon: 'card', kind: 'year', title: 'Wann wurde dein Führerschein ausgestellt?', text: 'Das Jahr steht auf der Karte in Feld 4a. Beim alten Papier-Führerschein das Ausstellungsjahr.', min: 1950, max: new Date().getFullYear(), show: d => d.license === true },
  { key: 'car', icon: 'car', kind: 'choice', title: 'Hast du ein Auto oder Motorrad?', text: 'Dann erinnern wir dich an TÜV, Reifenwechsel, Kfz-Steuer und den Versicherungswechsel bis 30. November.', options: [[true, 'Ja'], [false, 'Nein']] },
  { key: 'housing', icon: 'home', kind: 'choice', title: 'Wie wohnst du?', text: 'Mieter und Eigentümer haben unterschiedliche Pflichten.', options: [['miete', 'Zur Miete'], ['eigentum', 'Im Eigentum'], ['andere', 'Anders', 'z. B. bei den Eltern oder im Wohnheim']] },
  { key: 'heating', icon: 'flame', kind: 'choice', title: 'Womit wird geheizt?', text: 'Für Schornsteinfeger und Heizungswartung.', options: [['gas_oel', 'Gas oder Öl'], ['holz', 'Holz oder Kamin'], ['andere', 'Anders oder weiß nicht', 'Fernwärme, Wärmepumpe, Strom']] },
  { key: 'tax', icon: 'doc', kind: 'choice', title: 'Wie machst du deine Steuererklärung?', text: 'Mit Steuerberater gelten längere Fristen.', options: [['selbst', 'Selbst', 'z. B. mit ELSTER oder einer Steuer-App'], ['berater', 'Mit Steuerberater oder Lohnsteuerhilfe'], ['nein', 'Gar nicht', 'Wir erinnern an die freiwillige Erklärung']] },
  { key: 'kids', icon: 'people', kind: 'choice', title: 'Hast du Kinder?', text: 'Für U-Untersuchungen, Impfungen, Kita und Schule.', options: [[true, 'Ja'], [false, 'Nein']] },
  { key: 'pets', icon: 'paw', kind: 'multi', title: 'Hast du Haustiere?', text: 'Mehrfachauswahl möglich.', options: [['hund', 'Hund'], ['katze', 'Katze'], ['anderes', 'Anderes Tier'], ['keine', 'Keine']] },
  { key: 'travel', icon: 'plane', kind: 'choice', title: 'Reist du ins Ausland?', text: 'Dann behalten wir auch den Reisepass im Blick.', options: [[true, 'Ja, ab und zu'], [false, 'Nein']] }
];
const visibleQs = () => QUESTIONS.filter(q => !q.show || q.show(UI.draft));

/* ---------- Ansichten ---------- */
function tabs(cur) {
  const t = [['home', 'list', 'Übersicht'], ['calendar', 'cal', 'Kalender'], ['areas', 'grid', 'Bereiche'], ['settings', 'gear', 'Einstellungen']];
  return '<nav class="tabs" aria-label="Hauptnavigation">' + t.map(x => '<button data-act="tab" data-v="' + x[0] + '"' + (cur === x[0] ? ' aria-current="page"' : '') + '>' + svg(x[1]) + x[2] + '</button>').join('') + '</nav>';
}
function fab() { return '<button class="fab" data-act="add" aria-label="Eigene Erinnerung anlegen">' + svg('plus', ' stroke-width="2.5"') + '</button>'; }
function exampleBanner() { return S.example ? '<div class="banner">Du siehst Beispieldaten.<button data-act="startReal">Eigene Daten anlegen</button></div>' : ''; }
function storageBanner() { return saveOk ? '' : '<div class="banner">Dieser Browser speichert gerade nichts. Sichere deine Daten unter Einstellungen.</div>'; }

function vWelcome() {
  return '<div class="scroll plain">' +
    '<div class="qicon">' + svg('shield') + '</div>' +
    '<h1>Nie wieder eine Frist verpassen</h1>' +
    '<p class="muted">Ausweis, TÜV, Steuererklärung, Zahnarzt, Hundesteuer: Lebens-Admin kennt die typischen Pflichten in Deutschland und sagt dir rechtzeitig Bescheid.</p>' +
    '<div class="panel"><b>So geht’s</b><p class="small muted">Du beantwortest 10 kurze Fragen. Daraus entsteht dein persönlicher Plan. Daten wie dein Ausweis-Ablaufdatum trägst du danach nach und nach ein.</p></div>' +
    '<p class="small muted">Deine Angaben bleiben auf diesem Gerät. Kein Konto, keine Werbung.</p>' +
    '<div class="foot"><button class="btn" data-act="begin">Los geht’s</button><button class="btn ghost" data-act="example">Erst mit Beispieldaten ansehen</button></div></div>';
}

function vOnboard() {
  const qs = visibleQs(); const q = qs[UI.q]; const v = UI.draft[q.key];
  let body = '';
  if (q.kind === 'year') {
    body = '<div class="field"><label for="yearIn">Jahr</label><input class="input num" id="yearIn" type="number" inputmode="numeric" min="' + q.min + '" max="' + q.max + '" placeholder="z. B. ' + (q.key === 'birthYear' ? 1990 : 2010) + '" value="' + (v || '') + '"></div>' + (UI.err ? '<p class="err" role="alert">' + esc(UI.err) + '</p>' : '');
  } else {
    const multi = q.kind === 'multi';
    body = '<div class="list" role="group" aria-label="Antworten">' + q.options.map((o, i) => {
      const on = multi ? (v || []).includes(o[0]) : v === o[0];
      return '<button class="choice" data-act="pick" data-i="' + i + '" aria-pressed="' + on + '"><span>' + esc(o[1]) + (o[2] ? '<small>' + esc(o[2]) + '</small>' : '') + '</span><span class="check">' + svg('check', ' stroke-width="2.6"') + '</span></button>';
    }).join('') + '</div>' + (UI.err ? '<p class="err" role="alert">' + esc(UI.err) + '</p>' : '');
  }
  const pct = Math.round((UI.q + 1) / qs.length * 100);
  return '<div class="scroll plain">' +
    '<div class="bar"><button class="iconbtn" data-act="qback" aria-label="Zurück">' + svg('back', ' stroke-width="2.2"') + '</button><span class="small muted num">Frage ' + (UI.q + 1) + ' von ' + qs.length + '</span><span style="width:44px"></span></div>' +
    '<div class="progress" role="progressbar" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><div style="width:' + pct + '%"></div></div>' +
    '<div class="qicon">' + svg(q.icon, ' stroke-width="1.8"') + '</div>' +
    '<h1>' + esc(q.title) + '</h1><p class="muted">' + esc(q.text) + '</p>' + body +
    '<div class="foot"><button class="btn" data-act="qnext">' + (UI.q === qs.length - 1 ? 'Plan erstellen' : 'Weiter') + '</button></div></div>';
}

function vSummary() {
  const es = entries(); const miss = es.filter(e => e.status === 'missing').length;
  const cats = CATS.map(c => [c, es.filter(e => e.item.cat === c.id).length]).filter(x => x[1]);
  return '<div class="scroll plain"><div class="qicon">' + svg('check', ' stroke-width="2.4"') + '</div>' +
    '<h1>Dein Plan steht</h1><p class="muted">' + es.length + ' Erinnerungen passen zu deinen Antworten. ' + (miss ? miss + ' davon brauchen noch ein Datum, zum Beispiel das Ablaufdatum deines Ausweises. Die trägst du in Ruhe nach.' : '') + '</p>' +
    '<div class="props">' + cats.map(x => '<div class="prop"><span>' + esc(x[0].name) + '</span><b class="num">' + x[1] + '</b></div>').join('') + '</div>' +
    (LN && perm !== 'granted' ? '<div class="note"><strong>Erinnerungen erlauben</strong><p>Damit dein Handy dich rechtzeitig anstupst, braucht die App deine Erlaubnis für Mitteilungen.</p></div>' : '') +
    '<div class="foot">' + (LN && perm !== 'granted' ? '<button class="btn" data-act="perm">Mitteilungen erlauben</button><button class="btn ghost" data-act="tab" data-v="home">Später</button>' : '<button class="btn" data-act="tab" data-v="home">Zur Übersicht</button>') + '</div></div>';
}

function vHome() {
  const es = entries().filter(e => e.status !== 'done');
  const g = s => es.filter(e => e.status === s).sort(byDue);
  const over = g('overdue'), now = g('now'), soon = g('soon'), later = g('later'), miss = es.filter(e => e.status === 'missing');
  const next30 = es.filter(e => e.due && e.status !== 'overdue' && daysBetween(today(), e.due) <= 30).length;
  const t = today();
  let h = '<div class="scroll">' + exampleBanner() + storageBanner() +
    '<div class="top"><p class="small muted">' + WEEKDAYS[t.getDay()] + ', ' + t.getDate() + '. ' + MONTHS_LONG[t.getMonth()] + '</p><h1>Deine Fristen</h1></div>' +
    '<div class="hero"><div><b class="num">' + next30 + '</b><span>in den nächsten 30 Tagen</span></div><div><b class="num">' + over.length + '</b><span>überfällig</span></div></div>';
  const sec = (title, arr, red) => arr.length ? '<h2' + (red ? ' class="red"' : '') + '>' + title + '</h2><div class="list">' + arr.map(rowHTML).join('') + '</div>' : '';
  h += sec('Überfällig', over, true) + sec('Jetzt kümmern', now) + sec('Demnächst', soon);
  if (miss.length) h += '<h2>Datum eintragen (' + miss.length + ')</h2><div class="list">' + miss.slice(0, 4).map(rowHTML).join('') + '</div>' + (miss.length > 4 ? '<button class="linkbtn" data-act="tab" data-v="areas">Alle ' + miss.length + ' in den Bereichen ansehen</button>' : '');
  h += sec('Später', later.slice(0, 5));
  if (!es.length) h += '<div class="empty">Noch keine Erinnerungen. Lege mit dem Plus eine eigene an.</div>';
  return h + '</div>' + fab() + tabs('home');
}

function vCalendar() {
  const t = today(), end = addMonths(t, 12); const ev = [];
  entries().forEach(e => {
    if (e.status === 'done' || !e.due) return;
    if (e.item.mode === 'dates') {
      const firstDue = e.due;
      occurrences(e.item, firstDue < t ? firstDue : t, end).forEach(d => { if (d >= firstDue) ev.push({ e, d }); });
    } else if (e.due <= end) ev.push({ e, d: e.due });
  });
  ev.sort((x, y) => x.d - y.d);
  let h = '<div class="scroll">' + exampleBanner() + '<div class="top"><h1>Kalender</h1><p class="small muted">Die nächsten 12 Monate</p></div>';
  let cur = '';
  ev.forEach(x => {
    const k = x.d.getFullYear() + '-' + x.d.getMonth();
    if (k !== cur) { if (cur) h += '</div>'; cur = k; h += '<h2>' + MONTHS_LONG[x.d.getMonth()] + ' ' + x.d.getFullYear() + '</h2><div class="month">'; }
    const st = x.d < t ? 'overdue' : '';
    h += '<button class="cal ' + st + '" data-act="open" data-id="' + esc(x.e.item.id) + '"><span class="day"><b class="num">' + x.d.getDate() + '</b><span>' + WEEKDAYS[x.d.getDay()].slice(0, 2) + '</span></span><span class="rowtext"><b>' + esc(x.e.item.title) + '</b><span>' + esc(catOf(x.e.item.cat).name) + (st ? ' · überfällig' : '') + '</span></span></button>';
  });
  if (cur) h += '</div>'; else h += '<div class="empty">In den nächsten 12 Monaten steht nichts an.</div>';
  return h + '</div>' + fab() + tabs('calendar');
}

function vAreas() {
  const es = entries();
  let h = '<div class="scroll">' + exampleBanner() + '<div class="top"><h1>Bereiche</h1><p class="small muted">' + es.length + ' aktive Erinnerungen</p></div><div class="grid">';
  CATS.forEach(c => {
    const list = es.filter(e => e.item.cat === c.id); if (!list.length && c.id !== 'eigene') return;
    const over = list.filter(e => e.status === 'overdue').length, miss = list.filter(e => e.status === 'missing').length;
    const info = over ? over + ' überfällig' : miss ? miss + ' ohne Datum' : list.length ? list.length + (list.length === 1 ? ' Eintrag' : ' Einträge') : 'noch leer';
    h += '<button class="tile' + (over ? ' alert' : '') + '" data-act="area" data-c="' + c.id + '"><span class="ico">' + svg(c.icon) + '</span><span class="rowtext"><b>' + esc(c.name) + '</b><span>' + info + '</span></span></button>';
  });
  return h + '<button class="tile add" data-act="add">' + svg('plus', ' width="26" height="26" stroke-width="2.4"') + 'Eigene Erinnerung</button></div></div>' + tabs('areas');
}

function vArea() {
  const c = catOf(UI.area); const all = entries(true).filter(e => e.item.cat === c.id);
  const vis = all.filter(e => !e.hidden), hid = all.filter(e => e.hidden);
  const order = { overdue: 0, now: 1, soon: 2, missing: 3, later: 4, done: 5 };
  vis.sort((x, y) => order[x.status] - order[y.status] || byDue(x, y));
  let h = '<div class="scroll"><div class="bar"><button class="iconbtn" data-act="tab" data-v="areas" aria-label="Zurück zu den Bereichen">' + svg('back', ' stroke-width="2.2"') + '</button></div><h1>' + esc(c.name) + '</h1>';
  h += vis.length ? '<div class="list">' + vis.map(rowHTML).join('') + '</div>' : '<div class="empty">Keine Einträge in diesem Bereich.</div>';
  if (hid.length) {
    h += '<button class="linkbtn" data-act="toggleHidden">' + (UI.showHidden ? 'Ausgeblendete verbergen' : hid.length + ' ausgeblendete anzeigen') + '</button>';
    if (UI.showHidden) h += '<div class="list">' + hid.map(rowHTML).join('') + '</div>';
  }
  return h + '</div>' + fab() + tabs('areas');
}

function gcalLink(item, due) {
  const d1 = toISO(due).replace(/-/g, ''), d2 = toISO(addDays(due, 1)).replace(/-/g, '');
  const p = new URLSearchParams({ action: 'TEMPLATE', text: item.title, dates: d1 + '/' + d2, details: (item.hint ? item.hint + '\n\n' : '') + 'Erinnerung aus Lebens-Admin' });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}
function doneLabel(item, st, a) {
  const months = st.months != null ? st.months : (item.months ? item.months(a) : 0);
  if (item.mode === 'dates') return 'Erledigt für dieses Mal';
  if (item.mode === 'once' || !months) return 'Erledigt';
  const nx = parseISO(markDone(item, st, a).next);
  return (item.mode === 'expiry' ? 'Erneuert – gültig bis ' : 'Erledigt – nächster Termin ') + MONTHS[nx.getMonth()] + ' ' + nx.getFullYear();
}

function vItem() {
  const item = getItem(UI.sel); if (!item) { UI.view = 'home'; return vHome(); }
  const a = S.answers, st = stOf(item.id), r = computeDue(item, st, a), lead = leadOf(item);
  const stt = r.done ? 'done' : status(r.due, lead);
  const c = catOf(item.cat);
  let h = '<div class="scroll plain"><div class="bar"><button class="iconbtn" data-act="back" aria-label="Zurück">' + svg('back', ' stroke-width="2.2"') + '</button></div>' +
    '<div class="chips"><span class="chip">' + esc(c.name) + '</span>' + (item.type === 'Pflicht' ? '<span class="chip must">Pflicht</span>' : item.custom ? '' : '<span class="chip">Empfehlung</span>') + (st.hidden ? '<span class="chip">ausgeblendet</span>' : '') + '</div>' +
    '<h1>' + esc(item.title) + '</h1>';
  if (r.done) h += '<div class="panel"><span class="small muted">Status</span><span class="bigdate">Erledigt</span></div>';
  else if (r.due) h += '<div class="panel"><span class="small muted">' + (stt === 'overdue' ? 'War fällig am' : 'Nächster Termin') + '</span><span class="bigdate num">' + fmtDate(r.due) + '</span><span class="rel ' + (stt === 'overdue' ? 'overdue' : '') + '">' + relText(r.due) + (lead && stt !== 'overdue' ? ' · Erinnerung ' + (lead >= 7 && lead % 7 === 0 ? (lead / 7) + ' Wochen' : lead + ' Tage') + ' vorher' : '') + '</span></div>';
  else h += '<div class="panel"><span class="small muted">Nächster Termin</span><span class="bigdate">Datum fehlt</span><span class="small muted">Trag es unten ein, dann erinnert dich die App rechtzeitig.</span></div>';
  h += '<div class="props">';
  if (item.mode !== 'dates' && !r.done) h += '<div class="prop"><label for="dateIn">' + esc(item.ask || 'Datum') + '</label><input id="dateIn" type="date" data-ch="date" value="' + (st.next || (item.mode === 'once' && r.due ? toISO(r.due) : '')) + '"></div>';
  h += '<div class="prop"><span>Rhythmus</span><b>' + esc(rhythmText(item, a)) + '</b></div>';
  if (item.custom) {
    const cm = (S.custom.find(x => x.id === item.id) || {}).months || 0;
    h += '<div class="prop"><label for="repIn">Wiederholen</label><select id="repIn" data-ch="repeat">' + REPEATS.map(o => '<option value="' + o[0] + '"' + (o[0] === cm ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>';
  }
  h += '<div class="prop"><label for="leadIn">Erinnern</label><select id="leadIn" data-ch="lead">' + LEADS.map(o => '<option value="' + o[0] + '"' + (o[0] === lead ? ' selected' : '') + '>' + o[1] + '</option>').join('') + (LEADS.some(o => o[0] === lead) ? '' : '<option selected value="' + lead + '">' + lead + ' Tage vorher</option>') + '</select></div>';
  h += '<div class="prop"><span>Zuletzt erledigt</span><b>' + (st.last ? fmtDate(parseISO(st.last)) : '–') + '</b></div></div>';
  if (item.hint) h += '<div class="note"><strong>Gut zu wissen</strong><p>' + esc(item.hint) + '</p></div>';
  h += '<div class="foot">';
  if (r.due && !r.done) h += '<button class="btn" data-act="done">' + esc(doneLabel(item, st, a)) + '</button>';
  if (r.done) h += '<button class="btn ghost" data-act="reopen">Wieder aktivieren</button>';
  if (r.due && !r.done && !NATIVE) h += '<a class="btn ghost" href="' + esc(gcalLink(item, r.due)) + '" target="_blank" rel="noopener">In Google Kalender eintragen</a>';
  if (UI.confirm === 'remove') {
    h += '<div class="confirm" role="alert"><p><b>' + (item.custom ? 'Diese Erinnerung löschen?' : 'Diesen Eintrag ausblenden?') + '</b><br><span class="small">' + (item.custom ? 'Das lässt sich nicht rückgängig machen.' : 'Du findest ihn später im Bereich unter „ausgeblendete anzeigen“.') + '</span></p><div class="btns"><button class="btn danger small" data-act="removeYes">' + (item.custom ? 'Löschen' : 'Ausblenden') + '</button><button class="btn ghost small" data-act="removeNo">Abbrechen</button></div></div>';
  } else if (st.hidden) h += '<button class="linkbtn" data-act="unhide">Wieder einblenden</button>';
  else h += '<button class="linkbtn" data-act="remove">' + (item.custom ? 'Erinnerung löschen' : 'Betrifft mich nicht – ausblenden') + '</button>';
  return h + '</div></div>' + toastHTML();
}
const LEADS = [[0, 'Am Tag selbst'], [3, '3 Tage vorher'], [7, '1 Woche vorher'], [14, '2 Wochen vorher'], [28, '4 Wochen vorher'], [42, '6 Wochen vorher'], [60, '2 Monate vorher'], [90, '3 Monate vorher'], [120, '4 Monate vorher'], [180, '6 Monate vorher']];
const REPEATS = [[0, 'Einmalig'], [1, 'Jeden Monat'], [3, 'Alle 3 Monate'], [6, 'Alle 6 Monate'], [12, 'Jedes Jahr'], [24, 'Alle 2 Jahre'], [60, 'Alle 5 Jahre'], [120, 'Alle 10 Jahre']];

function vAdd() {
  const d = UI.draft;
  return '<div class="scroll plain"><div class="bar"><button class="iconbtn" data-act="back" aria-label="Zurück">' + svg('back', ' stroke-width="2.2"') + '</button></div><h1>Eigene Erinnerung</h1>' +
    '<form id="addForm" class="list">' +
    '<div class="field"><label for="aTitle">Was?</label><input class="input" id="aTitle" required maxlength="80" placeholder="z. B. Fahrradschloss-Code ändern" value="' + esc(d.title || '') + '"></div>' +
    '<div class="field"><label for="aDate">Wann fällig?</label><input class="input" id="aDate" type="date" required value="' + esc(d.date || '') + '"></div>' +
    '<div class="field"><label for="aRep">Wiederholen</label><select class="input" id="aRep">' + REPEATS.map(o => '<option value="' + o[0] + '">' + o[1] + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="aLead">Erinnern</label><select class="input" id="aLead">' + LEADS.map(o => '<option value="' + o[0] + '"' + (o[0] === 7 ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
    '<div class="field"><label for="aCat">Bereich</label><select class="input" id="aCat">' + CATS.map(c => '<option value="' + c.id + '"' + (c.id === (UI.area || 'eigene') ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select></div>' +
    (UI.err ? '<p class="err" role="alert">' + esc(UI.err) + '</p>' : '') +
    '<div class="foot"><button class="btn" type="submit">Speichern</button></div></form></div>';
}

function vSettings() {
  let h = '<div class="scroll">' + exampleBanner() + '<div class="top"><h1>Einstellungen</h1></div><h2>Erinnerungen</h2>';
  if (LN) {
    const on = S.notify.on && perm === 'granted';
    h += '<div class="props"><div class="prop"><span>Mitteilungen</span><b>' + (perm === 'granted' ? (S.notify.on ? 'an' : 'aus') : perm === 'denied' ? 'blockiert' : 'nicht erlaubt') + '</b></div>' +
      '<div class="prop"><label for="hourIn">Uhrzeit</label><select id="hourIn" data-ch="hour">' + [7, 8, 9, 10, 12, 15, 18, 19, 20].map(x => '<option value="' + x + '"' + (x === S.notify.hour ? ' selected' : '') + '>' + x + ':00 Uhr</option>').join('') + '</select></div></div>';
    if (perm === 'denied') h += '<p class="small muted">Mitteilungen sind in den Handy-Einstellungen blockiert. Erlaube sie dort unter Apps › Lebens-Admin › Benachrichtigungen.</p>';
    h += '<div class="list">' + (perm !== 'granted' && perm !== 'denied' ? '<button class="btn" data-act="perm">Mitteilungen erlauben</button>' : '<button class="btn ghost" data-act="notifyToggle">' + (on ? 'Erinnerungen ausschalten' : 'Erinnerungen einschalten') + '</button>') + '<button class="btn ghost" data-act="testNote">Test-Erinnerung senden</button></div>';
  } else {
    h += '<div class="note"><strong>Erinnerungen aufs Handy</strong><p>' + (IN_ARTIFACT ? 'Diese Version kann keine Mitteilungen schicken.' : 'Im Browser kann die App keine Mitteilungen schicken. Mit der Android-App kommen sie automatisch.') + ' Trag wichtige Termine mit „In Google Kalender eintragen“ ein, dann meldet sich dein Handy-Kalender.</p></div>';
  }
  h += '<h2>Deine Angaben</h2><div class="list"><button class="btn ghost" data-act="redo">Fragen noch einmal beantworten</button></div>' +
    '<h2>Sicherung</h2><p class="small muted">Deine Daten liegen nur auf diesem Gerät. Speichere ab und zu eine Sicherung, besonders vor einem Handywechsel.</p>' +
    '<div class="list"><button class="btn ghost" data-act="backup">' + (IN_ARTIFACT || !NATIVE ? 'Sicherung speichern' : 'Sicherung kopieren') + '</button><label class="btn ghost" for="restoreIn">Sicherung aus Datei laden</label><input id="restoreIn" type="file" accept=".json,application/json,text/plain" hidden data-ch="restore"><button class="btn ghost" data-act="pasteOpen">Sicherung aus Text einfügen</button></div>';
  if (UI.confirm === 'paste') h += '<div class="field"><label for="pasteIn">Sicherungstext</label><textarea class="input" id="pasteIn" rows="5" style="padding:12px;min-height:120px"></textarea><button class="btn" data-act="pasteDo">Laden</button></div>';
  if (UI.backupText) h += '<div class="field"><label for="bkOut">Deine Sicherung – kopieren und z. B. per Mail an dich selbst schicken</label><textarea class="input" id="bkOut" rows="5" readonly style="padding:12px;min-height:120px">' + esc(UI.backupText) + '</textarea></div>';
  h += (UI.err ? '<p class="err" role="alert">' + esc(UI.err) + '</p>' : '') + '<h2>Zurücksetzen</h2>';
  if (UI.confirm === 'reset') h += '<div class="confirm" role="alert"><p><b>Alle Daten löschen?</b><br><span class="small">Antworten, Termine und eigene Erinnerungen werden auf diesem Gerät gelöscht.</span></p><div class="btns"><button class="btn danger small" data-act="resetYes">Alles löschen</button><button class="btn ghost small" data-act="resetNo">Abbrechen</button></div></div>';
  else h += '<div class="list"><button class="btn ghost" data-act="reset">Alle Daten löschen</button></div>';
  h += '<p class="small muted">Alle Fristen ohne Gewähr, Stand Oktober 2026. Vorsorge-Hinweise ersetzen keine ärztliche Beratung.</p>';
  return h + '</div>' + toastHTML() + tabs('settings');
}
function toastHTML() { return UI.toast ? '<div class="toast" role="status"><span>' + esc(UI.toast.text) + '</span>' + (UI.toast.undo ? '<button data-act="undo">Rückgängig</button>' : '') + '</div>' : ''; }

/* ---------- Render ---------- */
const app = document.getElementById('app');
let lastView = '';
function render() {
  const v = { welcome: vWelcome, onboard: vOnboard, summary: vSummary, home: vHome, calendar: vCalendar, areas: vAreas, area: vArea, item: vItem, add: vAdd, settings: vSettings }[UI.view] || vHome;
  const sc = app.querySelector('.scroll'); const keep = lastView === UI.view && sc ? sc.scrollTop : 0;
  app.innerHTML = v();
  const ns = app.querySelector('.scroll'); if (ns) ns.scrollTop = keep;
  if (lastView !== UI.view) { const f = app.querySelector('#yearIn'); if (f && !f.value) setTimeout(() => f.focus(), 50); }
  lastView = UI.view;
}
let toastTimer;
function toast(text, undo) { UI.toast = { text, undo }; clearTimeout(toastTimer); toastTimer = setTimeout(() => { UI.toast = null; render(); }, 6000); }
function go(view) { UI.view = view; UI.confirm = null; UI.err = ''; render(); }

function finishOnboard() {
  const d = UI.draft;
  if (!d.license) delete d.licenseYear;
  if (Array.isArray(d.pets) && d.pets.includes('keine')) d.pets = ['keine'];
  S.answers = Object.assign({}, d); S.onboarded = true; save();
  go('summary');
}

function loadExample() {
  const y = today().getFullYear();
  const iso = (dy, m, dd) => toISO(new Date(y + dy, m - 1, dd));
  S = blank();
  S.answers = { birthYear: 1991, gender: 'm', license: true, licenseYear: 2003, car: true, housing: 'miete', heating: 'gas_oel', tax: 'selbst', kids: false, pets: ['hund'], travel: true };
  const n = (id, v) => { S.items[id] = { next: v }; };
  n('perso', iso(2, 5, 12)); n('pass', iso(1, 2, 3)); n('hu', iso(1, 3, 1)); n('inspektion', iso(1, 4, 1)); n('kfzsteuer', iso(1, 2, 14));
  n('zahnarzt', toISO(addDays(today(), 18))); n('hausrat', iso(1, 1, 1)); n('tetanus', iso(5, 6, 1)); n('entwurmung', toISO(addDays(today(), 9)));
  n('bankkarte', iso(0, 12, 31)); n('egk', iso(2, 9, 30)); n('hundesteuer', iso(1, 1, 15)); n('energie', iso(1, 6, 30)); n('tierarzt', iso(1, 5, 1));
  S.custom.push({ id: 'c_ex1', title: 'Fahrrad zur Inspektion', cat: 'eigene', months: 12, lead: 7 }); S.items.c_ex1 = { next: iso(1, 3, 20) };
  S.onboarded = true; S.example = true; save();
}

/* ---------- Ereignisse ---------- */
app.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act; const a = S.answers;
  if (act === 'begin') { UI.draft = {}; UI.q = 0; go('onboard'); }
  else if (act === 'example') { loadExample(); go('home'); }
  else if (act === 'startReal') { S = blank(); save(); UI.draft = {}; UI.q = 0; go('onboard'); }
  else if (act === 'pick') {
    const q = visibleQs()[UI.q]; const val = q.options[+b.dataset.i][0];
    if (q.kind === 'multi') {
      let cur = (UI.draft[q.key] || []).slice();
      if (val === 'keine') cur = ['keine']; else { cur = cur.filter(x => x !== 'keine'); cur = cur.includes(val) ? cur.filter(x => x !== val) : cur.concat(val); }
      UI.draft[q.key] = cur; UI.err = ''; render();
    } else { UI.draft[q.key] = val; UI.err = ''; render(); setTimeout(() => nextQ(), 180); }
  }
  else if (act === 'qnext') nextQ();
  else if (act === 'qback') { if (UI.q > 0) { UI.q--; UI.err = ''; render(); } else go(S.onboarded ? 'settings' : 'welcome'); }
  else if (act === 'tab') { UI.area = null; UI.showHidden = false; go(b.dataset.v); }
  else if (act === 'open') { UI.from = UI.view; UI.sel = b.dataset.id; go('item'); }
  else if (act === 'back') go(UI.from === 'item' ? 'home' : UI.from || 'home');
  else if (act === 'area') { UI.area = b.dataset.c; UI.showHidden = false; go('area'); }
  else if (act === 'toggleHidden') { UI.showHidden = !UI.showHidden; render(); }
  else if (act === 'add') { UI.from = UI.view; UI.draft = {}; go('add'); }
  else if (act === 'done') {
    const item = getItem(UI.sel); const prev = Object.assign({}, stOf(item.id));
    const ns = markDone(item, prev, a); if (prev.lead != null) ns.lead = prev.lead; if (prev.months != null) ns.months = prev.months;
    S.items[item.id] = ns; save();
    const r = computeDue(item, ns, a);
    toast(r.due ? 'Erledigt. Nächster Termin: ' + fmtDate(r.due) : 'Erledigt.', { id: item.id, prev }); render();
  }
  else if (act === 'undo') { const u = UI.toast && UI.toast.undo; if (u) { S.items[u.id] = u.prev; save(); } UI.toast = null; render(); }
  else if (act === 'reopen') { const st = Object.assign({}, stOf(UI.sel)); delete st.done; S.items[UI.sel] = st; save(); render(); }
  else if (act === 'remove') { UI.confirm = 'remove'; render(); }
  else if (act === 'removeNo') { UI.confirm = null; render(); }
  else if (act === 'removeYes') {
    const item = getItem(UI.sel);
    if (item.custom) { S.custom = S.custom.filter(c => c.id !== item.id); delete S.items[item.id]; save(); go(UI.from === 'item' ? 'home' : UI.from || 'home'); }
    else { S.items[item.id] = Object.assign({}, stOf(item.id), { hidden: true }); save(); UI.confirm = null; render(); }
  }
  else if (act === 'unhide') { const st = Object.assign({}, stOf(UI.sel)); delete st.hidden; S.items[UI.sel] = st; save(); render(); }
  else if (act === 'redo') { UI.draft = Object.assign({}, S.answers); UI.q = 0; go('onboard'); }
  else if (act === 'backup') backup();
  else if (act === 'perm') askPerm();
  else if (act === 'notifyToggle') { S.notify.on = !S.notify.on; save(); render(); }
  else if (act === 'testNote') testNotification();
  else if (act === 'pasteOpen') { UI.confirm = UI.confirm === 'paste' ? null : 'paste'; UI.err = ''; render(); }
  else if (act === 'pasteDo') { const t = app.querySelector('#pasteIn'); loadBackupText(t ? t.value.trim() : ''); }
  else if (act === 'reset') { UI.confirm = 'reset'; render(); }
  else if (act === 'resetNo') { UI.confirm = null; render(); }
  else if (act === 'resetYes') { S = blank(); save(); UI.draft = {}; go('welcome'); }
});

function nextQ() {
  const qs = visibleQs(); const q = qs[UI.q];
  if (q.kind === 'year') {
    const inp = app.querySelector('#yearIn'); const v = parseInt(inp && inp.value, 10);
    if (!v || v < q.min || v > q.max) { UI.err = 'Bitte ein Jahr zwischen ' + q.min + ' und ' + q.max + ' eingeben.'; render(); return; }
    UI.draft[q.key] = v;
  } else if (q.kind === 'multi') {
    if (!(UI.draft[q.key] || []).length) { UI.err = 'Bitte mindestens eine Antwort wählen.'; render(); return; }
  } else if (UI.draft[q.key] === undefined) { UI.err = 'Bitte eine Antwort wählen.'; render(); return; }
  UI.err = '';
  const qs2 = visibleQs();
  if (UI.q >= qs2.length - 1) finishOnboard(); else { UI.q++; render(); }
}

app.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.id === 'yearIn') { ev.preventDefault(); nextQ(); } });

app.addEventListener('change', ev => {
  const t = ev.target; const ch = t.dataset.ch; if (!ch) return;
  if (ch === 'date') { const st = Object.assign({}, stOf(UI.sel)); if (t.value) st.next = t.value; else delete st.next; S.items[UI.sel] = st; save(); render(); }
  else if (ch === 'lead') { S.items[UI.sel] = Object.assign({}, stOf(UI.sel), { lead: +t.value }); save(); render(); }
  else if (ch === 'repeat') { const c = S.custom.find(x => x.id === UI.sel); if (c) { c.months = +t.value; save(); render(); } }
  else if (ch === 'restore') restore(t.files && t.files[0]);
  else if (ch === 'hour') { S.notify.hour = +t.value; save(); render(); }
});

app.addEventListener('submit', ev => {
  ev.preventDefault();
  const title = app.querySelector('#aTitle').value.trim(), date = app.querySelector('#aDate').value;
  if (!title || !date) { UI.err = 'Bitte Titel und Datum ausfüllen.'; UI.draft = { title, date }; render(); return; }
  const id = 'c_' + Date.now().toString(36);
  S.custom.push({ id, title, cat: app.querySelector('#aCat').value, months: +app.querySelector('#aRep').value, lead: +app.querySelector('#aLead').value });
  S.items[id] = { next: date }; save();
  UI.sel = id; UI.from = 'home'; go('item'); toast('Erinnerung gespeichert.'); render();
});

async function backup() {
  UI.err = ''; UI.backupText = '';
  const json = JSON.stringify(Object.assign({ app: 'lebens-admin', version: 1 }, S));
  const name = 'lebens-admin-sicherung-' + toISO(today()) + '.json';
  if (IN_ARTIFACT) {
    const dl = await window.claude.use('downloads');
    if (!dl) { UI.err = 'Speichern ist in dieser Ansicht nicht möglich.'; render(); return; }
    try { await dl.save({ filename: name, data: json }); toast('Sicherung gespeichert.'); render(); }
    catch (e) { if (e && e.code !== 'declined') { UI.err = 'Die Sicherung konnte nicht gespeichert werden.'; render(); } }
    return;
  }
  if (!NATIVE) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); toast('Sicherung gespeichert.'); render(); return;
  }
  UI.backupText = json;
  try { await navigator.clipboard.writeText(json); toast('Sicherung kopiert. Füge sie z. B. in eine Mail an dich selbst ein.'); }
  catch (e) { toast('Markiere den Text unten und kopiere ihn.'); }
  render();
}
function loadBackupText(text) {
  try {
    const d = JSON.parse(text);
    if (d.app !== 'lebens-admin' || !d.answers) throw new Error();
    delete d.app; delete d.version; S = Object.assign(blank(), d); save(); UI.err = ''; UI.backupText = '';
    toast('Sicherung geladen.'); go('home');
  } catch (e) { UI.err = 'Das ist keine Lebens-Admin-Sicherung.'; render(); }
}
function restore(file) {
  if (!file) return;
  const fr = new FileReader();
  fr.onload = () => loadBackupText(fr.result);
  fr.readAsText(file);
}

/* ---------- Start ---------- */
if (LN) {
  try { LN.addListener('localNotificationActionPerformed', ev => { const id = ev && ev.notification && ev.notification.extra && ev.notification.extra.item; if (id && getItem(id)) { UI.from = 'home'; UI.sel = id; go('item'); } }); } catch (e) { }
  checkPerm().then(() => { render(); syncNotifications(); });
}
/* Beim Zurückkehren in die App: Datum kann sich geändert haben */
document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); scheduleSync(); } });
/* Offline-Fähigkeit für die installierte Web-App (iPhone, Browser) */
if (!NATIVE && !IN_ARTIFACT && 'serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
render();
