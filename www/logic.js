/* ===== Lebens-Admin: Katalog und Datumslogik (reine Funktionen) ===== */
const MONTHS = ['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.'];
const MONTHS_LONG = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const pad = n => String(n).padStart(2, '0');
const toISO = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseISO = s => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
function addMonths(d, n) {
  const y = d.getFullYear(), m = d.getMonth() + n;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(d.getDate(), last));
}
const daysBetween = (a, b) => Math.round((b - a) / 864e5);
const fmtDate = d => d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
/* Wochenende -> naechster Werktag (Feiertage nicht beruecksichtigt) */
function nextWorkday(d) { const w = d.getDay(); return w === 6 ? addDays(d, 2) : w === 0 ? addDays(d, 1) : d; }

const CATS = [
  { id: 'ausweise', name: 'Ausweise', icon: 'card' },
  { id: 'auto', name: 'Auto', icon: 'car' },
  { id: 'wohnung', name: 'Wohnung', icon: 'home' },
  { id: 'geld', name: 'Steuern & Geld', icon: 'doc' },
  { id: 'gesundheit', name: 'Gesundheit', icon: 'heart' },
  { id: 'kinder', name: 'Kinder', icon: 'people' },
  { id: 'tiere', name: 'Haustiere', icon: 'paw' },
  { id: 'eigene', name: 'Eigene', icon: 'star' }
];

const age = a => a.birthYear ? (today().getFullYear() - a.birthYear) : 0;
const yearly = (mm, dd) => y => [new Date(y, mm - 1, dd)];
const quarterly = y => [1, 4, 7, 10].map(m => new Date(y, m, 15));

/* Fuehrerschein-Umtauschfrist (Anlage 8e FeV) */
function licenseDeadline(a) {
  if (!a.license || !a.licenseYear) return null;
  const ly = a.licenseYear;
  if (ly >= 2013) return null;
  if (a.birthYear && a.birthYear < 1953) return new Date(2033, 0, 19);
  if (ly <= 1998) {
    const b = a.birthYear || 1971;
    const y = b <= 1958 ? 2022 : b <= 1964 ? 2023 : b <= 1970 ? 2024 : 2025;
    return new Date(y, 0, 19);
  }
  const y = ly <= 2001 ? 2026 : ly <= 2004 ? 2027 : ly <= 2007 ? 2028 : ly === 2008 ? 2029 : ly === 2009 ? 2030 : ly === 2010 ? 2031 : ly === 2011 ? 2032 : 2033;
  return new Date(y, 0, 19);
}

/*
 mode:
  interval  – wiederkehrend alle `months` Monate, Startdatum vom Nutzer
  expiry    – Ablaufdatum vom Nutzer, nach Erneuerung + `months`
  dates     – feste Termine im Jahr, gen(year) -> [Date]
  once      – einmaliger Termin, date(answers) -> Date
  manual    – Datum vom Nutzer, optional Wiederholung `months`
*/
const CATALOG = [
  // Ausweise
  { id: 'perso', cat: 'ausweise', title: 'Personalausweis erneuern', type: 'Pflicht', mode: 'expiry', months: a => age(a) < 24 ? 72 : 120, lead: 90, ask: 'Gültig bis (steht vorne auf dem Ausweis)', hint: 'Neuen Ausweis im Bürgeramt beantragen. Die Herstellung dauert oft 3–4 Wochen. Unter 24 Jahren gilt er 6 Jahre, sonst 10 Jahre.', cond: () => true },
  { id: 'pass', cat: 'ausweise', title: 'Reisepass erneuern', type: 'Empfehlung', mode: 'expiry', months: a => age(a) < 24 ? 72 : 120, lead: 120, ask: 'Gültig bis', hint: 'Manche Länder verlangen bei der Einreise noch 6 Monate Restgültigkeit. Herstellung im Normalverfahren dauert mehrere Wochen.', cond: a => a.travel },
  { id: 'fs_umtausch', cat: 'ausweise', title: 'Führerschein umtauschen', type: 'Pflicht', mode: 'once', date: licenseDeadline, lead: 180, hint: 'Alte Führerscheine müssen gestaffelt nach Ausstellungsjahr (Feld 4a) umgetauscht werden. Der Umtausch geht ohne Prüfung bei der Fahrerlaubnisbehörde.', cond: a => !!licenseDeadline(a) },
  { id: 'fs_neu', cat: 'ausweise', title: 'Führerschein-Karte erneuern', type: 'Pflicht', mode: 'expiry', months: () => 180, lead: 90, ask: 'Gültig bis (Feld 4b)', hint: 'Seit 19.01.2013 ausgestellte Karten gelten 15 Jahre. Die Fahrerlaubnis selbst bleibt, nur das Dokument wird erneuert.', cond: a => a.license && a.licenseYear >= 2013 },
  { id: 'egk', cat: 'ausweise', title: 'Gesundheitskarte läuft ab', type: 'Empfehlung', mode: 'expiry', months: () => 60, lead: 30, ask: 'Gültig bis (Rückseite)', hint: 'Meist schickt die Krankenkasse automatisch eine neue Karte. Falls nicht, rechtzeitig nachfragen.', cond: () => true },
  { id: 'bankkarte', cat: 'ausweise', title: 'Bankkarte läuft ab', type: 'Empfehlung', mode: 'expiry', months: () => 48, lead: 30, ask: 'Gültig bis', hint: 'Die neue Karte kommt meist automatisch. Danach Abos und Zahlungsdienste auf die neue Karte umstellen.', cond: () => true },
  // Auto
  { id: 'hu', cat: 'auto', title: 'Hauptuntersuchung (TÜV)', type: 'Pflicht', mode: 'interval', months: () => 24, fromDue: true, lead: 42, ask: 'Nächste HU fällig (Monat auf der Plakette)', hint: 'Geht bei TÜV, DEKRA, GTÜ oder KÜS. Zulassungsbescheinigung Teil I mitnehmen. Neuwagen müssen erstmals nach 3 Jahren hin.', cond: a => a.car },
  { id: 'kfzvers', cat: 'auto', title: 'Kfz-Versicherung vergleichen', type: 'Empfehlung', mode: 'dates', gen: yearly(11, 30), lead: 30, hint: 'Läuft der Vertrag zum 31.12., muss die Kündigung meist bis 30.11. beim Versicherer sein. Vorher Angebote vergleichen.', cond: a => a.car },
  { id: 'winterreifen', cat: 'auto', title: 'Winterreifen montieren', type: 'Pflicht', mode: 'dates', gen: yearly(10, 15), lead: 14, window: 75, hint: 'Bei Schnee, Eis und Glätte sind Winterreifen Pflicht. Faustregel: von Oktober bis Ostern. Werkstatt-Termine früh buchen.', cond: a => a.car },
  { id: 'sommerreifen', cat: 'auto', title: 'Sommerreifen montieren', type: 'Empfehlung', mode: 'dates', gen: yearly(4, 15), lead: 14, window: 60, hint: 'Nach Ostern, wenn kein Frost mehr zu erwarten ist. Profiltiefe prüfen: gesetzlich mindestens 1,6 mm.', cond: a => a.car },
  { id: 'inspektion', cat: 'auto', title: 'Inspektion / Ölwechsel', type: 'Empfehlung', mode: 'interval', months: () => 12, lead: 28, ask: 'Nächste Inspektion fällig (laut Serviceheft)', hint: 'Intervall steht im Serviceheft oder im Bordcomputer. Hier kannst du das Datum jederzeit anpassen.', cond: a => a.car },
  { id: 'kfzsteuer', cat: 'auto', title: 'Kfz-Steuer wird abgebucht', type: 'Pflicht', mode: 'interval', months: () => 12, fromDue: true, lead: 7, ask: 'Datum der nächsten Abbuchung (Steuerbescheid)', hint: 'Das Hauptzollamt bucht jährlich per Lastschrift ab. Konto gedeckt halten, sonst kommen Mahngebühren.', cond: a => a.car },
  { id: 'verbandkasten', cat: 'auto', title: 'Verbandkasten erneuern', type: 'Empfehlung', mode: 'expiry', months: () => 60, lead: 30, ask: 'Haltbar bis (Aufkleber am Kasten)', hint: 'Sterile Teile haben ein Ablaufdatum. Ein Verbandkasten nach DIN 13164 muss im Auto sein.', cond: a => a.car },
  // Wohnung
  { id: 'rauchmelder', cat: 'wohnung', title: 'Rauchmelder testen', type: 'Pflicht', mode: 'dates', gen: yearly(3, 13), lead: 0, window: 45, hint: 'Rauchmelder sind in allen Bundesländern Pflicht und sollen jährlich geprüft werden. Wer zuständig ist, regelt das Bundesland oder der Mietvertrag.', cond: () => true },
  { id: 'zaehler', cat: 'wohnung', title: 'Zählerstände ablesen', type: 'Empfehlung', mode: 'dates', gen: yearly(12, 28), lead: 0, window: 20, hint: 'Strom, Gas und Wasser zum Jahresende ablesen und mit Foto festhalten. Hilft bei Abrechnungen und Anbieterwechsel.', cond: () => true },
  { id: 'energie', cat: 'wohnung', title: 'Strom- und Gasvertrag prüfen', type: 'Empfehlung', mode: 'manual', months: () => 12, lead: 42, ask: 'Ende der Vertragslaufzeit', hint: 'Nach der Mindestlaufzeit lohnt sich oft ein Wechsel. Kündigungsfrist im Vertrag prüfen.', cond: () => true },
  { id: 'nebenkosten', cat: 'wohnung', title: 'Nebenkostenabrechnung prüfen', type: 'Empfehlung', mode: 'manual', months: () => 12, lead: 14, ask: 'Ende der Einwandfrist (Eingang der Abrechnung + 12 Monate)', hint: 'Die Abrechnung muss spätestens 12 Monate nach Ende des Abrechnungszeitraums kommen. Einwände sind bis 12 Monate nach Erhalt möglich.', cond: a => a.housing === 'miete' },
  { id: 'entlueften', cat: 'wohnung', title: 'Heizkörper entlüften', type: 'Empfehlung', mode: 'dates', gen: yearly(9, 25), lead: 0, window: 45, hint: 'Vor der Heizsaison entlüften, wenn Heizkörper gluckern oder oben kalt bleiben.', cond: () => true },
  { id: 'heizung', cat: 'wohnung', title: 'Heizung warten lassen', type: 'Empfehlung', mode: 'interval', months: () => 12, lead: 28, ask: 'Nächste Wartung', hint: 'Jährliche Wartung spart Energie und beugt Ausfällen vor. In Mietwohnungen kümmert sich meist der Vermieter.', cond: a => a.heating === 'gas_oel' },
  { id: 'schornstein', cat: 'wohnung', title: 'Schornsteinfeger-Termin', type: 'Pflicht', mode: 'manual', lead: 14, ask: 'Termin laut Feuerstättenbescheid', hint: 'Der Schornsteinfeger kommt laut Feuerstättenbescheid. Die Feuerstättenschau ist zweimal in sieben Jahren fällig.', cond: a => a.heating === 'gas_oel' || a.heating === 'holz' },
  { id: 'grundsteuer', cat: 'wohnung', title: 'Grundsteuer zahlen', type: 'Pflicht', mode: 'dates', gen: quarterly, lead: 7, window: 20, hint: 'Fällig jeweils am 15.02., 15.05., 15.08. und 15.11., sofern die Gemeinde nichts anderes festgelegt hat.', cond: a => a.housing === 'eigentum' },
  { id: 'hausrat', cat: 'wohnung', title: 'Hausrat und Haftpflicht prüfen', type: 'Empfehlung', mode: 'interval', months: () => 12, fromDue: true, lead: 30, ask: 'Hauptfälligkeit der Versicherung', hint: 'Einmal im Jahr prüfen, ob Versicherungssumme und Beitrag noch passen.', cond: () => true },
  { id: 'wohngebaeude', cat: 'wohnung', title: 'Wohngebäudeversicherung prüfen', type: 'Empfehlung', mode: 'interval', months: () => 12, fromDue: true, lead: 30, ask: 'Hauptfälligkeit der Versicherung', hint: 'Versicherungssumme an Baukosten anpassen und Elementarschutz prüfen.', cond: a => a.housing === 'eigentum' },
  { id: 'herbst', cat: 'wohnung', title: 'Haus winterfest machen', type: 'Empfehlung', mode: 'dates', gen: yearly(10, 25), lead: 0, window: 45, hint: 'Außenwasserhahn absperren und entleeren, Dachrinne reinigen.', cond: a => a.housing === 'eigentum' },
  { id: 'winterdienst', cat: 'wohnung', title: 'Winterdienst beginnt', type: 'Pflicht', mode: 'dates', gen: yearly(11, 1), lead: 7, window: 30, hint: 'Als Eigentümer oder laut Mietvertrag musst du bei Schnee und Glätte räumen und streuen. Streusalz und Schaufel bereitlegen.', cond: a => a.housing === 'eigentum' },
  // Steuern & Geld
  { id: 'steuer_selbst', cat: 'geld', title: 'Steuererklärung abgeben', type: 'Pflicht', mode: 'dates', gen: y => [nextWorkday(new Date(y, 6, 31))], lead: 90, window: 60, hint: 'Ohne Steuerberater bis 31. Juli des Folgejahres, fällt das auf ein Wochenende, am nächsten Werktag. Für 2026 also bis 02.08.2027.', cond: a => a.tax === 'selbst' },
  { id: 'steuer_berater', cat: 'geld', title: 'Steuererklärung (Steuerberater)', type: 'Pflicht', mode: 'dates', gen: y => [nextWorkday(new Date(y, 2, 0))], lead: 90, window: 30, hint: 'Mit Steuerberater oder Lohnsteuerhilfe bis Ende Februar des zweiten Folgejahres. Unterlagen deutlich früher abgeben.', cond: a => a.tax === 'berater' },
  { id: 'steuer_frei', cat: 'geld', title: 'Freiwillige Steuererklärung', type: 'Empfehlung', mode: 'dates', gen: yearly(12, 31), lead: 60, window: 10, hint: 'Wer nicht abgeben muss, kann bis zu 4 Jahre rückwirkend abgeben. Zum 31.12. verfällt das älteste Jahr, oft mit Erstattung.', cond: a => a.tax !== 'berater' },
  { id: 'unterlagen', cat: 'geld', title: 'Steuerunterlagen sammeln', type: 'Empfehlung', mode: 'dates', gen: yearly(3, 1), lead: 0, window: 45, hint: 'Lohnsteuerbescheinigung, Belege für Fahrten, Handwerker und Spenden in einen Ordner legen.', cond: a => a.tax === 'selbst' || a.tax === 'berater' },
  { id: 'rundfunk', cat: 'geld', title: 'Rundfunkbeitrag wird abgebucht', type: 'Pflicht', mode: 'dates', gen: quarterly, lead: 5, window: 10, hint: '18,36 € pro Monat und Wohnung, meist 55,08 € pro Quartal. Wer Bürgergeld, BAföG oder ähnliches bekommt, kann sich befreien lassen.', cond: () => true },
  { id: 'freistellung', cat: 'geld', title: 'Freistellungsauftrag prüfen', type: 'Empfehlung', mode: 'dates', gen: yearly(1, 2), lead: 0, window: 30, hint: 'Bis 1.000 € Kapitalerträge (Paare 2.000 €) bleiben steuerfrei, wenn der Freistellungsauftrag richtig verteilt ist.', cond: () => true },
  { id: 'vertraege', cat: 'geld', title: 'Handyvertrag / Abos prüfen', type: 'Empfehlung', mode: 'manual', lead: 42, ask: 'Ende der Mindestlaufzeit', hint: 'Nach der Mindestlaufzeit sind die meisten Verträge monatlich kündbar. Oft gibt es bei Wechsel bessere Preise.', cond: () => true },
  { id: 'schufa', cat: 'geld', title: 'Schufa-Selbstauskunft holen', type: 'Empfehlung', mode: 'interval', months: () => 12, lead: 0, ask: 'Wann möchtest du sie holen?', hint: 'Einmal im Jahr kostenlos nach Art. 15 DSGVO. Falsche Einträge kannst du berichtigen lassen.', cond: () => true },
  // Gesundheit
  { id: 'zahnarzt', cat: 'gesundheit', title: 'Zahnarzt-Kontrolle', type: 'Empfehlung', mode: 'interval', months: () => 6, lead: 14, ask: 'Nächste Kontrolle fällig', hint: 'Mindestens einmal pro Kalenderjahr eintragen lassen, damit das Bonusheft zählt. Empfohlen ist halbjährlich.', cond: () => true },
  { id: 'checkup', cat: 'gesundheit', title: 'Gesundheits-Check-up', type: 'Empfehlung', mode: 'interval', months: a => age(a) >= 35 ? 36 : 0, lead: 30, ask: 'Nächster Check-up möglich ab', hint: 'Gesetzlich Versicherte: einmal zwischen 18 und 34, ab 35 alle 3 Jahre. Termin in der Hausarztpraxis.', cond: a => age(a) >= 18 },
  { id: 'hautkrebs', cat: 'gesundheit', title: 'Hautkrebs-Screening', type: 'Empfehlung', mode: 'interval', months: () => 24, lead: 30, ask: 'Nächstes Screening möglich ab', hint: 'Ab 35 alle 2 Jahre, beim Hautarzt oder in vielen Hausarztpraxen.', cond: a => age(a) >= 35 },
  { id: 'gebaermutter', cat: 'gesundheit', title: 'Gebärmutterhalskrebs-Früherkennung', type: 'Empfehlung', mode: 'interval', months: a => age(a) >= 35 ? 36 : 12, lead: 30, ask: 'Nächste Untersuchung möglich ab', hint: 'Ab 20 Jahren. Bis 34 jährlich, ab 35 alle 3 Jahre als Kombitest.', cond: a => a.gender === 'w' && age(a) >= 20 },
  { id: 'brust', cat: 'gesundheit', title: 'Brustuntersuchung', type: 'Empfehlung', mode: 'interval', months: () => 12, lead: 30, ask: 'Nächste Untersuchung möglich ab', hint: 'Ab 30 jährliche Tastuntersuchung in der Frauenarztpraxis.', cond: a => a.gender === 'w' && age(a) >= 30 },
  { id: 'mammo', cat: 'gesundheit', title: 'Mammographie-Screening', type: 'Empfehlung', mode: 'interval', months: () => 24, lead: 30, ask: 'Nächste Einladung erwartet', hint: 'Von 50 bis 75 alle 2 Jahre, die Einladung kommt per Post.', cond: a => a.gender === 'w' && age(a) >= 50 && age(a) <= 75 },
  { id: 'prostata', cat: 'gesundheit', title: 'Prostata-Früherkennung', type: 'Empfehlung', mode: 'interval', months: () => 12, lead: 30, ask: 'Nächste Untersuchung möglich ab', hint: 'Ab 45 jährlich in der Urologie oder Hausarztpraxis.', cond: a => a.gender === 'm' && age(a) >= 45 },
  { id: 'darm', cat: 'gesundheit', title: 'Darmkrebs-Früherkennung', type: 'Empfehlung', mode: 'interval', months: () => 24, lead: 30, ask: 'Nächster Stuhltest / Termin', hint: 'Ab 50: Stuhltest alle 2 Jahre oder Darmspiegelung (zweimal im Abstand von 10 Jahren). Intervall hier anpassbar.', cond: a => age(a) >= 50 },
  { id: 'aorta', cat: 'gesundheit', title: 'Bauchaorten-Ultraschall', type: 'Empfehlung', mode: 'manual', lead: 30, ask: 'Geplanter Termin', hint: 'Männer ab 65 einmalig als Kassenleistung.', cond: a => a.gender === 'm' && age(a) >= 65 },
  { id: 'tetanus', cat: 'gesundheit', title: 'Tetanus/Diphtherie auffrischen', type: 'Empfehlung', mode: 'interval', months: () => 120, lead: 30, ask: 'Nächste Auffrischung fällig (Impfpass)', hint: 'Alle 10 Jahre auffrischen. Das Datum der letzten Impfung steht im Impfpass.', cond: () => true },
  { id: 'grippe', cat: 'gesundheit', title: 'Grippeimpfung', type: 'Empfehlung', mode: 'dates', gen: yearly(10, 15), lead: 14, window: 60, hint: 'Ab 60 jährlich empfohlen, am besten im Oktober oder November.', cond: a => age(a) >= 60 },
  { id: 'apotheke', cat: 'gesundheit', title: 'Hausapotheke prüfen', type: 'Empfehlung', mode: 'dates', gen: yearly(1, 10), lead: 0, window: 30, hint: 'Abgelaufene Medikamente aussortieren und Verbandsmaterial auffüllen.', cond: () => true },
  // Kinder
  { id: 'u_unters', cat: 'kinder', title: 'Nächste U-Untersuchung', type: 'Empfehlung', mode: 'manual', lead: 14, ask: 'Zeitfenster laut gelbem Heft', hint: 'U1 bis U9 bis etwa 5 Jahre, J1 mit 12–14. Die Zeitfenster stehen im gelben Kinderuntersuchungsheft.', cond: a => a.kids },
  { id: 'impfung_kind', cat: 'kinder', title: 'Impfung Kind', type: 'Empfehlung', mode: 'manual', lead: 14, ask: 'Nächste Impfung laut Impfpass', hint: 'Termine nach STIKO-Impfkalender, die Kinderarztpraxis trägt sie in den Impfpass ein.', cond: a => a.kids },
  { id: 'zahnarzt_kind', cat: 'kinder', title: 'Kinder-Zahnarzt', type: 'Empfehlung', mode: 'interval', months: () => 6, lead: 14, ask: 'Nächste Kontrolle', hint: 'Ab dem ersten Zahn, dann halbjährlich.', cond: a => a.kids },
  { id: 'ausweis_kind', cat: 'kinder', title: 'Ausweis Kind läuft ab', type: 'Pflicht', mode: 'expiry', months: () => 72, lead: 90, ask: 'Gültig bis', hint: 'Den Kinderreisepass gibt es seit 2024 nicht mehr. Kinder brauchen für Reisen Personalausweis oder Reisepass.', cond: a => a.kids && a.travel },
  { id: 'kita_schule', cat: 'kinder', title: 'Kita oder Schule anmelden', type: 'Pflicht', mode: 'manual', lead: 30, ask: 'Anmeldeschluss', hint: 'Kita-Plätze oft über ein Jahr im Voraus anmelden. Die Schulanmeldung ist im Jahr vor der Einschulung, die Gemeinde schreibt dich an.', cond: a => a.kids },
  // Haustiere
  { id: 'hundesteuer', cat: 'tiere', title: 'Hundesteuer zahlen', type: 'Pflicht', mode: 'manual', months: () => 12, lead: 7, ask: 'Nächste Fälligkeit laut Steuerbescheid', hint: 'Die Gemeinde legt Höhe und Termine fest. Einen neuen Hund innerhalb der Frist der Gemeinde anmelden.', cond: a => (a.pets || []).includes('hund') },
  { id: 'hundehaft', cat: 'tiere', title: 'Hundehaftpflicht prüfen', type: 'Empfehlung', mode: 'interval', months: () => 12, fromDue: true, lead: 30, ask: 'Hauptfälligkeit der Versicherung', hint: 'In mehreren Bundesländern Pflicht, überall sinnvoll.', cond: a => (a.pets || []).includes('hund') },
  { id: 'tier_impfung', cat: 'tiere', title: 'Impfung Haustier', type: 'Empfehlung', mode: 'manual', months: () => 12, lead: 14, ask: 'Nächste Impfung laut Heimtierausweis', hint: 'Termine stehen im Heimtierausweis. Für Reisen ins Ausland ist die Tollwutimpfung Pflicht.', cond: a => (a.pets || []).some(p => p !== 'keine') },
  { id: 'entwurmung', cat: 'tiere', title: 'Entwurmung', type: 'Empfehlung', mode: 'interval', months: () => 3, lead: 3, ask: 'Nächste Entwurmung', hint: 'Häufig alle 3 Monate, je nach Tier und Haltung. Rhythmus mit der Tierarztpraxis absprechen.', cond: a => (a.pets || []).some(p => p !== 'keine') },
  { id: 'tierarzt', cat: 'tiere', title: 'Tierarzt-Check', type: 'Empfehlung', mode: 'interval', months: () => 12, lead: 14, ask: 'Nächster Check', hint: 'Einmal im Jahr zur Kontrolle, oft zusammen mit der Impfung.', cond: a => (a.pets || []).some(p => p !== 'keine') }
];

/* Rhythmus als Text */
function rhythmText(item, a) {
  const m = item.months ? item.months(a) : 0;
  const every = m === 0 ? null : m % 12 === 0 ? (m === 12 ? 'jährlich' : 'alle ' + (m / 12) + ' Jahre') : (m === 1 ? 'monatlich' : 'alle ' + m + ' Monate');
  if (item.mode === 'dates') {
    if (item.gen === quarterly) return 'vierteljährlich';
    return 'jedes Jahr';
  }
  if (item.mode === 'once') return 'einmalig';
  if (item.mode === 'expiry') return every ? 'gültig ' + every.replace('alle ', '') : 'bis Ablauf';
  return every || 'einmalig / nach Bedarf';
}

/* Vorkommen eines festen Termins um ein Datum herum */
function occurrences(item, from, to) {
  const res = [];
  for (let y = from.getFullYear() - 1; y <= to.getFullYear() + 1; y++) item.gen(y).forEach(d => { if (d >= from && d <= to) res.push(d); });
  return res.sort((x, y) => x - y);
}

/*
 Faelligkeit eines Eintrags berechnen.
 st = gespeicherter Zustand {next, last, doneFor, lead, months}
 Rueckgabe: {due: Date|null, needsDate: bool, done: bool}
*/
function computeDue(item, st, a, now) {
  now = now || today();
  st = st || {};
  if (item.mode === 'dates') {
    const win = item.window || 30;
    const doneFor = st.doneFor ? parseISO(st.doneFor) : null;
    const recent = occurrences(item, addDays(now, -win), now).filter(d => !doneFor || d > doneFor);
    if (recent.length) return { due: recent[0], needsDate: false, done: false };
    const start = doneFor && doneFor >= now ? addDays(doneFor, 1) : addDays(now, 1);
    const up = occurrences(item, start, addDays(start, 800));
    return { due: up[0] || null, needsDate: false, done: false };
  }
  if (item.mode === 'once') {
    if (st.done) return { due: null, needsDate: false, done: true };
    const d = st.next ? parseISO(st.next) : item.date(a);
    return { due: d, needsDate: !d, done: false };
  }
  if (st.done) return { due: null, needsDate: false, done: true };
  if (!st.next) return { due: null, needsDate: true, done: false };
  return { due: parseISO(st.next), needsDate: false, done: false };
}

/* Was passiert bei "Erledigt" – gibt neuen Zustand zurueck */
function markDone(item, st, a, now) {
  now = now || today();
  st = Object.assign({}, st || {});
  st.last = toISO(now);
  const months = st.months != null ? st.months : (item.months ? item.months(a) : 0);
  if (item.mode === 'dates') {
    const cur = computeDue(item, st, a, now).due;
    st.doneFor = toISO(cur || now);
    return st;
  }
  if (item.mode === 'once' || !months) { st.done = true; delete st.next; return st; }
  const due = st.next ? parseISO(st.next) : null;
  const base = item.fromDue && due && daysBetween(now, due) > -60 ? due : now;
  st.next = toISO(addMonths(base, months));
  delete st.done;
  return st;
}

function status(due, lead, now) {
  now = now || today();
  if (!due) return 'missing';
  const d = daysBetween(now, due);
  if (d < 0) return 'overdue';
  if (d <= Math.max(lead, 0) || d <= 7) return 'now';
  if (d <= 60) return 'soon';
  return 'later';
}

function relText(due, now) {
  now = now || today();
  const d = daysBetween(now, due);
  if (d === 0) return 'heute';
  if (d === 1) return 'morgen';
  if (d === -1) return 'seit gestern';
  if (d < 0) return 'seit ' + (-d) + ' Tagen';
  if (d < 60) return 'in ' + d + ' Tagen';
  const m = Math.round(d / 30.4);
  if (m < 24) return 'in ' + m + ' Monaten';
  return 'in ' + Math.round(d / 365) + ' Jahren';
}

if (typeof module !== 'undefined') module.exports = { CATALOG, CATS, computeDue, markDone, status, relText, licenseDeadline, parseISO, toISO, addMonths, rhythmText, fmtDate, nextWorkday };
