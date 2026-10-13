# Refactor Summary: CSS Variables & IDN Club Total Sessions

## Changes Made

### 1. CSS Variables (Dark Mode Consistency)
All hardcoded colors have been refactored to use CSS custom properties.

#### New/Updated Files:
- `styles/design-system.css` — Complete design token system with light & dark mode
- `DetailModal.tsx` — Overlay, borders, text, and item backgrounds now use vars
- `SolidPieCard.tsx` — Dark card backgrounds use `--color-dark-card-*` tokens
- `ScalarKpiCard.tsx` — Same dark card token system
- `ClubGrid.tsx` — Background, text, and accent colors use vars
- `TotmByDepartment.tsx` — Header borders, text, and row backgrounds use vars
- `CultureChampionsGrid.tsx` — Background and text colors use vars
- `PodiumLeaderboard.tsx` — Background and text colors use vars
- `DepartmentRankTable.tsx` — Header borders, text, and row backgrounds use vars

#### New CSS Variables Added:
```
--color-dark-card-bg: #0F1115
--color-dark-card-text: #F5F5F5
--color-dark-card-muted: #8b8d94
--color-dark-card-dim: #4a4c54
--color-dark-card-border: #25272e
--color-brand-rgb: 237, 33, 39
--color-chart-grid: #D4B4A6
```

### 2. IDN Club — New KPI: Total Sessions
- Added `totalSessions` calculation (unique dates across all clubs)
- Added 4th KPI Card with `CalendarDays` icon
- Changed grid from `kpi-grid--3` to `kpi-grid--4`
- Responsive: stacks to 2-col on tablet, 1-col on mobile

### 3. Recharts Integration
- Chart grid lines, tooltips, and label colors now reference CSS variables
- Note: Recharts SVG `fill`/`stroke` props accept CSS var strings in modern browsers

## How to Apply
1. Replace `src/styles/design-system.css` with the new file
2. Replace each component file in `src/components/ui/`
3. Replace `src/pages/IdnClub.tsx`
4. No breaking changes to props or logic — purely stylistic
