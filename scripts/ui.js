/* ═════════════════════════════════════════════════════════════════════
   TRAINCORE FITNESS DASHBOARD - UI UTILITIES & HELPERS
   
   This file handles:
   - Chart rendering (cadence, maps)
   - Lifting management and modal
   - Settings and field visibility
   - Map rendering with Leaflet
   ═════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// ACTIVITY DETAIL MODAL - Show comprehensive stats for a single run
// ─────────────────────────────────────────────────────────────────────────

/**
 * Display detailed information about a specific activity
 * @param {number} index - Index of activity in stravaActivities array
 */
function showActivityDetail(index) {
  const idx = parseInt(index);
  const activity = stravaActivities[idx];
  if (!activity) return;
  
  // Calculate metrics
  const km = (activity.distance / 1000).toFixed(2);
  const timeS = activity.elapsed_time;
  const timeMin = Math.floor(timeS / 60);
  const timeH = Math.floor(timeMin / 60);
  const timeM = timeMin % 60;
  const timeFmt = timeH > 0 ? `${timeH}h ${timeM}m` : `${timeM}m`;
  
  const paceS = activity.distance > 0 ? (timeS / (activity.distance / 1000)) : 0;
  const paceMin = Math.floor(paceS / 60);
  const paceSec = Math.round(paceS % 60).toString().padStart(2, '0');
  
  const elevation = activity.total_elevation_gain || 0;
  const cadenceSpm = activity.average_cadence > 0 ? Math.round(activity.average_cadence * 2) : null;
  const avgHR = activity.average_heartrate ? Math.round(activity.average_heartrate) : null;
  
  // HR per km calculation
  const hrPerKm = avgHR && activity.distance > 0 ? (avgHR / (activity.distance / 1000)).toFixed(2) : 'N/A';
  
  // Zone 2 status
  const isZ2 = avgHR && avgHR >= Z2_HR_MIN && avgHR <= Z2_HR_MAX;
  
  // Elevation per km
  const elevPerKm = activity.distance > 0 ? (elevation / (activity.distance / 1000)).toFixed(2) : 0;
  
  const date = new Date(activity.start_date_local);
  const dateStr = date.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  // Build modal content
  const modal = document.getElementById('activityDetailModal');
  const content = modal.querySelector('.activity-detail-content');
  
  content.innerHTML = `
    <div class="activity-detail-header">
      <div class="activity-detail-title">
        <h2>${activity.name}</h2>
        <div class="activity-detail-date">${dateStr}</div>
      </div>
    </div>
    
    <div class="activity-detail-grid">
      <!-- Main stats -->
      <div class="detail-stat-box">
        <div class="detail-stat-label">Distance</div>
        <div class="detail-stat-value">${km} <span>km</span></div>
      </div>
      
      <div class="detail-stat-box">
        <div class="detail-stat-label">Duration</div>
        <div class="detail-stat-value">${timeFmt}</div>
      </div>
      
      <div class="detail-stat-box">
        <div class="detail-stat-label">Pace</div>
        <div class="detail-stat-value">${paceMin}:<span class="pace-sec">${paceSec}</span> <span>/km</span></div>
      </div>
      
      <!-- Elevation stats -->
      <div class="detail-stat-box">
        <div class="detail-stat-label">Elevation</div>
        <div class="detail-stat-value">${Math.round(elevation)} <span>m</span></div>
      </div>
      
      <div class="detail-stat-box">
        <div class="detail-stat-label">Elevation/km</div>
        <div class="detail-stat-value">${elevPerKm} <span>m</span></div>
      </div>
      
      <!-- Heart Rate stats -->
      ${avgHR ? `
      <div class="detail-stat-box">
        <div class="detail-stat-label">Avg Heart Rate</div>
        <div class="detail-stat-value">${avgHR} <span>bpm</span></div>
      </div>
      
      <div class="detail-stat-box ${isZ2 ? 'z2-box' : ''}">
        <div class="detail-stat-label">HR/km</div>
        <div class="detail-stat-value">${hrPerKm}</div>
      </div>
      
      <div class="detail-stat-box ${isZ2 ? 'z2-box' : ''}">
        <div class="detail-stat-label">Zone Status</div>
        <div class="detail-stat-value ${isZ2 ? 'z2-status' : 'nonz2-status'}">${isZ2 ? 'Zone 2 ✓' : 'High Intensity'}</div>
      </div>
      ` : ''}
      
      <!-- Cadence stats -->
      ${cadenceSpm ? `
      <div class="detail-stat-box">
        <div class="detail-stat-label">Avg Cadence</div>
        <div class="detail-stat-value">${cadenceSpm} <span>spm</span></div>
      </div>
      ` : ''}
    </div>
    
    <div class="activity-detail-actions">
      <a href="https://www.strava.com/activities/${activity.id}" target="_blank" class="detail-link-btn">View on Strava →</a>
    </div>
  `;
  
  modal.classList.add('open');
}

/**
 * Close the activity detail modal
 */
function closeActivityDetail() {
  const modal = document.getElementById('activityDetailModal');
  modal.classList.remove('open');
}

// ─────────────────────────────────────────────────────────────────────────
// SETTINGS & FIELD VISIBILITY
// ─────────────────────────────────────────────────────────────────────────

function toggleSettings() {
  const modal = document.getElementById('settingsModal');
  modal.classList.toggle('open');
}

function updateFieldVisibility() {
  fieldVisibility = {
    showElev: document.getElementById('showElev').checked,
    showHR: document.getElementById('showHR').checked,
    showCadence: document.getElementById('showCadence').checked,
    showZ2: document.getElementById('showZ2').checked,
    showCadenceTrend: document.getElementById('showCadenceTrend').checked,
    showMap: document.getElementById('showMap').checked
  };
  localStorage.setItem('fieldVisibility', JSON.stringify(fieldVisibility));
  updateSectionVisibility();
  if (stravaToken) {
    fetchStravaActivities();
  }
}

function updateSectionVisibility() {
  fieldVisibility = {
    showElev: document.getElementById('showElev').checked,
    showHR: document.getElementById('showHR').checked,
    showCadence: document.getElementById('showCadence').checked,
    showZ2: document.getElementById('showZ2').checked,
    showCadenceTrend: document.getElementById('showCadenceTrend').checked,
    showMap: document.getElementById('showMap').checked
  };
  localStorage.setItem('fieldVisibility', JSON.stringify(fieldVisibility));
  
  if (stravaToken) {
    const cadenceCard = document.querySelector('.two-col > .card:last-child');
    if (cadenceCard) {
      cadenceCard.style.display = fieldVisibility.showCadenceTrend ? 'block' : 'none';
    }
    
    const mapSection = document.getElementById('mapSection');
    if (mapSection) {
      mapSection.style.display = fieldVisibility.showMap ? 'block' : 'none';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// CADENCE CHART - Render cadence trend for last 7 runs
// ─────────────────────────────────────────────────────────────────────────

/**
 * Render mini bar chart of cadence for last 7 runs
 * Color coding: Green (teal) if >= 170, yellow if 160-169, red if < 160
 */
function renderCadenceChart(runs) {
  const chart = document.getElementById('cadenceChart');
  if (runs.length === 0) { 
    chart.innerHTML = '<div class="empty-state" style="width:100%;font-size:0.78rem;">No data yet</div>'; 
    return; 
  }
  const MAX_H = 60;
  const maxCad = Math.max(...runs.map(r => r.average_cadence * 2), CADENCE_TARGET + 10);
  chart.innerHTML = runs.slice().reverse().map(r => {
    if (!r.average_cadence) return '';
    const spm = Math.round(r.average_cadence * 2);
    const h = Math.round((spm / maxCad) * MAX_H);
    const color = spm >= CADENCE_TARGET ? 'var(--teal)' : spm >= CADENCE_TARGET - 10 ? 'var(--yellow)' : 'var(--red)';
    const date = new Date(r.start_date_local);
    const label = date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    return `<div class="cad-bar-wrap">
      <div class="cad-bar" style="height:${h}px;background:${color};opacity:0.85;"></div>
      <div class="cad-label">${label}</div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────────────
// MAP - Polyline decoding and Leaflet rendering
// ─────────────────────────────────────────────────────────────────────────

/**
 * Decode Google's polyline algorithm format (used by Strava)
 */
function decodePolyline(encoded) {
  const inv = 1.0 / 1e5;
  let decoded = [];
  let previous = [0, 0];
  let i = 0;

  while (i < encoded.length) {
    let ll = [0, 0];
    for (let j = 0; j < 2; j++) {
      let shift = 0;
      let result = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(i++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      ll[j] = previous[j] + (result & 1 ? ~(result >> 1) : result >> 1);
      previous[j] = ll[j];
    }
    decoded.push([ll[0] * inv, ll[1] * inv]);
  }
  return decoded;
}

/**
 * Initialize and render the map with all runs
 */
function renderRunMap(runs) {
  const mapContainer = document.getElementById('runMap');
  const mapLegend = document.getElementById('mapLegend');
  const mapEmpty = document.getElementById('mapEmpty');

  const runsWithRoutes = runs.filter(r => r.map?.summary_polyline);

  if (runsWithRoutes.length === 0) {
    mapEmpty.style.display = 'block';
    mapContainer.style.display = 'none';
    mapLegend.style.display = 'none';
    return;
  }

  mapContainer.style.display = 'block';
  mapLegend.style.display = 'block';
  mapEmpty.style.display = 'none';

  if (window.stravaMap) {
    window.stravaMap.remove();
  }

  const firstRoute = decodePolyline(runsWithRoutes[0].map.summary_polyline);
  const map = L.map('runMap', { zoomControl: true }).setView(firstRoute[0], 12);
  window.stravaMap = map;

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  const colors = ['#1E7FD6', '#ff6b35', '#8b7cf8', '#ffd166', '#3ddc97', '#ff5e6c', '#00d9ff'];
  let bounds = L.latLngBounds();

  runsWithRoutes.forEach((run, idx) => {
    const route = decodePolyline(run.map.summary_polyline);
    const color = colors[idx % colors.length];

    const polyline = L.polyline(route, {
      color: color,
      weight: 3,
      opacity: 0.8,
      lineCap: 'round'
    }).bindPopup(`<strong>${run.name}</strong><br>${(run.distance / 1000).toFixed(2)} km`);

    polyline.addTo(map);

    route.forEach(point => bounds.extend(point));
  });

  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// LIFTING - Exercise logging and management
// ─────────────────────────────────────────────────────────────────────────

function switchSession(session, btn) {
  currentSession = session;
  document.querySelectorAll('.session-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderExercises();
}

function renderExercises() {
  const list = document.getElementById('exerciseList');
  const exercises = liftData[currentSession] || [];
  if (exercises.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="icon">🏋️</div>No exercises logged. Hit "+ Add Exercise" to start.</div>';
    document.getElementById('liftVolume').textContent = 'Total volume: — kg';
    updateLiftStats();
    return;
  }
  const totalVol = exercises.reduce((s, e) => s + e.sets * e.reps * e.weight, 0);
  document.getElementById('liftVolume').textContent = `Total volume: ${totalVol.toLocaleString()} kg`;
  list.innerHTML = exercises.map((e, i) => {
    logExerciseProgression(e.name, e.sets, e.reps, e.weight);
    return `
    <div class="exercise-item">
      <div>
        <div class="ex-name">${e.name}</div>
        <div class="ex-sets">${e.sets} sets × ${e.reps} reps @ ${e.weight} kg</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="ex-vol">${(e.sets * e.reps * e.weight).toLocaleString()} kg vol</div>
        <button class="del-btn" onclick="deleteExercise(${i})" title="Remove">✕</button>
      </div>
    </div>`}).join('');
  updateLiftStats();
}

function updateLiftStats() {
  const total = (liftData['A']?.length || 0) + (liftData['B']?.length || 0);
  const sessions = (liftData['A']?.length > 0 ? 1 : 0) + (liftData['B']?.length > 0 ? 1 : 0);
  document.getElementById('liftCount').textContent = sessions;
}

function openModal() { 
  document.getElementById('modalOverlay').classList.add('open'); 
  document.getElementById('exName').focus(); 
}

function closeModal() { 
  document.getElementById('modalOverlay').classList.remove('open'); 
  clearModal(); 
}

function clearModal() {
  ['exName','exSets','exReps','exWeight'].forEach(id => document.getElementById(id).value = '');
}

function addExercise() {
  const name = document.getElementById('exName').value.trim();
  const sets = parseInt(document.getElementById('exSets').value);
  const reps = parseInt(document.getElementById('exReps').value);
  const weight = parseFloat(document.getElementById('exWeight').value);
  if (!name || !sets || !reps || isNaN(weight)) { 
    alert('Please fill in all fields.'); 
    return; 
  }
  if (!liftData[currentSession]) liftData[currentSession] = [];
  liftData[currentSession].push({ name, sets, reps, weight });
  localStorage.setItem('liftData', JSON.stringify(liftData));
  closeModal();
  renderExercises();
}

function deleteExercise(index) {
  liftData[currentSession].splice(index, 1);
  localStorage.setItem('liftData', JSON.stringify(liftData));
  renderExercises();
}

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ─────────────────────────────────────────────────────────────────────────
// APPLICATION INITIALIZATION - Run on page load (after all scripts loaded)
// ─────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 TRAINCORE Dashboard initializing...');
  
  // Display current ISO week number in header
  setWeekBadge();
  
  // Render saved lifting exercises from local storage
  renderExercises();
  
  // Update lift count in summary stats
  updateLiftStats();

  // ─── STEP 1: Initialize field visibility settings ───
  document.getElementById('showElev').checked = fieldVisibility.showElev;
  document.getElementById('showHR').checked = fieldVisibility.showHR;
  document.getElementById('showCadence').checked = fieldVisibility.showCadence;
  document.getElementById('showZ2').checked = fieldVisibility.showZ2;
  document.getElementById('showCadenceTrend').checked = fieldVisibility.showCadenceTrend;
  document.getElementById('showMap').checked = fieldVisibility.showMap;
  updateSectionVisibility();
  
  // ─── STEP 2: Close settings modal when clicking outside it ───
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    if (modal && !modal.contains(e.target) && !settingsBtn.contains(e.target)) {
      modal.classList.remove('open');
    }
  });

  console.log('✓ Dashboard UI ready');
});
