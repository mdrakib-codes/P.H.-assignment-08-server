require("dotenv").config();

const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");

const { getDB } = require("./config/db");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("StudioSpace API running");
});

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

async function startServer() {
  await getDB();

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`StudioSpace API listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start StudioSpace API:", error);
  process.exitCode = 1;
});