import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Chip
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form Fields
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('SUV');
  const [capacity, setCapacity] = useState(4);
  const [status, setStatus] = useState('available');
  const [assignedDriver, setAssignedDriver] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const resVeh = await axios.get('/api/vehicles');
      if (resVeh.data.success) setVehicles(resVeh.data.data);
      
      // Load drivers to populate assignment dropdown
      const resDrv = await axios.get('/api/drivers');
      if (resDrv.data.success) setDrivers(resDrv.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setVehicleNumber('');
    setVehicleType('SUV');
    setCapacity(7);
    setStatus('available');
    setAssignedDriver('');
    setErrorMsg('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (veh) => {
    setEditingVehicle(veh);
    setVehicleNumber(veh.vehicle_number);
    setVehicleType(veh.vehicle_type);
    setCapacity(veh.capacity);
    setStatus(veh.status);
    setAssignedDriver(veh.driver_id || '');
    setErrorMsg('');
    setOpenDialog(true);
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (!vehicleNumber.trim()) {
      setErrorMsg('Vehicle Number is required');
      return;
    }
    
    const payload = {
      vehicle_number: vehicleNumber.trim().toUpperCase(),
      vehicle_type: vehicleType,
      capacity: parseInt(capacity),
      status,
      driver_id: assignedDriver || null
    };

    try {
      if (editingVehicle) {
        // Update
        const res = await axios.put(`/api/vehicles/${editingVehicle.id}`, payload);
        if (res.data.success) setOpenDialog(false);
      } else {
        // Create
        const res = await axios.post('/api/vehicles', payload);
        if (res.data.success) setOpenDialog(false);
      }
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save vehicle details');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await axios.delete(`/api/vehicles/${id}`);
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || 'Deletion failed.');
      }
    }
  };

  const getStatusChip = (stat) => {
    const configs = {
      available: { color: 'success', label: 'Available' },
      on_trip: { color: 'primary', label: 'On Trip' },
      maintenance: { color: 'warning', label: 'Maintenance' },
      inactive: { color: 'default', label: 'Inactive' }
    };
    const c = configs[stat] || { color: 'default', label: stat };
    return <Chip label={c.label} color={c.color} size="small" variant="outlined" />;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Vehicle Fleet Management</Typography>
          <Typography variant="caption" color="textSecondary">Add, modify, and delete fleet cars & track assignments</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} sx={{ bgcolor: 'var(--primary-color)' }}>
            Add Vehicle
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'var(--secondary-color)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Vehicle Number</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Capacity</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Assigned Driver</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((veh) => (
              <TableRow key={veh.id} hover>
                <TableCell sx={{ fontWeight: 'bold', color: 'var(--primary-dark)' }}>{veh.vehicle_number}</TableCell>
                <TableCell>{veh.vehicle_type}</TableCell>
                <TableCell>{veh.capacity} Seater</TableCell>
                <TableCell>{getStatusChip(veh.status)}</TableCell>
                <TableCell>
                  {veh.driver_name ? (
                    <Box>
                      <Typography variant="body2" fontWeight="500">{veh.driver_name}</Typography>
                      <Typography variant="caption" color="textSecondary">{veh.driver_mobile}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary">Unassigned</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton color="primary" onClick={() => handleOpenEdit(veh)}><Edit /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(veh.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {vehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="textSecondary">No vehicles registered in the system.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">
          {editingVehicle ? 'Edit Vehicle Profile' : 'Register New Vehicle'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            fullWidth
            label="Vehicle License Number"
            placeholder="e.g. KA-01-AB-1234"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={vehicleType}
                  label="Vehicle Type"
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <MenuItem value="SUV">SUV</MenuItem>
                  <MenuItem value="Sedan">Sedan</MenuItem>
                  <MenuItem value="Minivan">Minivan</MenuItem>
                  <MenuItem value="Bus">Bus</MenuItem>
                  <MenuItem value="Hatchback">Hatchback</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Seating Capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </Grid>
          </Grid>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="on_trip">On Trip</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Assign Driver</InputLabel>
            <Select
              value={assignedDriver}
              label="Assign Driver"
              onChange={(e) => setAssignedDriver(e.target.value)}
            >
              <MenuItem value=""><em>None (Unassigned)</em></MenuItem>
              {drivers.map((drv) => (
                <MenuItem key={drv.id} value={drv.id}>
                  {drv.name} ({drv.license_number})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: 'var(--primary-color)' }}>
            Save Details
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vehicles;
