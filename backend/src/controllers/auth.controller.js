const jwt = require('jsonwebtoken');
const Teacher = require('../models/teacher.model');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields are required.' });
    }

    const existing = await Teacher.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already registered.' });
    }

    const teacher = await Teacher.create({ name, email, password });
    const token = generateToken(teacher._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      teacher: { id: teacher._id, name: teacher.name, email: teacher.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
    }

    const teacher = await Teacher.findOne({ email }).select('+password');
    if (!teacher || !(await teacher.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(teacher._id);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      teacher: { id: teacher._id, name: teacher.name, email: teacher.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { signup, login };
