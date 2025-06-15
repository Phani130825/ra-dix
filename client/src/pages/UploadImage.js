import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const UploadImage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState('pending');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Uploading image...');
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${API_URL}/images/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      console.log('Upload response:', response.data);
      const { reportId, imageUrl } = response.data;
      console.log('Setting reportId:', reportId);
      console.log('Setting imageUrl:', imageUrl);
      setReportId(reportId);
      setImageUrl(imageUrl);
      setStage(2);
      pollAnalysisStatus(reportId);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) {
      console.log('No URL provided to getImageUrl');
      return '';
    }
    if (url.startsWith('data:')) {
      console.log('Using data URL:', url.substring(0, 50) + '...');
      return url;
    }
    if (url.startsWith(API_URL)) {
      console.log('URL already includes API_URL:', url);
      return url;
    }
    if (url.startsWith('/uploads')) {
      const fullUrl = `${API_URL}${url}`;
      console.log('Constructed full URL:', fullUrl);
      return fullUrl;
    }
    const fullUrl = `${API_URL}/uploads/${url}`;
    console.log('Constructed full URL with leading slash:', fullUrl);
    return fullUrl;
  };

  const checkImageExists = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Image fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          url: url
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Image fetch error:', {
        error: error.message,
        url: url
      });
      return false;
    }
  };

  const pollAnalysisStatus = async (reportId) => {
    try {
      console.log('Polling status for report:', reportId);
      const response = await axios.get(`${API_URL}/images/status/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Status response:', response.data);
      const { status, class: className, confidence, tags, reportText, image } = response.data;
      
      if (status === 'completed') {
        console.log('Analysis completed, setting prediction');
        setPrediction({
          class: className,
          confidence,
          tags,
          reportText
        });
        if (image) {
          console.log('Setting image from status response:', image);
          setImageUrl(image);
        }
      } else if (status === 'error') {
        setError('Analysis failed. Please try again.');
      } else if (status === 'pending') {
        setTimeout(() => pollAnalysisStatus(reportId), 2000);
      }
    } catch (error) {
      console.error('Status check error:', error);
      setError('Failed to check analysis status');
    }
  };

  const handleGenerateReport = async () => {
    if (!reportId || !prediction) {
      setError('No report data available');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Saving report:', reportId);
      console.log('Current imageUrl:', imageUrl);
      
      const report = {
        id: reportId,
        reportId: reportId,
        image: imageUrl,
        class: prediction.class,
        confidence: prediction.confidence,
        tags: prediction.tags || [],
        reportText: prediction.reportText,
        createdAt: new Date().toISOString()
      };

      console.log('Saving report object:', report);

      const reports = JSON.parse(localStorage.getItem('reports') || '[]');
      reports.push(report);
      localStorage.setItem('reports', JSON.stringify(reports));

      console.log('Report saved successfully:', report);
      setStage(3);
    } catch (error) {
      console.error('Error saving report:', error);
      setError('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Upload Image', 'View Prediction', 'Generate Report'];

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {user?.userType === 'Doctor' ? `Welcome, Dr. ${user.name}!` : `Welcome, ${user?.name}!`}
        </Typography>

        <Stepper activeStep={stage - 1} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {imageUrl && (
          <Card sx={{ mb: 3 }}>
            <CardMedia
              component="img"
              image={getImageUrl(imageUrl)}
              alt="X-ray"
              sx={{ height: 300, objectFit: 'contain' }}
              onError={(e) => {
                console.error('Image load error:', {
                  error: e,
                  originalImage: imageUrl,
                  constructedUrl: getImageUrl(imageUrl)
                });
                checkImageExists(getImageUrl(imageUrl)).then(exists => {
                  console.log('Image exists check result:', {
                    exists,
                    url: getImageUrl(imageUrl)
                  });
                });
              }}
            />
          </Card>
        )}

        {stage === 1 && (
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              mb: 3
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <Button variant="contained" component="span" disabled={loading}>
                Select Image
              </Button>
            </label>
            <Typography variant="body1" sx={{ mt: 2 }}>
              or drag and drop an image here
            </Typography>
          </Box>
        )}

        {stage === 1 && (
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={!file || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Upload and Analyze'}
          </Button>
        )}

        {stage === 2 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Analysis Results
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : prediction ? (
              <Box sx={{ mt: 2 }}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="body1" paragraph>
                    {prediction.reportText}
                  </Typography>

                  {user?.userType === 'doctor' && prediction.tags && prediction.tags.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        Identified Conditions
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {prediction.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            color="primary"
                            variant="outlined"
                            sx={{ m: 0.5 }}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Paper>

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateReport}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Saving Report...
                    </>
                  ) : (
                    'Save Report'
                  )}
                </Button>
              </Box>
            ) : null}
          </Box>
        )}

        {stage === 3 && (
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Report Saved Successfully!
            </Typography>
            <Card sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
              <CardMedia
                component="img"
                image={getImageUrl(imageUrl)}
                alt="X-ray"
                sx={{ height: 300, objectFit: 'contain' }}
                onError={(e) => {
                  console.error('Image load error in stage 3:', {
                    error: e,
                    originalImage: imageUrl,
                    constructedUrl: getImageUrl(imageUrl)
                  });
                  checkImageExists(getImageUrl(imageUrl)).then(exists => {
                    console.log('Image exists check result in stage 3:', {
                      exists,
                      url: getImageUrl(imageUrl)
                    });
                  });
                }}
              />
            </Card>
            <Button
              variant="contained"
              onClick={() => navigate('/reports')}
              sx={{ mt: 2 }}
            >
              View Reports
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UploadImage; 