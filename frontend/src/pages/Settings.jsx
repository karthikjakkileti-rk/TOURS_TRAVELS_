import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Paper, TextField, Button, Grid, Divider,
  Alert, Card, CardContent, Switch, FormControlLabel, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { Save, Lock, Tune, AccountCircle } from '@mui/icons-material';

const Settings = () => {
  const { user } = useAuth();
  
  // Profile fields
  const [name, setName] = useState(user?.name || 'Manivtha Admin');
  const [email, setEmail] = useState(user?.email || 'admin@manivtha.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // App configurations mock
  const [gpsInterval, setGpsInterval] = useState('10'); // 10 seconds
  const [baseRate, setBaseRate] = useState('15'); // 15 INR per km
  const [enableAlerts, setEnableAlerts] = useState(true);
  
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleProfileSave = (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });
    
    if (password && password !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    
    setStatusMsg({ type: 'success', text: 'Profile changes saved successfully!' });
    setPassword('');
    setConfirmPassword('');
  };

  const handleConfigSave = () => {
    setStatusMsg({ type: 'success', text: 'Telemetry settings updated successfully!' });
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold">Account & System Settings</Typography>
        <Typography variant="caption" color="textSecondary">Modify login credentials, notification toggles, and base simulation rates</Typography>
      </Box>

      {statusMsg.text && (
        <Alert severity={statusMsg.type} sx={{ mb: 4, borderRadius: '8px' }}>
          {statusMsg.text}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Profile Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center" gap={1} sx={{ mb: 3 }}>
              <AccountCircle color="primary" /> Profile Credentials
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <form onSubmit={handleProfileSave}>
              <Box display="flex" flexDirection="column" gap={3}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  disabled
                  helperText="User emails cannot be modified once registered"
                />

                <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>
                  Change Password
                </Typography>

                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  sx={{ bgcolor: 'var(--primary-color)', alignSelf: 'flex-start', textTransform: 'none', borderRadius: '8px', px: 3 }}
                >
                  Save Profile
                </Button>
              </Box>
            </form>
          </Paper>
        </Grid>

        {/* Configurations Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Typography variant="subtitle1" fontWeight="bold" display="flex" alignItems="center" gap={1} sx={{ mb: 3 }}>
              <Tune color="primary" /> System & GPS Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box display="flex" flexDirection="column" gap={3}>
              <FormControl fullWidth>
                <InputLabel>GPS Simulation Step Time (Seconds)</InputLabel>
                <Select
                  value={gpsInterval}
                  label="GPS Simulation Step Time (Seconds)"
                  onChange={(e) => setGpsInterval(e.target.value)}
                >
                  <MenuItem value="5">5 Seconds (Fast Testing)</MenuItem>
                  <MenuItem value="10">10 Seconds (Standard)</MenuItem>
                  <MenuItem value="30">30 Seconds (Live Mode)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Base Tariff Rate (INR per km)"
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={enableAlerts}
                    onChange={(e) => setEnableAlerts(e.target.checked)}
                    color="primary"
                  />
                }
                label="Enable automatic delay notifications & popups"
              />

              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleConfigSave}
                sx={{ bgcolor: 'var(--primary-color)', alignSelf: 'flex-start', textTransform: 'none', borderRadius: '8px', px: 3 }}
              >
                Save Settings
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
