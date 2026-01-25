import connectDB from './db/index.js';
import { app } from './app.js'
import intelligenceRouter from './routes/intelligenceRoutes.js'
import dotenv from "dotenv"
dotenv.config({
    path: './.env'
})

import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

// Redis Subscriber Setup
const redisSubscriber = createClient({ url: 'redis://redis:6379' });
redisSubscriber.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
    try {
        await redisSubscriber.connect();
        await redisSubscriber.subscribe('market_updates', (message) => {
            // Broadcast to all connected clients
            console.log("DEBUG: Received market_updates from Redis");
            io.emit('live_ticker_update', JSON.parse(message));
        });
        console.log("Redis Subscriber connected and listening.");
    } catch (e) {
        console.log("Failed to connect to Redis:", e);
    }
})();

io.on('connection', (socket) => {
    console.log('User connected to Live Stream:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

connectDB()
    .then(() => {
        server.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️  Server is running at port : ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO db connection failed !!! ", err);
    })

app.use("/api/intelligence", intelligenceRouter);

