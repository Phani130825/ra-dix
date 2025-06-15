const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const FormData = require('form-data');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG and JPG are allowed.'));
      return;
    }
    cb(null, true);
  }
});

// Helper function to analyze image using Hugging Face API
async function analyzeImage(imagePath, reportId, userType) {
  try {
    console.log('Starting image analysis for report:', reportId);
    console.log('User type:', userType);

    const formData = new FormData();
    formData.append('images', fs.createReadStream(imagePath));

    // Set mode based on user type
    const mode = userType === 'doctor' ? 'doctor' : 'user';

    // Hugging Face API configuration
    const HF_TOKEN = "***REMOVED***";
    const API_URL = "https://saivathsal-radix.hf.space/analyse";

    console.log('Making API request to:', `${API_URL}?mode=${mode}`);

    const response = await axios.post(
      `${API_URL}?mode=${mode}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${HF_TOKEN}`
        },
        responseType: 'stream'
      }
    );

    let resultText = '';
    for await (const chunk of response.data) {
      resultText += chunk.toString();
    }

    console.log('Raw API response:', resultText);

    const result = JSON.parse(resultText);
    console.log('Parsed API response:', result);

    if (result.status === 'success') {
      const analysisResult = result.result;
      
      const updatedReport = await Report.findByIdAndUpdate(
        reportId,
        {
          status: 'completed',
          class: analysisResult.caption,
          confidence: 0.95,
          tags: userType === 'doctor' ? analysisResult.tags : [],
          reportText: generateReportText(analysisResult, userType)
        },
        { new: true }
      );

      console.log('Updated report:', updatedReport);
      return result;
    } else {
      throw new Error('Analysis failed: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    // Update report with error status
    await Report.findByIdAndUpdate(reportId, {
      status: 'error',
      class: 'Error analyzing image',
      confidence: 0,
      tags: ['Error analyzing image'],
      reportText: `An error occurred while analyzing the image: ${error.message}. Please try again.`
    });
    throw error;
  }
}

// Helper function to generate report text based on user type
function generateReportText(result, userType) {
  if (userType === 'doctor') {
    return `Detailed Chest X-Ray Analysis Report

Findings:
${result.caption}

Identified Conditions:
${result.tags ? result.tags.map(tag => `- ${tag}`).join('\n') : 'No specific conditions identified'}

Note: This is an AI-assisted analysis. Please review and verify all findings.`;
  } else {
    return `Chest X-Ray Analysis Report

Findings:
${result.caption}

Note: This is an AI-generated analysis and should be reviewed by a medical professional.`;
  }
}

// Upload and analyze image
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log('Processing upload for user:', req.user._id);
    console.log('Uploaded file:', {
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype
    });

    // Generate unique report ID
    const reportId = await Report.generateReportId();
    console.log('Generated report ID:', reportId);

    // Create image URL
    const imageUrl = `/uploads/${req.file.filename}`;
    console.log('Image URL:', imageUrl);

    // Create a new report
    const report = new Report({
      user: req.user._id,
      reportId,
      image: imageUrl,
      userType: req.user.userType,
      status: 'pending'
    });

    console.log('Created report:', report);
    await report.save();

    // Start analysis in background
    analyzeImage(req.file.path, report._id, req.user.userType)
      .catch(error => {
        console.error('Background analysis error:', error);
        // Update report status to error
        Report.findByIdAndUpdate(report._id, {
          status: 'error',
          class: 'Error',
          confidence: 0,
          tags: ['Error analyzing image']
        }).catch(updateError => {
          console.error('Error updating report status:', updateError);
        });
      });

    res.status(201).json({
      message: 'Image uploaded successfully',
      reportId: report.reportId,
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Upload error details:', {
      error: error.message,
      stack: error.stack,
      userId: req.user._id
    });
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Get analysis status
router.get('/status/:reportId', auth, async (req, res) => {
  try {
    console.log('Checking status for report:', req.params.reportId);
    console.log('User ID:', req.user._id);

    // First try to find by reportId
    let report = await Report.findOne({ reportId: req.params.reportId });

    // If not found, try to find by _id
    if (!report) {
      report = await Report.findById(req.params.reportId);
    }

    console.log('Found report:', report);

    if (!report) {
      console.log('Report not found');
      return res.status(404).json({ 
        message: 'Report not found',
        error: 'The requested report could not be found'
      });
    }

    // Verify user has access to this report
    if (report.user.toString() !== req.user._id.toString()) {
      console.log('User does not have access to this report');
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'You do not have permission to access this report'
      });
    }

    // Generate report text if not already present and status is completed
    if (!report.reportText && report.status === 'completed') {
      console.log('Generating report text');
      const result = {
        caption: report.class,
        tags: report.tags || []
      };
      report.reportText = generateReportText(result, report.userType);
      await report.save();
    }

    const response = {
      status: report.status,
      class: report.class,
      confidence: report.confidence,
      tags: report.tags || [],
      reportText: report.reportText,
      image: report.image
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Status check error details:', {
      error: error.message,
      stack: error.stack,
      reportId: req.params.reportId,
      userId: req.user._id
    });
    res.status(500).json({ 
      message: 'Error checking analysis status',
      error: error.message,
      details: 'An unexpected error occurred while checking the report status'
    });
  }
});

// Get image
router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../../uploads', req.params.filename);
  console.log('Serving image:', {
    filename: req.params.filename,
    filePath: filePath
  });
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('Image not found:', filePath);
    return res.status(404).json({ message: 'Image not found' });
  }
  
  res.sendFile(filePath);
});

module.exports = router; 