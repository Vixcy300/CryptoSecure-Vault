/**
 * Secure Logout Utility
 * Prevents back button access after logout
 */

export const secureLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Replace current history entry to prevent back button
    window.history.replaceState(null, '', '/login');

    // Redirect to login
    window.location.href = '/login';
};

export const clearSessionOnLoad = () => {
    // Check if we need to block back button access
    const token = localStorage.getItem('token');
    if (!token) {
        // User is not authenticated, prevent cached page access
        window.history.replaceState(null, '', window.location.href);
    }
};

export default secureLogout;
