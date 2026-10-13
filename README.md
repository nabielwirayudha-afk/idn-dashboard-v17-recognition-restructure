# Employee Experience Dashboard — IDN

A modern analytics dashboard for HR that combines **IDN Club**, **IDN Academy (In-Class Learning
+ Internal Internship)**, and **IDN Kudos** into one view of the employee ("Timmy") experience.
This is *not* an HRIS and *not* a training tracker — it's an engagement, learning, and
recognition analytics layer on top of those systems.

Built to follow the Flow Process Design doc: Steps 1–9 (extraction → employee-master matching →
validation → enrichment → transformation → KPI generation → visualization → detail tables →
final page structure) map directly onto `src/lib/dataLoader.ts`, `src/lib/filters.ts`,
`src/lib/aggregate.ts`, and the six pages under `src/pages/`.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`, no separate config file needed)
- Recharts for charts, Lucide for icons, PapaParse for CSV parsing
- React Router for the six dashboard pages

## Data source

This dashboard reads live from a Google Apps Script web app connected to your master
spreadsheet (`1hhCxhzjX98vgMtHJ0aQuvyHkDRPEtbZkmcgaG-dJPD8`). The endpoint is set in
`src/lib/dataSource.ts` (`APPS_SCRIPT_URL`) and returns one JSON object per sheet, matching the
Flow Process Design doc's structure. `src/lib/dataLoader.ts` parses each sheet's fields, joins
every activity record to the employee master by email (kudos receivers, which only have a name,
are matched by name), and derives Year/Month/Quarter from whichever date field is actually
reliable per sheet (some `Month` columns in the source sheets are miscomputed, so those are
recalculated from `Date`/`created` instead).

**One sheet couldn't be found on first connection:** `Employee [Non-Active]`. If your tab name is
different from that exact string, open the Apps Script project attached to the spreadsheet
(Extensions > Apps Script) and update the `SHEET_NAMES` list at the top of `Code.gs` to match,
then re-deploy (Deploy > Manage deployments > edit > New version). Until then, the app treats
"Non-Active" as an empty group rather than failing.

To point at a different deployment later, just change `APPS_SCRIPT_URL` in `src/lib/dataSource.ts`
— nothing else needs to change.

The `src/data/*.csv` files from earlier are no longer used by the app; they're left in place only
as an offline reference of the expected shape.

## Getting started (local)

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Other useful commands:

```bash
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally to sanity-check it
```

## Project structure

```
src/
  data/            Sample CSVs (see "Swapping in real data" below)
  lib/
    dataSource.ts  Where raw CSV text is imported from — the ONLY file that
                    needs to change to point at a different data source
    dataLoader.ts  Parses CSVs + joins every activity sheet to the employee
                    master by Email (Steps 1-5 of the flow doc)
    filters.ts     Applies the global filters to each dataset
    aggregate.ts    group-by / monthly & quarterly trend / top-N helpers
    theme.ts        Shared chart color palette
  context/
    DataContext.tsx   Loads the dataset once, holds global filter state
    ThemeContext.tsx  Dark/light mode
  components/
    layout/         Sidebar, FilterBar, PageHeader, Layout (routes render here)
    ui/             KpiCard, ChartCard, RankingList, HeatmapGrid
  pages/
    Overview.tsx            KPI cards + engagement pulse + top departments
    Engagement.tsx           IDN Club participation analytics
    Learning.tsx             IDN Academy (in-class + internship) analytics
    Recognition.tsx          IDN Kudos analytics
    EmployeeJourney.tsx      Per-employee timeline across all four programs
    DepartmentAnalytics.tsx  Sortable department comparison table
```

## Deploying to Netlify

`netlify.toml` is already set up (`npm run build`, publish `dist`, SPA redirect for React Router).
Push this project to a Git repo and connect it in Netlify, or drag-and-drop the `dist/` folder
after running `npm run build` for a one-off deploy.
