import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
  Grid, Tab, Tabs, InputAdornment, IconButton, Paper
} from '@mui/material';
import { Visibility, VisibilityOff, Map, Lock, Email, DirectionsCar } from '@mui/icons-material';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0); // 0 = Staff, 1 = Customer Guest
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [guestTripId, setGuestTripId] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setErrorMessage('');
  };

  const onLoginSubmit = async (data) => {
    setErrorMessage('');
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate('/');
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleGuestTracking = () => {
    if (!guestTripId.trim()) {
      setErrorMessage('Please enter a valid Trip ID');
      return;
    }
    navigate(`/tracking?tripId=${guestTripId.trim()}`);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 500, borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <Box sx={{ bg: '#fff', textAlign: 'center', pt: 4, pb: 2 }}>
          <Typography variant="h4" fontWeight="bold" color="var(--primary-color)">
            MANIVTHA
          </Typography>
          <Typography variant="subtitle2" color="textSecondary" sx={{ letterSpacing: 2, mt: 0.5 }}>
            TOURS & TRAVELS
          </Typography>
        </Box>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 'bold' }
          }}
        >
          <Tab label="Staff Login" icon={<Lock sx={{ fontSize: 18 }} />} iconPosition="start" />
          <Tab label="Track Guest Trip" icon={<Map sx={{ fontSize: 18 }} />} iconPosition="start" />
        </Tabs>

        <CardContent sx={{ p: 4 }}>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {errorMessage}
            </Alert>
          )}

          {tabValue === 0 ? (
            /* Staff Login Form */
            <form onSubmit={handleSubmit(onLoginSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'var(--text-light)' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'var(--text-light)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    py: 1.5,
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-color)',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'var(--primary-dark)',
                    },
                  }}
                >
                  {isSubmitting ? 'Logging in...' : 'Sign In'}
                </Button>

                <Paper variant="outlined" sx={{ p: 2, bg: '#f8fafc', borderRadius: '8px', borderStyle: 'dashed' }}>
                  <Typography variant="caption" color="textSecondary" fontWeight="500" display="block">
                    DEMO CREDENTIALS:
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block">
                    • <strong>Admin:</strong> admin@manivtha.com / admin123
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block">
                    • <strong>Driver:</strong> driver1@manivtha.com / driver123
                  </Typography>
                </Paper>
              </Box>
            </form>
          ) : (
            /* Guest Trip Tracking Form */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="body2" color="textSecondary" align="center">
                Passengers can track their active taxi/ride in real-time. Enter the Trip ID provided in your booking confirmation text.
              </Typography>

              <TextField
                fullWidth
                label="Enter Trip ID"
                placeholder="e.g. TRIP-BLR-EC-001"
                value={guestTripId}
                onChange={(e) => setGuestTripId(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DirectionsCar sx={{ color: 'var(--text-light)' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleGuestTracking}
                sx={{
                  py: 1.5,
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-light)',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'var(--primary-color)',
                  },
                }}
              >
                Track Live Location
              </Button>
              
              <Paper variant="outlined" sx={{ p: 2, bg: '#f8fafc', borderRadius: '8px', borderStyle: 'dashed' }}>
                <Typography variant="caption" color="textSecondary" fontWeight="500" display="block">
                  DEMO TRIP IDs:
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  • TRIP-BLR-EC-001 (Active - Bangalore Airport to E-City)
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  • TRIP-WF-BG-003 (Active & Delayed - Whitefield to Bannerghatta)
                </Typography>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
