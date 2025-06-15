import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  CloudUpload,
  Assessment,
  ExitToApp,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = isAuthenticated
    ? [
        {
          text: 'Dashboard',
          icon: <Dashboard />,
          path: '/dashboard',
        },
        {
          text: 'Upload Image',
          icon: <CloudUpload />,
          path: '/upload',
        },
        {
          text: 'View Reports',
          icon: <Assessment />,
          path: '/reports',
        },
      ]
    : [
        {
          text: 'Sign In',
          icon: <Person />,
          path: '/signin',
        },
        {
          text: 'Sign Up',
          icon: <Person />,
          path: '/signup',
        },
      ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const renderMenuItems = () => (
    <List>
      {menuItems.map((item) => (
        <ListItem key={item.text} disablePadding>
          <ListItemButton
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
      {isAuthenticated && (
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      )}
    </List>
  );

  return (
    <AppBar position="static">
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Chest X-Ray Analysis
        </Typography>

        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {menuItems.map((item) => (
              <Button
                key={item.text}
                color="inherit"
                startIcon={item.icon}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderBottom: location.pathname === item.path ? '2px solid white' : 'none',
                }}
              >
                {item.text}
              </Button>
            ))}
            {isAuthenticated && (
              <Button
                color="inherit"
                startIcon={<ExitToApp />}
                onClick={handleLogout}
                sx={{ mx: 1 }}
              >
                Logout
              </Button>
            )}
          </Box>
        )}
      </Toolbar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        >
          {renderMenuItems()}
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navigation; 