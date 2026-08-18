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

// UPDATED: Pointing to your local Netlify CLI development server
//const API_BASE = "http://localhost:8888";

const API_BASE_URL = window.location.hostname === "localhost" 
    ? "http://localhost:8888/api" 
    : "https://melodious-kheer-93353e.netlify.app/api";


// --- SECURED FETCH HELPER (UPDATED FOR FIREBASE TOKEN VERIFICATION) ---
/**
 * Use this wrapper instead of standard fetch() for protected API endpoints.
 * It fetches a fresh JWT from the backend using the Firebase ID token and injects it
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    const baseHeaders = {};

    // If the user is not logged in yet, bypass token fetch and use standard fetch with base headers
    if (!auth.currentUser) {
      options.headers = { ...baseHeaders, ...options.headers };
      return fetch(url, options);
    }

    // 1. Get the Firebase ID token for the currently logged-in user
    const idToken = await auth.currentUser.getIdToken();

    // 2. Request a fresh JWT from your backend by verifying the Firebase ID token
    const tokenResponse = await fetch(`${API_BASE}/api/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idToken })
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to acquire authentication token from server.");
    }

    const tokenData = await tokenResponse.json();
    const appToken = tokenData.token;

    console.log("Acquired application JWT. Expires in:", tokenData.expiresin, "seconds");

    // 3. Build headers with the new token
    const headers = {
      'Authorization': `Bearer ${appToken}`,
      ...options.headers
    };

    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    options.headers = headers;
    
    // 4. Execute the original fetch request
    return fetch(url, options);

  } catch (error) {
    console.error("authenticatedFetch Error:", error);
    throw error;
  }
}
