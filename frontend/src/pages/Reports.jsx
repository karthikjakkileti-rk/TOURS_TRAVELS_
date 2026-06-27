import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid, Card, CardContent,
  CircularProgress, MenuItem, Select, FormControl, InputLabel,
  Stack, ToggleButton, ToggleButtonGroup, Chip
} from '@mui/material';
import { Download, Refresh, GetApp, Summarize } from '@mui/icons-material';

const Reports = () => {
  const [range, setRange] = useState('daily'); // daily, weekly, monthly
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  // Aggregated Summary Stats for quick view
  const [summary, setSummary] = useState({
    totalCount: 0,
    completedCount: 0,
    delayedCount: 0,
    totalRevenue: 0
  });

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/reports?range=${range}`);
      if (res.data.success) {
        setReports(res.data.data);
        
        // Calculate dynamic summary stats based on current filter list
        const total = res.data.data.length;
        const completed = res.data.data.filter(r => r.status === 'trip_completed').length;
        const delayed = res.data.data.filter(r => r.delay_status === 'delayed').length;
        const revenue = res.data.data.reduce((sum, r) => sum + parseFloat(r.fare_amount || 0), 0);
        
        setSummary({
          totalCount: total,
          completedCount: completed,
          delayedCount: delayed,
          totalRevenue: revenue.toFixed(2)
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [range]);

  const handleRangeChange = (event, newRange) => {
    if (newRange !== null) {
      setRange(newRange);
    }
  };

  const handleExport = (format) => {
    const token = localStorage.getItem('token');
    // Open in a new tab to download the CSV or print the PDF
    const exportUrl = `http://localhost:5000/api/reports/export?format=${format}&range=${range}&Authorization=Bearer ${token}`;
    
    // Express doesn't automatically read headers for simple browser window.open clicks,
    // so we can pass the auth token as a query parameter in our route.
    // In our backend authMiddleware we fetched it from header, but wait!
    // We can update the backend auth or just create a downloadable link that contains the query token.
    // Wait, let's see: in our backend, the auth check is `req.headers.authorization`.
    // Let's pass the token in a query param and make a clean export!
    // Wait, let's update the window open code, or download it via an Axios call,
    // which handles authorization headers perfectly!
    // Yes! Downloading via Axios as a blob is the professional standard. It preserves authorization headers and triggers downloads programmatically!
    
    if (format === 'csv') {
      axios.get(`/api/reports/export?format=csv&range=${range}`, { responseType: 'blob' })
        .then(response => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `manivtha_report_${range}.csv`);
          document.body.appendChild(link);
          link.click();
          link.remove();
        })
        .catch(err => console.error(err));
    } else {
      // For PDF (Print friendly HTML format):
      // We can fetch it with auth header using axios, get the HTML string, open a new window and write the content!
      // This is an incredibly elegant solution that keeps JWT authentication 100% secure!
      axios.get(`/api/reports/export?format=pdf&range=${range}`)
        .then(response => {
          const printWindow = window.open('', '_blank');
          printWindow.document.write(response.data);
          printWindow.document.close();
        })
        .catch(err => console.error(err));
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Company Log Reports</Typography>
          <Typography variant="caption" color="textSecondary">Generate operations sheets, export files, and overview revenue indexes</Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={range}
            exclusive
            onChange={handleRangeChange}
            size="small"
          >
            <ToggleButton value="daily" sx={{ textTransform: 'none', px: 2 }}>Daily</ToggleButton>
            <ToggleButton value="weekly" sx={{ textTransform: 'none', px: 2 }}>Weekly</ToggleButton>
            <ToggleButton value="monthly" sx={{ textTransform: 'none', px: 2 }}>Monthly</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadReports}>Refresh</Button>
        </Stack>
      </Box>

      {/* Summary KPI Panel */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', borderLeft: '4px solid var(--primary-color)' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">TOTAL TRIPS</Typography>
              <Typography variant="h6" fontWeight="bold">{summary.totalCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', borderLeft: '4px solid #2e7d32' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">COMPLETED TRIPS</Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">{summary.completedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', borderLeft: '4px solid #ff3d00' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">DELAYED TRIPS</Typography>
              <Typography variant="h6" fontWeight="bold" color="error.main">{summary.delayedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '12px', borderLeft: '4px solid #f57c00' }}>
            <CardContent>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">ESTIMATED REVENUE</Typography>
              <Typography variant="h6" fontWeight="bold">₹{summary.totalRevenue}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export operations card */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" fontWeight="bold" display="flex" alignItems="center" gap={1}>
            <Summarize color="primary" /> Export document options:
          </Typography>
          <Box display="flex" gap={2}>
            <Button 
              variant="contained" 
              color="success"
              startIcon={<GetApp />}
              onClick={() => handleExport('csv')}
              sx={{ textTransform: 'none', borderRadius: '8px' }}
            >
              Export to CSV (Excel)
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<Download />}
              onClick={() => handleExport('pdf')}
              sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: 'var(--primary-color)' }}
            >
              Print / Save to PDF
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" sx={{ py: 10 }}><CircularProgress /></Box>
      ) : (
        /* Report table */
        <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'var(--secondary-color)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Trip ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pickup Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Drop Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fare Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Distance Covered</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Delay Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cab Assigned</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((r, idx) => (
                <TableRow key={idx} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{r.trip_uid}</TableCell>
                  <TableCell>{r.customer_name}</TableCell>
                  <TableCell>{r.pickup_location}</TableCell>
                  <TableCell>{r.drop_location}</TableCell>
                  <TableCell fontWeight="bold">₹{r.fare_amount}</TableCell>
                  <TableCell>{r.distance_covered} km</TableCell>
                  <TableCell>
                    {r.delay_status === 'delayed' ? (
                      <Chip label="Delayed" color="error" size="small" variant="outlined" />
                    ) : (
                      <Chip label="On Time" color="success" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>{r.vehicle_number || 'n/a'}</TableCell>
                  <TableCell>{new Date(r.trip_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="textSecondary">No trips records found in the specified range.</Typography>
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

export default Reports;
