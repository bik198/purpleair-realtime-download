import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { sensorIndex, apiKey, startTimestamp, endTimestamp, fields } = await request.json();

    // Validate inputs
    if (!sensorIndex || !apiKey || !startTimestamp || !endTimestamp) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate fields array
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: 'At least one field must be selected' },
        { status: 400 }
      );
    }

    // PurpleAir API configuration
    const fieldsString = fields.join(',');
    const average = 0;
    const baseUrl = `https://api.purpleair.com/v1/sensors/${sensorIndex}/history`;
    const apiUrl = `${baseUrl}?average=${average}&fields=${fieldsString}&start_timestamp=${startTimestamp}&end_timestamp=${endTimestamp}`;

    // Fetch data from PurpleAir API
    const response = await fetch(apiUrl, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.description || `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Sort data by timestamp in ascending order
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      // Find the index of time_stamp field (usually first field)
      const timeStampIndex = data.fields?.findIndex(field => 
        field === 'time_stamp' || field === 'timestamp'
      ) ?? 0;

      data.data.sort((a, b) => {
        const timeA = a[timeStampIndex];
        const timeB = b[timeStampIndex];
        
        // Handle both string timestamps (ISO format) and numeric timestamps
        if (typeof timeA === 'string' && typeof timeB === 'string') {
          return new Date(timeA).getTime() - new Date(timeB).getTime();
        } else if (typeof timeA === 'number' && typeof timeB === 'number') {
          return timeA - timeB;
        } else {
          // Fallback: convert to numbers
          const numA = typeof timeA === 'string' ? new Date(timeA).getTime() : timeA;
          const numB = typeof timeB === 'string' ? new Date(timeB).getTime() : timeB;
          return numA - numB;
        }
      });
    }

    // Generate filename
    const safeStart = startTimestamp.replace(/[:+]/g, '_');
    const filename = `sensor_${sensorIndex}_${safeStart}.json`;

    // Return data directly (no file system operations for serverless compatibility)
    return NextResponse.json({
      success: true,
      filename,
      dataPoints: data.data?.length || 0,
      data: data, // Include the full data in the response
      jsonContent: JSON.stringify(data, null, 2), // Include formatted JSON string for download
    });
  } catch (error) {
    console.error('Error downloading data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download data' },
      { status: 500 }
    );
  }
}

