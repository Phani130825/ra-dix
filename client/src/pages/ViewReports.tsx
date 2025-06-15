import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { jsPDF } from 'jspdf';

interface Report {
  _id: string;
  image: string;
  prediction: {
    class: string;
    confidence: number;
    tags?: string[];
  };
  createdAt: string;
  userType: string;
}

const ViewReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/reports`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (report: Report) => {
    const doc = new jsPDF();

    // Add background color
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');

    // Add heading
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('RaDix', 105, 20, { align: 'center' });

    // Add contact email
    doc.setFontSize(12);
    doc.text('Contact: 108radix@gmail.com', 105, 30, { align: 'center' });

    // Add timestamp
    const timestamp = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.text(`Generated on: ${timestamp}`, 105, 40, { align: 'center' });

    // Add separator line
    doc.line(10, 50, 200, 50);

    // Add user details
    if (user) {
      doc.setFontSize(12);
      doc.text(`Name: ${user.name}`, 20, 60);
      doc.text(`User Type: ${user.userType}`, 20, 70);
      if (user.age) doc.text(`Age: ${user.age}`, 20, 80);
      if (user.weight) doc.text(`Weight: ${user.weight}`, 20, 90);
      if (user.height) doc.text(`Height: ${user.height}`, 20, 100);
    }

    // Add report details
    doc.text(`Report ID: ${report._id}`, 20, 120);
    doc.text(`Class: ${report.prediction.class}`, 20, 130);
    doc.text(`Confidence: ${report.prediction.confidence}%`, 20, 140);

    // Add tags if available
    if (report.prediction.tags && report.prediction.tags.length > 0) {
      doc.text('Tags:', 20, 150);
      report.prediction.tags.forEach((tag, index) => {
        doc.text(`${index + 1}. ${tag}`, 30, 160 + index * 10);
      });
    }

    // Add image
    if (report.image) {
      try {
        const image = await fetch(report.image).then((res) => res.blob());
        const imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(image);
        });

        doc.addImage(
          imageData as string,
          'JPEG',
          40,
          200,
          130,
          100
        );
      } catch (error) {
        console.error('Error adding image to PDF:', error);
      }
    }

    // Save PDF
    doc.save(`RaDix_Report_${report._id}.pdf`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Your Reports
        </Typography>

        {reports.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ mt: 4 }}>
            No reports found. Upload an image to generate your first report.
          </Typography>
        ) : (
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {reports.map((report) => (
              <Grid item xs={12} md={6} key={report._id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={report.image}
                    alt={`Report ${report._id}`}
                    sx={{ objectFit: 'contain' }}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Report ID: {report._id}
                    </Typography>
                    <Typography variant="body1">
                      Class: {report.prediction.class}
                    </Typography>
                    <Typography variant="body1">
                      Confidence: {report.prediction.confidence}%
                    </Typography>
                    {report.prediction.tags && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2">Tags:</Typography>
                        <ul>
                          {report.prediction.tags.map((tag, index) => (
                            <li key={index}>{tag}</li>
                          ))}
                        </ul>
                      </Box>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => downloadPDF(report)}
                      sx={{ mt: 2 }}
                    >
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default ViewReports; 