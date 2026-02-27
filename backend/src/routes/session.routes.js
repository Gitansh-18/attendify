const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  startSession,
  getSessionQR,
  endSession,
} = require('../controllers/session.controller');
const {
  getSessionAttendance,
  exportAttendanceExcel,
} = require('../controllers/attendance.controller');

router.use(protect);

router.post('/start', startSession);
router.get('/:id/qr', getSessionQR);
router.put('/:id/end', endSession);
router.get('/:id/attendance', getSessionAttendance);
router.get('/:id/attendance/export', exportAttendanceExcel);

module.exports = router;
