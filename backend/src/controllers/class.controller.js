const Class = require('../models/class.model');

// POST /api/classes
const createClass = async (req, res) => {
  try {
    const { name, subject } = req.body;

    if (!name || !subject) {
      return res
        .status(400)
        .json({ success: false, message: 'Name and subject are required.' });
    }

    const newClass = await Class.create({
      name,
      subject,
      teacherId: req.teacher.id,
    });

    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/classes
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.teacher.id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/classes/:id
const deleteClass = async (req, res) => {
  try {
    const cls = await Class.findOne({
      _id: req.params.id,
      teacherId: req.teacher.id,
    });

    if (!cls) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or unauthorized.',
      });
    }

    await cls.deleteOne();
    res.json({ success: true, message: 'Class deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createClass, getClasses, deleteClass };
