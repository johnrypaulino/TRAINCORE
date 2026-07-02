/* ═════════════════════════════════════════════════════════════════════
   TRAINCORE FITNESS DASHBOARD - STRAVA API INTEGRATION
   
   This file handles:
   - Strava OAuth authentication flow
   - API credential management
   - Activity fetching and processing
   - Token management and refresh
   ═════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// STRAVA CREDENTIALS - Save and manage API credentials
// ─────────────────────────────────────────────────────────────────────────
function saveCredentials() {
  const clientId = document.getElementById('clientIdInput').value.trim();
  const clientSecret = document.getElementById('clientSecretInput').value.trim();
  
  // Validate both fields are filled
  if (!clientId || !clientSecret || clientSecret === '••••••••') {
    alert('Please enter both your Client ID and Client Secret.');
    return;
  }
  
  // Save to local storage for future use
  stravaCredentials = { clientId, clientSecret };
  localStorage.setItem('stravaCredentials', JSON.stringify(stravaCredentials));
  document.getElementById('credsSaved').style.display = 'block';
  
  // Automatically redirect to Strava for authorization
  setTimeout(() => {
    handleStravaClick();
  }, 500);
}

// ─────────────────────────────────────────────────────────────────────────
// STRAVA OAUTH - Handle connection/disconnection and token exchange
// ─────────────────────────────────────────────────────────────────────────

/**
 * Handle Strava connect/disconnect button click
 * If connected: logs out and clears token
 * If not connected: initiates OAuth flow
 */
function handleStravaClick() {
  if (stravaToken) {
    // ── DISCONNECT: Remove token and reset UI ──
    console.log('🔌 Disconnecting from Strava...');
    localStorage.removeItem('stravaToken');
    stravaToken = null;
    setStravaDisconnected();
    resetRunningUI();
    return;
  }
  
  if (!stravaCredentials) {
    alert('Please enter and save your Strava API credentials first (see the setup section below).');
    return;
  }
  
  // ── CONNECT: Redirect to Strava OAuth page ──
  console.log('🔗 Redirecting to Strava OAuth...');
  const redirectUri = window.location.origin + window.location.pathname;
  const scope = 'activity:read_all';  // Read-only access to activities
  const url = `https://www.strava.com/oauth/authorize?client_id=${stravaCredentials.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
  window.location.href = url;
}

/**
 * Exchange OAuth authorization code for access token
 * @param {string} code - Authorization code from Strava
 */
async function exchangeCode(code) {
  if (!stravaCredentials) return;
  
  const runsList = document.getElementById('runsList');
  runsList.innerHTML = '<div class="loading"><span class="spinner"></span>Connecting to Strava…</div>';
  
  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: stravaCredentials.clientId,
        client_secret: stravaCredentials.clientSecret,
        code,
        grant_type: 'authorization_code'
      })
    });
    
    const data = await res.json();
    if (data.access_token) {
      console.log('✓ Strava authentication successful');
      localStorage.setItem('stravaToken', JSON.stringify(data));  // Save token + refresh token
      stravaToken = data.access_token;
      setStravaConnected();
      fetchStravaActivities();
    } else {
      runsList.innerHTML = `<div class="error-msg">Auth failed: ${data.message || 'Unknown error'}. Check your Client ID and Secret.</div>`;
    }
  } catch (e) {
    console.error('Auth error:', e);
    runsList.innerHTML = `<div class="error-msg">Connection error: ${e.message}</div>`;
  }
}

/**
 * Refresh expired access token using refresh_token
 * @param {string} refreshToken - Refresh token from previous auth
 */
async function refreshToken(refreshToken) {
  if (!stravaCredentials) return;
  
  try {
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: stravaCredentials.clientId,
        client_secret: stravaCredentials.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    const data = await res.json();
    if (data.access_token) {
      console.log('🔄 Token refreshed successfully');
      localStorage.setItem('stravaToken', JSON.stringify(data));
      stravaToken = data.access_token;
      setStravaConnected();
      fetchStravaActivities();
    }
  } catch (e) {
    console.error('Refresh error:', e);
    setStravaDisconnected();
  }
}

// ─────────────────────────────────────────────────────────────────────────
// UI STATE MANAGEMENT - Update UI based on connection status
// ─────────────────────────────────────────────────────────────────────────

/**
 * Update UI when Strava is successfully connected
 */
function setStravaConnected() {
  console.log('✓ Strava connected - showing data sections');
  document.getElementById('stravaBtn').classList.add('connected');
  document.getElementById('stravaBtnText').textContent = 'Strava Connected ✓';
  document.getElementById('stravaSetup').style.display = 'none';    // Hide setup instructions
  document.getElementById('summaryStrip').style.display = 'grid';   // Show stats
  document.getElementById('runningSection').style.display = 'grid'; // Show running
  document.getElementById('mapSection').style.display = 'block';    // Show map
  document.getElementById('liftingSection').style.display = 'block'; // Show lifting
}

/**
 * Update UI when Strava is disconnected
 */
function setStravaDisconnected() {
  console.log('✗ Strava disconnected - hiding data sections');
  document.getElementById('stravaBtn').classList.remove('connected');
  document.getElementById('stravaBtnText').textContent = 'Connect Strava';
  document.getElementById('stravaSetup').style.display = 'block';   // Show setup
  document.getElementById('summaryStrip').style.display = 'none';   // Hide stats
  document.getElementById('runningSection').style.display = 'none'; // Hide running
  document.getElementById('mapSection').style.display = 'none';     // Hide map
  document.getElementById('liftingSection').style.display = 'block'; // Keep lifting visible
  document.getElementById('runsList').innerHTML = '<div class="loading"><span class="spinner"></span>Connect Strava to load your runs…</div>';
}

/**
 * Clear all running-related UI when disconnecting
 */
function resetRunningUI() {
  // Clear stats cards
  document.getElementById('totalKm').innerHTML = '—<span>km</span>';
  document.getElementById('totalElevation').innerHTML = '—<span>m</span>';
  document.getElementById('avgHeartRate').innerHTML = '—<span>bpm</span>';
  document.getElementById('runsCount').textContent = '—';
  document.getElementById('avgCadence').innerHTML = '—<span>spm</span>';
  
  // Clear progress bars
  document.getElementById('goalText').textContent = '0 / 30 km';
  document.getElementById('goalBar').style.width = '0%';
  document.getElementById('z2Bar').style.width = '0%';
  document.getElementById('z2Pct').textContent = '—% of runs in Z2';
  
  // Clear charts
  document.getElementById('cadenceChart').innerHTML = '<div class="empty-state" style="width:100%;font-size:0.78rem;">No data yet</div>';
  document.getElementById('runsList').innerHTML = '<div class="loading"><span class="spinner"></span>Connect Strava to load your runs…</div>';
  
  // Clear map
  if (window.stravaMap) {
    window.stravaMap.remove();
    window.stravaMap = null;
  }
  document.getElementById('runMap').style.display = 'none';
  document.getElementById('mapLegend').style.display = 'none';
  document.getElementById('mapEmpty').style.display = 'none';
}

// ─────────────────────────────────────────────────────────────────────────
// STRAVA API - Fetch and process activities
// ─────────────────────────────────────────────────────────────────────────

/**
 * Fetch this week's runs + recent activities for cadence chart from Strava API
 */
async function fetchStravaActivities() {
  const runsList = document.getElementById('runsList');
  runsList.innerHTML = '<div class="loading"><span class="spinner"></span>Loading activities...</div>';

  try {
    // Get this week's Monday to filter activities
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const afterTs = Math.floor(monday.getTime() / 1000);

    // Fetch this week's activities
    console.log('📡 Fetching this weeks activities from Strava...');
    const weekRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${afterTs}&per_page=20`,
      { headers: { Authorization: `Bearer ${stravaToken}` } }
    );
    const weekActivities = await weekRes.json();
    if (!Array.isArray(weekActivities)) throw new Error(weekActivities.message || 'API error');

    // Fetch last ~14 activities for cadence trend
    const recentRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=14`,
      { headers: { Authorization: `Bearer ${stravaToken}` } }
    );
    const recentActivities = await recentRes.json();

    processActivities(weekActivities, Array.isArray(recentActivities) ? recentActivities : weekActivities);
  } catch (e) {
    console.error('Strava API error:', e);
    runsList.innerHTML = `<div class="error-msg">Failed to load activities: ${e.message}</div>`;
  }
}

/**
 * Process and display Strava activity data
 * Updates all stats, charts, maps, and Zone 2 tracking
 * @param {Array} weekRuns - Activities from this week
 * @param {Array} recentAll - Recent activities for trends
 */
function processActivities(weekRuns, recentAll) {
  // Filter to runs only (exclude cycling, swimming, etc)
  const runs = weekRuns.filter(a => a.type === 'Run' || a.sport_type === 'Run');
  const recentRuns = recentAll.filter(a => a.type === 'Run' || a.sport_type === 'Run').slice(0, 7);
  
  // Store activities globally for detail view modal
  stravaActivities = runs;

  // ── Calculate summary statistics ──
  const totalKm = runs.reduce((s, a) => s + a.distance / 1000, 0);
  const totalElevation = runs.reduce((s, a) => s + (a.total_elevation_gain || 0), 0);
  const runsCount = runs.length;
  const cadences = recentRuns.filter(a => a.average_cadence > 0).map(a => Math.round(a.average_cadence * 2));
  const avgCadence = cadences.length ? Math.round(cadences.reduce((s, c) => s + c, 0) / cadences.length) : null;
  
  // ── Heart Rate calculations ──
  const heartRates = runs.filter(a => a.average_heartrate > 0).map(a => Math.round(a.average_heartrate));
  const avgHeartRate = heartRates.length ? Math.round(heartRates.reduce((s, h) => s + h, 0) / heartRates.length) : null;

  // ── Zone 2 calculation (aerobic training: HR 120-150 bpm) ──
  const z2Runs = runs.filter(a => a.average_heartrate >= Z2_HR_MIN && a.average_heartrate <= Z2_HR_MAX);
  const z2Pct = runs.length ? Math.round((z2Runs.length / runs.length) * 100) : 0;

  // ── Update summary card stats ──
  console.log(`📊 Stats: ${totalKm.toFixed(1)}km, ${runsCount} runs, Avg HR: ${avgHeartRate} bpm, Z2: ${z2Pct}%`);
  
  document.getElementById('totalKm').innerHTML = `${totalKm.toFixed(1)}<span>km</span>`;
  document.getElementById('totalElevation').innerHTML = `${Math.round(totalElevation)}<span>m</span>`;
  document.getElementById('runsCount').textContent = runsCount;
  document.getElementById('goalText').textContent = `${totalKm.toFixed(1)} / ${WEEKLY_GOAL_KM} km`;
  document.getElementById('goalBar').style.width = `${Math.min(100, (totalKm / WEEKLY_GOAL_KM) * 100)}%`;
  
  if (avgCadence) {
    document.getElementById('avgCadence').innerHTML = `${avgCadence}<span>spm</span>`;
  }
  if (avgHeartRate) {
    document.getElementById('avgHeartRate').innerHTML = `${avgHeartRate}<span>bpm</span>`;
  }
  
  // Update Zone 2 compliance tracking
  document.getElementById('z2Bar').style.width = `${z2Pct}%`;
  document.getElementById('z2Pct').textContent = `${z2Pct}% of runs in Zone 2`;
  
  // Log Zone 2 stats for progression tracking
  trackZone2Progress(z2Runs.length, runs.length, avgHeartRate);

  // ── Render individual runs list ──
  const runsList = document.getElementById('runsList');
  if (runs.length === 0) {
    runsList.innerHTML = '<div class="empty-state"><div class="icon">🏃</div>No runs logged yet this week.</div>';
  } else {
    runsList.innerHTML = runs.map((a, idx) => {
      const km = (a.distance / 1000).toFixed(2);
      const paceS = a.distance > 0 ? (a.elapsed_time / (a.distance / 1000)) : 0;
      const paceMin = Math.floor(paceS / 60);
      const paceSec = Math.round(paceS % 60).toString().padStart(2, '0');
      const isZ2 = a.average_heartrate >= Z2_HR_MIN && a.average_heartrate <= Z2_HR_MAX;
      const hasHR = a.average_heartrate > 0;
      const elevation = a.total_elevation_gain || 0;
      const date = new Date(a.start_date_local);
      const dateStr = date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
      const cadenceSpm = a.average_cadence > 0 ? Math.round(a.average_cadence * 2) : null;
      
      return `
        <div class="run-item" data-activity-idx="${idx}" style="cursor:pointer;">
          <div class="run-left">
            <span class="run-icon">🏃</span>
            <div>
              <div class="run-name">${a.name}</div>
              <div class="run-date">${dateStr}</div>
            </div>
          </div>
          <div class="run-stats">
            <div class="run-stat"><span class="label">Dist</span>${km} km</div>
            <div class="run-stat"><span class="label">Pace</span>${paceMin}:${paceSec}/km</div>
            ${fieldVisibility.showElev && elevation > 0 ? `<div class="run-stat"><span class="label">Elev</span>${Math.round(elevation)} m</div>` : ''}
            ${fieldVisibility.showHR && hasHR ? `<div class="run-stat"><span class="label">HR</span>${Math.round(a.average_heartrate)} bpm</div>` : ''}
            ${fieldVisibility.showCadence && cadenceSpm ? `<div class="run-stat"><span class="label">Cadence</span>${cadenceSpm} spm</div>` : ''}
            ${fieldVisibility.showZ2 && hasHR ? `<span class="z2-badge ${isZ2 ? 'z2-yes' : 'z2-no'}">${isZ2 ? 'Z2 ✓' : 'Non-Z2'}</span>` : ''}
          </div>
        </div>`;
    }).join('');  
    // Attach click handlers to run items
    document.querySelectorAll('.run-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = item.getAttribute('data-activity-idx');
        showActivityDetail(idx);
      });
    });
  }

  // ── Render route map ──
  renderRunMap(runs);

  // ── Render cadence trend chart ──
  renderCadenceChart(recentRuns);
}

// ─────────────────────────────────────────────────────────────────────────
// AUTO-INITIALIZATION - Check Strava connection on page load
// ─────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Checking Strava connection status...');
  
  // ─── STEP 1: Check if returning from Strava OAuth callback ───
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code && stravaCredentials) {
    console.log('🔗 OAuth redirect detected, exchanging code...');
    exchangeCode(code);
    history.replaceState({}, '', window.location.pathname); // Clean URL
    return;
  }

  // ─── STEP 2: Try to use saved token if still valid ───
  const saved = localStorage.getItem('stravaToken');
  if (saved) {
    const tokenData = JSON.parse(saved);
    // Check if token hasn't expired yet
    if (tokenData.expires_at * 1000 > Date.now()) {
      console.log('✓ Using saved Strava token');
      stravaToken = tokenData.access_token;
      setStravaConnected();
      fetchStravaActivities();
    } else if (tokenData.refresh_token) {
      // Token expired, try refreshing it
      console.log('🔄 Token expired, attempting refresh...');
      refreshToken(tokenData.refresh_token);
    }
  } else {
    setStravaDisconnected();
  }

  // ─── STEP 3: Pre-fill saved credentials if they exist ───
  if (stravaCredentials) {
    const clientIdInput = document.getElementById('clientIdInput');
    const clientSecretInput = document.getElementById('clientSecretInput');
    const credsSaved = document.getElementById('credsSaved');
    if (clientIdInput) clientIdInput.value = stravaCredentials.clientId;
    if (clientSecretInput) clientSecretInput.value = '••••••••';
    if (credsSaved) credsSaved.style.display = 'block';
  }
});
