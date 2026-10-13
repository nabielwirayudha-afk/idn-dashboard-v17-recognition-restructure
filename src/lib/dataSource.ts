// STEP 1 — DATA SOURCE EXTRACTION
//
// Primary source: the live Apps Script web app bound to the Employee
// Experience master spreadsheet. It returns one JSON object keyed by the
// exact tab name of every sheet in the spreadsheet, e.g.:
//   { "IDN Club": [...], "IDN Kudos": [...], "Employee [Active]": [...], ... }
//
// If that request fails for any reason (offline, URL changed, permissions,
// CORS), the app automatically falls back to the bundled sample CSVs in
// src/data so the dashboard still renders. See DataContext.tsx for how the
// fallback is triggered, and dataLoader.ts for how each shape is parsed.

export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwJmyIhelBt64dDtoEogA_74hU9ICmnOcFdOM0rMPoDfE56Rm0T4OWZ69Wd_KsI92FC/exec';

export type RemoteSheetPayload = Record<string, Record<string, unknown>[]> & {
  _meta?: { sheets: string[]; generatedAt: string };
  error?: boolean;
  message?: string;
};

export async function fetchRemoteData(): Promise<RemoteSheetPayload> {
  const res = await fetch(APPS_SCRIPT_URL, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Apps Script request failed with status ${res.status}`);
  }
  const json = (await res.json()) as RemoteSheetPayload;
  if (json.error) {
    throw new Error(json.message || 'Apps Script returned an error');
  }
  return json;
}

// --- Sample data fallback (unchanged from the mock-data version) ---------
import employeeActiveCsv from '@/data/employee_active.csv?raw';
import employeeNonActiveCsv from '@/data/employee_nonactive.csv?raw';
import idnClubCsv from '@/data/idn_club.csv?raw';
import idnAcademyInClassCsv from '@/data/idn_academy_inclass.csv?raw';
import idnAcademyInternshipCsv from '@/data/idn_academy_internship.csv?raw';
import idnKudosCsv from '@/data/idn_kudos.csv?raw';
import timmyOfTheMonthCsv from '@/data/timmy_of_the_month.csv?raw';

export const sampleCsvSheets = {
  employeeActive: employeeActiveCsv,
  employeeNonActive: employeeNonActiveCsv,
  idnClub: idnClubCsv,
  idnAcademyInClass: idnAcademyInClassCsv,
  idnAcademyInternship: idnAcademyInternshipCsv,
  idnKudos: idnKudosCsv,
  timmyOfTheMonth: timmyOfTheMonthCsv,
};
