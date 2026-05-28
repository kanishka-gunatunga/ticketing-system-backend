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

const app = BirdInit();

function BirdInit() {
    const app = express();
    // Middleware
    app.use(cors());
    app.use(express.json());
    return app;
}

// Vercel Serverless On-Demand DB Sync
// On actual Vercel deployments, process.env.VERCEL is '1' and process.env.NOW_REGION is set.
// Checking process.env.NOW_REGION ensures that we do not mistakenly trigger Vercel serverless mode 
// during local development if the user's terminal environment has VERCEL=true/1 set.
const isVercel = (process.env.VERCEL === '1' || process.env.VERCEL === 'true') && !!process.env.NOW_REGION;
let isDbSynced = false;

if (isVercel) {
    app.use(async (req, res, next) => {
        if (!isDbSynced) {
            try {
                await db.sequelize.sync({ alter: { drop: false } });
                isDbSynced = true;
                console.log("Database synced on-demand in Vercel serverless container.");
            } catch (error) {
                console.error("Failed to sync database on-demand:", error);
            }
        }
        next();
    });
}

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

        // Sync database (safe mode: assumes tables exist or creates them if missing)
        await db.sequelize.sync({ alter: { drop: false } });
        console.log("Database verified, synced, and connected.");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
    }
};

if (!isVercel) {
    startServer();
}

export default app;
