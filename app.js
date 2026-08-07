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

const API_BASE = "https://unloving-limit-ferry.ngrok-free.dev";

// --- SECURED FETCH HELPER (UPDATED FOR 15s SHORT-LIVED JWT) ---
/**
 * Use this wrapper instead of standard fetch() for protected API endpoints.
 * It fetches a fresh 15-second short-lived JWT from the backend and injects it.
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    // If the user is not logged in yet, bypass short-lived token fetch and use standard fetch
    if (!auth.currentUser) {
      return fetch(url, options);
    }

    // 1. Request a fresh short-lived JWT from your backend using the correct absolute URL
    const tokenResponse = await fetch(`${API_BASE}/api/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to acquire short-lived authentication token from server.");
    }

    const tokenData = await tokenResponse.json();
    const shortLivedToken = tokenData.token;

    console.log("Acquired short-lived JWT. Expires in:", tokenData.expiresin, "seconds");

    // 2. Build headers with the new short-lived token
    const headers = {
      'Authorization': `Bearer ${shortLivedToken}`,
      'ngrok-skip-browser-warning': 'true',
      ...options.headers
    };

    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    options.headers = headers;
    
    // 3. Execute the original fetch request
    return fetch(url, options);

  } catch (error) {
    console.error("authenticatedFetch Error:", error);
    throw error;
  }
}
