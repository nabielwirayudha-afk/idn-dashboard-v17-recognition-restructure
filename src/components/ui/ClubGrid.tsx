import {
  Music,
  Camera,
  BookOpen,
  Gamepad2,
  ChefHat,
  Palette,
  Bike,
  Film,
  Trophy,
  Footprints,
  Circle,
  Activity,
  Mountain,
  Heart,
  type LucideIcon,
} from 'lucide-react';

export interface ClubMetricRow {
  club: string;
  uniqueTimmy: number;
  totalSessions: number;
  averageParticipants: number;
}

const CLUB_IMAGE_MAP: Record<string, string> = {
  'idn padel': '/IDN Padel.png',
  'idn pickleball': '/IDN Pickleball.png',
  'idn soccer': '/IDN Soccer.png',
  'idn active class': '/IDN Active Class.png',
  'idn badminton': '/IDN Badminton.png',
  'idn basketball': '/IDN Basketball.png',
  'idn book club': '/IDN Book Club.png',
  'idn futsal': '/IDN Futsal.png',
  'idn hiking': '/IDN Hiking.png',
};

function imageForClub(name: string): string | null {
  return CLUB_IMAGE_MAP[name.trim().toLowerCase()] || null;
}

function iconForClub(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/soccer|football|futsal/.test(n)) return Footprints;
  if (/basketball|volleyball|handball|baseball/.test(n)) return Circle;
  if (/badminton|tennis|padel|pickleball|squash/.test(n)) return Activity;
  if (/run|marathon|jogging/.test(n)) return Footprints;
  if (/hiking|trekking|mountain/.test(n)) return Mountain;
  if (/gym|fitness|workout|crossfit|yoga|pilates/.test(n)) return Heart;
  if (/swim|diving|surf/.test(n)) return Circle;
  if (/cycling|bike|bicycle/.test(n)) return Bike;
  if (/skate|board|roller/.test(n)) return Activity;
  if (/music|band|choir|sing|karaoke|dance|dj/.test(n)) return Music;
  if (/photo|camera|potret/.test(n)) return Camera;
  if (/film|movie|cinema|video/.test(n)) return Film;
  if (/art|paint|draw|craft|design|sketch/.test(n)) return Palette;
  if (/theater|drama|acting|perform/.test(n)) return Activity;
  if (/book|read|liter|novel|writing|poetry|journal/.test(n)) return BookOpen;
  if (/game|gaming|esport|board.?game/.test(n)) return Gamepad2;
  if (/cook|culinary|food|chef|baking|recipe/.test(n)) return ChefHat;
  if (/tech|coding|programming|robotic|ai|data/.test(n)) return Activity;
  if (/meditation|mindfulness|wellness|spa/.test(n)) return Heart;
  if (/travel|wander|adventure|explore/.test(n)) return Mountain;
  if (/active|class|challenge|competition|league|champion/.test(n)) return Trophy;
  return Trophy;
}

export default function ClubGrid({ rows }: { rows: ClubMetricRow[]; isAdmin?: boolean }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
        No clubs to show.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => {
        const imagePath = imageForClub(r.club);
        const Icon = iconForClub(r.club);

        return (
          <div
            key={r.club}
            className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors"
          >
            {/* Icon */}
            <span
              className="grid place-items-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: 'rgba(237, 33, 39, 0.10)', color: '#ED2127' }}
            >
              {imagePath ? (
                <img src={imagePath} alt={r.club} className="w-5 h-5 object-contain" loading="lazy" />
              ) : (
                <Icon size={18} />
              )}
            </span>

            {/* Club Name */}
            <div className="min-w-0 shrink-0" style={{ width: '180px' }}>
              <p className="text-sm font-bold text-gray-900 truncate">
                {r.club}
              </p>
            </div>

            {/* Metrics — equal-width columns, stretched to fill remaining space */}
            <div className="flex-1 grid grid-cols-3 gap-4 items-baseline">
              {/* Primary: Unique Timmy */}
              <div className="text-right">
                <div className="text-xl font-extrabold text-gray-900 tabular-nums leading-none">
                  {r.uniqueTimmy}
                </div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">
                  Unique Timmy
                </div>
              </div>

              {/* Secondary: Sessions */}
              <div className="text-right">
                <div className="text-xl font-extrabold text-gray-600 tabular-nums leading-none">
                  {r.totalSessions}
                </div>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1">
                  Sessions
                </div>
              </div>

              {/* Tertiary: Avg / Session */}
              <div className="text-right">
                <div className="text-xl font-extrabold text-amber-500 tabular-nums leading-none">
                  {Math.round(r.averageParticipants)}
                </div>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1">
                  Avg / Session
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
