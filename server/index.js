import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({
    origin: "*"
  }));
app.use(express.json());


console.log('aa',process.env.ANTHROPIC_API_KEY,)
console.log("API KEY LOADED:", process.env.ANTHROPIC_API_KEY?.slice(0, 15));

app.use((req, res, next) => {
    console.log("Incoming request:", req.method, req.url);
    next();
  });
  
app.post("/api/analyze", async (req, res) => {
    console.log("Request reached backend");
  
    try {
      console.log("Calling Anthropic API");
  
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(req.body),
      });
  
      console.log("Anthropic response received");
  
      const data = await response.json();
      res.json(data);
  
    } catch (err) {
      console.log("Error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app.listen(3001, "0.0.0.0", () => {
    console.log("Server running on port 3001");
  });