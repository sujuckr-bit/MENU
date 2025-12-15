/**
 * Global Toast Notification Helper
 * Standardized toast notifications across all pages
 * Usage: showToast('Message', 'success|error|warn|info', timeout)
 */

window.showToast = function(message, type = 'info', timeout = 3000) {
    try {
        // Create container if not exists
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.style.position = 'fixed';
            container.style.right = '20px';
            container.style.bottom = '20px';
            container.style.zIndex = '9999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            container.style.pointerEvents = 'none';
            document.body.appendChild(container);
        }

        // Create toast element
        const el = document.createElement('div');
        el.textContent = message;
        el.style.minWidth = '250px';
        el.style.padding = '12px 16px';
        el.style.borderRadius = '8px';
        el.style.color = '#fff';
        el.style.fontWeight = '500';
        el.style.fontSize = '0.95rem';
        el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15)';
        el.style.opacity = '0';
        el.style.transition = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.transform = 'translateY(12px)';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';

        // Set background color based on type
        const colors = {
            success: 'linear-gradient(90deg, #28a745, #20c997)',
            error: 'linear-gradient(90deg, #dc3545, #c82333)',
            warn: 'linear-gradient(90deg, #ffc107, #ff9800)',
            info: 'linear-gradient(90deg, #17a2b8, #0dcaf0)'
        };
        el.style.background = colors[type] || colors.info;

        // Add to container
        container.appendChild(el);

        // Animate in
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });

        // Click to dismiss
        el.addEventListener('click', () => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(12px)';
            setTimeout(() => { el.remove(); }, 200);
        });

        // Auto dismiss after timeout
        const timeoutId = setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(12px)';
            setTimeout(() => { el.remove(); }, 200);
        }, timeout);

        // Clear timeout on hover (pause)
        el.addEventListener('mouseenter', () => clearTimeout(timeoutId));

        return el;
    } catch (e) {
        console.error('showToast error:', e);
    }
};

// Legacy support for pages that define it locally
if (typeof showToast === 'undefined') {
    window.showToast = window.showToast;
}
