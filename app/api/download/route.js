import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'public', 'downloads');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Generate filename
    const safeStart = startTimestamp.replace(/[:+]/g, '_');
    const filename = `sensor_${sensorIndex}_${safeStart}.json`;
    const filePath = path.join(dataDir, filename);

    // Save file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    // Return download URL
    const downloadUrl = `/downloads/${filename}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      filename,
      dataPoints: data.data?.length || 0,
    });
  } catch (error) {
    console.error('Error downloading data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download data' },
      { status: 500 }
    );
  }
}

