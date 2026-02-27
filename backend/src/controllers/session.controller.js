const QRCode = require('qrcode');
const Session = require('../models/session.model');
const Class = require('../models/class.model');
const { encrypt } = require('../utils/qrCrypto');

const SESSION_DURATION_MS = 40 * 1000; // 40 seconds
const QR_WINDOW_MS = 4 * 1000;         // 4 seconds per QR frame

// POST /api/sessions/start
const startSession = async (req, res) => {
  try {
    const { classId } = req.body;

    if (!classId) {
      return res
        .status(400)
        .json({ success: false, message: 'classId is required.' });
    }

    // Verify class belongs to teacher
    const cls = await Class.findOne({ _id: classId, teacherId: req.teacher.id });
    if (!cls) {
      return res
        .status(404)
        .json({ success: false, message: 'Class not found or unauthorized.' });
    }

    // Deactivate any existing active sessions for this class
    await Session.updateMany(
      { classId, teacherId: req.teacher.id, isActive: true },
      { isActive: false }
    );

    const now = new Date();
    const session = await Session.create({
      classId,
      teacherId: req.teacher.id,
      sessionStartTime: now,
      sessionEndTime: new Date(now.getTime() + SESSION_DURATION_MS),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Session started. QR will expire in 40 seconds.',
      data: {
        sessionId: session._id,
        classId: session.classId,
        sessionEndTime: session.sessionEndTime,
        qrRefreshInterval: QR_WINDOW_MS,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sessions/:id/qr  – returns fresh QR data image (call every 4s)
const getSessionQR = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: 'Session not found.' });
    }

    // Auth: only the teacher who owns the session
    if (session.teacherId.toString() !== req.teacher.id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const now = new Date();

    // Auto-expire check
    if (now > session.sessionEndTime || !session.isActive) {
      session.isActive = false;
      await session.save();
      return res
        .status(410)
        .json({ success: false, message: 'Session expired.' });
    }

    // Build QR payload: encrypt classId + sessionId + current 4-second window
    const windowIndex = Math.floor(
      (now - session.sessionStartTime) / QR_WINDOW_MS
    );

    const payload = JSON.stringify({
      classId: session.classId.toString(),
      sessionId: session._id.toString(),
      window: windowIndex,
      exp: session.sessionEndTime.getTime(),
    });

    const encrypted = encrypt(payload);

//  This must exist in Render env
    const frontendURL = process.env.FRONTEND_URL;

    const fullURL = `${frontendURL}/attend?payload=${encrypted}`;

    const qrDataUrl = await QRCode.toDataURL(fullURL, {
      errorCorrectionLevel: 'H',
      width: 300,
    });

    res.json({
      success: true,
      data: {
        qrImage: qrDataUrl,       // base64 PNG – render as <img src=...>
        encryptedPayload: encrypted,
        windowIndex,
        expiresAt: session.sessionEndTime,
        remainingMs: session.sessionEndTime - now,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/sessions/:id/end – teacher manually ends session
const endSession = async (req, res) => {
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

    session.isActive = false;
    session.sessionEndTime = new Date();
    await session.save();

    res.json({ success: true, message: 'Session ended successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { startSession, getSessionQR, endSession };
