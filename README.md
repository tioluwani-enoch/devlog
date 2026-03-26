# DevLog

Auto-generate your daily standup notes from GitHub activity. Connect your GitHub account, and DevLog pulls your commits, pull requests, and code reviews into a clean, editable summary you can paste into Slack.

## Features

- **GitHub OAuth** — Sign in with your GitHub account
- **Activity sync** — Fetches commits, PRs, and reviews automatically
- **Smart grouping** — Groups activity by repo and branch
- **Editable summaries** — Auto-generated text you can tweak before sharing
- **History** — Past summaries saved as a personal work journal
- **Copy to clipboard** — One click to paste into Slack or anywhere

## Tech Stack

- **Frontend:** React, React Router, Axios
- **Backend:** Node.js, Express, express-session
- **Database:** PostgreSQL
- **APIs:** GitHub REST API v3, GitHub OAuth

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A GitHub account

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/devlog.git
cd devlog
npm run install:all
```

### 2. Set up PostgreSQL

```bash
# Create the database
createdb devlog

# Or via psql:
psql -U postgres -c "CREATE DATABASE devlog;"
```

### 3. Create a GitHub OAuth App

This is how users will sign in. Follow these steps:

1. Go to **https://github.com/settings/developers**
2. Click **"New OAuth App"**
3. Fill in the form:
   - **Application name:** `DevLog` (or whatever you want)
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/auth/callback`
4. Click **"Register application"**
5. You'll see your **Client ID** on the app page
6. Click **"Generate a new client secret"** — copy it immediately (you won't see it again)

### 4. Configure environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and fill in your values:

```
GITHUB_CLIENT_ID=your_client_id_from_step_3
GITHUB_CLIENT_SECRET=your_client_secret_from_step_3
SESSION_SECRET=any-random-string-here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devlog
```

### 5. Run the database migration

```bash
npm run db:migrate
```

### 6. Start the app

```bash
# From the root directory — starts both server and client
npm run dev
```

- Server runs on `http://localhost:3001`
- Client runs on `http://localhost:3000`

Open `http://localhost:3000`, sign in with GitHub, and hit "Generate today's standup."

---

## Project Structure

```
devlog/
├── client/                  # React frontend
│   ├── public/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── hooks/           # Custom hooks (useAuth)
│       ├── pages/           # Page components
│       ├── styles/          # CSS files
│       └── utils/           # API client
├── server/                  # Express backend
│   └── src/
│       ├── db/              # Database pool + migrations
│       ├── middleware/       # Auth middleware
│       ├── routes/          # API route handlers
│       └── services/        # GitHub API + business logic
└── package.json             # Root workspace config
```

## API Endpoints

| Method | Endpoint                  | Description                         |
|--------|---------------------------|-------------------------------------|
| GET    | `/auth/github`            | Get GitHub OAuth URL                |
| POST   | `/auth/github/callback`   | Exchange code for token, login      |
| GET    | `/auth/me`                | Get current authenticated user      |
| POST   | `/auth/logout`            | Destroy session                     |
| GET    | `/api/activity?days=1`    | Fetch + store GitHub activity       |
| GET    | `/api/activity/history`   | Query stored activities             |
| POST   | `/api/summaries`          | Save/update a standup summary       |
| GET    | `/api/summaries`          | List recent summaries               |
| GET    | `/api/summaries/:date`    | Get summary for a specific date     |

---

## Clearing Database
`
 node -e 'require("dotenv").config(); const db = require("./src/db"); db.query("TRUNCATE activities, summaries RESTART IDENTITY").then(() => { console.log("Cleared"); process.exit(); })'
`

## License

MIT
