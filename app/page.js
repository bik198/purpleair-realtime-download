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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
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

const SELECT_ALL_VALUE = '__select_all__';

const fieldOptions = [
  { value: SELECT_ALL_VALUE, label: 'Select All Fields' },
  ...ALL_FIELDS.map((field) => ({
    value: field,
    label: field,
  })),
];

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
  const [downloadedData, setDownloadedData] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleStartTimeChange = (newValue) => {
    setFormData({
      ...formData,
      startTimestamp: newValue,
      endTimestamp: null, // Reset end timestamp when start changes
    });
    setError('');
    setSuccess('');
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
  };

  const handleFieldsChange = (selectedOptions) => {
    const options = selectedOptions || [];
    
    // Check if "Select All" is in the selection
    const hasSelectAll = options.some(option => option.value === SELECT_ALL_VALUE);
    
    // If "Select All" was clicked, select all fields
    if (hasSelectAll) {
      // Select all fields (excluding "Select All" from the stored value)
      const allFieldsSelected = fieldOptions.filter(opt => opt.value !== SELECT_ALL_VALUE);
      setFormData({
        ...formData,
        fields: allFieldsSelected,
      });
    } 
    // Normal selection/deselection - exclude "Select All" from stored value
    else {
      const filteredOptions = options.filter(opt => opt.value !== SELECT_ALL_VALUE);
      setFormData({
        ...formData,
        fields: filteredOptions,
      });
    }
    
    setError('');
    setSuccess('');
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
    setDownloadedData(null);

    // Convert selected options to array of field values, excluding "Select All"
    const fieldValues = formData.fields
      .map((option) => option.value)
      .filter((value) => value !== SELECT_ALL_VALUE);
    
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

      setSuccess('Data downloaded successfully! You can view the data in the table below. You can also download the data in JSON format or CSV format. ');
      setDownloadUrl(data.downloadUrl);
      setDownloadedData(data.data);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to convert data to CSV format
  const convertToCSV = (data) => {
    if (!data || !data.fields || !data.data) {
      return '';
    }

    // Create header row
    const header = data.fields.join(',');
    
    // Create data rows
    const rows = data.data.map(row => {
      return row.map(cell => {
        // Escape commas and quotes in CSV
        const cellValue = String(cell);
        if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
          return `"${cellValue.replace(/"/g, '""')}"`;
        }
        return cellValue;
      }).join(',');
    });

    return [header, ...rows].join('\n');
  };

  // Function to download CSV
  const handleDownloadCSV = () => {
    if (!downloadedData) return;

    const csvContent = convertToCSV(downloadedData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename similar to JSON file
    const safeStart = formData.startTimestamp.utc().format('YYYY-MM-DDTHH:mm:ss[Z]').replace(/[:+]/g, '_');
    const filename = `sensor_${formData.sensorIndex}_${safeStart}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              PurpleAir Data Downloader
            </Typography>
            <Typography variant="body1" color="text.secondary">
            Download  real-time observation sensor data from PurpleAir sensor
            </Typography>
          </Box>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
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
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
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
                </Box>

              <FormControl fullWidth>
                <InputLabel id="fields-label" shrink>
                  Fields (Select multiple)
                </InputLabel>
                <Box sx={{ mt: 1 }}>
                  <Select
                    isMulti
                    name="fields"
                    options={fieldOptions}
                    value={
                      formData.fields.length === ALL_FIELDS.length
                        ? [{ value: SELECT_ALL_VALUE, label: 'Select All Fields' }, ...formData.fields]
                        : formData.fields
                    }
                    onChange={handleFieldsChange}
                    styles={selectStyles}
                    placeholder="Select fields..."
                    isClearable
                    isSearchable
                  />
                </Box>
                <FormHelperText>
                  All fields are selected by default. You can search and select/deselect fields. Use &quot;Select All Fields&quot; to quickly select all options.
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

              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  disabled={loading || !isFormValid()}
                  sx={{ py: 1.5 }}
                >
                  {loading ? 'Downloading...' : 'Download Data'}
                </Button>

                {downloadUrl && (
                  <>
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
                    <Button
                      onClick={handleDownloadCSV}
                      variant="contained"
                      color="info"
                      fullWidth
                      size="large"
                      disabled={!downloadedData}
                      sx={{ py: 1.5 }}
                    >
                      Download CSV File
                    </Button>
                  </>
                )}
              </Box>
              </Box>
            </form>
          </LocalizationProvider>

          {downloadedData && (
            <Box sx={{ mt: 4 }}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    Downloaded Data
                  </Typography>
                  
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={`Sensor Index: ${downloadedData.sensor_index || 'N/A'}`} 
                      color="primary" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`Data Points: ${downloadedData.data?.length || 0}`} 
                      color="secondary" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={`API Version: ${downloadedData.api_version || 'N/A'}`} 
                      variant="outlined" 
                    />
                  </Box>

                  {downloadedData.data && downloadedData.data.length > 0 && (
                    <TableContainer sx={{ maxHeight: 600, mt: 2 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            {downloadedData.fields?.map((field, index) => (
                              <TableCell
                                key={index}
                                sx={{
                                  fontWeight: 'bold',
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? theme.palette.grey[800] 
                                    : theme.palette.grey[200],
                                }}
                              >
                                {field}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {downloadedData.data.map((row, rowIndex) => (
                            <TableRow key={rowIndex} hover>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex}>
                                  {typeof cell === 'number' 
                                    ? cell.toLocaleString(undefined, { 
                                        maximumFractionDigits: 2 
                                      })
                                    : String(cell)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}

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
