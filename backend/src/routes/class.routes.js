const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createClass,
  getClasses,
  deleteClass,
} = require('../controllers/class.controller');

router.use(protect); // All class routes require auth

router.post('/', createClass);
router.get('/', getClasses);
router.delete('/:id', deleteClass);

module.exports = router;
