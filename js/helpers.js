const Helpers = {
    /**
     * Create a delay
     * @param {number} ms - Delay in milliseconds
     */
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    /**
     * Format number to fixed decimal places
     * @param {number} number - Number to format
     * @param {number} decimals - Number of decimal places
     */
    formatNumber: (number, decimals = 2) => {
        try {
            return parseFloat(number).toFixed(decimals);
        } catch {
            return '0.' + '0'.repeat(decimals);
        }
    },
    
    /**
     * Format timestamp to locale string
     * @param {number} timestamp - Unix timestamp
     */
    formatTime: (timestamp) => {
        try {
            return new Date(timestamp * 1000).toLocaleString();
        } catch {
            return 'Invalid Date';
        }
    },
    
    /**
     * Generate unique ID
     */
    generateId: () => '_' + Math.random().toString(36).substr(2, 9),

    /**
     * Show toast message to user
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, error, warning, info)
     */
    showMessage: (message, type = 'info') => {
        // Remove any existing messages first
        Helpers.clearMessages();

        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type} fade-in`;
        
        // Add icon based on message type
        const icon = Helpers.getMessageIcon(type);
        messageElement.innerHTML = `
            <span class="message-icon">${icon}</span>
            <span class="message-text">${message}</span>
        `;
        
        document.body.appendChild(messageElement);
        
        // Add click to dismiss
        messageElement.addEventListener('click', () => {
            messageElement.classList.add('fade-out');
            setTimeout(() => messageElement.remove(), 300);
        });
        
        // Auto dismiss after delay
        setTimeout(() => {
            if (document.body.contains(messageElement)) {
                messageElement.classList.add('fade-out');
                setTimeout(() => messageElement.remove(), 300);
            }
        }, 3000);
    },

    /**
     * Clear all existing messages
     */
    clearMessages: () => {
        document.querySelectorAll('.message').forEach(msg => {
            msg.classList.add('fade-out');
            setTimeout(() => msg.remove(), 300);
        });
    },

    /**
     * Get icon for message type
     * @param {string} type - Message type
     */
    getMessageIcon: (type) => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    },

    /**
     * Format wallet address
     * @param {string} address - Wallet address
     * @param {number} start - Number of characters to show at start
     * @param {number} end - Number of characters to show at end
     */
    formatAddress: (address, start = 6, end = 4) => {
        if (!address) return '';
        if (address.length <= start + end) return address;
        return `${address.slice(0, start)}...${address.slice(-end)}`;
    },

    /**
     * Format currency value
     * @param {number|string} value - Value to format
     * @param {number} decimals - Number of decimals
     * @param {string} symbol - Currency symbol
     */
    formatCurrency: (value, decimals = 4, symbol = 'ETH') => {
        try {
            const number = parseFloat(value);
            if (isNaN(number)) return `0 ${symbol}`;
            return `${number.toFixed(decimals)} ${symbol}`;
        } catch {
            return `0 ${symbol}`;
        }
    },

    /**
     * Validate Ethereum address
     * @param {string} address - Address to validate
     */
    isValidAddress: (address) => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            Helpers.showMessage('Copied to clipboard!', 'success');
        } catch (err) {
            Helpers.showMessage('Failed to copy to clipboard', 'error');
        }
    },

    /**
     * Add hover effect to element
     * @param {HTMLElement} element - Element to add effect to
     * @param {string} className - Class to add on hover
     */
    addHoverEffect: (element, className = 'hover') => {
        if (!element) return;
        element.addEventListener('mouseenter', () => element.classList.add(className));
        element.addEventListener('mouseleave', () => element.classList.remove(className));
    },

    /**
     * Add click ripple effect
     * @param {HTMLElement} element - Element to add effect to
     */
    addRippleEffect: (element) => {
        if (!element) return;
        element.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            element.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    },

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     */
    isInViewport: (element) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Add loader to element
     * @param {HTMLElement} element - Element to add loader to
     */
    addLoader: (element) => {
        if (!element) return;
        const loader = document.createElement('div');
        loader.className = 'loader';
        element.appendChild(loader);
        return () => loader.remove();
    }
};

// Make helpers available globally
window.Helpers = Helpers;

// Add default styles for helpers
const style = document.createElement('style');
style.textContent = `
    .message {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    
    .message-success { border-left: 4px solid #4CAF50; }
    .message-error { border-left: 4px solid #f44336; }
    .message-warning { border-left: 4px solid #ff9800; }
    .message-info { border-left: 4px solid #2196F3; }

    .message-icon {
        font-size: 16px;
        line-height: 1;
    }

    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }

    .loader {
        width: 20px;
        height: 20px;
        border: 2px solid #0f6;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes ripple {
        to { transform: scale(4); opacity: 0; }
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);