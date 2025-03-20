import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import artRoutes from "./routes/artRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Default route for testing
app.get("/", (req, res) => {
  res.send("Art Marketplace API is running!");
});

// Routes
app.use("/api/art", artRoutes);
app.use("/api/auth", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
