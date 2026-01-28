const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// CORS Configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://crypto-secure-vault.vercel.app',
        'https://crypto-secure-vault-f5z9lfcm2-vixcy300s-projects.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

const io = new Server(server, {
    cors: corsOptions
});

// Security Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());


// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
});
app.use(limiter);

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/files', require('./src/routes/files'));
app.use('/api/zkp', require('./src/routes/zkp'));
app.use('/api/logs', require('./src/routes/logs'));


app.get('/', (req, res) => {
    res.send('CryptoSecure Vault API is Secure & Running (MongoDB)');
});

// WebSocket Connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on secure port ${PORT}`);
});

module.exports = { app, io };
