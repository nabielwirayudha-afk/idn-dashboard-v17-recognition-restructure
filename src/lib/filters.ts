import type {
  GlobalFilters,
  ClubRecord,
  InClassLearningRecord,
  InternshipRecord,
  KudosRecord,
  TimmyOfTheMonthRecord,
  Employee,
} from '@/types';

// Logic Issue #2 fix: Department/Location comparisons were previously exact
// (byte-for-byte) string matches. Any stray whitespace or casing difference
// between a record's resolved department/location and the canonical
// dropdown value (sourced from Employee [Active]) silently excluded that
// row from filtered results. All comparisons now go through this
// normalizer — trimmed, whitespace-collapsed, case-insensitive — while the
// original casing is still what's stored/displayed everywhere else.
function norm(s: string | undefined | null): string {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Per the "Overall" dashboard rule: every metric, chart, and denominator that
// is based on employee headcount or participation must only ever count
// employees with Status = Active. Non-Active employees are excluded from
// these calculations entirely, regardless of any filter selection.
function matchesCommon(
  f: GlobalFilters,
  opts: {
    year?: number;
    quarter?: number;
    month?: number;
    department?: string;
    location?: string;
    email?: string;
    name?: string;
    status?: string;
  },
  forceActiveOnly = false
): boolean {
  if (f.year !== 'All' && String(opts.year ?? '') !== f.year) return false;
  if (f.quarter !== 'All' && String(opts.quarter ?? '') !== f.quarter) return false;
  if (f.month !== 'All' && String(opts.month ?? '') !== f.month) return false;
  if (f.department !== 'All' && norm(opts.department) !== norm(f.department)) return false;
  if (f.location !== 'All' && norm(opts.location) !== norm(f.location)) return false;
  if (f.email !== 'All' && norm(opts.email) !== norm(f.email)) return false;
  if (f.employeeName !== 'All' && norm(opts.name) !== norm(f.employeeName)) return false;
  if (forceActiveOnly) {
    // True Active Employee Guard / inner-join semantics: a record only
    // counts if it successfully joined to an Active employee. A record
    // whose employee lookup failed (opts.status === undefined) must be
    // EXCLUDED, not silently passed through.
    if (opts.status !== 'Active') return false;
  } else if (f.employmentStatus !== 'All' && opts.status !== f.employmentStatus) {
    return false;
  }
  return true;
}

export function filterEmployees(rows: Employee[], f: GlobalFilters): Employee[] {
  // BUGFIX: employee headcount is a snapshot, not an activity log — it must
  // never be zeroed out by Year/Quarter/Month filters, only by
  // Department/Location/Active-status.
  return rows.filter((r) => {
    if (f.department !== 'All' && norm(r.department) !== norm(f.department)) return false;
    if (f.location !== 'All' && norm(r.location) !== norm(f.location)) return false;
    if (f.email !== 'All' && norm(r.email) !== norm(f.email)) return false;
    if (f.employeeName !== 'All' && norm(r.name) !== norm(f.employeeName)) return false;
    if (r.status !== 'Active') return false;
    return true;
  });
}

export function filterClub(rows: ClubRecord[], f: GlobalFilters): ClubRecord[] {
  return rows.filter((r) =>
    matchesCommon(
      f,
      {
        year: r.year,
        quarter: r.quarter,
        month: r.month,
        department: r.department,
        location: r.location,
        email: r.email,
        name: r.name,
        status: r.employee?.status,
      },
      true
    )
  );
}

export function filterInClass(rows: InClassLearningRecord[], f: GlobalFilters): InClassLearningRecord[] {
  return rows.filter((r) =>
    matchesCommon(
      f,
      {
        year: r.year,
        quarter: r.quarter,
        month: r.month,
        department: r.department,
        location: r.location,
        email: r.email,
        name: r.name,
        status: r.employee?.status,
      },
      true
    )
  );
}

export function filterInternship(rows: InternshipRecord[], f: GlobalFilters): InternshipRecord[] {
  return rows.filter((r) =>
    matchesCommon(
      f,
      {
        year: r.year,
        quarter: r.quarter,
        month: r.month,
        department: r.homeDepartment,
        location: r.employee?.location,
        email: r.email,
        name: r.name,
        status: r.employee?.status,
      },
      true
    )
  );
}

export function filterKudos(rows: KudosRecord[], f: GlobalFilters): KudosRecord[] {
  // A kudos record matches if EITHER the sender or the receiver matches the
  // department/location filter (so "Sent" and "Received" slices can each be
  // computed from the same filtered set). Kudos totals are transaction
  // counts, not headcount metrics, so they are NOT restricted to Active-only.
  return rows.filter((r) => {
    if (f.year !== 'All' && String(r.year) !== f.year) return false;
    if (f.quarter !== 'All' && String(r.quarter) !== f.quarter) return false;
    if (f.month !== 'All' && String(r.month) !== f.month) return false;

    const senderMatches = matchesCommon(f, {
      department: r.senderDepartment,
      location: r.senderEmployee?.location,
      email: r.senderEmail,
      name: r.senderName,
      year: r.year,
      quarter: r.quarter,
      month: r.month,
    });
    const receiverMatches = matchesCommon(f, {
      department: r.receiverDepartment,
      location: r.receiverEmployee?.location,
      email: r.receiverEmail,
      name: r.receiverName,
      year: r.year,
      quarter: r.quarter,
      month: r.month,
    });
    return senderMatches || receiverMatches;
  });
}

/** Received-only variant, for the Overview tab per Logic Issue #3: only the
 * RECEIVER side is checked against Department/Location — sender is ignored
 * entirely, since Overview now scopes strictly to received recognition. */
export function filterKudosReceivedOnly(rows: KudosRecord[], f: GlobalFilters): KudosRecord[] {
  return rows.filter((r) => {
    if (f.year !== 'All' && String(r.year) !== f.year) return false;
    if (f.quarter !== 'All' && String(r.quarter) !== f.quarter) return false;
    if (f.month !== 'All' && String(r.month) !== f.month) return false;
    return matchesCommon(f, {
      department: r.receiverDepartment,
      location: r.receiverEmployee?.location,
      email: r.receiverEmail,
      name: r.receiverName,
      status: r.receiverStatusRaw,
      year: r.year,
      quarter: r.quarter,
      month: r.month,
    });
  });
}

export function filterTimmyOfTheMonth(rows: TimmyOfTheMonthRecord[], f: GlobalFilters): TimmyOfTheMonthRecord[] {
  return rows.filter((r) =>
    matchesCommon(f, {
      year: r.year,
      quarter: r.quarter,
      month: r.month,
      department: r.currentDepartment,
      location: r.employee?.location,
      email: r.email,
      name: r.name,
    })
  );
}

// ---------------------------------------------------------------------------
// "NoTime" variants — apply Department/Location (and Active-only, where
// relevant) but deliberately IGNORE Year/Quarter/Month. Used by QoQ
// comparisons and rolling-window trend charts, which need to see multiple
// periods of data at once regardless of the currently selected date filter.
// ---------------------------------------------------------------------------

function matchesNoTime(
  f: GlobalFilters,
  opts: { department?: string; location?: string; status?: string },
  forceActiveOnly = false
): boolean {
  if (f.department !== 'All' && norm(opts.department) !== norm(f.department)) return false;
  if (f.location !== 'All' && norm(opts.location) !== norm(f.location)) return false;
  // Active Employee Guard: true inner-join — a failed employee lookup
  // (status undefined) must be excluded, not passed through.
  if (forceActiveOnly && opts.status !== 'Active') return false;
  return true;
}

export function filterClubNoTime(rows: ClubRecord[], f: GlobalFilters): ClubRecord[] {
  return rows.filter((r) => matchesNoTime(f, { department: r.department, location: r.location, status: r.employee?.status }, true));
}

export function filterInClassNoTime(rows: InClassLearningRecord[], f: GlobalFilters): InClassLearningRecord[] {
  return rows.filter((r) => matchesNoTime(f, { department: r.department, location: r.location, status: r.employee?.status }, true));
}

export function filterInternshipNoTime(rows: InternshipRecord[], f: GlobalFilters): InternshipRecord[] {
  return rows.filter((r) => matchesNoTime(f, { department: r.homeDepartment, location: r.employee?.location, status: r.employee?.status }, true));
}

export function filterKudosNoTime(rows: KudosRecord[], f: GlobalFilters): KudosRecord[] {
  return rows.filter((r) => {
    const senderMatches = matchesNoTime(f, { department: r.senderDepartment, location: r.senderEmployee?.location });
    const receiverMatches = matchesNoTime(f, { department: r.receiverDepartment, location: r.receiverEmployee?.location });
    return senderMatches || receiverMatches;
  });
}

/** Received-only NoTime variant for Overview's QoQ comparisons. */
export function filterKudosReceivedOnlyNoTime(rows: KudosRecord[], f: GlobalFilters): KudosRecord[] {
  return rows.filter((r) =>
    matchesNoTime(f, { department: r.receiverDepartment, location: r.receiverEmployee?.location, status: r.receiverStatusRaw }, true)
  );
}

export function filterTimmyOfTheMonthNoTime(rows: TimmyOfTheMonthRecord[], f: GlobalFilters): TimmyOfTheMonthRecord[] {
  return rows.filter((r) => matchesNoTime(f, { department: r.currentDepartment, location: r.location || r.employee?.location, status: r.employee?.status }, true));
}

/** Overview-tab-only: Kudos scoped to the RECEIVING side alone (per the
 * "Received Only" logic fix), matched precisely against the receiver's own
 * department/location/status — not the sender's, and not an OR-match across
 * both sides like the Recognition tab still uses. */
export function filterKudosReceivedNoTime(rows: KudosRecord[], f: GlobalFilters): KudosRecord[] {
  return rows.filter((r) =>
    matchesNoTime(f, { department: r.receiverDepartment, location: r.receiverEmployee?.location, status: r.receiverStatusRaw }, true)
  );
}
