# DuoBook - Language Learning App

This project is a full-stack language learning application featuring interactive story generation, progress tracking, challenges, and achievements.

Built with:

- **Frontend:** React, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** Prisma (SQLite for Dev, PostgreSQL recommended for Prod)
- **Authentication:** Firebase Authentication
- **AI:** OpenAI API (for story generation)

## Development Setup

Follow these steps to set up the project for local development.

### 1. Environment Configuration

Detailed instructions for setting up necessary API keys (Firebase, OpenAI) and the Firebase Admin SDK are in a separate file:

➡️ **See: [ENV-SETUP-INSTRUCTIONS.md](./ENV-SETUP-INSTRUCTIONS.md)**

Make sure you create the `.env` file and place the `firebase-admin-sdk.json` file in the project root as described in that guide before proceeding.

### 2. Install Dependencies

Navigate to the project directory (`language-book-app`) and install the required Node.js packages:

```bash
npm install
```

Note: This repo uses `react-joyride@2.9.3`, which has a peer range of `react@15-18`. The app uses React 19 and react-joyride still works in practice, but npm’s newer resolver will otherwise block install. An `.npmrc` with `legacy-peer-deps=true` is included to allow installation. If you prefer a one-off install without the config, you can run `npm install --legacy-peer-deps`.

### 3. Database Setup

Initialize the local SQLite database and populate it with initial challenge/achievement data:

```bash
# Apply database schema migrations (creates dev.db if it doesn't exist)
npm run prisma:migrate

# Seed the database with initial data
npx prisma db seed
```

_(To inspect the database later, you can use `npx prisma studio`)_

### 4. Run the Application

You need two terminals running concurrently:

- **Terminal 1 (Backend Server):**
  ```bash
  npm run server:dev
  ```
- **Terminal 2 (Frontend Dev Server):**
  ```bash
  npm run dev
  ```

The application should then be accessible, typically at `http://localhost:5173` (check the output of the frontend server).

## Production Deployment

For deploying to production (e.g., using a VPS like DigitalOcean):

1.  Ensure your `.env` file uses a production database connection string (e.g., PostgreSQL) for `DATABASE_URL`.
2.  Build the frontend: `npm run build`
3.  Build the backend: `npm run server:build`
4.  Run database migrations: `npx prisma migrate deploy`
5.  Run the backend server using a process manager like PM2: `pm2 start build/server/index.js --name duobook-backend`
6.  Configure a web server like Nginx as a reverse proxy to serve the frontend static files (from `dist/`) and forward API requests (e.g., `/api`) to the backend process.
7.  Ensure necessary environment variables are set on the production server.
