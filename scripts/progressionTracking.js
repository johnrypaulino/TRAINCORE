/* ═════════════════════════════════════════════════════════════════════
   TRAINCORE FITNESS DASHBOARD - ZONE 2 OPTIMIZATION & LIFTING PROGRESSION
   
   This file handles:
   - Zone 2 aerobic training tracking and history
   - Lifting personal records and progression
   - Exercise history management
   ═════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────
// ZONE 2 TRACKING - Track aerobic compliance over time
// ─────────────────────────────────────────────────────────────────────────

/**
 * Track Zone 2 progress for the current week
 * @param {number} z2Runs - Number of runs in Zone 2
 * @param {number} totalRuns - Total runs this week
 * @param {number} avgHR - Average heart rate across all runs
 */
function trackZone2Progress(z2Runs, totalRuns, avgHR) {
  const today = new Date().toISOString().split('T')[0];
  
  if (!zone2History[today]) {
    zone2History[today] = {};
  }
  
  zone2History[today] = {
    z2Runs,
    totalRuns,
    avgHR: avgHR || 0,
    z2Percentage: totalRuns > 0 ? Math.round((z2Runs / totalRuns) * 100) : 0
  };
  
  localStorage.setItem('zone2History', JSON.stringify(zone2History));
  console.log(`📈 Zone 2 tracking: ${z2Runs}/${totalRuns} runs (${zone2History[today].z2Percentage}%)`);
}

/**
 * Calculate Zone 2 weekly trends
 * Returns stats about Zone 2 compliance for the current week
 */
function calculateZone2Trend() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  
  let totalZ2Runs = 0;
  let totalRuns = 0;
  let avgHRWeek = 0;
  let dayCount = 0;
  
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(monday);
    checkDate.setDate(monday.getDate() + i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    if (zone2History[dateStr]) {
      const day = zone2History[dateStr];
      totalZ2Runs += day.z2Runs;
      totalRuns += day.totalRuns;
      avgHRWeek += day.avgHR;
      dayCount++;
    }
  }
  
  return {
    z2Runs: totalZ2Runs,
    totalRuns,
    z2Percentage: totalRuns > 0 ? Math.round((totalZ2Runs / totalRuns) * 100) : 0,
    avgHR: dayCount > 0 ? Math.round(avgHRWeek / dayCount) : 0,
    target: ZONE2_WEEKLY_TARGET * 100,
    isOnTrack: totalRuns > 0 && (totalZ2Runs / totalRuns) >= ZONE2_WEEKLY_TARGET
  };
}

// ─────────────────────────────────────────────────────────────────────────
// LIFTING PROGRESSION - Track exercise PRs and improvements
// ─────────────────────────────────────────────────────────────────────────

/**
 * Log exercise for progression tracking
 * Stores history and calculates improvement trends
 * @param {string} exerciseName - Name of the exercise
 * @param {number} sets - Number of sets
 * @param {number} reps - Reps per set
 * @param {number} weight - Weight in kg
 */
function logExerciseProgression(exerciseName, sets, reps, weight) {
  if (!liftingProgressionHistory[exerciseName]) {
    liftingProgressionHistory[exerciseName] = [];
  }
  
  const entry = {
    date: new Date().toISOString(),
    sets,
    reps,
    weight,
    volume: sets * reps * weight  // Total volume = sets × reps × weight
  };
  
  liftingProgressionHistory[exerciseName].push(entry);
  localStorage.setItem('liftingProgressionHistory', JSON.stringify(liftingProgressionHistory));
  
  console.log(`💪 Logged: ${exerciseName} - ${sets}×${reps} @ ${weight}kg (${entry.volume} volume)`);
}

/**
 * Get personal record for an exercise
 * Returns the highest weight lifted for that exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {object} - PR details or null if no history
 */
function getExercisePR(exerciseName) {
  if (!liftingProgressionHistory[exerciseName] || liftingProgressionHistory[exerciseName].length === 0) {
    return null;
  }
  
  const history = liftingProgressionHistory[exerciseName];
  let prEntry = history[0];
  let prWeight = prEntry.weight * prEntry.reps / 10;  // Estimate 1RM using Epley formula
  
  for (let i = 1; i < history.length; i++) {
    const entry = history[i];
    const estimatedMax = entry.weight * entry.reps / 10;
    if (estimatedMax > prWeight) {
      prWeight = estimatedMax;
      prEntry = entry;
    }
  }
  
  return {
    weight: prEntry.weight,
    reps: prEntry.reps,
    sets: prEntry.sets,
    date: new Date(prEntry.date).toLocaleDateString(),
    estimatedMax: Math.round(prWeight * 10) / 10
  };
}

/**
 * Get volume trend for an exercise (last 4 sessions)
 * @param {string} exerciseName - Name of the exercise
 * @returns {object} - Progression stats
 */
function getExerciseProgression(exerciseName) {
  if (!liftingProgressionHistory[exerciseName] || liftingProgressionHistory[exerciseName].length === 0) {
    return null;
  }
  
  const history = liftingProgressionHistory[exerciseName];
  const recent = history.slice(-4);  // Last 4 sessions
  
  if (recent.length < 2) {
    return { volume: recent[0].volume, trend: 'new', improvement: 0 };
  }
  
  const firstVolume = recent[0].volume;
  const lastVolume = recent[recent.length - 1].volume;
  const improvement = lastVolume - firstVolume;
  const improvementPct = ((improvement / firstVolume) * 100).toFixed(1);
  
  let trend = 'stable';
  if (improvement > 0) trend = 'up';
  if (improvement < 0) trend = 'down';
  
  return {
    volume: lastVolume,
    trend,
    improvement,
    improvementPct,
    sessions: recent.length
  };
}

/**
 * Display exercise progression in UI
 * Shows improvement indicators for exercises
 * @param {string} exerciseName - Exercise to display progression for
 * @returns {string} - HTML for progression display
 */
function getProgressionHTML(exerciseName) {
  const progression = getExerciseProgression(exerciseName);
  if (!progression) return '';
  
  const trendIcon = progression.trend === 'up' ? '📈' : progression.trend === 'down' ? '📉' : '➡️';
  
  return `
    <div class="progression-card">
      <div class="progression-header">📊 Progression</div>
      <div class="progression-stat">
        <span class="progression-label">Current Volume</span>
        <span class="progression-value">${progression.volume.toLocaleString()} kg</span>
      </div>
      <div class="progression-stat">
        <span class="progression-label">Last ${progression.sessions} Sessions</span>
        <span class="progression-value">${trendIcon} ${progression.improvementPct}%</span>
      </div>
    </div>
  `;
}
