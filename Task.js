const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true // Format: YYYY-MM-DD
  },
  hour: {
    type: Number,
    required: true // 1–12
  },
  minute: {
    type: Number,
    required: true // 0–59
  },
  ampm: {
    type: String,
    enum: ['AM', 'PM'],
    required: true
  },
  repeat: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  }
});

module.exports = mongoose.model('Task', taskSchema);