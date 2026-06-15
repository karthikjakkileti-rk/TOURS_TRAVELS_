import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Grid, Paper, Box, Typography, Card, CardContent, CircularProgress,
  IconButton, Button, Tooltip
} from '@mui/material';
import {
  DirectionsCar, Map, History, Warning, People, AttachMoney, Refresh, TrendingUp
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const { cards, charts } = stats;

  const kpis = [
    { title: 'Total Vehicles', value: cards.totalVehicles, icon: <DirectionsCar />, color: '#0d47a1' },
    { title: 'Active Trips', value: cards.activeTrips, icon: <Map />, color: '#1e88e5' },
    { title: 'Completed Trips', value: cards.completedTrips, icon: <History />, color: '#2e7d32' },
    { title: 'Delayed Trips', value: cards.delayedTrips, icon: <Warning />, color: '#ff3d00' },
    { title: 'Total Drivers', value: cards.totalDrivers, icon: <People />, color: '#7b1fa2' },
    { title: 'Total Revenue', value: `₹${cards.totalRevenue}`, icon: <AttachMoney />, color: '#f57c00' },
  ];

  // Colors for Vehicle Utilization Pie Chart
  const utilizationColors = {
    'available': '#2e7d32', // Green
    'on_trip': '#0d47a1',   // Blue
    'maintenance': '#f57c00', // Orange
    'inactive': '#94a3b8'    // Gray
  };

  const formattedUtilization = (charts.vehicleUtilization || []).map(item => ({
    name: item.status.replace('_', ' ').toUpperCase(),
    value: item.count,
    color: utilizationColors[item.status] || '#cbd5e1'
  }));

  // Colors for Delays Breakdown
  const delayColors = {
    'on_time': '#2e7d32',
    'delayed': '#ff3d00'
  };

  const formattedDelays = (charts.delayBreakdown || []).map(item => ({
    name: item.delay_status.replace('_', ' ').toUpperCase(),
    value: item.count,
    color: delayColors[item.delay_status] || '#cbd5e1'
  }));

  return (
    <Box>
      {/* Title Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="var(--text-dark)">
            Fleet Overview Dashboard
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Live analytics and tracking indicators for Manivtha Travels
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<Refresh />} 
          onClick={fetchStats}
          sx={{ borderRadius: '8px', textTransform: 'none' }}
        >
          Refresh Data
        </Button>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={idx}>
            <Card 
              className="hover-lift"
              sx={{ 
                borderRadius: '12px', 
                borderLeft: `5px solid ${kpi.color}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="textSecondary" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
                    {kpi.title}
                  </Typography>
                  <Box sx={{ color: kpi.color, opacity: 0.8 }}>{kpi.icon}</Box>
                </Box>
                <Typography variant="h5" fontWeight="bold" color="var(--text-dark)">
                  {kpi.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Primary Analytics Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Trips per Day (Bar Chart) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Daily Trip Bookings (Last 7 Days)
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.tripsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <ChartTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                  />
                  <Bar dataKey="count" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Revenue Trend (Area Chart) */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Revenue Summary Trend (Last 7 Days)
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.revenueTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2e7d32" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <ChartTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                  />
                  <Area type="monotone" dataKey="amount" stroke="#2e7d32" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Breakdown Donut Charts */}
      <Grid container spacing={3}>
        {/* Vehicle Utilization breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Vehicle Fleet Utilization
            </Typography>
            <Box height={280} display="flex" alignItems="center" justifyContent="center">
              {formattedUtilization.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No vehicles registered</Typography>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedUtilization}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {formattedUtilization.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Delay Statistics breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Active Trip Delay Statistics
            </Typography>
            <Box height={280} display="flex" alignItems="center" justifyContent="center">
              {formattedDelays.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No active trips running</Typography>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedDelays}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {formattedDelays.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
