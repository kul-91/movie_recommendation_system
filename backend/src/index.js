import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import { connectDB } from "./lib/db.js";
import { protectRoute } from "./middleware/auth.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// Auth Routes
app.use("/api/auth", authRoutes);

// Recommendation Route
app.get('/api/recommendations', protectRoute, async (req, res) => {
    const movieTitle = req.query.movie_title;

    try {
        // Forward the request to Python FastAPI server
        const response = await axios.get(`http://127.0.0.1:8000/api/recommend`, {
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

// Start Server
app.listen(PORT, () => {
    console.log(`Node server is running on port ${PORT}`);
    connectDB();
});
