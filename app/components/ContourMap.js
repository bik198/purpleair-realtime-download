'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Box, Container, Paper, Typography, CircularProgress, Alert } from '@mui/material';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '600px' }}>
      <CircularProgress />
    </Box>
  ),
});

// Texas approximate bounds
const TEXAS_BOUNDS = {
  minLat: 25.8,
  maxLat: 36.5,
  minLon: -106.6,
  maxLon: -93.5,
};

export default function ContourMap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load AOD data
    const loadData = async () => {
      try {
        const response = await fetch('/data/AOD_points.json');
        if (!response.ok) {
          throw new Error('Failed to load AOD data');
        }
        const jsonData = await response.json();
        setData(jsonData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Process data for Texas and create contour grid
  const plotData = useMemo(() => {
    if (!data || !data.points) return null;

    // Filter points for Texas
    const texasPoints = data.points.filter(
      (point) =>
        point.latitude >= TEXAS_BOUNDS.minLat &&
        point.latitude <= TEXAS_BOUNDS.maxLat &&
        point.longitude >= TEXAS_BOUNDS.minLon &&
        point.longitude <= TEXAS_BOUNDS.maxLon
    );

    if (texasPoints.length === 0) return null;

    // Create a grid for contour plotting
    // Use a reasonable grid resolution
    const gridSize = 100;
    const latStep = (TEXAS_BOUNDS.maxLat - TEXAS_BOUNDS.minLat) / gridSize;
    const lonStep = (TEXAS_BOUNDS.maxLon - TEXAS_BOUNDS.minLon) / gridSize;

    // Create grid arrays
    const lats = [];
    const lons = [];
    for (let i = 0; i <= gridSize; i++) {
      lats.push(TEXAS_BOUNDS.minLat + i * latStep);
      lons.push(TEXAS_BOUNDS.minLon + i * lonStep);
    }

    // Interpolate AOD values onto grid using inverse distance weighting
    const aodGrid = [];
    for (let i = 0; i <= gridSize; i++) {
      const row = [];
      for (let j = 0; j <= gridSize; j++) {
        const gridLat = lats[i];
        const gridLon = lons[j];

        // Find nearby points and interpolate
        let sumWeightedAOD = 0;
        let sumWeights = 0;
        const maxDistance = 0.5; // degrees

        for (const point of texasPoints) {
          const distance = Math.sqrt(
            Math.pow(point.latitude - gridLat, 2) + Math.pow(point.longitude - gridLon, 2)
          );

          if (distance < maxDistance) {
            const weight = 1 / (distance + 0.01); // Add small value to avoid division by zero
            sumWeightedAOD += point.AOD * weight;
            sumWeights += weight;
          }
        }

        const interpolatedAOD = sumWeights > 0 ? sumWeightedAOD / sumWeights : null;
        row.push(interpolatedAOD);
      }
      aodGrid.push(row);
    }

    return {
      lats,
      lons,
      aodGrid,
      pointCount: texasPoints.length,
    };
  }, [data]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
          py: 6,
          px: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
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
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  if (!plotData) {
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
          <Alert severity="warning">No data points found for Texas region.</Alert>
        </Container>
      </Box>
    );
  }

  const plotlyData = [
    {
      type: 'contour',
      x: plotData.lons,
      y: plotData.lats,
      z: plotData.aodGrid,
      colorscale: [
        [0, 'blue'],
        [0.1, 'cyan'],
        [0.2, 'green'],
        [0.3, 'yellow'],
        [0.4, 'orange'],
        [0.5, 'red'],
      ],
      zmin: 0,
      zmax: 0.5,
      contours: {
        coloring: 'heatmap',
        showlines: true,
        start: 0,
        end: 0.5,
        size: 0.02, // More contour lines (every 0.02 AOD units)
        showlabels: true, // Show labels on contour lines
        labelfont: {
          size: 10,
          color: 'white',
        },
      },
      colorbar: {
        title: 'AOD',
        titleside: 'right',
        tickmode: 'linear',
        tick0: 0,
        dtick: 0.1,
      },
    },
  ];

  const layout = {
    title: {
      text: 'AOD Contour Map - Texas',
      font: { size: 24 },
    },
    xaxis: {
      title: {
        text: 'Longitude (°)',
        font: { size: 16, weight: 'bold' },
      },
      range: [TEXAS_BOUNDS.minLon, TEXAS_BOUNDS.maxLon],
      showgrid: true,
      gridcolor: 'rgba(128, 128, 128, 0.2)',
    },
    yaxis: {
      title: {
        text: 'Latitude (°)',
        font: { size: 16, weight: 'bold' },
      },
      range: [TEXAS_BOUNDS.minLat, TEXAS_BOUNDS.maxLat],
      showgrid: true,
      gridcolor: 'rgba(128, 128, 128, 0.2)',
    },
    width: 1200,
    height: 800,
    margin: { l: 80, r: 60, t: 80, b: 80 },
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
      <Container maxWidth="xl">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Aerosol Optical Depth (AOD) visualization for the state of Texas
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Data points: {plotData.pointCount.toLocaleString()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Plot data={plotlyData} layout={layout} config={{ responsive: true }} />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
