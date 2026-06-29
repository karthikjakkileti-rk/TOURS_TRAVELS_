import React from 'react';
import { Box, Typography, Step, Stepper, StepLabel, StepConnector } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Check, DirectionsCar, Place, DoneAll } from '@mui/icons-material';

const workflowSteps = [
  { key: 'booking_created', label: 'Booking Created' },
  { key: 'driver_assigned', label: 'Driver Assigned' },
  { key: 'vehicle_dispatched', label: 'Vehicle Dispatched' },
  { key: 'driver_reached_pickup', label: 'Reached Pickup' },
  { key: 'pickup_completed', label: 'Pickup Completed' },
  { key: 'trip_in_progress', label: 'Trip In Progress' },
  { key: 'drop_completed', label: 'Drop Completed' },
  { key: 'trip_completed', label: 'Trip Completed' }
];

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.MuiStepConnector-alternativeLabel`]: {
    top: 22,
  },
  [`&.MuiStepConnector-active`]: {
    [`& .MuiStepConnector-line`]: {
      backgroundImage: 'linear-gradient(95deg, var(--primary-light) 0%, var(--accent-color) 100%)',
    },
  },
  [`&.MuiStepConnector-completed`]: {
    [`& .MuiStepConnector-line`]: {
      backgroundImage: 'linear-gradient(95deg, var(--primary-light) 0%, var(--accent-color) 100%)',
    },
  },
  [`& .MuiStepConnector-line`]: {
    height: 3,
    border: 0,
    backgroundColor: '#cbd5e1',
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: '#cbd5e1',
  zIndex: 1,
  color: '#fff',
  width: 44,
  height: 44,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundImage: 'linear-gradient(136deg, var(--primary-light) 0%, var(--primary-color) 100%)',
    boxShadow: '0 4px 10px 0 rgba(0,0,0,0.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage: 'linear-gradient(136deg, #2e7d32 0%, var(--accent-color) 100%)',
  }),
}));

function ColorlibStepIcon(props) {
  const { active, completed, className, icon } = props;

  const icons = {
    1: <Check fontSize="small" />,
    2: <Check fontSize="small" />,
    3: <DirectionsCar fontSize="small" />,
    4: <Place fontSize="small" />,
    5: <Check fontSize="small" />,
    6: <DirectionsCar fontSize="small" />,
    7: <Place fontSize="small" />,
    8: <DoneAll fontSize="small" />,
  };

  return (
    <ColorlibStepIconRoot ownerState={{ active, completed }} className={className}>
      {icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

const getNormalizedStepIndex = (status) => {
  const statusMapping = {
    'created': 0,
    'booking_created': 0,
    'assigned': 1,
    'driver_assigned': 1,
    'dispatched': 2,
    'vehicle_dispatched': 2,
    'reached_pickup': 3,
    'driver_reached_pickup': 3,
    'pickup_completed': 4,
    'trip_started': 5,
    'trip_in_progress': 5,
    'drop_completed': 6,
    'completed': 7,
    'trip_completed': 7
  };
  return statusMapping[status] !== undefined ? statusMapping[status] : 0;
};

const Timeline = ({ currentStatus }) => {
  // Find index of current status in workflow steps list using normalization
  const activeStep = getNormalizedStepIndex(currentStatus);

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
        {workflowSteps.map((step, index) => (
          <Step key={step.key} completed={index < activeStep || currentStatus === 'trip_completed' || currentStatus === 'completed'}>
            <StepLabel 
              StepIconComponent={ColorlibStepIcon}
              StepIconProps={{ icon: index + 1 }}
            >
              <Typography 
                variant="caption" 
                fontWeight={index === activeStep ? 'bold' : 'normal'}
                color={index === activeStep ? 'var(--primary-color)' : 'textSecondary'}
              >
                {step.label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default Timeline;
