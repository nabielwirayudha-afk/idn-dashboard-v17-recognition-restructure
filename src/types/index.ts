export type EmploymentStatus = 'Active' | 'Non-Active';

export interface Employee {
  name: string;
  email: string;
  department: string;
  location: string;
  employmentType: string;
  positionLevel: string;
  jobGrade: string;
  jobRole: string;
  positionName: string;
  directReport: string;
  joinDatePT: string;
  joinDateIDN: string;
  workingPeriod: string;
  tenureCategory: string;
  status: EmploymentStatus;
  // Extra fields available from the live Employee Active/Non-Active sheets.
  // Optional because sample data doesn't include them.
  nik?: string;
  gender?: string;
  maritalStatus?: string;
  religion?: string;
  ageCategory?: string;
  costCenter?: string;
}

export interface ClubRecord {
  name: string;
  email: string;
  department: string;
  location: string;
  club: string;
  date: string;
  year: number;
  month: number;
  quarter: number;
  status: string;
  employee?: Employee;
}

export interface InClassLearningRecord {
  name: string;
  email: string;
  department: string;
  location: string;
  directReport: string;
  course: string;
  date: string;
  year: number;
  month: number;
  quarter: number;
  learningHours: number;
  status: string;
  employee?: Employee;
}

export interface InternshipRecord {
  name: string;
  email: string;
  homeDepartment: string;
  hostDepartment: string;
  date: string;
  year: number;
  month: number;
  quarter: number;
  learningHours: number;
  status: string;
  employee?: Employee;
}

export interface KudosRecord {
  senderName: string;
  senderEmail: string;
  senderDepartment: string;
  receiverName: string;
  receiverEmail: string;
  receiverDepartment: string;
  value: string;
  message: string;
  created: string;
  lastModified: string;
  year: number;
  month: number;
  quarter: number;
  avgDecisionDays: number;
  managerValidation: string;
  status: string;
  /** Normalized workflow status: REVIEW / APPROVED / REJECTED / OTHER, read
   * directly from the Kudos sheet's own Status column. */
  workflowStatus: 'REVIEW' | 'APPROVED' | 'REJECTED' | 'OTHER';
  /** Receiver's employment status read directly from the Kudos sheet's own
   * "status (from To)" column, rather than derived via a name lookup. */
  receiverStatusRaw: EmploymentStatus;
  /** Sender's employment status read directly from the Kudos sheet's own
   * status column (Q per the latest column-mapping brief), falling back to
   * the email-based employee lookup if that column isn't present. */
  senderStatusRaw: EmploymentStatus;
  senderEmployee?: Employee;
  receiverEmployee?: Employee;
}

export interface DeptHeadcount {
  department: string;
  /** null when the sheet has no time dimension at all (flat snapshot) —
   * in that case the same count applies to every period. */
  year: number | null;
  month: number | null;
  activeCount: number;
}

export interface TimmyOfTheMonthRecord {
  name: string;
  email: string;
  jobPosition: string;
  currentDepartment: string;
  location: string;
  year: number;
  month: number;
  quarter: number;
  /** Timmyness content only (Timmyness 1 + 2, blank if neither present) —
   * NOT an employment status. */
  status: string;
  /** Raw Date column value (A), for display in the detail popup. */
  rawDate: string;
  /** Active/Non-Active read directly from the sheet's own Status column,
   * kept separate from `status` (which holds Timmyness content only). */
  employeeStatusRaw: EmploymentStatus;
  employee?: Employee;
}

export interface Dataset {
  employees: Employee[];
  club: ClubRecord[];
  inClass: InClassLearningRecord[];
  internship: InternshipRecord[];
  kudos: KudosRecord[];
  timmyOfTheMonth: TimmyOfTheMonthRecord[];
  // Authoritative active-headcount snapshot from the 'Total Employe per Dept'
  // sheet. This is INTENTIONALLY separate from `employees` and must never be
  // affected by date filters (Year/Quarter/Month) — only by Department /
  // Location selection — per the "Total Active Employee becomes 0" bugfix.
  deptHeadcount: DeptHeadcount[];
  totalActiveHeadcount: number;
  deptHeadcountSource: 'sheet' | 'derived';
}

export interface GlobalFilters {
  year: string | 'All';
  quarter: string | 'All';
  month: string | 'All';
  department: string | 'All';
  location: string | 'All';
  employmentStatus: string | 'All';
  employeeName: string | 'All';
  email: string | 'All';
}

export const DEFAULT_FILTERS: GlobalFilters = {
  year: 'All',
  quarter: 'All',
  month: 'All',
  department: 'All',
  location: 'All',
  employmentStatus: 'All',
  employeeName: 'All',
  email: 'All',
};

export interface JourneyEvent {
  type: 'joined' | 'club' | 'learning' | 'internship' | 'kudos_received' | 'kudos_sent' | 'timmy_of_the_month';
  date: string;
  title: string;
  detail: string;
}

export type DataSourceStatus =
  | { kind: 'loading' }
  | { kind: 'live' }
  | { kind: 'sample'; reason: string };
