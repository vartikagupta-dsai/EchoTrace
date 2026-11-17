
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.send("EchoTrace AI Backend is Running! ✨");
});

// Test API route
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "EchoTrace backend connected successfully!"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`EchoTrace server running at http://localhost:${PORT}`);
});
