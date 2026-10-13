import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { buildDatasetFromRemote, loadSampleDataset } from '@/lib/dataLoader';
import {
  filterEmployees,
  filterClub,
  filterInClass,
  filterInternship,
  filterKudos,
  filterTimmyOfTheMonth,
  filterClubNoTime,
  filterInClassNoTime,
  filterInternshipNoTime,
  filterKudosNoTime,
  filterTimmyOfTheMonthNoTime,
} from '@/lib/filters';
import { DEFAULT_FILTERS, type Dataset, type GlobalFilters, type DataSourceStatus, type Employee } from '@/types';

const CONFIG_GAS_URL = 'https://script.google.com/macros/s/AKfycbzhfQezgDNU2JYzB8B-5-DDo2jCCqwqRQIhG5d9q73-STh56s0q5Pv00C0dDyqJg62G/exec';
const DATA_GAS_URL = 'https://script.google.com/macros/s/AKfycbwJmyIhelBt64dDtoEogA_74hU9ICmnOcFdOM0rMPoDfE56Rm0T4OWZ69Wd_KsI92FC/exec';

const CACHE_KEY_PREFIX = 'idn_dashboard_cache_v3';
const TOKEN_STORAGE_KEY = 'idn_dashboard_token';
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 jam

interface CacheEntry {
  token: string;
  department: string | null;
  isAdmin: boolean;
  dataset: Dataset;
  timestamp: number;
}

interface DataContextValue {
  token: string | null;
  department: string | null;
  isAdmin: boolean;
  raw: Dataset;
  filtered: Dataset;
  filteredNoTime: Pick<Dataset, 'club' | 'inClass' | 'internship' | 'kudos' | 'timmyOfTheMonth'>;
  filters: GlobalFilters;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>;
  resetFilters: () => void;
  status: DataSourceStatus;
  retry: () => void;
  options: {
    years: string[];
    quarters: string[];
    months: string[];
    departments: string[];
    locations: string[];
    employmentStatuses: string[];
    employeeNames: string[];
    emails: string[];
  };
}

const EMPTY_DATASET: Dataset = {
  employees: [], club: [], inClass: [], internship: [], kudos: [], timmyOfTheMonth: [],
  deptHeadcount: [], totalActiveHeadcount: 0, deptHeadcountSource: 'derived',
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

function normEmail(email?: string): string {
  return (email ?? '').toLowerCase().trim();
}

function getTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('t') || params.get('token');
}

function getStoredToken(): string | null {
  // sessionStorage instead of localStorage: each browser tab gets its own
  // independent value, so opening a different token in another tab can no
  // longer overwrite the token this tab is supposed to keep using.
  try { return sessionStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
}

function storeToken(token: string) {
  try { sessionStorage.setItem(TOKEN_STORAGE_KEY, token); } catch { /* ignore */ }
}

function clearStoredToken() {
  try { sessionStorage.removeItem(TOKEN_STORAGE_KEY); } catch { /* ignore */ }
}

// ============================================
// CACHE: baca dari localStorage (dataset cache tetap boleh shared antar tab,
// tapi di-namespace per-token supaya tab dengan token berbeda tidak saling
// menimpa cache dataset satu sama lain)
// ============================================
function cacheKeyFor(token: string): string {
  return `${CACHE_KEY_PREFIX}_${token}`;
}

function readCache(token: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKeyFor(token));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKeyFor(token));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry) {
  const key = cacheKeyFor(entry.token);
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    // localStorage penuh — hapus cache lama dan coba lagi
    console.warn('Cache penuh, mencoba clear dan simpan ulang...');
    try {
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      console.warn('Gagal menyimpan cache (storage penuh)');
    }
  }
}

function clearCache(token: string) {
  try { localStorage.removeItem(cacheKeyFor(token)); } catch { /* ignore */ }
}

function buildPromotedDataset(raw: Dataset): Dataset {
  if (raw.employees.length === 0) return raw;

  const bestByEmail = new Map<string, Employee>();
  raw.employees.forEach((e) => {
    const email = normEmail(e.email);
    if (!email) return;
    const existing = bestByEmail.get(email);
    if (!existing || (e.status === 'Active' && existing.status !== 'Active')) {
      bestByEmail.set(email, e);
    }
  });

  const fixEmployee = <T extends { email?: string; employee?: Employee }>(r: T): T => {
    const email = normEmail(r.email);
    if (!email) return r;
    const best = bestByEmail.get(email);
    if (!best) return r;
    return { ...r, employee: best };
  };

  const fixKudos = (r: typeof raw.kudos[number]) => {
    const sEmail = normEmail(r.senderEmail);
    const rEmail = normEmail(r.receiverEmail);
    return {
      ...r,
      senderEmployee: sEmail ? bestByEmail.get(sEmail) || r.senderEmployee : r.senderEmployee,
      receiverEmployee: rEmail ? bestByEmail.get(rEmail) || r.receiverEmployee : r.receiverEmployee,
    };
  };

  const dedupedEmployees = Array.from(bestByEmail.values());

  return {
    ...raw,
    employees: dedupedEmployees,
    club: raw.club.map(fixEmployee),
    inClass: raw.inClass.map(fixEmployee),
    internship: raw.internship.map(fixEmployee),
    kudos: raw.kudos.map(fixKudos),
    timmyOfTheMonth: raw.timmyOfTheMonth.map(fixEmployee),
  };
}

// ============================================
// INISIALISASI DARI CACHE (instant, tanpa loading)
// ============================================
function getInitialState() {
  const urlToken = getTokenFromUrl();
  const storedToken = getStoredToken();
  const token = urlToken || storedToken;

  if (!token) {
    return {
      token: null,
      department: null,
      isAdmin: false,
      raw: EMPTY_DATASET,
      status: { kind: 'sample' as const, reason: 'Token tidak ditemukan di URL. Tambahkan ?t=TOKEN di belakang link.' },
      filters: DEFAULT_FILTERS,
    };
  }

  // Simpan token ke storage
  storeToken(token);

  // Coba baca cache
  const cached = readCache(token);
  if (cached && cached.token === token) {
    console.log('⚡ Instant load dari cache saat inisialisasi');
    const filters = cached.department && cached.department !== 'ALL'
      ? { ...DEFAULT_FILTERS, department: cached.department }
      : DEFAULT_FILTERS;

    return {
      token,
      department: cached.department,
      isAdmin: cached.isAdmin,
      raw: cached.dataset,
      status: { kind: 'live' as const },
      filters,
    };
  }

  // Tidak ada cache — akan fetch di useEffect
  return {
    token,
    department: null,
    isAdmin: false,
    raw: EMPTY_DATASET,
    status: { kind: 'loading' as const },
    filters: DEFAULT_FILTERS,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const init = getInitialState();

  const [token] = useState<string | null>(init.token);
  const [department, setDepartment] = useState<string | null>(init.department);
  const [isAdmin, setIsAdmin] = useState(init.isAdmin);
  const [raw, setRaw] = useState<Dataset>(init.raw);
  const [status, setStatus] = useState<DataSourceStatus>(init.status);
  const [attempt, setAttempt] = useState(0);
  const [filters, setFilters] = useState<GlobalFilters>(init.filters);

  useEffect(() => {
    let cancelled = false;

    if (!token) return;

    // Kalau sudah live dari cache, tetap fetch di background untuk update
    const shouldFetchSilently = status.kind === 'live';

    if (shouldFetchSilently) {
      console.log('🔄 Fetch data terbaru di background...');
    }

    async function load() {
      try {
        // Jalankan resolveToken dan fetch data secara PARALEL (bukan berurutan),
        // supaya total waktu tunggu = yang paling lama di antara keduanya, bukan jumlah keduanya.
        const resolvePromise = fetch(`${CONFIG_GAS_URL}?action=resolveToken&t=${encodeURIComponent(token!)}`).then((r) => r.json());
        const dataPromise = fetch(DATA_GAS_URL).then((r) => r.json());

        const resolveData = await resolvePromise;

        if (resolveData.error) {
          throw new Error(resolveData.message || 'Token tidak valid');
        }

        const dept = resolveData.department;
        const admin = resolveData.isAdmin;

        if (!cancelled) {
          setDepartment(dept);
          setIsAdmin(admin);
        }

        const payload = await dataPromise;
        const dataset = buildDatasetFromRemote(payload);

        if (dataset.employees.length === 0) {
          throw new Error('Data kosong — cek koneksi ke Data GAS.');
        }

        if (!cancelled) {
          setRaw(dataset);

          if (dept && dept !== 'ALL') {
            setFilters((prev) => ({ ...prev, department: dept }));
          }

          writeCache({
            token: token!,
            department: dept,
            isAdmin: admin,
            dataset,
            timestamp: Date.now(),
          });

          setStatus({ kind: 'live' });
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Gagal terhubung ke server.';
        console.error('Error:', message);

        // Kalau sudah live dari cache, jangan override dengan error
        if (status.kind !== 'live') {
          clearCache(token!);
          setRaw(loadSampleDataset());
          setStatus({ kind: 'sample', reason: message });
        }
      }
    }

    load();

    return () => { cancelled = true; };
  }, [token, attempt]);

  const retry = () => {
    if (token) clearCache(token);
    clearStoredToken();
    setAttempt((n) => n + 1);
  };

  // ============================================
  // LOCK FILTER: Non-admin tidak bisa ganti department
  // ============================================
  const safeSetFilters = useCallback(
    (action: React.SetStateAction<GlobalFilters>) => {
      setFilters((prev) => {
        const next = typeof action === 'function' ? (action as (prev: GlobalFilters) => GlobalFilters)(prev) : action;
        if (!isAdmin && department && department !== 'ALL') {
          return { ...next, department };
        }
        return next;
      });
    },
    [isAdmin, department]
  );

  const safeResetFilters = useCallback(() => {
    if (!isAdmin && department && department !== 'ALL') {
      setFilters({ ...DEFAULT_FILTERS, department });
    } else {
      setFilters(DEFAULT_FILTERS);
    }
  }, [isAdmin, department]);

  // Safety net
  useEffect(() => {
    if (!isAdmin && department && department !== 'ALL' && filters.department !== department) {
      setFilters((prev) => ({ ...prev, department }));
    }
  }, [filters.department, department, isAdmin]);

  const promoted = useMemo(() => buildPromotedDataset(raw), [raw]);

  const filtered = useMemo<Dataset>(
    () => ({
      employees: filterEmployees(promoted.employees, filters),
      club: filterClub(promoted.club, filters),
      inClass: filterInClass(promoted.inClass, filters),
      internship: filterInternship(promoted.internship, filters),
      kudos: filterKudos(promoted.kudos, filters),
      timmyOfTheMonth: filterTimmyOfTheMonth(promoted.timmyOfTheMonth, filters),
      deptHeadcount: promoted.deptHeadcount,
      totalActiveHeadcount: promoted.totalActiveHeadcount,
      deptHeadcountSource: promoted.deptHeadcountSource,
    }),
    [promoted, filters]
  );

  const filteredNoTime = useMemo(
    () => ({
      club: filterClubNoTime(promoted.club, filters),
      inClass: filterInClassNoTime(promoted.inClass, filters),
      internship: filterInternshipNoTime(promoted.internship, filters),
      kudos: filterKudosNoTime(promoted.kudos, filters),
      timmyOfTheMonth: filterTimmyOfTheMonthNoTime(promoted.timmyOfTheMonth, filters),
    }),
    [promoted, filters]
  );

  const options = useMemo(() => {
    const years = new Set<string>();
    const departments = new Set<string>();
    const locations = new Set<string>();
    const statuses = new Set<string>();
    const names = new Set<string>();
    const emails = new Set<string>();

    for (const e of raw.employees) {
      if (e.department && e.status === 'Active') departments.add(e.department);
      if (e.location) locations.add(e.location);
      if (e.status) statuses.add(e.status);
      if (e.name) names.add(e.name);
      if (e.email) emails.add(e.email);
    }
    for (const c of raw.club) if (c.year) years.add(String(c.year));
    for (const c of raw.inClass) if (c.year) years.add(String(c.year));
    for (const c of raw.kudos) if (c.year) years.add(String(c.year));

    return {
      years: Array.from(years).sort(),
      quarters: ['1', '2', '3', '4'],
      months: Array.from({ length: 12 }, (_, i) => String(i + 1)),
      departments: Array.from(departments).sort(),
      locations: Array.from(locations).sort(),
      employmentStatuses: Array.from(statuses).sort(),
      employeeNames: Array.from(names).sort(),
      emails: Array.from(emails).sort(),
    };
  }, [raw]);

  return (
    <DataContext.Provider value={{ 
      token, department, isAdmin,
      raw, filtered, filteredNoTime, filters, setFilters: safeSetFilters, resetFilters: safeResetFilters, options, status, retry 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
