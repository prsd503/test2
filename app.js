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

// Cache the guest JWT locally to prevent excessive calls to the guest token endpoint
let cachedGuestToken = null;

async function getGuestToken(appCheckToken) {
  if (cachedGuestToken) return cachedGuestToken;
  try {
    const res = await fetch(`${API_BASE}/api/auth/guest-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Firebase-AppCheck': appCheckToken,
        ...NG_HEADERS
      }
    });
    if (res.ok) {
      const data = await res.json();
      cachedGuestToken = data.token;
      return cachedGuestToken;
    }
  } catch (err) {
    console.warn("Could not fetch guest token:", err);
  }
  return "";
}

/**
 * Universal fetch wrapper that attaches a valid backend JWT (Admin JWT or Guest JWT) 
 * and Firebase App Check headers to every request.
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    const appCheckToken = await getAppCheckToken();
    let authToken = "";

    // 1. If a user is logged in, attempt to get an Admin JWT token
    if (auth.currentUser) {
      try {
        const firebaseIdToken = await auth.currentUser.getIdToken();
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
        }
      } catch (exchangeErr) {
        console.warn("Admin token exchange skipped/failed (user is not admin). Using guest token.");
      }
    }

    // 2. Fallback to guest JWT if no admin token was acquired (guests or non-admin logged-in users)
    if (!authToken) {
      authToken = await getGuestToken(appCheckToken);
    }

    // 3. Build headers with the verified JWT and App Check attached
    options.headers = {
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      'X-Firebase-AppCheck': appCheckToken,
      ...NG_HEADERS,
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
