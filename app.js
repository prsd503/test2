import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

const firebaseConfig = {
    apiKey: "AIzaSyBEYKHQpy_VjmgjYIwQOPjXth1bghYsf9M",
    authDomain: "finder-owl.firebaseapp.com", 
    projectId: "finder-owl",
    storageBucket: "finder-owl.firebasestorage.app",
    messagingSenderId: "1011347100861",
    appId: "1:1011347100861:web:24246f9a4eb24d812cd3d4"
};

const app = initializeApp(firebaseConfig);

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LfyzGwtAAAAAPj_AmQ3jjFhjuyYa5P8fxrxTGFI'),
    isTokenAutoRefreshEnabled: true
});

export const auth = getAuth(app);
export const db = getFirestore(app);

// --- SECURED FETCH HELPER ---
export async function authenticatedFetch(url, options = {}) {
    // Wait for Firebase Auth to initialize and confirm user state
    if (auth.authStateReady) {
        await auth.authStateReady();
    }

    const currentUser = auth.currentUser;
    
    if (!currentUser) {
        throw new Error("User must be logged in to perform this action.");
    }

    // Force a fresh Firebase Auth ID Token to prevent 403 errors
    const idToken = await currentUser.getIdToken(true);

    options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'ngrok-skip-browser-warning': 'true'
    };

    return fetch(url, options);
}
