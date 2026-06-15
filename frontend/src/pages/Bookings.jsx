import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Chip, Grid
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Map } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Bookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [assignedVehicle, setAssignedVehicle] = useState('');
  const [assignedDriver, setAssignedDriver] = useState('');
  const [fareAmount, setFareAmount] = useState('');
  const [status, setStatus] = useState('pending');

  const loadData = async () => {
    setLoading(true);
    try {
      const resBook = await axios.get('/api/bookings');
      if (resBook.data.success) setBookings(resBook.data.data);

      // Load vehicles to see who's available
      const resVeh = await axios.get('/api/vehicles');
      if (resVeh.data.success) {
        setVehicles(resVeh.data.data);
      }

      // Load drivers to see who's available
      const resDrv = await axios.get('/api/drivers');
      if (resDrv.data.success) {
        setDrivers(resDrv.data.data);
      }
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
    setEditingBooking(null);
    setCustomerName('');
    setCustomerMobile('');
    setPickupLocation('');
    setDropLocation('');
    // Default to tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setTripDate(tomorrow.toISOString().slice(0, 16));
    setAssignedVehicle('');
    setAssignedDriver('');
    setFareAmount('500');
    setStatus('pending');
    setErrorMsg('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (book) => {
    setEditingBooking(book);
    setCustomerName(book.customer_name);
    setCustomerMobile(book.customer_mobile);
    setPickupLocation(book.pickup_location);
    setDropLocation(book.drop_location);
    setTripDate(new Date(book.trip_date).toISOString().slice(0, 16));
    setAssignedVehicle(book.vehicle_id || '');
    setAssignedDriver(book.driver_id || '');
    setFareAmount(String(book.fare_amount));
    setStatus(book.booking_status);
    setErrorMsg('');
    setOpenDialog(true);
  };

  // Auto calculate a reasonable fare based on locations for mock demo purposes
  const handleCalculateFare = () => {
    if (pickupLocation && dropLocation) {
      // Basic mock formula
      const hash = (pickupLocation.length + dropLocation.length) * 12;
      const calc = Math.max(350, (hash % 1200) + 150);
      setFareAmount(String(calc));
    }
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (!customerName.trim() || !customerMobile.trim() || !pickupLocation.trim() || !dropLocation.trim() || !tripDate || !fareAmount) {
      setErrorMsg('Please enter all booking details');
      return;
    }

    const payload = {
      customer_name: customerName.trim(),
      customer_mobile: customerMobile.trim(),
      pickup_location: pickupLocation.trim(),
      drop_location: dropLocation.trim(),
      trip_date: tripDate,
      vehicle_id: assignedVehicle || null,
      driver_id: assignedDriver || null,
      fare_amount: parseFloat(fareAmount),
      booking_status: status
    };

    try {
      if (editingBooking) {
        await axios.put(`/api/bookings/${editingBooking.id}`, payload);
      } else {
        await axios.post('/api/bookings', payload);
      }
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error saving booking record');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this booking? Active trips linked to this will be removed.')) {
      try {
        await axios.delete(`/api/bookings/${id}`);
        loadData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete booking.');
      }
    }
  };

  const getStatusChip = (stat) => {
    const configs = {
      pending: { color: 'warning', label: 'Pending' },
      confirmed: { color: 'info', label: 'Confirmed' },
      completed: { color: 'success', label: 'Completed' },
      cancelled: { color: 'error', label: 'Cancelled' }
    };
    const c = configs[stat] || { color: 'default', label: stat };
    return <Chip label={c.label} color={c.color} size="small" />;
  };

  // Filter lists: only show drivers and vehicles that are available or assigned to THIS booking
  const availableVehicles = vehicles.filter(v => v.status === 'available' || (editingBooking && v.id === editingBooking.vehicle_id));
  const availableDrivers = drivers.filter(d => d.status === 'available' || (editingBooking && d.id === editingBooking.driver_id));

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Trip Bookings Directory</Typography>
          <Typography variant="caption" color="textSecondary">Create travel bookings, allocate cabs, assign drivers, and check ride status</Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadData}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd} sx={{ bgcolor: 'var(--primary-color)' }}>
            New Booking
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'var(--secondary-color)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Route</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Trip Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Assigned Cab / Driver</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Fare</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Trip ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((book) => (
              <TableRow key={book.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{book.customer_name}</Typography>
                  <Typography variant="caption" color="textSecondary">{book.customer_mobile}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2"><strong>From:</strong> {book.pickup_location}</Typography>
                  <Typography variant="body2"><strong>To:</strong> {book.drop_location}</Typography>
                </TableCell>
                <TableCell>{new Date(book.trip_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
                <TableCell>
                  {book.vehicle_number ? (
                    <Box>
                      <Typography variant="body2" fontWeight="500">{book.vehicle_number} ({book.vehicle_type})</Typography>
                      <Typography variant="caption" color="textSecondary">{book.driver_name || 'No Driver'}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="error" fontWeight="bold">Unassigned</Typography>
                  )}
                </TableCell>
                <TableCell fontWeight="bold">₹{book.fare_amount}</TableCell>
                <TableCell>{getStatusChip(book.booking_status)}</TableCell>
                <TableCell>
                  {book.trip_uid ? (
                    <Button 
                      size="small" 
                      variant="text" 
                      startIcon={<Map />} 
                      onClick={() => navigate(`/tracking?tripId=${book.trip_uid}`)}
                      sx={{ fontWeight: 'bold', textTransform: 'none' }}
                    >
                      {book.trip_uid}
                    </Button>
                  ) : (
                    <Typography variant="caption" color="textSecondary">n/a</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ minWidth: '120px' }}>
                  {book.trip_id && (
                    <Button 
                      size="small" 
                      variant="text" 
                      onClick={() => navigate(`/trips/detail/${book.trip_id}`)}
                      sx={{ textTransform: 'none', fontWeight: 'bold', mr: 0.5 }}
                    >
                      Details
                    </Button>
                  )}
                  <IconButton size="small" color="primary" onClick={() => handleOpenEdit(book)}><Edit /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(book.id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Typography variant="body2" color="textSecondary">No bookings logged in the system.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Booking Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight="bold">
          {editingBooking ? 'Edit Booking Information' : 'Dispatch New Trip Booking'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Mobile Number"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pickup Address"
                placeholder="e.g. Bangalore Airport"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                onBlur={handleCalculateFare}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Drop-off Address"
                placeholder="e.g. Electronic City"
                value={dropLocation}
                onChange={(e) => setDropLocation(e.target.value)}
                onBlur={handleCalculateFare}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Trip Date & Time"
                type="datetime-local"
                value={tripDate}
                onChange={(e) => setTripDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  label="Fare Amount (INR)"
                  type="number"
                  value={fareAmount}
                  onChange={(e) => setFareAmount(e.target.value)}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleCalculateFare}
                  sx={{ textTransform: 'none', minWidth: 100 }}
                >
                  Estimate
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Allocate Vehicle</InputLabel>
                <Select
                  value={assignedVehicle}
                  label="Allocate Vehicle"
                  onChange={(e) => setAssignedVehicle(e.target.value)}
                >
                  <MenuItem value=""><em>None (Unassigned)</em></MenuItem>
                  {availableVehicles.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.vehicle_number} - {v.vehicle_type} ({v.capacity} pax)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assign Driver</InputLabel>
                <Select
                  value={assignedDriver}
                  label="Assign Driver"
                  onChange={(e) => setAssignedDriver(e.target.value)}
                >
                  <MenuItem value=""><em>None (Unassigned)</em></MenuItem>
                  {availableDrivers.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name} (Exp: {d.experience} yrs)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Booking/Trip Status</InputLabel>
                <Select
                  value={status}
                  label="Booking/Trip Status"
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="pending">Pending (Awaiting Allocation)</MenuItem>
                  <MenuItem value="confirmed">Confirmed (Auto-Triggers Driver GPS Activation)</MenuItem>
                  <MenuItem value="completed">Completed (Trip History Archive)</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: 'var(--primary-color)' }}>
            Confirm Dispatch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bookings;
