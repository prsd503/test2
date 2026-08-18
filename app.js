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

// --- SECURED FETCH HELPER (UPDATED FOR FIREBASE TOKEN VERIFICATION) ---
/**
 * Use this wrapper instead of standard fetch() for protected API endpoints.
 * It fetches a fresh JWT from the backend using the Firebase ID token and injects it[cite: 2].
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    // If the user is not logged in yet, bypass token fetch and use standard fetch[cite: 2]
    if (!auth.currentUser) {
      return fetch(url, options);
    }

    // 1. Get the Firebase ID token for the currently logged-in user
    const idToken = await auth.currentUser.getIdToken();

    // 2. Request a fresh JWT from your backend by verifying the Firebase ID token[cite: 2]
    const tokenResponse = await fetch(`${API_BASE}/api/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ idToken })
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to acquire authentication token from server.");
    }

    const tokenData = await tokenResponse.json();
    const appToken = tokenData.token;

    console.log("Acquired application JWT. Expires in:", tokenData.expiresin, "seconds");

    // 3. Build headers with the new token[cite: 2]
    const headers = {
      'Authorization': `Bearer ${appToken}`,
      'ngrok-skip-browser-warning': 'true',
      ...options.headers
    };

    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    options.headers = headers;
    
    // 4. Execute the original fetch request[cite: 2]
    return fetch(url, options);

  } catch (error) {
    console.error("authenticatedFetch Error:", error);
    throw error;
  }
}
