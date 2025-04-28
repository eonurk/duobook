# Firebase Configuration Guide

## Environment Variables Setup

Create a `.env` file in the root of your project with the following variables:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# OpenAI API Key
VITE_OPENAI_API_KEY=your-openai-api-key
```

## Fixing the Firestore Connection Errors

If you're seeing Firebase/Firestore connection errors, follow these steps:

1. **Verify Firebase Project Setup**:

   - Make sure you've created a Firebase project at https://console.firebase.google.com/
   - Enable Authentication and Firestore in your project

2. **Check Firestore Database**:

   - Go to Firebase Console → Your Project → Firestore Database
   - If not already created, click "Create database"
   - Choose either "Production mode" or "Test mode" to start
   - Select a region close to your users

3. **Update Firestore Rules**:

   - In Firebase Console, go to Firestore Database → Rules
   - Update rules to allow authenticated users access:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

4. **Check Environment Variables**:

   - Ensure your `.env` file contains all the required Firebase variables
   - Get these values from Firebase Console → Project settings → Your apps → SDK setup

5. **Restart Development Server**:

   - After updating your `.env` file, restart your development server:

   ```
   npm run dev
   ```

If you continue to experience issues, please check the browser console for more detailed error messages.
