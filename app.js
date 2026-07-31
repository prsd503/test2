// Enable Debug Provider for local development
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

// TODO: Replace with your actual Firebase project configuration details
const firebaseConfig = {
  apiKey: "AIzaSyBEYKHQpy_VjmgjYIwQOPjXth1bghYsf9M",
  authDomain: "finder-owl.firebaseapp.com", 
  projectId: "finder-owl",
  storageBucket: "finder-owl.firebasestorage.app",
  messagingSenderId: "1011347100861",
  appId: "1:1011347100861:web:24246f9a4eb24d812cd3d4"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);

// Initialize App Check and export it
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-v3-site-key-if-needed'),
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const db = getFirestore(app);

// --- STEP 2: SECURED FETCH HELPER ---
/**
 * Use this wrapper instead of standard fetch() for protected API endpoints.
 * It automatically injects the Firebase Auth token and App Check token.
 */
export async function authenticatedFetch(url, options = {}) {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error("User must be logged in to perform this action.");
  }

  // 1. Get Firebase Auth ID Token & App Check Token simultaneously
  const [idToken, appCheckTokenRes] = await Promise.all([
    currentUser.getIdToken(),
    getToken(appCheck, false)
  ]);

  // 2. Inject both tokens into request headers
  options.headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
    'X-Firebase-AppCheck': appCheckTokenRes.token
  };

  return fetch(url, options);
}