import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid, Card, CardContent,
  CircularProgress, Chip, Stack
} from '@mui/material';
import { PlayArrow, Map, DirectionsCar, Place, DoneAll, Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

const Trips = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isDriver } = useAuth();
  
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/trips');
      if (res.data.success) {
        setTrips(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
    // Poll trips every 10 seconds to keep live progress synced
    const interval = setInterval(loadTrips, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusChip = (stat) => {
    const configs = {
      booking_created: { color: 'default', label: 'Booking Created' },
      driver_assigned: { color: 'info', label: 'Driver Assigned' },
      vehicle_dispatched: { color: 'secondary', label: 'Dispatched' },
      driver_reached_pickup: { color: 'warning', label: 'Reached Pickup' },
      pickup_completed: { color: 'primary', label: 'Pickup Completed' },
      trip_in_progress: { color: 'primary', label: 'In Progress' },
      drop_completed: { color: 'success', label: 'Drop Completed' },
      trip_completed: { color: 'success', label: 'Completed' }
    };
    const c = configs[stat] || { color: 'default', label: stat };
    return <Chip label={c.label} color={c.color} size="small" />;
  };

  const getDelayChip = (delayStat) => {
    if (delayStat === 'delayed') {
      return <Chip label="Delayed" color="error" size="small" className="delay-pulse-badge" />;
    }
    return <Chip label="On Time" color="success" size="small" variant="outlined" />;
  };

  // Status Workflow helper to get next status and label
  const getNextWorkflowState = (currentStatus) => {
    switch (currentStatus) {
      case 'booking_created':
        return { status: 'driver_assigned', label: 'Assign Driver & Vehicle' };
      case 'driver_assigned':
        return { status: 'vehicle_dispatched', label: 'Dispatch Vehicle' };
      case 'vehicle_dispatched':
        return { status: 'driver_reached_pickup', label: 'Mark Reached Pickup' };
      case 'driver_reached_pickup':
        return { status: 'pickup_completed', label: 'Mark Pickup Completed' };
      case 'pickup_completed':
        return { status: 'trip_in_progress', label: 'Start Trip Route' };
      case 'trip_in_progress':
        return { status: 'drop_completed', label: 'Mark Drop Completed' };
      case 'drop_completed':
        return { status: 'trip_completed', label: 'Mark Trip Completed' };
      default:
        return null;
    }
  };

  const handleUpdateStatus = async (tripId, nextStatus) => {
    try {
      const res = await axios.post(`/api/trips/${tripId}/status`, { status: nextStatus });
      if (res.data.success) {
        if (nextStatus === 'trip_completed') {
          // Trigger confetti celebration on trip completion
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        loadTrips();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  if (loading && trips.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {isDriver ? 'My Assigned Trip Schedule' : 'Active Ride Operations'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {isDriver 
              ? 'Update travel milestones and view client routes' 
              : 'Monitor live positions, coordinate lines, and dispatch alerts'}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={loadTrips}>Refresh</Button>
      </Box>

      {isDriver ? (
        /* Driver Panel view: Focus on large cards for mobile usability */
        <Grid container spacing={3}>
          {trips.map((trip) => {
            const nextStep = getNextWorkflowState(trip.status);
            return (
              <Grid item xs={12} md={6} key={trip.id}>
                <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: '4px solid var(--primary-color)' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="var(--primary-dark)">
                          {trip.trip_uid}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Customer: {trip.customer_name} ({trip.customer_mobile})
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        {getStatusChip(trip.status)}
                        {getDelayChip(trip.delay_status)}
                      </Stack>
                    </Box>

                    <Stack spacing={1.5} sx={{ my: 2 }}>
                      <Box display="flex" gap={1}>
                        <Place sx={{ color: 'var(--accent-color)' }} />
                        <Typography variant="body2"><strong>From:</strong> {trip.pickup_location}</Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Place sx={{ color: 'var(--warning-color)' }} />
                        <Typography variant="body2"><strong>To:</strong> {trip.drop_location}</Typography>
                      </Box>
                      {trip.status !== 'trip_completed' && (
                        <Box sx={{ bgcolor: 'var(--secondary-color)', p: 1.5, borderRadius: '8px' }}>
                          <Typography variant="caption" color="textSecondary" display="block">SIMULATED GPS TELEMETRY</Typography>
                          <Typography variant="body2"><strong>ETA:</strong> {trip.eta_minutes} mins</Typography>
                          <Typography variant="body2"><strong>Remaining Distance:</strong> {trip.remaining_distance} km</Typography>
                          <Typography variant="body2"><strong>Route Progress:</strong> {trip.route_progress_percent}%</Typography>
                          <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                            *Coordinates simulation updates automatically in the background every 10 seconds.
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Box display="flex" gap={2} sx={{ mt: 3 }}>
                      {nextStep && (
                        <Button 
                          variant="contained" 
                          color="primary"
                          startIcon={<PlayArrow />}
                          onClick={() => handleUpdateStatus(trip.id, nextStep.status)}
                          sx={{ textTransform: 'none', borderRadius: '8px', flexGrow: 1 }}
                        >
                          {nextStep.label}
                        </Button>
                      )}
                      <Button 
                        variant="outlined" 
                        startIcon={<Map />}
                        onClick={() => navigate(`/tracking?tripId=${trip.trip_uid}`)}
                        sx={{ textTransform: 'none', borderRadius: '8px' }}
                      >
                        Track Map
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {trips.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px' }}>
                <Typography color="textSecondary">No trips currently assigned to you.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        /* Admin Grid view: Compact Table for monitoring all vehicles */
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'var(--secondary-color)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Trip ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Route (Pickup &gt; Drop)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Driver / Cab</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Workflow Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Delay Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Progress / ETA</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id} hover>
                  <TableCell sx={{ fontWeight: 'bold', color: 'var(--primary-dark)' }}>{trip.trip_uid}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{trip.customer_name}</Typography>
                    <Typography variant="caption" color="textSecondary">{trip.customer_mobile}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontSize="13px"><strong>P:</strong> {trip.pickup_location}</Typography>
                    <Typography variant="body2" fontSize="13px"><strong>D:</strong> {trip.drop_location}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{trip.driver_name}</Typography>
                    <Typography variant="caption" color="textSecondary">{trip.vehicle_number}</Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(trip.status)}</TableCell>
                  <TableCell>{getDelayChip(trip.delay_status)}</TableCell>
                  <TableCell>
                    {trip.status === 'trip_completed' ? (
                      <Typography variant="body2" color="success.main" fontWeight="bold">Arrived</Typography>
                    ) : (
                      <Box>
                        <Typography variant="body2"><strong>{trip.route_progress_percent}%</strong> completed</Typography>
                        <Typography variant="caption" color="textSecondary">{trip.remaining_distance} km left | {trip.eta_minutes} min ETA</Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<Map />} 
                        onClick={() => navigate(`/tracking?tripId=${trip.trip_uid}`)}
                        sx={{ textTransform: 'none', borderRadius: '6px' }}
                      >
                        Track Ride
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => navigate(`/trips/detail/${trip.id}`)}
                        sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: 'var(--primary-color)' }}
                      >
                        Details
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {trips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="textSecondary">No active trips currently logged.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Trips;
