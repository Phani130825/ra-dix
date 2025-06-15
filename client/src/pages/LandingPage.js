import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Paper,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          mt: 8,
          mb: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="text.primary"
          gutterBottom
        >
          Welcome to RaDix
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          Advanced Chest X-ray Analysis Platform
        </Typography>
        <Box sx={{ mt: 4 }}>
          {!user ? (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{ mr: 2 }}
            >
              Get Started
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/upload')}
              sx={{ mr: 2 }}
            >
              Upload X-ray
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Typography component="h2" variant="h5" gutterBottom>
              AI-Powered Analysis
            </Typography>
            <Typography>
              Our advanced AI algorithms provide accurate analysis of chest X-ray images,
              helping medical professionals make informed decisions.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Typography component="h2" variant="h5" gutterBottom>
              Detailed Reports
            </Typography>
            <Typography>
              Generate comprehensive reports with detailed findings and
              recommendations for each analyzed X-ray image.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Typography component="h2" variant="h5" gutterBottom>
              Secure & Private
            </Typography>
            <Typography>
              Your data is encrypted and secure. We maintain strict privacy
              standards to protect patient information.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LandingPage; 