/**
 * Employee Experience Dashboard — Apps Script Data API
 * Spreadsheet ID: 1hhCxhzjX98vgMtHJ0aQuvyHkDRPEtbZkmcgaG-dJPD8
 *
 * HOW TO USE
 * 1. Open the spreadsheet, go to Extensions > Apps Script.
 * 2. Delete anything in Code.gs and paste this whole file in.
 * 3. Deploy > Manage deployments > click the pencil (Edit) on your existing
 *    deployment > Version: "New version" > Deploy.
 *    (This keeps the same /exec URL you already shared with Claude.)
 *
 * WHAT CHANGED FROM THE FIRST VERSION
 * This version reads EVERY tab in the spreadsheet automatically instead of a
 * fixed list of sheet names — that's why "Employee [Non-Active]" came back
 * empty last time (the tab name didn't exactly match what was hardcoded).
 * Now it doesn't matter what the tabs are named; whatever exists gets
 * returned, keyed by its exact tab name.
 *
 * WHAT IT RETURNS
 * A GET request to the deployed URL returns JSON shaped like:
 * {
 *   "IDN Club": [ { "Name": "...", "Email": "...", ... }, ... ],
 *   "IDN Academy (Interactive In-Class Learning)": [ ... ],
 *   "IDN Academy (Internal Internship)": [ ... ],
 *   "IDN Kudos": [ ... ],
 *   "Timmy of the Month": [ ... ],
 *   "Employee [Active]": [ ... ],
 *   "Employee [Non-Active]": [ ... ],
 *   "_meta": { "sheets": ["...tab names found..."] }
 * }
 * Each sheet's first row is treated as the header row and used as the JSON
 * keys for every row below it. Dates are converted to ISO strings.
 */

const SHEET_ID = '1hhCxhzjX98vgMtHJ0aQuvyHkDRPEtbZkmcgaG-dJPD8';

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheets = ss.getSheets();
    const result = {};
    const sheetNames = [];

    sheets.forEach(function (sheet) {
      const name = sheet.getName();
      sheetNames.push(name);
      result[name] = sheetToJson(sheet);
    });

    result._meta = { sheets: sheetNames, generatedAt: new Date().toISOString() };

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: true, message: String(err) });
  }
}

/**
 * Converts a sheet's data into an array of objects, using row 1 as headers.
 * Dates are converted to ISO strings so the dashboard can parse them reliably.
 */
function sheetToJson(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return [];

  const headers = values[0].map(function (h) {
    return String(h).trim();
  });

  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const isEmpty = row.every(function (v) {
      return v === '' || v === null || v === undefined;
    });
    if (isEmpty) continue;

    const obj = {};
    headers.forEach(function (header, colIdx) {
      if (!header) return;
      let cell = row[colIdx];
      if (cell instanceof Date) {
        cell = Utilities.formatDate(cell, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
      }
      obj[header] = cell;
    });
    rows.push(obj);
  }
  return rows;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
