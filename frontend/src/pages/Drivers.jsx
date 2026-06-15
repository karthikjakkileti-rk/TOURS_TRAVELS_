import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Chip
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [experience, setExperience] = useState(0);
  const [status, setStatus] = useState('available');

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/drivers');
      if (res.data.success) {
        setDrivers(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setName('');
    setEmail('');
    setMobileNumber('');
    setLicenseNumber('');
    setExperience(2);
    setStatus('available');
    setErrorMsg('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (drv) => {
    setEditingDriver(drv);
    setName(drv.name);
    setEmail(drv.email || '');
    setMobileNumber(drv.mobile_number);
    setLicenseNumber(drv.license_number);
    setExperience(drv.experience);
    setStatus(drv.status);
    setErrorMsg('');
    setOpenDialog(true);
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (!name.trim() || !email.trim() || !mobileNumber.trim() || !licenseNumber.trim()) {
      setErrorMsg('Please fill in all details');
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile_number: mobileNumber.trim(),
      license_number: licenseNumber.trim().toUpperCase(),
      experience: parseInt(experience),
      status
    };

    try {
      if (editingDriver) {
        // Update
        const res = await axios.put(`/api/drivers/${editingDriver.id}`, payload);
        if (res.data.success) setOpenDialog(false);
      } else {
        // Create (links automatically creates user account password 'driver123')
        const res = await axios.post('/api/drivers', payload);
        if (res.data.success) setOpenDialog(false);
      }
      loadDrivers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save driver profile');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Warning: Deleting this driver will also delete their login account. Proceed?')) {
      try {
        await axios.delete(`/api/drivers/${id}`);
        loadDrivers();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete driver.');
      }
    }
  };

  const getStatusChip = (stat) => {
    const configs = {
      available: { color: 'success', label: 'Available' },
      on_trip: { color: 'primary', label: 'On Trip' },
      inactive: { color: 'default', label: 'Inactive' }
    };
    const c = configs[stat] || { color: 'default', label: stat };
    return <Chip label={c.label} color={c.color} size="small" variant="outlined" />;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Driver Directory</Typography>
          <Typography variant="caption" color="textSecondary">Manage company drivers, credentials, and experience indexes</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadDrivers}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} sx={{ bgcolor: 'var(--primary-color)' }}>
            Add Driver
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'var(--secondary-color)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Login Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Mobile Number</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>License Code</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Experience</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {drivers.map((drv) => (
              <TableRow key={drv.id} hover>
                <TableCell sx={{ fontWeight: 'bold', color: 'var(--primary-dark)' }}>{drv.name}</TableCell>
                <TableCell>{drv.email || <span style={{ color: '#aaa', fontStyle: 'italic' }}>no email</span>}</TableCell>
                <TableCell>{drv.mobile_number}</TableCell>
                <TableCell>{drv.license_number}</TableCell>
                <TableCell>{drv.experience} Years</TableCell>
                <TableCell>{getStatusChip(drv.status)}</TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpenEdit(drv)}><Edit /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(drv.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {drivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="textSecondary">No drivers registered in the database.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">
          {editingDriver ? 'Modify Driver details' : 'Register New Driver'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            fullWidth
            label="Driver Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextField
            fullWidth
            label="Email Address (Used for Login)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!editingDriver}
            helperText={editingDriver ? '' : "Automatically generates user login credentials. Default password is 'driver123'."}
          />

          <TextField
            fullWidth
            label="Mobile Phone Number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
          />

          <TextField
            fullWidth
            label="Commercial License Code"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />

          <TextField
            fullWidth
            label="Years of Driving Experience"
            type="number"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel>Duty Status</InputLabel>
            <Select
              value={status}
              label="Duty Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="available">Available (Off duty / awaiting booking)</MenuItem>
              <MenuItem value="on_trip">On Trip (Active assignment)</MenuItem>
              <MenuItem value="inactive">Inactive (Suspended / Leave)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: 'var(--primary-color)' }}>
            Confirm Registration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Drivers;
