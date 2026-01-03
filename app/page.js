'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useTheme } from '@mui/material/styles';

// Extend dayjs with UTC plugin
dayjs.extend(utc);

// Dynamically import react-select with SSR disabled to prevent hydration errors
const Select = dynamic(() => import('react-select'), {
  ssr: false,
  loading: () => <Box sx={{ minHeight: '56px' }} />,
});

// Dynamically import DateTimePicker with SSR disabled to prevent hydration errors
const DateTimePicker = dynamic(
  () => import('@mui/x-date-pickers/DateTimePicker').then((mod) => mod.DateTimePicker),
  {
    ssr: false,
    loading: () => <Box sx={{ minHeight: '56px' }} />,
  }
);

const ALL_FIELDS = [
  'pm1.0_atm',
  'pm1.0_cf_1',
  'pm2.5_atm',
  'pm10.0_atm',
  'humidity',
  'temperature',
  'pressure',
  'scattering_coefficient',
  'visual_range',
  '0.3_um_count',
];

const fieldOptions = ALL_FIELDS.map((field) => ({
  value: field,
  label: field,
}));

export default function Home() {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    sensorIndex: '280470',
    apiKey: 'A7F28BBF-E813-11F0-B596-4201AC1DC123',
    startTimestamp: dayjs.utc('2026-01-01T16:00:00Z'),
    endTimestamp: dayjs.utc('2026-01-01T16:30:00Z'), // Will be reset when start changes
    fields: fieldOptions, // All fields selected by default
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
    setDownloadUrl('');
  };

  const handleStartTimeChange = (newValue) => {
    setFormData({
      ...formData,
      startTimestamp: newValue,
      endTimestamp: null, // Reset end timestamp when start changes
    });
    setError('');
    setSuccess('');
    setDownloadUrl('');
  };

  const handleEndTimeChange = (newValue) => {
    if (newValue && formData.startTimestamp) {
      const diffInMinutes = newValue.diff(formData.startTimestamp, 'minute');
      // Restrict to max 60 minutes
      if (diffInMinutes > 60) {
        // Set to exactly 60 minutes after start
        const maxEndTime = formData.startTimestamp.add(60, 'minute');
        setFormData({
          ...formData,
          endTimestamp: maxEndTime,
        });
      } else if (diffInMinutes < 0) {
        // End time cannot be before start time
        setFormData({
          ...formData,
          endTimestamp: formData.startTimestamp,
        });
      } else {
        setFormData({
          ...formData,
          endTimestamp: newValue,
        });
      }
    } else {
      setFormData({
        ...formData,
        endTimestamp: newValue,
      });
    }
    setError('');
    setSuccess('');
    setDownloadUrl('');
  };

  const handleFieldsChange = (selectedOptions) => {
    setFormData({
      ...formData,
      fields: selectedOptions || [],
    });
    setError('');
    setSuccess('');
    setDownloadUrl('');
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.sensorIndex.trim() !== '' &&
      formData.apiKey.trim() !== '' &&
      formData.startTimestamp &&
      formData.endTimestamp &&
      formData.fields.length > 0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Please fill in all fields');
      return;
    }

    // Validate time gap is at most 60 minutes
    const diffInMinutes = formData.endTimestamp.diff(formData.startTimestamp, 'minute');
    if (diffInMinutes > 60) {
      setError('Time gap cannot exceed 60 minutes');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setDownloadUrl('');

    // Convert selected options to array of field values
    const fieldValues = formData.fields.map((option) => option.value);
    
    // Convert dayjs objects to ISO 8601 strings
    const startTimestampISO = formData.startTimestamp.utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    const endTimestampISO = formData.endTimestamp.utc().format('YYYY-MM-DDTHH:mm:ss[Z]');

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensorIndex: formData.sensorIndex,
          apiKey: formData.apiKey,
          startTimestamp: startTimestampISO,
          endTimestamp: endTimestampISO,
          fields: fieldValues,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to download data');
      }

      setSuccess('Data downloaded successfully!');
      setDownloadUrl(data.downloadUrl);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Custom styles for react-select to match Material UI
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '56px',
      borderColor: state.isFocused ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.23)',
      boxShadow: state.isFocused ? `0 0 0 1px ${theme.palette.primary.main}` : 'none',
      '&:hover': {
        borderColor: state.isFocused ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.87)',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: theme.palette.primary.light,
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: theme.palette.primary.contrastText,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        color: theme.palette.primary.contrastText,
      },
    }),
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
        py: 6,
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              PurpleAir Data Downloader
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Download historical sensor data from PurpleAir
            </Typography>
          </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  Due to API points, the time selection has been restricted to 60 mins at max.
                </Alert>
                <TextField
                  label="Sensor Index"
                  name="sensorIndex"
                  value={formData.sensorIndex}
                  onChange={handleChange}
                  required
                  fullWidth
                  placeholder="Enter sensor index (e.g., 123456)"
                  variant="outlined"
                />

                <TextField
                  label="API Key"
                  name="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={handleChange}
                  required
                  fullWidth
                  placeholder="Enter your PurpleAir API key"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowApiKey(!showApiKey)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                        >
                          {showApiKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <DateTimePicker
                  label="Start Timestamp (UTC)"
                  value={formData.startTimestamp}
                  onChange={handleStartTimeChange}
                  slotProps={{
                    textField: {
                      required: true,
                      fullWidth: true,
                      variant: 'outlined',
                      helperText: 'Select date and time (up to minutes)',
                    },
                  }}
                  views={['year', 'month', 'day', 'hours', 'minutes']}
                  format="YYYY-MM-DD HH:mm"
                />

                <DateTimePicker
                  label="End Timestamp (UTC)"
                  value={formData.endTimestamp}
                  onChange={handleEndTimeChange}
                  minDateTime={formData.startTimestamp || undefined}
                  maxDateTime={
                    formData.startTimestamp
                      ? formData.startTimestamp.add(60, 'minute')
                      : undefined
                  }
                  disabled={!formData.startTimestamp}
                  slotProps={{
                    textField: {
                      required: true,
                      fullWidth: true,
                      variant: 'outlined',
                      helperText: formData.startTimestamp
                        ? 'Select date and time (max 60 minutes after start time)'
                        : 'Please select start timestamp first',
                    },
                  }}
                  views={['year', 'month', 'day', 'hours', 'minutes']}
                  format="YYYY-MM-DD HH:mm"
                />

              <FormControl fullWidth>
                <InputLabel id="fields-label" shrink>
                  Fields (Select multiple)
                </InputLabel>
                <Box sx={{ mt: 1 }}>
                  <Select
                    isMulti
                    name="fields"
                    options={fieldOptions}
                    value={formData.fields}
                    onChange={handleFieldsChange}
                    styles={selectStyles}
                    placeholder="Select fields..."
                    isClearable
                    isSearchable
                  />
                </Box>
                <FormHelperText>
                  All fields are selected by default. You can search and select/deselect fields.
                </FormHelperText>
              </FormControl>

              {error && (
                <Alert severity="error" onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" onClose={() => setSuccess('')}>
                  {success}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading || !isFormValid()}
                sx={{ py: 1.5, mt: 1 }}
              >
                {loading ? 'Downloading...' : 'Download Data'}
              </Button>

              {downloadUrl && (
                <Button
                  href={downloadUrl}
                  download
                  variant="contained"
                  color="success"
                  fullWidth
                  size="large"
                  component="a"
                  sx={{ py: 1.5 }}
                >
                  Download JSON File
                </Button>
              )}
              </Box>
            </form>
          </LocalizationProvider>

          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'semibold' }}>
              Default Time Range
            </Typography>
            <Typography variant="body2" color="text.secondary">
              January 1, 2026, 10:00 AM - 10:30 AM (CST)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              UTC: 2026-01-01T16:00:00Z - 2026-01-01T16:30:00Z
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
