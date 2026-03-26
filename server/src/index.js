require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");

const authRoutes = require("./routes/auth");
const activityRoutes = require("./routes/activity");
const summaryRoutes = require("./routes/summaries");

const app = express();
const PORT = process.env.PORT || 3001;

// --------------- Middleware ---------------

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Disable caching for API responses
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

// --------------- Routes ---------------

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/summaries", summaryRoutes);

// --------------- Error handler ---------------

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// --------------- Start ---------------

app.listen(PORT, () => {
  console.log(`🚀 DevLog server running on http://localhost:${PORT}`);
});
