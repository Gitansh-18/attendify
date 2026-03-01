require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./utils/db');

const authRoutes = require('./routes/auth.routes');
const classRoutes = require('./routes/class.routes');
const sessionRoutes = require('./routes/session.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const { protect } = require('./middleware/auth.middleware');

const app = express();

/* ================= CORS ================= */

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://attendifyqrfrontend.vercel.app",
    "https://attendx-fc2jat25f-maskigitansh633-8327s-projects.vercel.app"
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ================= BODY PARSER ================= */

app.use(express.json());

/* ================= DATABASE ================= */

connectDB();

/* ================= ROUTES ================= */

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/api/test', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Protected route works!',
    teacher: req.teacher,
  });
});

/* ================= ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));