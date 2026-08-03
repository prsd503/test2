import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

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

// --- APP CHECK INITIALIZATION ---
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LfyzGwtAAAAAPj_AmQ3jjFhjuyYa5P8fxrxTGFI'),
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const db = getFirestore(app);

// --- SECURED FETCH HELPER ---
/**
 * Use this wrapper instead of standard fetch() for protected API endpoints.
 * It automatically injects the Firebase Auth Bearer token.
 */
export async function authenticatedFetch(url, options = {}) {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error("User must be logged in to perform this action.");
  }

  // 1. Get Firebase Auth ID Token
  const idToken = await currentUser.getIdToken();

  // 2. Prepare headers, avoiding forced Content-Type if body is FormData
  const headers = {
    'Authorization': `Bearer ${idToken}`,
    'ngrok-skip-browser-warning': 'true',
    ...options.headers
  };

  // If the body is not FormData and a content-type isn't specified, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  options.headers = headers;

  return fetch(url, options);
}
