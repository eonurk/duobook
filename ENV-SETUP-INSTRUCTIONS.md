# Development Environment Setup Guide

## 1. Environment Variables (`.env` file)

Create a `.env` file in the root of the `language-book-app` project directory with the following variables:

```ini
# === Frontend Firebase Configuration (for Authentication) ===
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# === OpenAI API Key (Currently Frontend - Move to Backend for Production!) ===
# NOTE: For production security, this key MUST be removed from the frontend
# and used only in the backend environment.
VITE_OPENAI_API_KEY=your-openai-api-key

# === Backend Database URL (Prisma) ===
# Use SQLite for local development
DATABASE_URL="file:./dev.db"
# NOTE: For production, change this to your production database connection string (e.g., PostgreSQL).
```

- Get the `VITE_FIREBASE_...` values from your Firebase Project settings → Your apps → SDK setup & configuration.
- Get the `VITE_OPENAI_API_KEY` from your OpenAI account settings.

## 2. Firebase Admin SDK Setup (Backend)

The backend server uses the Firebase Admin SDK to verify user tokens. You need a service account key file:

1.  **Generate Key:**
    - Go to your Firebase Console → Project settings → Service accounts.
    - Select "Node.js" for the Admin SDK configuration snippet.
    - Click "Generate new private key".
    - A JSON file will be downloaded.
2.  **Place Key:**
    - Rename the downloaded JSON file to `firebase-admin-sdk.json`.
    - Place this file in the root of the `language-book-app` project directory.
3.  **Security:**
    - **IMPORTANT:** Add `firebase-admin-sdk.json` to your `.gitignore` file. **Do NOT commit this file to Git**, as it contains sensitive credentials.

## 3. Install Dependencies

Navigate to the `language-book-app` directory in your terminal and run:

```bash
npm install
```

## 4. Setup Database

Run the following commands to initialize your local SQLite database and populate it with initial data (like challenges):

```bash
# Apply database schema migrations
npm run prisma:migrate

# Seed the database with initial data (challenges, etc.)
npx prisma db seed
```

## 5. Run the Application

You need to run both the frontend and backend servers concurrently:

- **Terminal 1 (Backend):**
  ```bash
  npm run server:dev
  ```
- **Terminal 2 (Frontend):**
  ```bash
  npm run dev
  ```

Now you can access the application in your browser, typically at `http://localhost:5173` (check the output of `npm run dev`).

## Troubleshooting

- **Server Errors:** Check the terminal running `npm run server:dev` for backend errors.
- **Frontend Errors:** Check the browser's developer console (F12) for frontend errors.
- **Environment Variables:** Ensure your `.env` file is correctly placed in the `language-book-app` root and has all the required variables filled in. Restart the servers after modifying `.env`.
- **Database:** Use `npx prisma studio` to inspect the contents of your `dev.db` file.
