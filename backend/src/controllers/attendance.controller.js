const xlsx = require('xlsx');
const Attendance = require('../models/attendance.model');
const Session = require('../models/session.model');
const { decrypt } = require('../utils/qrCrypto');

const QR_WINDOW_MS = 4 * 1000;

// POST /api/attendance/mark
const markAttendance = async (req, res) => {
  try {
    const { encryptedPayload, rollNo, name, department } = req.body;

    if (!encryptedPayload || !rollNo || !name || !department) {
      return res.status(400).json({
        success: false,
        message: 'encryptedPayload, rollNo, name, department are required.',
      });
    }

    // --- Decrypt & parse QR payload ---
    let payload;
    try {
      payload = JSON.parse(decrypt(encryptedPayload));
    } catch {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid QR code.' });
    }

    const { classId, sessionId, window: qrWindow, exp } = payload;

    // --- Check overall session expiry ---
    if (Date.now() > exp) {
      return res
        .status(410)
        .json({ success: false, message: 'QR Expired – Scan Again' });
    }

    // --- Find and validate session ---
    const session = await Session.findById(sessionId);
    if (!session || !session.isActive) {
      return res
        .status(410)
        .json({ success: false, message: 'QR Expired – Scan Again' });
    }

    const now = new Date();
    if (now > session.sessionEndTime) {
      session.isActive = false;
      await session.save();
      return res
        .status(410)
        .json({ success: false, message: 'QR Expired – Scan Again' });
    }

    // --- Validate 4-second QR window ---
    // --- Validate 4-second QR window ---
    const currentWindow = Math.floor(
      (now - session.sessionStartTime) / QR_WINDOW_MS
    );
    if (currentWindow !== qrWindow) {
      return res
      .status(410)
      .json({ success: false, message: 'QR Expired – Scan Again' });
    }

    // --- Duplicate check: one attendance per roll per session ---
    const existing = await Attendance.findOne({
      sessionId,
      rollNo: rollNo.trim(),
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this session.',
      });
    }

    // --- Save attendance ---
    const attendance = await Attendance.create({
      sessionId,
      classId,
      rollNo: rollNo.trim(),
      name: name.trim(),
      department: department.trim(),
      timestamp: now,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully!',
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sessions/:id/attendance  – Phase 5
const getSessionAttendance = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      teacherId: req.teacher.id,
    });

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: 'Session not found or unauthorized.' });
    }

    const records = await Attendance.find({ sessionId: req.params.id }).sort({
      timestamp: 1,
    });

    res.json({
      success: true,
      totalPresent: records.length,
      sessionActive: session.isActive,
      sessionEndTime: session.sessionEndTime,
      data: records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sessions/:id/attendance/export  – Phase 5 Excel export
const exportAttendanceExcel = async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      teacherId: req.teacher.id,
    }).populate('classId', 'name subject');

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: 'Session not found or unauthorized.' });
    }

    const records = await Attendance.find({ sessionId: req.params.id }).sort({
      rollNo: 1,
    });

    const worksheetData = [
      ['Roll No', 'Name', 'Department', 'Marked At'],
      ...records.map((r) => [
        r.rollNo,
        r.name,
        r.department,
        new Date(r.timestamp).toLocaleString(),
      ]),
    ];

    const ws = xlsx.utils.aoa_to_sheet(worksheetData);
    const wb = xlsx.utils.book_new();

    // Style header row (bold-ish via col widths)
    ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 25 }];

    const sheetName = `${session.classId?.name || 'Class'} Attendance`;
    xlsx.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendance_${req.params.id}.xlsx"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { markAttendance, getSessionAttendance, exportAttendanceExcel };
