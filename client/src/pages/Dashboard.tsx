import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  CloudUpload,
  Assessment,
  History,
  MedicalServices,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      title: 'Upload New X-Ray',
      description: 'Upload and analyze a new chest X-ray image',
      icon: <CloudUpload sx={{ fontSize: 40 }} />,
      action: () => navigate('/upload'),
      color: '#1976d2',
    },
    {
      title: 'View Reports',
      description: 'Access your analysis reports and history',
      icon: <Assessment sx={{ fontSize: 40 }} />,
      action: () => navigate('/reports'),
      color: '#2e7d32',
    },
    {
      title: 'Recent Analysis',
      description: 'View your most recent X-ray analysis',
      icon: <History sx={{ fontSize: 40 }} />,
      action: () => navigate('/reports'),
      color: '#ed6c02',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.userType === 'Doctor' ? `Dr. ${user.name}` : user?.name}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Manage your chest X-ray analysis and reports from your dashboard.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 2,
                      color: feature.color,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom align="center">
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    variant="contained"
                    onClick={feature.action}
                    sx={{ bgcolor: feature.color }}
                  >
                    Get Started
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Tips
          </Typography>
          <Typography variant="body2" paragraph>
            • Ensure your X-ray images are clear and properly oriented
          </Typography>
          <Typography variant="body2" paragraph>
            • For best results, use high-quality images in JPEG or PNG format
          </Typography>
          <Typography variant="body2" paragraph>
            • Reports are automatically saved and can be accessed anytime
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard; 