import Papa from 'papaparse';
import { sampleCsvSheets, type RemoteSheetPayload } from './dataSource';
import type {
  Employee,
  EmploymentStatus,
  ClubRecord,
  InClassLearningRecord,
  InternshipRecord,
  KudosRecord,
  TimmyOfTheMonthRecord,
  Dataset,
} from '@/types';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (Number.isNaN(d1) || Number.isNaN(d2)) return 0;
  return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

/** Normalizes whatever the sheets use for employment status into the two
 * canonical values the app filters on ("Active" needs to allow "ACTIVE",
 * "active", " Active " etc.) */
function normalizeStatus(raw: unknown): EmploymentStatus {
  // Strict: only an exact "ACTIVE" counts as Active. Anything else — blank,
  // "Non-Active", "Not-Active", "Not Active", "Inactive", etc. — is Non-Active.
  return str(raw).toUpperCase().trim() === 'ACTIVE' ? 'Active' : 'Non-Active';
}

/** Pulls {year, month, quarter} out of an ISO-ish date string. Returns nulls
 * for anything that fails to parse so callers can fall back to given fields. */
function dateParts(v: unknown): { year: number | null; month: number | null; quarter: number | null } {
  const d = new Date(str(v));
  if (Number.isNaN(d.getTime())) return { year: null, month: null, quarter: null };
  const month = d.getMonth() + 1;
  return { year: d.getFullYear(), month, quarter: Math.ceil(month / 3) };
}

/** Parses quarter values in whatever format they show up: "Quarter 1", "Q3",
 * "3", 3. */
function parseQuarter(v: unknown, fallback = 0): number {
  const s = str(v);
  const match = s.match(/(\d)/);
  if (match) return Number(match[1]);
  return num(v, fallback);
}

const MONTH_NAME_TO_NUM: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function parseMonth(v: unknown, fallback = 0): number {
  const s = str(v).toLowerCase();
  if (MONTH_NAME_TO_NUM[s]) return MONTH_NAME_TO_NUM[s];
  const asNum = Number(v);
  if (Number.isFinite(asNum) && asNum >= 1 && asNum <= 12) return asNum;
  const parts = dateParts(v);
  return parts.month ?? fallback;
}

/** Normalizes the Kudos sheet's own workflow-status column (N) into one of
 * the four canonical buckets used by the Recognition KPI cards. */
function normalizeWorkflowStatus(raw: unknown): 'REVIEW' | 'APPROVED' | 'REJECTED' | 'OTHER' {
  const s = str(raw).toUpperCase();
  if (s.includes('REVIEW')) return 'REVIEW';
  if (s.includes('APPROV') || s.includes('VALID')) return 'APPROVED';
  if (s.includes('REJECT')) return 'REJECTED';
  return 'OTHER';
}

/** Finds a sheet in the remote payload by trying exact name, then a
 * normalized (lowercase, whitespace-collapsed) match, then a "contains"
 * match — so small tab-name differences don't silently drop data. */
function findSheet(payload: RemoteSheetPayload, candidates: string[]): Record<string, unknown>[] {
  const keys = Object.keys(payload).filter((k) => k !== '_meta' && k !== 'error' && k !== 'message');
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

  for (const candidate of candidates) {
    if (payload[candidate]) return payload[candidate] as Record<string, unknown>[];
  }
  for (const candidate of candidates) {
    const target = normalize(candidate);
    const found = keys.find((k) => normalize(k) === target);
    if (found) return payload[found] as Record<string, unknown>[];
  }
  for (const candidate of candidates) {
    const target = normalize(candidate);
    const found = keys.find((k) => normalize(k).includes(target) || target.includes(normalize(k)));
    if (found) return payload[found] as Record<string, unknown>[];
  }
  return [];
}

/** Collapses internal whitespace + trims + lowercases, so "John   Doe " and
 * "john doe" resolve to the same lookup key. Improves the receiver
 * name-match rate for Kudos (which has no receiver email column at all). */
function normalizeKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildEmployeeIndexByEmail(employees: Employee[]): Map<string, Employee> {
  const idx = new Map<string, Employee>();
  for (const e of employees) if (e.email) idx.set(normalizeKey(e.email), e);
  return idx;
}

function buildEmployeeIndexByName(employees: Employee[]): Map<string, Employee> {
  const idx = new Map<string, Employee>();
  for (const e of employees) if (e.name) idx.set(normalizeKey(e.name), e);
  return idx;
}

/** Parses a column header like "Jan 2025", "January 2025", "Jan-25",
 * "01/2025", "2025-01" into {year, month}. Returns null if it doesn't look
 * like a month/year label at all. */
function parseMonthYearLabel(label: string): { year: number; month: number } | null {
  const s = label.trim();

  // "2025-01" / "2025/01"
  let m = s.match(/^(\d{4})[-/](\d{1,2})$/);
  if (m) return { year: Number(m[1]), month: Number(m[2]) };

  // "01/2025" / "01-2025"
  m = s.match(/^(\d{1,2})[-/](\d{4})$/);
  if (m) return { year: Number(m[2]), month: Number(m[1]) };

  // "Jan 2025" / "January 2025" / "Jan-2025" / "Jan-25" / "Jan25"
  m = s.match(/^([A-Za-z]+)[\s-]?(\d{2,4})$/);
  if (m) {
    const monthNum = MONTH_NAME_TO_NUM[m[1].toLowerCase()];
    if (monthNum) {
      let year = Number(m[2]);
      if (year < 100) year += year < 70 ? 2000 : 1900;
      return { year, month: monthNum };
    }
  }
  return null;
}

const GRAND_TOTAL_LABEL = /^(total|grand total|all|overall|company|semua|jumlah total)$/i;

/** Handles BOTH plausible layouts for the 'Total Employee per Dept' sheet:
 *  - WIDE: one row per department, one column per month (e.g. "Jan 2025",
 *    "Feb 2025", ...).
 *  - LONG: one row per department+period, with explicit Year/Month/Period
 *    and a single count column.
 * Falls back to a flat (time-less) snapshot if neither pattern is detected,
 * so a plain "Department, Total" sheet still works exactly as before. */
function parseDeptHeadcountSheet(rows: Record<string, unknown>[]): { list: import('@/types').DeptHeadcount[]; total: number } | null {
  if (rows.length === 0) return null;
  const sample = rows[0];
  const keys = Object.keys(sample);
  const deptKey = keys.find((k) => /dep(artmen)?t/i.test(k)) || keys[0];
  if (!deptKey) return null;

  // --- Try WIDE format: look for multiple headers that parse as month/year ---
  const monthColumns = keys
    .filter((k) => k !== deptKey)
    .map((k) => ({ key: k, parsed: parseMonthYearLabel(k) }))
    .filter((c): c is { key: string; parsed: { year: number; month: number } } => c.parsed !== null);

  if (monthColumns.length >= 2) {
    const list: import('@/types').DeptHeadcount[] = [];
    for (const r of rows) {
      const department = str(r[deptKey]);
      if (!department || GRAND_TOTAL_LABEL.test(department)) continue;
      for (const col of monthColumns) {
        list.push({ department, year: col.parsed.year, month: col.parsed.month, activeCount: num(r[col.key]) });
      }
    }
    if (list.length > 0) {
      const total = totalForLatestPeriod(list);
      return { list, total };
    }
  }

  // --- Try LONG format: explicit Year (+ Month, or a combined Period label) ---
  const yearKey = keys.find((k) => /^year$/i.test(k));
  const monthKey = keys.find((k) => /^month$/i.test(k));
  const periodKey = keys.find((k) => /period|bulan|month.?year/i.test(k) && k !== deptKey);
  const countKey =
    keys.find((k) => /total.*(active|employe)/i.test(k)) ||
    keys.find((k) => /(active|employe).*total/i.test(k)) ||
    keys.find((k) => /count|total|headcount|jumlah/i.test(k));

  if (countKey && (yearKey || periodKey)) {
    const list: import('@/types').DeptHeadcount[] = [];
    for (const r of rows) {
      const department = str(r[deptKey]);
      if (!department || GRAND_TOTAL_LABEL.test(department)) continue;
      let year: number | null = null;
      let month: number | null = null;
      if (yearKey) {
        year = num(r[yearKey]) || null;
        month = monthKey ? parseMonth(r[monthKey], 0) || null : null;
      } else if (periodKey) {
        const parsed = parseMonthYearLabel(str(r[periodKey]));
        if (parsed) {
          year = parsed.year;
          month = parsed.month;
        }
      }
      list.push({ department, year, month, activeCount: num(r[countKey]) });
    }
    if (list.length > 0) {
      const total = totalForLatestPeriod(list);
      return { list, total };
    }
  }

  // --- Fallback: FLAT snapshot, no time dimension at all ---
  const flatCountKey =
    keys.find((k) => /total.*(active|employe)/i.test(k)) ||
    keys.find((k) => /(active|employe).*total/i.test(k)) ||
    keys.find((k) => /count|total|headcount|jumlah/i.test(k));
  if (!flatCountKey) return null;

  const list = rows
    .map((r) => ({ department: str(r[deptKey]), year: null, month: null, activeCount: num(r[flatCountKey]) }))
    .filter((r) => r.department && !GRAND_TOTAL_LABEL.test(r.department));
  if (list.length === 0) return null;
  const total = list.reduce((s, r) => s + r.activeCount, 0);
  return { list, total };
}

function totalForLatestPeriod(list: import('@/types').DeptHeadcount[]): number {
  let latestKey = -1;
  for (const r of list) {
    if (r.year === null) continue;
    const key = r.year * 100 + (r.month ?? 0);
    if (key > latestKey) latestKey = key;
  }
  if (latestKey === -1) return list.reduce((s, r) => s + r.activeCount, 0);
  return list
    .filter((r) => (r.year ?? 0) * 100 + (r.month ?? 0) === latestKey)
    .reduce((s, r) => s + r.activeCount, 0);
}

function deriveDeptHeadcountFromEmployees(employees: Employee[]): { list: import('@/types').DeptHeadcount[]; total: number } {
  const m = new Map<string, number>();
  employees.forEach((e) => {
    if (e.status !== 'Active') return;
    m.set(e.department, (m.get(e.department) || 0) + 1);
  });
  const list = Array.from(m.entries()).map(([department, activeCount]) => ({ department, year: null, month: null, activeCount }));
  const total = list.reduce((s, r) => s + r.activeCount, 0);
  return { list, total };
}

// ---------------------------------------------------------------------------
// LIVE DATA — parses the JSON returned by the Apps Script web app
// ---------------------------------------------------------------------------

export function buildDatasetFromRemote(payload: RemoteSheetPayload): Dataset {
  const activeRows = findSheet(payload, ['Employee [Active]', 'Employee (Active)', 'Employee Active']);
  const nonActiveRows = findSheet(payload, ['Employee [Non-Active]', 'Employee [Non Active]', 'Employee (Non-Active)', 'Employee Non-Active']);

  const parseEmployee = (r: Record<string, unknown>): Employee => ({
    name: str(r['NAME'] ?? r['Name']),
    email: str(r['EMAIL'] ?? r['Email']).toLowerCase(),
    department: str(r['DEPARTMENT']),
    location: str(r['LOCATION']),
    employmentType: str(r['EMPLOYENT TYPE'] ?? r['EMPLOYMENT TYPE']),
    positionLevel: str(r['POSITION LEVEL']),
    jobGrade: str(r['Job Grade']),
    jobRole: str(r['Job Role']),
    positionName: str(r['Position Name']),
    directReport: str(r['DIRECT REPORT']),
    joinDatePT: str(r['JOIN DATE (to each PT)']),
    joinDateIDN: str(r['JOIN DATE (to IDN)']),
    workingPeriod: str(r['WORKING PERIOD']),
    tenureCategory: str(r['TENURE CATEGORY']),
    status: normalizeStatus(r['STATUS EMPLOYMENT']),
    nik: str(r['NIK']) || undefined,
    gender: str(r['GENDER']) || undefined,
    maritalStatus: str(r['MARITAL STATUS']) || undefined,
    religion: str(r['RELIGION']) || undefined,
    ageCategory: str(r['AGE CATEGORY']) || undefined,
    costCenter: str(r['COST CENTER']) || undefined,
  });

  const employees: Employee[] = [
    ...activeRows.map(parseEmployee).map((e) => ({ ...e, status: 'Active' as const })),
    ...nonActiveRows.map(parseEmployee).map((e) => ({ ...e, status: 'Non-Active' as const })),
  ];

  // Deduplicate: same email in both Active & Non-Active sheets.
  // Active copy wins so program records always join to the right employee.
  const employeeDedupMap = new Map<string, Employee>();
  for (const e of employees) {
    if (!e.email) continue;
    const key = normalizeKey(e.email);
    const existing = employeeDedupMap.get(key);
    if (!existing || (e.status === 'Active' && existing.status !== 'Active')) {
      employeeDedupMap.set(key, e);
    }
  }
  const dedupedEmployees = Array.from(employeeDedupMap.values());

  const byEmail = buildEmployeeIndexByEmail(dedupedEmployees);
  const byName = buildEmployeeIndexByName(dedupedEmployees);
  const lookupByEmail = (email: string) => byEmail.get(normalizeKey(email));
  const lookupByName = (name: string) => byName.get(normalizeKey(name));

  // --- IDN Club ---
  const clubRows = findSheet(payload, ['IDN Club']);
  const club: ClubRecord[] = clubRows.map((r) => {
    const email = str(r['Email']).toLowerCase();
    const employee = lookupByEmail(email);
    const parts = dateParts(r['Date']);
    return {
      name: str(r['Name']),
      email,
      department: employee?.department || str(r['Dep']),
      location: employee?.location || str(r['Location']),
      club: str(r['IDN Club'] ?? r['Club']),
      date: str(r['Date']),
      year: parts.year ?? num(r['Year']),
      month: parts.month ?? 0,
      quarter: parts.quarter ?? parseQuarter(r['Quarter']),
      status: str(r['Status']),
      employee,
    };
  });

  // --- IDN Academy: Interactive In-Class Learning ---
  const inClassRows = findSheet(payload, ['IDN Academy (Interactive In-Class Learning)', 'IDN Academy Interactive In-Class Learning']);
  const inClass: InClassLearningRecord[] = inClassRows.map((r) => {
    const email = str(r['Email']).toLowerCase();
    const employee = lookupByEmail(email);
    const parts = dateParts(r['Date']);
    return {
      name: str(r['Name']),
      email,
      department: employee?.department || str(r['Dep']),
      location: employee?.location || str(r['Location']),
      directReport: str(r['Direct Report']),
      course: str(r['Interactive In-Class Learning'] ?? r['Course']),
      date: str(r['Date']),
      year: parts.year ?? num(r['Year']),
      month: parts.month ?? 0,
      quarter: parts.quarter ?? parseQuarter(r['Quarter']),
      learningHours: num(r['Hours'] ?? r['Learning Hours']),
      status: str(r['Status']),
      employee,
    };
  });

  // --- IDN Academy: Internal Internship ---
  const internshipRows = findSheet(payload, ['IDN Academy (Internal Internship)', 'IDN Academy Internal Internship']);
  const internship: InternshipRecord[] = internshipRows.map((r) => {
    const email = str(r['Email']).toLowerCase();
    const employee = lookupByEmail(email);
    return {
      name: str(r['Name']),
      email,
      homeDepartment: employee?.department || str(r['Home Department']),
      hostDepartment: str(r['Host Department']),
      date: str(r['Date']) || '',
      year: num(r['Year']),
      month: 0,
      quarter: parseQuarter(r['Quarter']),
      learningHours: num(r['Hours'] ?? r['Learning Hours']),
      status: str(r['Status']),
      employee,
    };
  });

  // --- IDN Kudos ---
  const kudosRows = findSheet(payload, ['IDN Kudos']);
  const kudos: KudosRecord[] = kudosRows.map((r) => {
    const senderEmail = str(r['Email (from Sender)']).toLowerCase();
    const senderEmployee = lookupByEmail(senderEmail);
    const receiverName = str(r['To']);
    // Prefer a direct receiver-email column if the sheet has one, falling
    // back to the fragile name-based lookup only if it doesn't.
    const receiverEmailDirect = str(
      r['Email (from To)'] ?? r['Email (from Receiver)'] ?? r['Email (from To) 2'] ?? ''
    ).toLowerCase();
    const receiverEmployee = (receiverEmailDirect && lookupByEmail(receiverEmailDirect)) || lookupByName(receiverName);
    const created = str(r['created'] ?? r['Created']);
    const parts = dateParts(created);
    return {
      senderName: str(r['Sender']),
      senderEmail,
      senderDepartment: str(r['Department (from Sender) 2']) || senderEmployee?.department || '',
      receiverName,
      receiverEmail: receiverEmailDirect || receiverEmployee?.email || '',
      receiverDepartment: str(r['Department (from To) 2']) || receiverEmployee?.department || '',
      value: str(r['Timmyness (Short) (from timmynes)'] ?? r['Value']),
      message: str(r['Message']),
      created,
      lastModified: str(r['Last Modified']),
      year: parts.year ?? num(r['Year']),
      month: parts.month ?? parseMonth(r['Month']),
      quarter: parts.quarter ?? parseQuarter(r['Quarter']),
      avgDecisionDays: daysBetween(created, str(r['Last Modified'])),
      managerValidation: str(r['Manager Validation']),
      status: str(r['Status']),
      workflowStatus: normalizeWorkflowStatus(r['Status']),
      // Active/Non-Active is validated against the Timmy Active master data
      // (Employee Active / Non-Active sheets), NOT the Kudos row's own status
      // columns. A sender/receiver that can't be matched to the master is
      // treated as Non-Active. Kudos COUNTS still include these rows; this
      // flag only controls whether the person's NAME may be displayed.
      receiverStatusRaw: receiverEmployee?.status ?? 'Non-Active',
      senderStatusRaw: senderEmployee?.status ?? 'Non-Active',
      senderEmployee,
      receiverEmployee,
    };
  });

  // --- Timmy of the Month ---
  const totmRows = findSheet(payload, ['Timmy of the Month']);

  // Reads the "Category" column (Individual/Team) — this is column J in the
  // sheet, confirmed with values "INDIVIDUAL" / "TEAM". Falls back to a
  // couple of alternate header spellings, then to the 10th column by
  // position, in case the header text ever changes.
  const getTotmTypeColumnJ = (r: Record<string, unknown>): string => {
    const named = r['Category'] ?? r['Type'] ?? r['Team/Individual'] ?? r['Individual/Team'] ?? r['J'];
    if (named !== undefined && str(named) !== '') return str(named);
    const keys = Object.keys(r);
    return str(r[keys[9]]); // column J = 10th column, 0-based index 9
  };

  // Per user instruction: rows whose column J marks them as a "Team" award
  // (not an individual) should always show as Active, regardless of what
  // the Status column says.
  const isTotmTeamRow = (r: Record<string, unknown>): boolean => /team/i.test(getTotmTypeColumnJ(r));

  const timmyOfTheMonth: TimmyOfTheMonthRecord[] = totmRows.map((r) => {
    const email = str(r['Email']).toLowerCase();
    const name = str(r['Name']);
    // Per the v2.1 count-validation fix: fall back to a name match when the
    // email lookup fails, instead of silently dropping the record from the
    // Active Employee Guard (which caused the 101-vs-168 undercount).
    const employee = lookupByEmail(email) || lookupByName(name);
    // For STATUS specifically, only trust an EMAIL match — lookupByName can
    // false-positive-match a different real employee who happens to share
    // the exact same name string, which was still leaking wrong "Active"
    // statuses for people who aren't actually this row's person.
    const employeeForStatus = email ? lookupByEmail(email) : undefined;
    // Prefer an explicit Date column if present (per the v2.1 column
    // mapping), falling back to the Month column as before.
    const dateSource = r['Date'] ?? r['Month'];
    const parts = dateParts(dateSource);
    const timmyness = [r['Timmyness 1'], r['Timmyness 2']].map(str).filter(Boolean).join(' · ');
    return {
      name,
      email,
      jobPosition: str(r['Job Position']),
      currentDepartment: str(r['Current Dept.']) || employee?.department || '',
      location: str(r['Location']) || employee?.location || '',
      year: parts.year ?? num(r['Year']),
      month: parts.month ?? 0,
      quarter: parts.quarter ?? parseQuarter(r['Quarter']),
      // Per user instruction: if both Timmyness columns are blank, this
      // record simply has no Timmyness content — do NOT fall back to the
      // raw Status column (which holds employment status, not a category,
      // and was leaking "ACTIVE"/"NOT-ACTIVE" into the Recognition charts).
      status: timmyness,
      rawDate: str(r['Date']),
      // The Status column is the employment Active/Non-Active flag. Source
      // of truth is the matched employee's master status — matched by
      // EMAIL only (see employeeForStatus above), to avoid false Active
      // results from a same-name-but-different-person collision. Exceptions:
      // - a "Team" row (per column J / Category) is always Active, since
      //   employment status doesn't really apply to a team.
      // - a row with no reliable (email-based) employee match is always
      //   Non-Active, per user instruction — the sheet's own Status column
      //   is not trusted as a fallback (unreliable for non-employees).
      employeeStatusRaw: isTotmTeamRow(r)
        ? 'Active'
        : employeeForStatus?.status
        ? normalizeStatus(employeeForStatus.status)
        : 'Non-Active',
      employee,
    };
  });

  // --- Total Employe per Dept (authoritative active-headcount snapshot) ---
  const headcountRows = findSheet(payload, ['Total Employe per Dept', 'Total Employee per Dept', 'Total Employe Per Dept', 'Total Active Employee per Dept']);
  const parsedHeadcount = parseDeptHeadcountSheet(headcountRows);
  const headcount = parsedHeadcount ?? deriveDeptHeadcountFromEmployees(dedupedEmployees);

  return {
    employees: dedupedEmployees,
    club,
    inClass,
    internship,
    kudos,
    timmyOfTheMonth,
    deptHeadcount: headcount.list,
    totalActiveHeadcount: headcount.total,
    deptHeadcountSource: parsedHeadcount ? 'sheet' : 'derived',
  };
}

function parseCsv(csv: string): Record<string, string>[] {
  return Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true }).data;
}

function parseSampleEmployees(csv: string, status: EmploymentStatus): Employee[] {
  return parseCsv(csv).map((r) => ({
    name: r['Name'],
    email: (r['Email'] || '').trim().toLowerCase(),
    department: r['DEPARTMENT'],
    location: r['LOCATION'],
    employmentType: r['EMPLOYENT TYPE'],
    positionLevel: r['POSITION LEVEL'],
    jobGrade: r['Job Grade'],
    jobRole: r['Job Role'],
    positionName: r['Position Name'],
    directReport: r['DIRECT REPORT'],
    joinDatePT: r['JOIN DATE (to each PT)'],
    joinDateIDN: r['JOIN DATE (to IDN)'],
    workingPeriod: r['WORKING PERIOD'],
    tenureCategory: r['TENURE CATEGORY'],
    status: (r['STATUS EMPLOYMENT'] as EmploymentStatus) || status,
  }));
}

export function loadSampleDataset(): Dataset {
  const employees = [
    ...parseSampleEmployees(sampleCsvSheets.employeeActive, 'Active'),
    ...parseSampleEmployees(sampleCsvSheets.employeeNonActive, 'Non-Active'),
  ];

  // Deduplicate: Active wins over Non-Active for same email
  const sampleDedupMap = new Map<string, Employee>();
  for (const e of employees) {
    if (!e.email) continue;
    const key = (e.email || '').trim().toLowerCase();
    const existing = sampleDedupMap.get(key);
    if (!existing || (e.status === 'Active' && existing.status !== 'Active')) {
      sampleDedupMap.set(key, e);
    }
  }
  const dedupedEmployees = Array.from(sampleDedupMap.values());

  const byEmail = buildEmployeeIndexByEmail(dedupedEmployees);
  const lookup = (email: string) => byEmail.get((email || '').trim().toLowerCase());

  const club: ClubRecord[] = parseCsv(sampleCsvSheets.idnClub).map((r) => {
    const email = (r['Email'] || '').trim().toLowerCase();
    const employee = lookup(email);
    return {
      name: r['Name'], email,
      department: employee?.department || r['Dep'],
      location: employee?.location || r['Location'],
      club: r['Club'], date: r['Date'],
      year: num(r['Year']), month: num(r['Month']), quarter: num(r['Quarter']),
      status: r['Status'], employee,
    };
  });

  const inClass: InClassLearningRecord[] = parseCsv(sampleCsvSheets.idnAcademyInClass).map((r) => {
    const email = (r['Email'] || '').trim().toLowerCase();
    const employee = lookup(email);
    return {
      name: r['Name'], email,
      department: employee?.department || r['Dep'],
      location: employee?.location || r['Location'],
      directReport: r['Direct Report'], course: r['Course'], date: r['Date'],
      year: num(r['Year']), month: num(r['Month']), quarter: num(r['Quarter']),
      learningHours: num(r['Learning Hours']), status: r['Status'], employee,
    };
  });

  const internship: InternshipRecord[] = parseCsv(sampleCsvSheets.idnAcademyInternship).map((r) => {
    const email = (r['Email'] || '').trim().toLowerCase();
    const employee = lookup(email);
    return {
      name: r['Name'], email,
      homeDepartment: employee?.department || r['Home Department'],
      hostDepartment: r['Host Department'], date: r['Date'],
      year: num(r['Year']), month: num(r['Month']), quarter: num(r['Quarter']),
      learningHours: num(r['Learning Hours']), status: r['Status'], employee,
    };
  });

  const kudos: KudosRecord[] = parseCsv(sampleCsvSheets.idnKudos).map((r) => {
    const senderEmail = (r['Email (from Sender)'] || '').trim().toLowerCase();
    const receiverEmail = (r['Email (from To)'] || '').trim().toLowerCase();
    const senderEmployee = lookup(senderEmail);
    const receiverEmployee = lookup(receiverEmail);
    return {
      senderName: r['Sender'], senderEmail,
      senderDepartment: r['Department (from Sender) 2'] || senderEmployee?.department || '',
      receiverName: r['To'], receiverEmail,
      receiverDepartment: r['Department (from To) 2'] || receiverEmployee?.department || '',
      value: r['Value'], message: r['Message'],
      created: r['created'], lastModified: r['Last Modified'],
      year: num(r['Year']), month: num(r['Month']), quarter: num(r['Quarter']),
      avgDecisionDays: daysBetween(r['created'], r['Last Modified']),
      managerValidation: r['Manager Validation'], status: r['Status'],
      workflowStatus: normalizeWorkflowStatus(r['Status']),
      receiverStatusRaw: receiverEmployee?.status ?? 'Non-Active',
      senderStatusRaw: senderEmployee?.status ?? 'Non-Active',
      senderEmployee, receiverEmployee,
    };
  });

  const timmyOfTheMonth: TimmyOfTheMonthRecord[] = parseCsv(sampleCsvSheets.timmyOfTheMonth).map((r) => {
    const email = (r['Email'] || '').trim().toLowerCase();
    const employee = lookup(email);
    return {
      name: r['Name'], email,
      jobPosition: r['Job Position'],
      currentDepartment: r['Current Dept.'] || employee?.department || '',
      location: employee?.location || '',
      year: num(r['Year']), month: num(r['Month']), quarter: num(r['Quarter']),
      status: '', rawDate: r['Date'] || '',
      employeeStatusRaw: normalizeStatus(employee?.status ?? 'Active'),
      employee,
    };
  });

  const headcount = deriveDeptHeadcountFromEmployees(dedupedEmployees);

  return {
    employees: dedupedEmployees,
    club,
    inClass,
    internship,
    kudos,
    timmyOfTheMonth,
    deptHeadcount: headcount.list,
    totalActiveHeadcount: headcount.total,
    deptHeadcountSource: 'derived',
  };
}
