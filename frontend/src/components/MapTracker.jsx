import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Box, Paper, Typography } from '@mui/material';

// Custom Map Controller to smoothly pan map when vehicle moves
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

// Create custom colored SVG markers using Leaflet divIcon
const createCustomIcon = (color, glyph) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${glyph}
      </div>
    `,
    className: 'custom-map-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const pickupIcon = createCustomIcon('#2e7d32', 'P'); // Green P
const dropIcon = createCustomIcon('#c62828', 'D');   // Red D
const vehicleIcon = createCustomIcon('#0d47a1', '🚗'); // Blue Car

const MapTracker = ({ 
  currentLat, 
  currentLng, 
  pickupLat, 
  pickupLng, 
  dropLat, 
  dropLng,
  pickupAddress,
  dropAddress,
  vehiclePlate,
  currentAddress
}) => {
  // Ensure we have active positions
  const vehiclePos = currentLat && currentLng ? [parseFloat(currentLat), parseFloat(currentLng)] : null;
  const pickupPos = pickupLat && pickupLng ? [parseFloat(pickupLat), parseFloat(pickupLng)] : null;
  const dropPos = dropLat && dropLng ? [parseFloat(dropLat), parseFloat(dropLng)] : null;

  // Fallback default coordinates (Bangalore center)
  const defaultCenter = [12.9716, 77.5946];
  const centerPos = vehiclePos || pickupPos || defaultCenter;

  // Build the route coordinates list for drawing the path
  const routePath = [];
  if (pickupPos) routePath.push(pickupPos);
  if (vehiclePos) routePath.push(vehiclePos);
  if (dropPos) routePath.push(dropPos);

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: '400px', position: 'relative' }}>
      <MapContainer 
        center={centerPos} 
        zoom={13} 
        style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Recenter controller */}
        {vehiclePos && <RecenterMap center={vehiclePos} />}

        {/* Pickup Pin */}
        {pickupPos && (
          <Marker position={pickupPos} icon={pickupIcon}>
            <Popup>
              <Typography variant="body2" fontWeight="bold">Pickup Location</Typography>
              <Typography variant="caption">{pickupAddress || 'Origin'}</Typography>
            </Popup>
          </Marker>
        )}

        {/* Drop Pin */}
        {dropPos && (
          <Marker position={dropPos} icon={dropIcon}>
            <Popup>
              <Typography variant="body2" fontWeight="bold">Drop Location</Typography>
              <Typography variant="caption">{dropAddress || 'Destination'}</Typography>
            </Popup>
          </Marker>
        )}

        {/* Live Vehicle Pin */}
        {vehiclePos && (
          <Marker position={vehiclePos} icon={vehicleIcon}>
            <Popup>
              <Typography variant="body2" fontWeight="bold">Vehicle: {vehiclePlate || 'Active Ride'}</Typography>
              <Typography variant="caption" sx={{ color: 'var(--primary-color)', fontWeight: 500 }}>
                {currentAddress || 'In Transit'}
              </Typography>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline path */}
        {routePath.length > 1 && (
          <Polyline 
            positions={routePath} 
            color="var(--primary-light)" 
            weight={4} 
            opacity={0.7} 
            dashArray="10, 10" 
          />
        )}
      </MapContainer>

      {/* Floating Status card */}
      {currentAddress && (
        <Paper 
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 1000,
            p: 2,
            maxWidth: 300,
            borderRadius: '8px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(4px)',
            borderLeft: '4px solid var(--primary-color)'
          }}
        >
          <Typography variant="caption" color="textSecondary" fontWeight="bold" display="block">
            CURRENT LOCATION
          </Typography>
          <Typography variant="body2" fontWeight={600} color="var(--text-dark)">
            {currentAddress}
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
            Lat: {parseFloat(currentLat).toFixed(4)}, Lng: {parseFloat(currentLng).toFixed(4)}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MapTracker;
