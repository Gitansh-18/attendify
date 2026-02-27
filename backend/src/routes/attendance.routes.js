const express = require('express');
const router = express.Router();
const { markAttendance } = require('../controllers/attendance.controller');

// Public route – students don't need a JWT to mark attendance
router.post('/mark', markAttendance);

module.exports = router;
