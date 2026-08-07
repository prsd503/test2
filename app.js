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
 * Universal fetch wrapper that uses the Guest JWT for public GET requests (searches) 
 * and attempts Admin JWT exchange only for write/mutation operations when logged in.
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    const appCheckToken = await getAppCheckToken();
    let authToken = "";

    const method = (options.method || 'GET').toUpperCase();
    const isGetRequest = method === 'GET';

    // 1. For public GET requests (searches, lookups) or when no user is logged in, use the Guest Token
    if (isGetRequest || !auth.currentUser) {
      authToken = await getGuestToken(appCheckToken);
    } else {
      // 2. For write/mutation operations (POST/PUT/DELETE), attempt to get an Admin JWT token
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
        console.warn("Admin token exchange failed. Falling back to guest token.");
      }

      // Fallback to guest token if admin exchange didn't yield a token
      if (!authToken) {
        authToken = await getGuestToken(appCheckToken);
      }
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
