import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Grid, Paper, TextField, Button, Alert,
  Card, CardContent, CircularProgress, Divider, Stack
} from '@mui/material';
import { Search, NearMe, QueryBuilder, DirectionsCar, Place } from '@mui/icons-material';
import MapTracker from '../components/MapTracker';
import Timeline from '../components/Timeline';

const LiveTracking = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryTripId = searchParams.get('tripId') || '';

  const [tripId, setTripId] = useState(queryTripId);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTrackingData = async (uid) => {
    if (!uid) return;
    try {
      const res = await axios.get(`/api/trips/tracking/${uid}`);
      if (res.data.success) {
        setTrip(res.data.data);
        setErrorMsg('');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to load tracking data. Please verify Trip ID.');
      setTrip(null);
    }
  };

  // Trigger search on search button click
  const handleSearch = () => {
    if (!tripId.trim()) {
      setErrorMsg('Please enter a Trip ID');
      return;
    }
    setLoading(true);
    fetchTrackingData(tripId.trim());
    setLoading(false);
  };

  // Initial load if query param exists
  useEffect(() => {
    if (queryTripId) {
      setTripId(queryTripId);
      setLoading(true);
      fetchTrackingData(queryTripId);
      setLoading(false);
    }
  }, [queryTripId]);

  // Set up polling for active trips to animate movement
  useEffect(() => {
    if (trip && trip.status !== 'trip_completed') {
      const interval = setInterval(() => {
        fetchTrackingData(trip.trip_uid);
      }, 5000); // Poll every 5s for smooth UI updates
      return () => clearInterval(interval);
    }
  }, [trip]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold">Live Vehicle Tracker</Typography>
        <Typography variant="caption" color="textSecondary">Trace real-time route path, GPS coordinates, and arrival milestones</Typography>
      </Box>

      {/* Search Input Widget */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={9}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Enter Trip ID (e.g. TRIP-BLR-EC-001)"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              sx={{ bgcolor: 'var(--primary-color)', height: '40px', fontWeight: 'bold', textTransform: 'none' }}
            >
              Search Trip
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {errorMsg && <Alert severity="warning" sx={{ mb: 4, borderRadius: '8px' }}>{errorMsg}</Alert>}
      {loading && (
        <Box display="flex" justifyContent="center" sx={{ my: 5 }}><CircularProgress /></Box>
      )}

      {trip && (
        <Grid container spacing={3}>
          {/* Timeline and details card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <Typography variant="subtitle2" color="textSecondary" fontWeight="bold" sx={{ mb: 1 }}>
                RIDE WORKFLOW TIMELINE
              </Typography>
              <Timeline currentStatus={trip.status} />
            </Paper>
          </Grid>

          {/* Left Panel: Statistics and Driver details */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Trip stats card */}
              <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                    Telemetry Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">Trip ID</Typography>
                      <Typography variant="body2" fontWeight="bold" color="var(--primary-color)">
                        {trip.trip_uid}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">ETA Minutes</Typography>
                      <Typography variant="body2" fontWeight="bold" display="flex" alignItems="center" gap={0.5}>
                        <QueryBuilder fontSize="small" color="action" />
                        {trip.status === 'trip_completed' ? 'Arrived' : `${trip.eta_minutes} mins`}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">Remaining Distance</Typography>
                      <Typography variant="body2" fontWeight="bold" display="flex" alignItems="center" gap={0.5}>
                        <NearMe fontSize="small" color="action" />
                        {trip.status === 'trip_completed' ? '0.00 km' : `${trip.remaining_distance} km`}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="textSecondary">Progress</Typography>
                      <Typography variant="body2" fontWeight="bold" color="var(--accent-color)">
                        {trip.route_progress_percent}%
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Driver info card */}
              <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                    Driver & Cab Info
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Stack spacing={2}>
                    <Box display="flex" gap={1.5} alignItems="center">
                      <DirectionsCar color="primary" sx={{ fontSize: 32 }} />
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{trip.driver_name}</Typography>
                        <Typography variant="caption" color="textSecondary">{trip.driver_mobile}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" justifyContent="space-between" sx={{ bg: 'var(--secondary-color)', p: 1.5, borderRadius: '8px' }}>
                      <Typography variant="body2">Vehicle Number:</Typography>
                      <Typography variant="body2" fontWeight="bold">{trip.vehicle_number}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Right Panel: OpenStreetMap Leaflet Container */}
          <Grid item xs={12} md={8}>
            <Paper 
              sx={{ 
                p: 1.5, 
                borderRadius: '12px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                height: '450px',
                overflow: 'hidden'
              }}
            >
              <MapTracker
                currentLat={trip.current_latitude}
                currentLng={trip.current_longitude}
                pickupLat={trip.pickup_latitude}
                pickupLng={trip.pickup_longitude}
                dropLat={trip.drop_latitude}
                dropLng={trip.drop_longitude}
                pickupAddress={trip.pickup_location}
                dropAddress={trip.drop_location}
                vehiclePlate={trip.vehicle_number}
                currentAddress={trip.current_address}
              />
            </Paper>
          </Grid>
        </Grid>
      )}

      {!trip && !errorMsg && !loading && (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px', mt: 2 }}>
          <Typography variant="body1" color="textSecondary">
            Please search for a Trip ID above to activate the live GPS tracking viewport.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default LiveTracking;
