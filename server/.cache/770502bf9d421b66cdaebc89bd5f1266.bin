// API Configuration
// Untuk support mobile/Android: gunakan IP server yang sama, bukan localhost
function getAPIBaseUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Desktop/local: gunakan localhost
        return 'http://localhost:3000';
    } else {
        // Mobile/Android: gunakan IP server yang sama
        return `http://${window.location.hostname}:3000`;
    }
}

const API_CONFIG = {
    baseUrl: getAPIBaseUrl(),
    endpoints: {
        login: '/api/login',
        logout: '/api/logout',
        menus: '/api/menus',
        orders: '/api/orders',
        settings: '/api/settings',
        changePassword: '/api/change-password'
    }
};

// Get full endpoint URL
function getApiUrl(endpoint) {
    return API_CONFIG.baseUrl + API_CONFIG.endpoints[endpoint];
}

// API Helper Functions
async function apiCall(endpoint, options = {}) {
    const url = getApiUrl(endpoint);
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include' // Send cookies for session
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, finalOptions);

        // Safely parse body only when appropriate
        const ct = (response.headers.get('content-type') || '').toLowerCase();
        let data = null;

        if (response.status === 204 || response.status === 205) {
            data = null; // No content
        } else if (ct.includes('application/json')) {
            try {
                data = await response.json();
            } catch (e) {
                console.warn(`Failed to parse JSON response from ${url}:`, e);
                data = null;
            }
        } else {
            // If not JSON, attempt to read text. If text is JSON-like, try parse, otherwise return text.
            try {
                const text = await response.text();
                if (text) {
                    try { data = JSON.parse(text); } catch (e) { data = text; }
                } else {
                    data = null;
                }
            } catch (e) {
                console.warn(`Failed to read non-JSON response from ${url}:`, e);
                data = null;
            }
        }

        return {
            ok: response.ok,
            status: response.status,
            data: data
        };
    } catch (error) {
        console.error(`API call failed to ${endpoint}:`, error);
        return {
            ok: false,
            status: 0,
            data: { error: error.message }
        };
    }
}

// Login with password (server-side)
async function loginWithAPI(password) {
    const result = await apiCall('login', {
        method: 'POST',
        body: JSON.stringify({ password })
    });
    
    if (result.ok) {
        sessionStorage.setItem('isAdmin', '1');
        sessionStorage.setItem('adminLoginTime', String(Date.now()));
        return true;
    }
    return false;
}

// Logout
async function logoutWithAPI() {
    await apiCall('logout', { method: 'POST' });
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminLoginTime');
}

// Get menus from API
async function fetchMenusFromAPI() {
    const result = await apiCall('menus');
    if (result.ok) {
        return result.data || {};
    }
    console.error('Failed to fetch menus:', result.data);
    return {};
}

// Fetch settings from API
async function fetchSettingsFromAPI() {
    const result = await apiCall('settings');
    if (result.ok) {
        return result.data || {};
    }
    console.error('Failed to fetch settings:', result.data);
    return {};
}

// Save menus to API (admin only)
async function saveMenusToAPI(menus) {
    const result = await apiCall('menus', {
        method: 'POST',
        body: JSON.stringify(menus)
    });
    
    if (!result.ok) {
        // Log detailed error for debugging
        const errorMsg = result.data?.error || 'Unknown error';
        const details = result.data?.details || '';
        console.error(`[SYNC ERROR] Status ${result.status}: ${errorMsg} ${details ? '— ' + details : ''}`);
    }
    
    return result.ok;
}

// Get orders from API (admin only)
async function fetchOrdersFromAPI() {
    const result = await apiCall('orders');
    if (result.ok) {
        return Array.isArray(result.data) ? result.data : [];
    }
    console.error('Failed to fetch orders:', result.data);
    return [];
}

// Create order via API
async function createOrderViaAPI(orderData) {
    const result = await apiCall('orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
    
    if (result.ok && result.data.id) {
        return result.data.id;
    }
    console.error('Failed to create order:', result.data);
    return null;
}

// Change admin password
async function changeAdminPasswordViaAPI(newPassword) {
    const result = await apiCall('changePassword', {
        method: 'POST',
        body: JSON.stringify({ newPassword })
    });
    return result.ok;
}

// Check if user is logged in as admin (via session)
function isAdminLoggedIn() {
    return sessionStorage.getItem('isAdmin') === '1';
}

// Backwards compatibility: expose global API_BASE_URL expected by older pages
try {
    if (typeof window !== 'undefined') window.API_BASE_URL = API_CONFIG.baseUrl;
} catch (e) {
    // ignore in non-browser environments
}
