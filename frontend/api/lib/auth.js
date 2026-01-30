const jwt = require('jsonwebtoken');

// Verify JWT token from Authorization header
function verifyToken(req) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// CORS headers for API responses
function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

// JSON response helper
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders()
        }
    });
}

// Error response helper
function errorResponse(message, status = 400) {
    return jsonResponse({ error: true, message }, status);
}

// Handle CORS preflight
function handleOptions() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders()
    });
}

module.exports = {
    verifyToken,
    generateToken,
    corsHeaders,
    jsonResponse,
    errorResponse,
    handleOptions
};
