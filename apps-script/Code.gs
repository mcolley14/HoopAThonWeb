// Hoop-A-Thon signups: Google Apps Script web app bound to the signup Sheet.
// Setup steps are in apps-script/README.md.
//
// POST  body: JSON {type: "individual"|"team", ...fields}  -> {ok: true} or {ok: false, error}
// GET   -> {participants: N}  (individual rows + sum of team sizes)

const SHEETS = {
  individual: {
    name: "Individuals",
    headers: ["Submitted", "Name", "Email", "Phone", "Goal (CAD)"],
  },
  team: {
    name: "Teams",
    headers: ["Submitted", "Company", "Contact", "Email", "Team size", "Participant names"],
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_LEN = 2000;

function doGet() {
  return json({ participants: countParticipants() });
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return json({ ok: false, error: "Invalid request." });
  }

  // Honeypot: real people never fill the hidden "website" field.
  if (data.website) return json({ ok: true });

  const row = data.type === "team" ? teamRow(data) : data.type === "individual" ? individualRow(data) : null;
  if (!row) return json({ ok: false, error: "Invalid request." });
  if (row.error) return json({ ok: false, error: row.error });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheetFor(data.type).appendRow([new Date()].concat(row.values.map(safeCell)));
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true, participants: countParticipants() });
}

function individualRow(d) {
  const name = clean(d.participantName);
  const email = clean(d.participantEmail);
  const goal = Number(d.participantGoal);
  if (!name) return { error: "Please enter participant full name." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid participant email." };
  if (!Number.isFinite(goal) || goal < 0) return { error: "Fundraising goal must be zero or higher." };
  return { values: [name, email, clean(d.participantPhone), goal] };
}

function teamRow(d) {
  const company = clean(d.companyName);
  const contact = clean(d.teamContact);
  const email = clean(d.teamEmail);
  const size = Number(d.teamSize);
  const names = clean(d.participantNames);
  if (!company || !contact) return { error: "Please enter company and contact names." };
  if (!EMAIL_RE.test(email)) return { error: "Please enter a valid corporate email." };
  if (!Number.isInteger(size) || size < 2 || size > 500) return { error: "Team size must be at least 2." };
  if (names.split("\n").filter(Boolean).length < 2) return { error: "Please list at least two participant names." };
  return { values: [company, contact, email, size, names] };
}

function countParticipants() {
  const individuals = Math.max(sheetFor("individual").getLastRow() - 1, 0);
  const teams = sheetFor("team");
  let teamTotal = 0;
  if (teams.getLastRow() > 1) {
    teams
      .getRange(2, 5, teams.getLastRow() - 1, 1)
      .getValues()
      .forEach(function (r) {
        teamTotal += Number(r[0]) || 0;
      });
  }
  return individuals + teamTotal;
}

function sheetFor(type) {
  const spec = SHEETS[type];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(spec.name);
  if (!sheet) {
    sheet = ss.insertSheet(spec.name);
    sheet.appendRow(spec.headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function clean(v) {
  return String(v == null ? "" : v).trim().slice(0, MAX_LEN);
}

// Stop a submitted value like "=IMPORTXML(...)" from running as a formula.
function safeCell(v) {
  return typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
