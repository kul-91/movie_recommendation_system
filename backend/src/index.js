import express from "express";
import axios from "axios";

const app = express();

app.get('/api/recommendations', async (req, res) => {
    const movieTitle = req.query.title;

    try {
        // Forward the request to the Python FastAPI server
        const response = await axios.get(`http://127.0.0.1:8000/api/recommend`, {
            params: { movie_title: movieTitle }
        });

        // Send the recommendation data back to React
        res.json(response.data);
    } catch (error) {
        console.error("Error connecting to Python service:", error.message);
        res.status(500).json({ error: "Failed to get recommendations" });
    }
});

app.listen(5000, () => console.log('Node.js server running on port 5000'));
