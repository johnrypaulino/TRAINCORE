# TRAINCORE - Fitness Dashboard

A comprehensive fitness tracking dashboard that integrates with Strava to monitor running metrics, zone 2 aerobic training, and lifting progression.

## Features

- **Strava Integration** - OAuth authentication with Strava API v3
- **Run Tracking** - Weekly distance goals, pace, elevation, heart rate monitoring
- **Zone 2 Optimization** - Track aerobic training compliance (HR 120-150 bpm)
- **Cadence Analysis** - Monitor step cadence trends with visual charts
- **Route Visualization** - Interactive map view of all routes using Leaflet.js
- **Lifting Progression** - Log exercises, track personal records and volume progression
- **Heart Rate Analytics** - HR per km, average HR, zone-based classification
- **Responsive Design** - Works on desktop and mobile devices

## Technology Stack

- **Frontend**: HTML5, CSS3, vanilla JavaScript
- **APIs**: Strava API v3 (OAuth 2.0)
- **Maps**: Leaflet.js v1.9.4
- **Storage**: Browser localStorage (no backend required)

## Setup Instructions

### 1. Get Strava API Credentials

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new API application (use any name)
3. Set callback domain to `johnrypaulino.github.io`
4. Copy your **Client ID** and **Client Secret**

### 2. Run Locally (Optional)

**Note**: This dashboard is designed to run on GitHub Pages at https://johnrypaulino.github.io/TRAINCORE/

For local development, you can still test it locally:

**Option A: Python HTTP Server**
```bash
cd TRAINCORE
python -m http.server 8000
# Open http://localhost:8000
# Note: Create a separate Strava app with callback domain "localhost" for local testing
```

**Option B: Node.js HTTP Server**
```bash
cd TRAINCORE
npx http-server
# Opens automatically
# Note: Create a separate Strava app with callback domain "localhost" for local testing
```

### 3. Access on GitHub Pages

Visit: **https://johnrypaulino.github.io/TRAINCORE/**

### 4. Authorize with Strava

1. Paste your Client ID and Client Secret into the dashboard
2. Click "Save Credentials"
3. Authorize the app on Strava
4. Your runs and activity data will load automatically

## Deployment on GitHub Pages

### Enable GitHub Pages

1. Go to repository Settings → Pages
2. Select "Deploy from a branch"
3. Choose `main` branch → `/ (root)`
4. Your site will be live at: `https://johnrypaulino.github.io/TRAINCORE/`

### Update Strava Redirect URI

**Important**: When deploying on GitHub Pages, you must update your Strava API app settings:

1. Go back to [Strava API Settings](https://www.strava.com/settings/api)
2. Change the callback domain from `localhost` to your GitHub Pages URL
3. Set it to: `https://johnrypaulino.github.io`
4. Update your dashboard credentials with the same Client ID and Secret

## Project Structure

```
TRAINCORE/
├── index.html                    # Main HTML entry point
├── styles/
│   └── main.css                 # Complete stylesheet
├── scripts/
│   ├── init.js                  # State management & initialization
│   ├── strava.js                # OAuth & Strava API integration
│   ├── progressionTracking.js   # Zone 2 & lifting progression
│   └── ui.js                    # UI utilities & rendering
└── .vscode/
    └── launch.json              # VSCode debug configuration
```

## Key Metrics

- **Weekly Distance Goal**: 30 km
- **Zone 2 HR Range**: 120-150 bpm
- **Cadence Target**: 170 steps/min
- **Zone 2 Weekly Target**: 80% of runs

## Features in Detail

### Zone 2 Optimization
Tracks which runs fall within aerobic training zone (120-150 bpm) to help optimize training for endurance building.

### Lifting Progression
- Log exercises with sets, reps, and weight
- Automatically calculates training volume (sets × reps × weight)
- Tracks personal records and progression trends
- Shows improvement indicators (📈📉➡️)

### Heart Rate Analytics
- HR per km calculation (like Strava)
- Zone classification (Zone 2 vs High Intensity)
- Weekly average heart rate tracking
- HR trend monitoring

### Activity Detail Modal
Click any run to view comprehensive details:
- Distance and duration
- Pace per kilometer
- Elevation gain and elevation per km
- Average heart rate and HR per km
- Zone 2 status indicator
- Direct link to full activity on Strava

## Settings & Customization

Use the settings icon (⚙️) to toggle visibility of:
- Elevation gain per run
- Heart rate metrics
- Cadence data
- Zone 2 badges
- Cadence trend chart
- Route map

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Requires ES6 support (all modern browsers)

## Notes

- All data is stored locally in browser localStorage
- No backend server required
- OAuth tokens are securely stored
- Refresh tokens enable persistent authentication

## Troubleshooting

**"Can't access GitHub Pages"**
- Wait 1-2 minutes for GitHub Pages to build
- Check Settings → Pages to confirm deployment status
- Ensure redirect URI matches your GitHub Pages URL

**"Strava authorization fails"**
- Verify callback domain in Strava API settings matches your URL
- Use `localhost` for local development
- Use your GitHub Pages URL for production

**"Runs not loading"**
- Check browser console for API errors
- Verify Strava token hasn't expired
- Try re-authorizing by clearing credentials and reconnecting

## License

MIT License - Feel free to fork, modify, and deploy!

## Author

Created by Matthew Paulino - TRAINCORE Training System

---

**Live Demo**: https://johnrypaulino.github.io/TRAINCORE/
