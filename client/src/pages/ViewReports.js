import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardActions
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import { Chip } from '@mui/material';

const ViewReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    try {
      const savedReports = JSON.parse(localStorage.getItem('reports') || '[]');
      console.log('Fetched reports:', savedReports);
      setReports(savedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (reportId) => {
    try {
      const updatedReports = reports.filter(report => report.reportId !== reportId);
      localStorage.setItem('reports', JSON.stringify(updatedReports));
      setReports(updatedReports);
    } catch (error) {
      console.error('Error deleting report:', error);
      setError('Failed to delete report');
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedReport(null);
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
    // If the URL already includes the API_URL, return it as is
    if (url.startsWith(API_URL)) {
      console.log('URL already includes API_URL:', url);
      return url;
    }
    // If the URL starts with /uploads, add API_URL
    if (url.startsWith('/uploads')) {
      const fullUrl = `${API_URL}${url}`;
      console.log('Constructed full URL:', fullUrl);
      return fullUrl;
    }
    // If the URL is a relative path without leading slash, add API_URL and leading slash
    const fullUrl = `${API_URL}/uploads/${url}`;
    console.log('Constructed full URL with leading slash:', fullUrl);
    return fullUrl;
  };

  // Add a function to check if the image exists
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

  const handleDownloadPDF = async (report) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('X-ray Analysis Report', 20, 20);
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, 20, 30);
      
      // Add analysis results
      doc.setFontSize(14);
      doc.text('Analysis Results:', 20, 40);
      doc.setFontSize(12);
      doc.text(`Class: ${report.class}`, 20, 50);
      doc.text(`Confidence: ${(report.confidence * 100).toFixed(2)}%`, 20, 60);
      
      // Add tags if available
      if (report.tags && report.tags.length > 0) {
        doc.text('Identified Conditions:', 20, 70);
        report.tags.forEach((tag, index) => {
          doc.text(`• ${tag}`, 30, 80 + (index * 10));
        });
      }
      
      // Add report text
      if (report.reportText) {
        const splitText = doc.splitTextToSize(report.reportText, 170);
        doc.text(splitText, 20, 100);
      }

      // Add image
      if (report.image) {
        try {
          const imageUrl = getImageUrl(report.image);
          console.log('Loading image for PDF:', imageUrl);
          
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onload = function() {
            const imgData = reader.result;
            doc.addImage(imgData, 'JPEG', 20, 150, 170, 100);
            doc.save(`xray-report-${report.reportId}.pdf`);
          };
          
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error('Error loading image for PDF:', error);
          doc.text('Image could not be loaded', 20, 150);
          doc.save(`xray-report-${report.reportId}.pdf`);
        }
      } else {
        doc.save(`xray-report-${report.reportId}.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {user?.userType === 'Doctor' ? `Welcome, Dr. ${user.name}!` : `Welcome, ${user?.name}!`}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {reports.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ mt: 4 }}>
            No reports found. Upload an X-ray image to generate your first report.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {reports.map((report) => {
              const imageUrl = getImageUrl(report.image);
              console.log('Rendering report card with image:', {
                reportId: report.reportId,
                originalImage: report.image,
                constructedUrl: imageUrl
              });
              
              return (
                <Grid item xs={12} sm={6} md={4} key={report.reportId}>
                  <Card>
                    <CardMedia
                      component="img"
                      image={imageUrl}
                      alt="X-ray"
                      sx={{ height: 200, objectFit: 'contain' }}
                      onError={(e) => {
                        console.error('Image load error in report card:', {
                          error: e,
                          reportId: report.reportId,
                          originalImage: report.image,
                          constructedUrl: imageUrl
                        });
                        // Check if the image exists
                        checkImageExists(imageUrl).then(exists => {
                          console.log('Image exists check result:', {
                            exists,
                            url: imageUrl
                          });
                        });
                      }}
                    />
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Report #{report.reportId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Date: {new Date(report.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Class: {report.class}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Confidence: {(report.confidence * 100).toFixed(2)}%
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleViewReport(report)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleDownloadPDF(report)}
                        >
                          Download PDF
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDelete(report.reportId)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedReport && (
          <>
            <DialogTitle>Report Details</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <CardMedia
                  component="img"
                  image={getImageUrl(selectedReport.image)}
                  alt="X-ray"
                  sx={{ height: 300, objectFit: 'contain', mb: 2 }}
                  onError={(e) => {
                    console.error('Image load error in dialog:', {
                      error: e,
                      reportId: selectedReport.reportId,
                      originalImage: selectedReport.image,
                      constructedUrl: getImageUrl(selectedReport.image)
                    });
                    // Check if the image exists
                    checkImageExists(getImageUrl(selectedReport.image)).then(exists => {
                      console.log('Image exists check result in dialog:', {
                        exists,
                        url: getImageUrl(selectedReport.image)
                      });
                    });
                  }}
                />
                <Typography variant="h6" gutterBottom>
                  Analysis Results
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedReport.reportText}
                </Typography>
                {selectedReport.tags && selectedReport.tags.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Identified Conditions
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedReport.tags.map((tag, index) => (
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
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button
                variant="contained"
                onClick={() => handleDownloadPDF(selectedReport)}
              >
                Download PDF
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default ViewReports; 