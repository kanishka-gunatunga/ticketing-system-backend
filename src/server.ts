import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './models';
import ticketRoutes from './routes/ticket.routes';
// import chatRoutes from './routes/chat.routes';
import authRoutes from './routes/auth.routes';
import ticketActivityRoutes from './routes/ticketActivity.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api', ticketActivityRoutes); // Mount at /api so paths become /api/tickets/:ticketId/followups
app.use('/api/tickets', ticketRoutes);
// app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('Ticketing System Platform API');
});

import mysql from 'mysql2/promise';

// Database & Server Start
const PORT = process.env.PORT || 4000;

const startServer = async () => {
    try {
        // Automatically create database if it doesn't exist
        const connection = await mysql.createConnection({
            host: process.env.HOST || 'localhost',
            user: process.env.DB_USERNAME || 'root',
            password: process.env.DB_PASSWORD || 'Kaveesha@123'
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DATABASE || 'ticketing-system'}\`;`);
        await connection.end();
        console.log("Database verified/created.");

        // Sync database (safe mode: assumes tables exist or creates them if missing)
        await db.sequelize.sync({ alter: { drop: false } });
        console.log("Database synced.");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

startServer();
