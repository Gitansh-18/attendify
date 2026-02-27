const mongoose = require('mongoose');

const SESSION_DURATION_MS = 40 * 1000; // 40 seconds

const sessionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    sessionStartTime: {
      type: Date,
      default: Date.now,
    },
    sessionEndTime: {
      type: Date,
      default: () => new Date(Date.now() + SESSION_DURATION_MS),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual to check if session is expired
sessionSchema.virtual('isExpired').get(function () {
  return new Date() > this.sessionEndTime;
});

module.exports = mongoose.model('Session', sessionSchema);
