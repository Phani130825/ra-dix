const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  image: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: 'Pending Analysis'
  },
  confidence: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'error'],
    default: 'pending'
  },
  userType: {
    type: String,
    enum: ['user', 'doctor'],
    required: true
  },
  reportText: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate unique report ID
reportSchema.statics.generateReportId = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequential = String(Math.floor(Math.random() * 999)).padStart(3, '0');
  const reportId = `RPT${year}${month}${day}_${sequential}`;

  // Check if ID exists
  const existingReport = await this.findOne({ reportId });
  if (existingReport) {
    return this.generateReportId(); // Recursively try again
  }

  return reportId;
};

// Create indexes
reportSchema.index({ user: 1, reportId: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report; 