import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
import { protectRoute } from "./middleware/auth.middleware.js";

import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:5173",
    credentials: true
}));


const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

app.get("/api/health", async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/api/health`);
        res.json(response.data);
    } catch (error) {
        res.status(503).json({ status: "loading" });
    }
});

// Auth Routes
app.use("/api/auth", authRoutes);

app.get('/api/movies', protectRoute, async (req, res) => {
    try {
        const response = await axios.get(`${PYTHON_API_URL}/api/movies`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching movies list:", error.message);
        res.status(500).json({ message: "Failed to fetch movies" });
    }
});

// Recommendation Route
app.get('/api/recommendations', protectRoute, async (req, res) => {
    const movieTitle = req.query.movie_title;

    try {
        // Forward the request to Python FastAPI server
        const response = await axios.get(`${PYTHON_API_URL}/api/recommend`, {
            params: { movie_title: movieTitle }
        });

        // Send the recommendation data back to React
        res.json(response.data);
    } catch (error) {
        console.error("Error connecting to Python service:", error.message);
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ message: "Movie not found" });
        }
        res.status(500).json({ message: "Failed to get recommendations" });
    }
});


if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.use((req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    });
}

app.listen(PORT, () => {
    console.log(`Node server is running on port ${PORT}`);
    connectDB();
});
