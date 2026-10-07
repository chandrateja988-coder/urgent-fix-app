# Urgent Fix

A full-stack MVP that lets a Victorian renter report an urgent repair. Reports are
saved to a database and can be loaded back on the **My reports** screen.

```
React (browser)  ->  Python API (FastAPI)  ->  Supabase (Postgres)
   front desk           back office              filing cabinet
```

- **React** collects the report and only ever calls its own `/api/...` address.
- **Python** (`api/index.py`) checks the data and is the *only* part that talks to Supabase.
- **Supabase** stores the rows in a `reports` table (Row Level Security switched on).
- The Supabase secret key lives in environment variables (`.env` locally, Vercel
  settings in production). It is never in the React code and never committed to Git.

## Tech stack

- Python 3 + FastAPI (`api/index.py`) with the official `supabase` client
- Supabase (Postgres database)
- Vercel (hosts the React build and the Python API)
- React 18 (functional components + hooks)
- Tailwind CSS v4 (via `@tailwindcss/vite`, design tokens declared in `src/index.css`)
- lucide-react (icons — the `CircleCheckIcon` in the success alert)
- Vite
- No router — screens are switched with plain component state in `src/App.jsx`
- Plain JavaScript (`.jsx`) — no TypeScript, no shadcn CLI

## Getting started (local)

1. Copy `.env.example` to `.env` and fill in `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
2. Create the table once in the Supabase SQL Editor (see `supabase/schema.sql`).
3. Start the Python API:

```bash
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

4. In a second terminal, start React (Vite forwards `/api` to port 8000):

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run test:smoke # renders every screen and checks the expected content
```

## Environment variables

| Name                   | Where it is set                              | Used by       |
|------------------------|----------------------------------------------|---------------|
| `SUPABASE_URL`         | `.env` locally, Vercel project settings      | Python API    |
| `SUPABASE_SERVICE_KEY` | `.env` locally, Vercel project settings      | Python API    |

`.env` is listed in `.gitignore`; `.env.example` shows the names without real values.

## API

| Method | Path                         | What it does                                          |
|--------|------------------------------|-------------------------------------------------------|
| GET    | `/api/health`                | Is the API up, and are the two variables present?     |
| POST   | `/api/reports`               | Validates a report and inserts it into `reports`      |
| GET    | `/api/reports?user_email=…`  | Returns that renter's 20 newest reports               |

## Screens

| # | Screen                  | File                                  | Moves on when                              |
|---|-------------------------|---------------------------------------|--------------------------------------------|
| 1 | Login                   | `src/screens/LoginScreen.jsx`         | Any non-empty email + password → screen 2   |
| 2 | Report an issue         | `src/screens/ReportIssueScreen.jsx`   | Description + date → screen 3               |
| 3 | Property & contact      | `src/screens/PropertyDetailsScreen.jsx` | Address + valid email → screen 4          |
| 4 | Confirmation            | `src/screens/ConfirmationScreen.jsx`  | "Done" resets the form → screen 1           |
| – | My reports              | `src/screens/MyReportsScreen.jsx`     | Loads saved reports from the database       |

The logged-in email is shown in the header as `Signed in as …`. Screen 4 shows a
`SuccessAlert` reading "Report submitted successfully" above the summary of screens 2–3.

## Project structure

```
api/index.py                   Python (FastAPI) backend - the only code that talks to Supabase
requirements.txt               Python packages
vercel.json                    Sends /api/* to the Python function on Vercel
.env.example                   Names of the environment variables (no real values)
index.html                     Vite entry HTML
vite.config.js                 Vite + React + Tailwind plugins
scripts/smoke-test.jsx         SSR render checks (npm run test:smoke)
src/
  main.jsx                     React root
  index.css                    Tailwind import + theme tokens
  App.jsx                      Screen switching + report/contact state
  api.js                       The only file that calls the Python API (fetch)
  components/
    AppHeader.jsx              Slim app bar with the current step
    Button.jsx                 Primary teal button (also a secondary variant)
    Card.jsx                   White rounded container with padding + shadow
    InputField.jsx             Label + text/email/password/date input
    TextAreaField.jsx          Label + multi-line input (same styling as InputField)
    FileField.jsx              Label + file input, shows the attached file name
    SuccessAlert.jsx           Green success box: check icon, bold title, description
    fieldStyles.js             Shared control/label/error class strings
  screens/                     The four screens listed above
  utils/formatters.js          Date ("4 March 2026") and file-size formatting
```

## Reusable components

- **`Button`** — used on all four screens. `variant="primary"` (default) is deep teal
  with white text; `variant="secondary"` is used for the Back actions.
- **`InputField`** — label on top with a consistent border/padding/focus style, used for
  every text, email, password and date input on screens 1, 2 and 3. Accepts `helpText`
  and `error` props.
- **`Card`** — white `rounded-xl` container with padding and a subtle shadow, wrapping
  the content on screens 2, 3 and 4.
- **`SuccessAlert`** — rounded, bordered box in an emerald success tone with a
  `CircleCheckIcon` (lucide-react), a bold title and a description underneath. Used on
  screen 4. Props: `title`, `description`, `titleAs` (default `h2`, the confirmation
  screen passes `h1`), `className` and optional `children`.
- **`TextAreaField`** and **`FileField`** — the same label/control styling as
  `InputField`, for the two non-text control types on screen 2. All three field
  components share the class strings in `components/fieldStyles.js`, so no styling is
  duplicated.

## Design tokens

Defined in `src/index.css` and used as Tailwind utilities:

| Token            | Value     | Usage                              |
|------------------|-----------|------------------------------------|
| `--color-canvas` | `#F7F5F0` | Page background (`bg-canvas`)      |
| `--color-brand`  | `#0F6E56` | Buttons and headings (`bg-brand`)  |
| `--color-brand-dark` | `#0B5343` | Button hover                  |
| `--color-brand-soft` | `#E3EFEB` | Subtle teal tint             |
| `--color-ink`    | `#21252B` | Body text                          |
| `--color-ink-soft` | `#5C646D` | Muted text                       |
| `--color-line`   | `#D9D5CD` | Control borders                    |
| `--color-success` | `#059669` | Success icon accent (emerald)     |
| `--color-success-ink` | `#065F46` | Success alert text            |
| `--color-success-soft` | `#ECFDF5` | Success alert background     |
| `--color-success-line` | `#A7F3D0` | Success alert border         |

## Notes / limitations

- The login is a demo: any email and password are accepted, and reports are filed under
  the email typed in. A production version would use real authentication (for example
  Supabase Auth) and Row Level Security policies tied to the signed-in user.
- Validation is checked twice: inline in React, and again in the Python API.
- The photo is never uploaded; only its name and size are stored.
- Nothing is sent to a rental provider - this is a demo of the reporting workflow.
