const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get all reports for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching reports for user:', req.user._id);
    const reports = await Report.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');

    console.log(`Found ${reports.length} reports`);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      message: 'Error fetching reports',
      error: error.message 
    });
  }
});

// Get a specific report
router.get('/:reportId', auth, async (req, res) => {
  try {
    console.log('Fetching report:', req.params.reportId);
    const report = await Report.findOne({
      reportId: req.params.reportId,
      user: req.user._id
    }).select('-__v');

    if (!report) {
      console.log('Report not found');
      return res.status(404).json({ message: 'Report not found' });
    }

    console.log('Report found:', report.reportId);
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ 
      message: 'Error fetching report',
      error: error.message 
    });
  }
});

// Export report
router.post('/:reportId/export', auth, async (req, res) => {
  try {
    console.log('Exporting report:', req.params.reportId);
    console.log('User ID:', req.user._id);
    console.log('Request method:', req.method);
    console.log('Request path:', req.path);
    console.log('Request headers:', req.headers);

    const report = await Report.findOne({
      reportId: req.params.reportId,
      user: req.user._id
    });

    if (!report) {
      console.log('Report not found');
      return res.status(404).json({ 
        message: 'Report not found',
        details: 'The requested report could not be found. Please check the report ID and try again.'
      });
    }

    console.log('Found report:', report.reportId);

    // For now, just return the report data
    // TODO: Implement actual PDF generation
    const response = {
      message: 'Report export successful',
      report: {
        id: report._id,
        reportId: report.reportId,
        image: report.image,
        class: report.class,
        confidence: report.confidence,
        tags: report.tags,
        reportText: report.reportText,
        createdAt: report.createdAt
      }
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      message: 'Error exporting report',
      error: error.message,
      details: 'An unexpected error occurred while exporting the report. Please try again later.'
    });
  }
});

// Delete a report
router.delete('/:reportId', auth, async (req, res) => {
  try {
    console.log('Deleting report:', req.params.reportId);
    const report = await Report.findOne({
      reportId: req.params.reportId,
      user: req.user._id
    });

    if (!report) {
      console.log('Report not found');
      return res.status(404).json({ message: 'Report not found' });
    }

    // Delete the image file if it exists
    if (report.image) {
      try {
        const imagePath = path.join(__dirname, '..', '..', report.image);
        await fs.unlink(imagePath);
        console.log('Deleted image file:', imagePath);
      } catch (err) {
        console.error('Error deleting image file:', err);
      }
    }

    await report.deleteOne();
    console.log('Report deleted successfully');
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ 
      message: 'Error deleting report',
      error: error.message 
    });
  }
});

module.exports = router; 