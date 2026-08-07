import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

// --- APP CHECK DEBUG ENABLEMENT ---
self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;

const firebaseConfig = {
  apiKey: "AIzaSyAO4UNADGQWTyT3F6Si6bhJaFS8uyQAkZI",
  authDomain: "finder-owl.firebaseapp.com", 
  projectId: "finder-owl",
  storageBucket: "finder-owl.firebasestorage.app",
  messagingSenderId: "1011347100861",
  appId: "1:1011347100861:web:24246f9a4eb24d812cd3d4"
};

const app = initializeApp(firebaseConfig);

// Initialize App Check
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LeWv9YqAAAAAFYyYV-yqX8_T-N8X_YyYV-yqX8_T'), 
  isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const db = getFirestore(app);

const API_BASE = "https://unloving-limit-ferry.ngrok-free.dev";
const NG_HEADERS = { 'ngrok-skip-browser-warning': 'true' };

/**
 * Helper function to retrieve the Firebase App Check token.
 */
async function getAppCheckToken() {
  try {
    if (!appCheck) return "";
    const appCheckResponse = await getToken(appCheck, false);
    return appCheckResponse.token;
  } catch (err) {
    console.error("Failed to get Firebase App Check token:", err);
    return "";
  }
}

// --- SECURED FETCH HELPER ---
export async function authenticatedFetch(url, options = {}) {
  try {
    const appCheckToken = await getAppCheckToken();

    // Standard headers for all requests
    const baseHeaders = {
      'X-Firebase-AppCheck': appCheckToken,
      ...NG_HEADERS
    };

    if (!auth.currentUser) {
      options.headers = { ...baseHeaders, ...options.headers };
      if (options.body && !(options.body instanceof FormData) && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
      }
      return fetch(url, options);
    }

    // 1. Get fresh Firebase ID Token
    const firebaseIdToken = await auth.currentUser.getIdToken();
    let authToken = firebaseIdToken;

    // 2. Try to exchange for a short-lived backend JWT (Optional fallback layer)
    try {
      const tokenResponse = await fetch(`${API_BASE}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`,
          'X-Firebase-AppCheck': appCheckToken,
          ...NG_HEADERS
        }
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        if (tokenData && tokenData.token) {
          authToken = tokenData.token;
        }
      } else {
        console.warn("Backend token exchange endpoint responded with error status. Falling back to direct Firebase ID token.");
      }
    } catch (exchangeErr) {
      console.warn("Network/Server error during token exchange. Falling back to direct Firebase ID token.", exchangeErr);
    }

    // 3. Attach authorization header with token
    options.headers = {
      'Authorization': `Bearer ${authToken}`,
      ...baseHeaders,
      ...options.headers
    };

    if (options.body && !(options.body instanceof FormData) && !options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }

    return fetch(url, options);

  } catch (error) {
    console.error("authenticatedFetch Error:", error);
    throw error;
  }
}
