import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, Badge, Menu, MenuItem,
  Divider, Tooltip, Avatar, Button, Paper, Popover
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, DirectionsCar, People, Assignment,
  Map, Assessment, Settings, ExitToApp, Notifications, FiberManualRecord
} from '@mui/icons-material';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const { user, logout, isAdmin, isDriver } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 15 seconds
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotifMenu = (event) => {
    setAnchorElNotif(event.currentTarget);
  };

  const handleCloseNotifMenu = () => {
    setAnchorElNotif(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.post(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = [];

  if (isAdmin) {
    menuItems.push(
      { text: 'Dashboard', icon: <Dashboard />, path: '/' },
      { text: 'Vehicles', icon: <DirectionsCar />, path: '/vehicles' },
      { text: 'Drivers', icon: <People />, path: '/drivers' },
      { text: 'Bookings', icon: <Assignment />, path: '/bookings' },
      { text: 'Trips', icon: <Map />, path: '/trips' },
      { text: 'Live Tracking', icon: <Map />, path: '/tracking' },
      { text: 'Reports', icon: <Assessment />, path: '/reports' },
      { text: 'Settings', icon: <Settings />, path: '/settings' }
    );
  } else if (isDriver) {
    menuItems.push(
      { text: 'My Trips', icon: <Assignment />, path: '/trips' },
      { text: 'Live Tracking', icon: <Map />, path: '/tracking' },
      { text: 'Settings', icon: <Settings />, path: '/settings' }
    );
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ bg: 'var(--primary-dark)', display: 'flex', justifyContent: 'center', py: 2 }}>
        <Typography variant="h6" noWrap component="div" sx={{ color: '#fff', fontWeight: 'bold', letterSpacing: 1 }}>
          MANIVTHA
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flexGrow: 1, px: 2, py: 3 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 'var(--border-radius)',
                  backgroundColor: isActive ? 'rgba(30, 136, 229, 0.15)' : 'transparent',
                  color: isActive ? 'var(--primary-light)' : '#cbd5e1',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'var(--primary-light)' : '#cbd5e1', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '14px', fontWeight: isActive ? 'bold' : 'normal' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={<ExitToApp />}
          onClick={logout}
          sx={{ borderRadius: '8px', textTransform: 'none' }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: '0 1px 10px 0 rgba(0,0,0,0.05)',
          backgroundColor: '#ffffff',
          color: 'var(--text-dark)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
            Manivtha Tours & Travels
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Notification Bell */}
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={handleOpenNotifMenu}>
                <Badge badgeContent={unreadCount} color="error">
                  <Notifications sx={{ color: 'var(--text-light)' }} />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Popover
              anchorEl={anchorElNotif}
              open={Boolean(anchorElNotif)}
              onClose={handleCloseNotifMenu}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                sx: { width: 320, maxHeight: 400, mt: 1.5, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }
              }}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">Alerts & Notifications</Typography>
                {unreadCount > 0 && <Typography variant="caption" color="primary">{unreadCount} new</Typography>}
              </Box>
              <Divider />
              <List sx={{ p: 0 }}>
                {notifications.length === 0 ? (
                  <ListItem sx={{ py: 3, justifyContent: 'center' }}>
                    <Typography variant="body2" color="textSecondary">No notifications</Typography>
                  </ListItem>
                ) : (
                  notifications.map((notif) => (
                    <ListItem 
                      key={notif.id} 
                      alignItems="flex-start"
                      secondaryAction={
                        !notif.is_read && (
                          <IconButton edge="end" size="small" onClick={() => handleMarkAsRead(notif.id)}>
                            <FiberManualRecord sx={{ fontSize: 10, color: 'var(--warning-color)' }} />
                          </IconButton>
                        )
                      }
                      sx={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: notif.is_read ? 'transparent' : 'rgba(30, 136, 229, 0.03)',
                        py: 1.5
                      }}
                    >
                      <Box sx={{ pr: 2 }}>
                        <Typography variant="body2" fontWeight={notif.is_read ? 'normal' : 'bold'}>{notif.title}</Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" fontSize={9} sx={{ display: 'block', mt: 0.5 }}>
                          {formatTime(notif.created_at)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))
                )}
              </List>
            </Popover>

            {/* Profile Avatar */}
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar sx={{ bgcolor: 'var(--primary-color)' }}>
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              PaperProps={{ sx: { mt: 1.5, minWidth: 150 } }}
            >
              <MenuItem disabled sx={{ opacity: 1, py: 1 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">{user?.name}</Typography>
                  <Typography variant="caption" color="textSecondary">{user?.email}</Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/settings'); }}>Profile Settings</MenuItem>
              <MenuItem onClick={logout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawers */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#1e293b', color: '#fff' },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, backgroundColor: '#0f172a', color: '#fff', borderRight: 'none' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* App Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          pt: 10 // Account for fixed app bar
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
