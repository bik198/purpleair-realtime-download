# PurpleAir Data Downloader

A Next.js web application for downloading historical sensor data from PurpleAir.

## Features

- Simple web interface for downloading PurpleAir sensor data
- Input fields for:
  - Sensor Index
  - API Key
  - Start Timestamp (ISO 8601 format)
  - End Timestamp (ISO 8601 format)
- Downloads data in JSON format
- Default time range: January 1, 2026, 10:00 AM - 10:30 AM (CST)

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd purpleair-web
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter your PurpleAir sensor index
2. Enter your PurpleAir API key
3. Enter start and end timestamps in ISO 8601 format (UTC)
   - Example: `2026-01-01T16:00:00Z`
4. Click "Download Data"
5. Once downloaded, click "Download JSON File" to save the data

## API Endpoint

The application uses the PurpleAir API:
- Endpoint: `https://api.purpleair.com/v1/sensors/{sensor_index}/history`
- Fields: `pm1.0_atm,pm1.0_cf_1,pm2.5_atm,pm10.0_atm,humidity,temperature,pressure,scattering_coefficient,visual_range,0.3_um_count`

## Project Structure

```
purpleair-web/
├── app/
│   ├── api/
│   │   └── download/
│   │       └── route.js    # API route for downloading data
│   ├── page.js              # Main page component
│   └── layout.js            # Root layout
├── public/
│   └── downloads/          # Downloaded JSON files (created automatically)
└── package.json
```

## Building for Production

```bash
npm run build
npm start
```

## Notes

- Downloaded files are saved in `public/downloads/`
- Timestamps must be in UTC (ISO 8601 format with Z)
- The API key is sent securely to the server-side API route
