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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const UploadImage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [reportId, setReportId] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dialog, setDialog] = useState({ open: false, title: '', message: '' });

  const showDialog = (title: string, message: string) => {
    setDialog({ open: true, title, message });
  };

  const closeDialog = () => {
    setDialog({ open: false, title: '', message: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      showDialog('Warning', 'Please upload a file first.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/images/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.error) {
        showDialog('Error', response.data.error);
      } else {
        setPrediction({
          class: response.data.prediction.class,
          confidence: response.data.prediction.confidence,
          tags: response.data.tags,
        });
        setStage(2);
      }
    } catch (error) {
      console.error('Error:', error);
      showDialog('Error', 'An error occurred during file upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!user) {
      showDialog('Error', 'User not found. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/reports`,
        {
          image: imageUrl,
          prediction: prediction,
          userType: user.userType,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setReportId(response.data.reportId);
      setStage(3);
      showDialog('Success', 'Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      showDialog('Error', 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const preventDefault = (e: React.DragEvent) => e.preventDefault();

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          {user?.userType === 'Doctor' ? `Welcome, Dr. ${user.name}!` : `Welcome, ${user?.name}!`}
        </Typography>

        <Dialog open={dialog.open} onClose={closeDialog}>
          <DialogTitle>{dialog.title}</DialogTitle>
          <DialogContent>{dialog.message}</DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Close</Button>
          </DialogActions>
        </Dialog>

        <Stepper activeStep={stage - 1} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Upload Image</StepLabel>
          </Step>
          <Step>
            <StepLabel>Generate Report</StepLabel>
          </Step>
          <Step>
            <StepLabel>Export Report</StepLabel>
          </Step>
        </Stepper>

        {stage === 1 && (
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
            }}
            onDrop={handleDrop}
            onDragOver={preventDefault}
            onDragEnter={preventDefault}
          >
            <Typography variant="h6" gutterBottom>
              Drop Your Image Here
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              or
            </Typography>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button variant="contained" component="span">
                Choose File
              </Button>
            </label>

            {file && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Selected Image:</Typography>
                <img
                  src={URL.createObjectURL(file)}
                  alt="Selected"
                  style={{
                    maxWidth: '200px',
                    border: '1px solid #ddd',
                    marginTop: '10px',
                  }}
                />
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !file}
              sx={{ mt: 2 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Analyzing...
                </>
              ) : (
                'Submit / Analyze'
              )}
            </Button>
          </Box>
        )}

        {stage === 2 && prediction && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Prediction Results
            </Typography>
            {user?.userType === 'Doctor' ? (
              prediction.tags && Array.isArray(prediction.tags) ? (
                <Box>
                  <Typography variant="subtitle1">Tags:</Typography>
                  <ul>
                    {prediction.tags.map((tag: string, index: number) => (
                      <li key={index}>{tag}</li>
                    ))}
                  </ul>
                </Box>
              ) : (
                <Typography>No tags available.</Typography>
              )
            ) : (
              <Box>
                <Typography>
                  Class: {prediction.class || 'N/A'}
                </Typography>
                <Typography>
                  Confidence: {prediction.confidence || 'N/A'}
                </Typography>
                <Typography sx={{ mt: 2 }}>
                  You have been diagnosed with viral pneumonia. It is important to follow these guidelines for recovery:
                </Typography>
                <Typography component="div" sx={{ mt: 1 }}>
                  <strong>Rest and Hydration:</strong> Ensure adequate rest and drink plenty of fluids to stay hydrated. This helps your body fight the infection.
                </Typography>
                <Typography component="div" sx={{ mt: 1 }}>
                  <strong>Monitor symptoms</strong> Watch for worsening symptoms such as high fever, difficulty breathing, or chest pain. Seek immediate medical attention if these occur.
                </Typography>
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateReport}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Generating Report...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </Box>
        )}

        {stage === 3 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Export Report
            </Typography>
            <Typography>
              Report ID: <strong>{reportId}</strong>
            </Typography>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Uploaded"
                style={{
                  maxWidth: '200px',
                  border: '1px solid #ddd',
                  marginTop: '20px',
                  marginBottom: '25px',
                }}
              />
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/reports')}
              sx={{ mt: 2 }}
            >
              View All Reports
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UploadImage; 