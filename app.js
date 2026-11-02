
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Movie = require("./models/Movie");

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// Serve frontend files from the frontend folder
app.use(express.static(path.join(__dirname, "frontend")));

// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ==========================================
// CREATE - ADD A NEW MOVIE
// ==========================================

app.post("/movies", async (req, res) => {
  try {
    const movie = await Movie.create(req.body);

    res.status(201).json({
      message: "Movie added successfully",
      movie
    });

  } catch (err) {
    res.status(400).json({
      message: "Unable to add movie",
      error: err.message
    });
  }
});

// ==========================================
// READ - GET ALL MOVIES
// ==========================================

app.get("/movies", async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: movies.length,
      movies
    });

  } catch (err) {
    res.status(500).json({
      message: "Unable to fetch movies",
      error: err.message
    });
  }
});

// ==========================================
// READ - GET A SINGLE MOVIE BY ID
// ==========================================

app.get("/movies/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid movie ID"
      });
    }

    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    res.status(200).json(movie);

  } catch (err) {
    res.status(500).json({
      message: "Unable to fetch movie",
      error: err.message
    });
  }
});

// ==========================================
// UPDATE - UPDATE MOVIE DETAILS
// ==========================================

app.put("/movies/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid movie ID"
      });
    }

    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    res.status(200).json({
      message: "Movie updated successfully",
      movie
    });

  } catch (err) {
    res.status(400).json({
      message: "Unable to update movie",
      error: err.message
    });
  }
});

// ==========================================
// DELETE - DELETE A MOVIE
// ==========================================

app.delete("/movies/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid movie ID"
      });
    }

    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({
        message: "Movie not found"
      });
    }

    res.status(200).json({
      message: "Movie deleted successfully",
      movie
    });

  } catch (err) {
    res.status(500).json({
      message: "Unable to delete movie",
      error: err.message
    });
  }
});

// ==========================================
// SERVER AND DATABASE CONNECTION
// ==========================================

const PORT = process.env.PORT || 3000;

async function startServer() {

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing from .env file");
    process.exit(1);
  }

  try {

    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Atlas connected successfully");

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend: http://localhost:${PORT}`);
      console.log(`API: http://localhost:${PORT}/movies`);
    });

  } catch (err) {

    console.error("MongoDB connection failed:", err.message);
    process.exit(1);

  }
}

startServer();
