require("dotenv").config();
const express = require("express"),
  cors = require("cors"),
  connectDB = require("./config/db");
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", app: "StaffSync API" }),
);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/apiRoutes"));
app.use((req, res) =>
  res.status(404).json({ message: `Not Found - ${req.originalUrl}` }),
);
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "ValidationError")
    return res.status(400).json({ message: err.message });
  if (err.code === 11000)
    return res
      .status(409)
      .json({ message: "A record with that value already exists" });
  res
    .status(500)
    .json({
      message:
        process.env.NODE_ENV === "production" ? "Server error" : err.message,
    });
});
const port = process.env.PORT || 5500;
connectDB()
  .then(() =>
    app.listen(port, () => console.log(`StaffSync API listening on ${port}`)),
  )
  .catch((e) => {
    console.error("Database connection failed:", e.message);
    process.exit(1);
  });
