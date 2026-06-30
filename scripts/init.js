/* ═════════════════════════════════════════════════════════════════════
   TRAINCORE FITNESS DASHBOARD - INITIALIZATION & STATE MANAGEMENT
   
   This file handles:
   - Application state initialization
   - Global variables and constants
   - Local storage management
   - Page load setup
   ═════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// APPLICATION STATE - Global variables storing app data
// ─────────────────────────────────────────────────────────────────────────

// Current selected lifting session (A = Full Body A, B = Full Body B)
let currentSession = 'A';

// Strava OAuth access token from successful authentication
let stravaToken = null;

// Lifting exercises persisted in browser local storage
// Structure: { A: [...exercises], B: [...exercises] }
let liftData = JSON.parse(localStorage.getItem('liftData') || '{"A":[],"B":[]}');

// Strava API credentials (Client ID & Secret) saved by user
let stravaCredentials = JSON.parse(localStorage.getItem('stravaCredentials') || 'null');

// Lifting progression history - tracks PRs and improvements
// Structure: { exerciseName: [{ date, sets, reps, weight }] }
let liftingProgressionHistory = JSON.parse(localStorage.getItem('liftingProgressionHistory') || '{}');

// Zone 2 training history - tracks aerobic compliance over time
// Structure: { dateString: { z2Runs, totalRuns, avgHR, z2Percentage } }
let zone2History = JSON.parse(localStorage.getItem('zone2History') || '{}');

// Training constants
const WEEKLY_GOAL_KM = 30;                  // Target weekly running distance
const CADENCE_TARGET = 170;                 // Target cadence (steps per minute)
const Z2_HR_MIN = 120;                      // Zone 2 HR floor (bpm)
const Z2_HR_MAX = 150;                      // Zone 2 HR ceiling (bpm)
const ZONE2_WEEKLY_TARGET = 0.80;           // Target 80% of runs in Zone 2

// Field visibility settings - what user wants to see (persisted)
// Structure: { showElev, showHR, showCadence, showZ2, showCadenceTrend, showMap }
let fieldVisibility = JSON.parse(
  localStorage.getItem('fieldVisibility') || 
  '{"showElev":true,"showHR":true,"showCadence":true,"showZ2":true,"showCadenceTrend":true,"showMap":true}'
);

// Strava activities from this week - populated when activities load
// Used for detailed activity view when user clicks on a run
let stravaActivities = [];

// ─────────────────────────────────────────────────────────────────────────
// WEEK BADGE - Display current ISO week number
// ─────────────────────────────────────────────────────────────────────────
function setWeekBadge() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  document.getElementById('weekBadge').textContent = `Week ${week}`;
}
