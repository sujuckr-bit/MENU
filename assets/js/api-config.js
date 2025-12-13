// API Configuration
// Support untuk: localhost, IP address, domain (HTTP & HTTPS)
function getAPIBaseUrl() {
    const protocol = window.location.protocol; // 'https:' atau 'http:'
    const hostname = window.location.hostname;
    
    // Development local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000';
    }
    
    // Production dengan domain atau IP
    // Gunakan protokol yang sama (HTTPS jika akses via HTTPS)
    return `${protocol}//${hostname}:3000`;
}

const API_CONFIG = {
    baseUrl: getAPIBaseUrl(),
    endpoints: {
        login: '/api/login',
        logout: '/api/logout',
        menus: '/api/menus',
        orders: '/api/orders',
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
        const data = await response.json();
        
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
