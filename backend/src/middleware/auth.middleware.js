const jwt = require('jsonwebtoken');
const Teacher = require('../models/teacher.model');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'Not authorized. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teacher = await Teacher.findById(decoded.id);

    if (!teacher) {
      return res
        .status(401)
        .json({ success: false, message: 'Teacher not found.' });
    }

    req.teacher = { id: teacher._id, name: teacher.name, email: teacher.email };
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = { protect };
