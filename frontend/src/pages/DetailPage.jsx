import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Grid, Card, CardContent, CircularProgress,
  Divider, Stack, TextField, MenuItem, Select, FormControl, InputLabel, Alert,
  Rating, Chip, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
  ArrowBack, DirectionsCar, People, Person, AttachMoney, Warning, Star,
  History, LocationOn, Feedback, Campaign, CheckCircle, Refresh
} from '@mui/icons-material';

const DetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Payment Form States
  const [advAmt, setAdvAmt] = useState('');
  const [balAmt, setBalAmt] = useState('');
  const [payStatus, setPayStatus] = useState('pending');
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState('');

  // Complaint Form States
  const [complaintText, setComplaintText] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Rating Form States
  const [ratingVal, setRatingVal] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await axios.get(`/api/trips/${id}/details`);
      if (res.data.success) {
        const payload = res.data.data;
        setData(payload);
        setAdvAmt(payload.payment.advance_amount);
        setBalAmt(payload.payment.balance_amount);
        setPayStatus(payload.payment.payment_status);
        if (payload.rating) {
          setRatingVal(payload.rating.rating);
          setFeedbackText(payload.rating.feedback || '');
        }
        setErrorMsg('');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load trip details. Verify trip ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdatePayment = async () => {
    setUpdatingPayment(true);
    setPaySuccessMsg('');
    try {
      const res = await axios.post(`/api/trips/${id}/payment`, {
        advance_amount: parseFloat(advAmt),
        balance_amount: parseFloat(balAmt),
        payment_status: payStatus
      });
      if (res.data.success) {
        setPaySuccessMsg('Payment recorded successfully!');
        fetchDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating payment');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleAddComplaint = async () => {
    if (!complaintText.trim()) return;
    setSubmittingComplaint(true);
    try {
      const res = await axios.post(`/api/trips/${id}/complaint`, {
        complaint_text: complaintText.trim()
      });
      if (res.data.success) {
        setComplaintText('');
        fetchDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleAddRating = async () => {
    if (ratingVal === 0) return;
    setSubmittingRating(true);
    try {
      const res = await axios.post(`/api/trips/${id}/rating`, {
        rating: ratingVal,
        feedback: feedbackText.trim()
      });
      if (res.data.success) {
        fetchDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving feedback');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (errorMsg || !data) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{errorMsg || 'Trip details not found'}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>Back</Button>
      </Box>
    );
  }

  const { trip, payment, complaints, rating, history, gps_path, ai_summaries } = data;

  const getStatusColor = (stat) => {
    const map = {
      booking_created: 'default',
      driver_assigned: 'info',
      vehicle_dispatched: 'secondary',
      pickup_completed: 'primary',
      trip_in_progress: 'primary',
      trip_completed: 'success'
    };
    return map[stat] || 'default';
  };

  return (
    <Box>
      {/* Header bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate(-1)}
            sx={{ textTransform: 'none', borderRadius: '8px' }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h5" fontWeight="bold">Trip Operations Detail</Typography>
            <Typography variant="caption" color="textSecondary">Trip UID: <strong>{trip.trip_uid}</strong></Typography>
          </Box>
        </Stack>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchDetails}>Refresh</Button>
      </Box>

      <Grid container spacing={3}>
        {/* Highlight AI Summaries Card */}
        <Grid item xs={12}>
          <Card 
            sx={{ 
              borderRadius: '16px', 
              boxShadow: '0 8px 30px rgba(0,0,0,0.05)', 
              background: 'linear-gradient(135deg, #0d47a1 0%, #1e88e5 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
                Rule-Based AI summaries
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: '12px', height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Campaign fontSize="small" /> Trip Progress Summary
                    </Typography>
                    <Typography variant="body2">{ai_summaries.trip_summary}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: '12px', height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Warning fontSize="small" /> Delay Summary
                    </Typography>
                    <Typography variant="body2">{ai_summaries.delay_summary}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 2, borderRadius: '12px', height: '100%' }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Feedback fontSize="small" /> Customer Update Message
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1.5 }}>"{ai_summaries.customer_update_message}"</Typography>
                    <Button 
                      variant="outlined" 
                      color="inherit" 
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(ai_summaries.customer_update_message);
                        alert('Customer update copied to clipboard!');
                      }}
                      sx={{ textTransform: 'none', borderColor: 'rgba(255,255,255,0.5)', borderRadius: '6px' }}
                    >
                      Copy Update
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Left Column: Personnel & Fleet details, Payments, Feedback */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Personnel Grid */}
            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Directory Entities</Typography>
              <Grid container spacing={3}>
                {/* Customer Details */}
                <Grid item xs={12} sm={4}>
                  <Box display="flex" gap={1.5} alignItems="center">
                    <Person color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary" fontWeight="bold">CUSTOMER</Typography>
                      <Typography variant="body1" fontWeight="bold">{trip.customer_name}</Typography>
                      <Typography variant="body2" color="textSecondary">{trip.customer_mobile}</Typography>
                    </Box>
                  </Box>
                </Grid>
                {/* Driver Details */}
                <Grid item xs={12} sm={4}>
                  <Box display="flex" gap={1.5} alignItems="center">
                    <People color="secondary" sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary" fontWeight="bold">ASSIGNED DRIVER</Typography>
                      <Typography variant="body1" fontWeight="bold">{trip.driver_name || 'Unassigned'}</Typography>
                      {trip.driver_mobile && <Typography variant="body2" color="textSecondary">{trip.driver_mobile}</Typography>}
                      {trip.driver_license && <Typography variant="caption" color="textSecondary" display="block">Lic: {trip.driver_license}</Typography>}
                    </Box>
                  </Box>
                </Grid>
                {/* Vehicle Details */}
                <Grid item xs={12} sm={4}>
                  <Box display="flex" gap={1.5} alignItems="center">
                    <DirectionsCar color="action" sx={{ fontSize: 32 }} />
                    <Box>
                      <Typography variant="caption" color="textSecondary" fontWeight="bold">FLEET VEHICLE</Typography>
                      <Typography variant="body1" fontWeight="bold">{trip.vehicle_number || 'Unallocated'}</Typography>
                      {trip.vehicle_type && <Typography variant="body2" color="textSecondary">{trip.vehicle_type} ({trip.vehicle_capacity} pax)</Typography>}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Payments Panel */}
            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney color="success" /> Payment Tracking Ledger
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {paySuccessMsg && <Alert severity="success" sx={{ mb: 2 }}>{paySuccessMsg}</Alert>}
              
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Advance Paid (₹)"
                    type="number"
                    size="small"
                    value={advAmt}
                    onChange={(e) => setAdvAmt(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Balance Due (₹)"
                    type="number"
                    size="small"
                    value={balAmt}
                    onChange={(e) => setBalAmt(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={payStatus}
                      label="Status"
                      onChange={(e) => setPayStatus(e.target.value)}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="partial">Partial</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="success" 
                    onClick={handleUpdatePayment}
                    disabled={updatingPayment}
                    sx={{ textTransform: 'none', fontWeight: 'bold' }}
                  >
                    {updatingPayment ? 'Saving...' : 'Update Ledger'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Complaints panel */}
            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Campaign color="error" /> Customer Complaints Desk
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box display="flex" gap={2}>
                  <TextField
                    fullWidth
                    placeholder="Describe issue (e.g. driver late, AC not working...)"
                    size="small"
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                  />
                  <Button 
                    variant="contained" 
                    color="error" 
                    onClick={handleAddComplaint}
                    disabled={submittingComplaint || !complaintText.trim()}
                    sx={{ textTransform: 'none', minWidth: '150px' }}
                  >
                    File Complaint
                  </Button>
                </Box>

                {complaints.length === 0 ? (
                  <Typography variant="caption" color="textSecondary" align="center">No active complaints filed for this booking.</Typography>
                ) : (
                  <List dense sx={{ bgcolor: 'var(--secondary-color)', borderRadius: '8px', px: 1 }}>
                    {complaints.map((c) => (
                      <ListItem key={c.id}>
                        <ListItemIcon><Warning color="error" size="small" /></ListItemIcon>
                        <ListItemText 
                          primary={c.complaint_text}
                          secondary={`Filed: ${new Date(c.created_at).toLocaleString()} | Status: ${c.status.toUpperCase()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Stack>
            </Paper>

            {/* Ratings Feedback Panel */}
            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star color="warning" /> Ride Feedback & Review
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2">Customer Rating:</Typography>
                  <Rating
                    value={ratingVal}
                    onChange={(event, newValue) => setRatingVal(newValue)}
                    disabled={!!rating}
                  />
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Customer testimonials and remarks..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  disabled={!!rating}
                />

                {!rating && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleAddRating}
                    disabled={submittingRating || ratingVal === 0}
                    sx={{ textTransform: 'none', alignSelf: 'flex-end', bgcolor: 'var(--primary-color)' }}
                  >
                    Submit Review
                  </Button>
                )}
                {rating && (
                  <Alert severity="info" icon={<CheckCircle />}>
                    Customer rating is logged.
                  </Alert>
                )}
              </Box>
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column: Trip workflow timeline logs, GPS coordinates history */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Workflow History Logs */}
            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', minHeight: '300px' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <History color="primary" /> Workflow Status Log
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {history.length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
                  No updates recorded in history log.
                </Typography>
              ) : (
                <List dense>
                  {history.map((h) => (
                    <ListItem key={h.id} sx={{ px: 0, alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                        <CheckCircle color={h.status === 'trip_completed' ? 'success' : 'primary'} fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={h.action}
                        secondary={
                          <React.Fragment>
                            <Typography variant="caption" display="block" color="textSecondary">
                              {new Date(h.created_at).toLocaleString()}
                            </Typography>
                            {h.remarks && (
                              <Typography variant="body2" component="span" color="textPrimary" fontSize="12px" display="block" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                Remarks: {h.remarks}
                              </Typography>
                            )}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            {/* GPS Telemetry Logs */}
            <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', maxHeight: '450px', overflowY: 'auto' }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn color="secondary" /> GPS Coordinate Logs
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {gps_path.length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
                  No coordinate coordinates logged yet.
                </Typography>
              ) : (
                <List dense>
                  {gps_path.map((g, idx) => (
                    <ListItem key={idx} sx={{ px: 0, borderBottom: '1px solid #f1f5f9' }}>
                      <ListItemIcon sx={{ minWidth: 30 }}><LocationOn fontSize="small" color="action" /></ListItemIcon>
                      <ListItemText
                        primary={g.address || 'Coordinates update'}
                        secondary={
                          <React.Fragment>
                            <Typography variant="caption" color="textSecondary">
                              Lat: {parseFloat(g.latitude).toFixed(5)} | Lng: {parseFloat(g.longitude).toFixed(5)}
                            </Typography>
                            <Typography variant="caption" display="block" color="primary">
                              {new Date(g.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DetailPage;
