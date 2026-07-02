/* ═════════════════════════════════════════════════════════════════════
   TRAINCORE FITNESS DASHBOARD - HEVY SYNC INTEGRATION

   This file handles:
   - Saving a Hevy API key in browser localStorage
   - Fetching Hevy exercise templates
   - Syncing the current TRAINCORE lifting session to Hevy as a workout
   ═════════════════════════════════════════════════════════════════════ */

const HEVY_API_BASE = 'https://api.hevyapp.com';
const HEVY_API_KEY_STORAGE = 'hevyApiKey';
const HEVY_LAST_SYNC_STORAGE = 'hevyLastSync';

function normalizeHevyName(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function setHevyStatus(message, state = 'default') {
  const status = document.getElementById('hevySyncStatus');
  if (!status) return;

  status.classList.remove('is-success', 'is-error', 'is-loading');
  if (state === 'success') status.classList.add('is-success');
  if (state === 'error') status.classList.add('is-error');
  if (state === 'loading') status.classList.add('is-loading');
  status.textContent = message;
}

async function readHevyResponse(response) {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return { message: raw, error: raw };
  }
}

function getHevyApiKey() {
  return localStorage.getItem(HEVY_API_KEY_STORAGE) || '';
}

function saveHevyApiKey() {
  const input = document.getElementById('hevyApiKeyInput');
  if (!input) return;

  const apiKey = input.value.trim();
  if (!apiKey) {
    setHevyStatus('Enter a Hevy API key first.', 'error');
    return;
  }

  localStorage.setItem(HEVY_API_KEY_STORAGE, apiKey);
  setHevyStatus('Hevy API key saved locally in this browser.', 'success');
}

async function fetchHevyExerciseTemplates(apiKey) {
  const templates = [];
  let page = 1;
  let pageCount = 1;

  while (page <= pageCount) {
    const response = await fetch(`${HEVY_API_BASE}/v1/exercise_templates?page=${page}&pageSize=1000`, {
      headers: {
        'api-key': apiKey,
        Accept: 'application/json'
      }
    });

    const data = await readHevyResponse(response);
    if (!response.ok) {
      throw new Error(data.error || data.message || `Hevy exercise template request failed with ${response.status}`);
    }

    if (Array.isArray(data.exercise_templates)) {
      templates.push(...data.exercise_templates);
    }

    pageCount = Number(data.page_count) || 1;
    page += 1;
  }

  return templates;
}

function buildHevyWorkout(exercises, templates, sessionLabel) {
  const templateByName = new Map(
    templates.map(template => [normalizeHevyName(template.title), template])
  );

  const missingTemplates = [];
  const workoutExercises = exercises.map((exercise, exerciseIndex) => {
    const template = templateByName.get(normalizeHevyName(exercise.name));
    if (!template) {
      missingTemplates.push(exercise.name);
      return null;
    }

    const sets = [];
    for (let setIndex = 0; setIndex < exercise.sets; setIndex += 1) {
      sets.push({
        index: setIndex,
        type: 'normal',
        weight_kg: exercise.weight,
        reps: exercise.reps,
        distance_meters: null,
        duration_seconds: null,
        rpe: null,
        custom_metric: null
      });
    }

    return {
      index: exerciseIndex,
      title: exercise.name,
      notes: 'Synced from TRAINCORE',
      exercise_template_id: template.id,
      supersets_id: null,
      sets
    };
  }).filter(Boolean);

  if (missingTemplates.length > 0) {
    throw new Error(
      `No Hevy template match for: ${missingTemplates.join(', ')}. Rename those lifts to match Hevy exercise templates or create matching templates first.`
    );
  }

  const now = new Date();
  const startTime = new Date(now.getTime() - Math.max(15, exercises.length * 8) * 60000);
  const title = `TRAINCORE ${sessionLabel} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const description = `Synced from TRAINCORE session ${sessionLabel}.`;

  return {
    id: `traincore-${sessionLabel.toLowerCase()}-${now.getTime()}`,
    title,
    description,
    start_time: startTime.toISOString(),
    end_time: now.toISOString(),
    updated_at: now.toISOString(),
    created_at: startTime.toISOString(),
    exercises: workoutExercises
  };
}

async function syncCurrentSessionToHevy() {
  const apiKey = getHevyApiKey();
  if (!apiKey) {
    setHevyStatus('Save your Hevy API key first.', 'error');
    return;
  }

  const exercises = liftData[currentSession] || [];
  if (exercises.length === 0) {
    setHevyStatus('Add at least one exercise to the current session before syncing.', 'error');
    return;
  }

  const button = document.querySelector('.hevy-sync-panel .btn-primary');
  const previousText = button ? button.textContent : '';
  if (button) button.disabled = true;

  setHevyStatus('Loading Hevy templates...', 'loading');

  try {
    const templates = await fetchHevyExerciseTemplates(apiKey);
    const workout = buildHevyWorkout(
      exercises,
      templates,
      currentSession === 'A' ? 'Full Body A' : 'Full Body B'
    );

    setHevyStatus('Uploading workout to Hevy...', 'loading');

    const response = await fetch(`${HEVY_API_BASE}/v1/workouts`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(workout)
    });

    const data = await readHevyResponse(response);
    if (!response.ok) {
      throw new Error(data.error || data.message || `Hevy workout creation failed with ${response.status}`);
    }

    localStorage.setItem(HEVY_LAST_SYNC_STORAGE, JSON.stringify({
      syncedAt: new Date().toISOString(),
      session: currentSession,
      workoutId: data?.workout?.id || data?.id || null,
      title: data?.workout?.title || data?.title || workout.title
    }));

    setHevyStatus(`Synced to Hevy: ${workout.title}`, 'success');
  } catch (error) {
    console.error('Hevy sync error:', error);
    setHevyStatus(error.message || 'Could not sync to Hevy.', 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

function restoreHevySyncState() {
  const input = document.getElementById('hevyApiKeyInput');
  if (input) {
    input.value = getHevyApiKey();
  }

  const lastSyncRaw = localStorage.getItem(HEVY_LAST_SYNC_STORAGE);
  if (!lastSyncRaw) {
    if (!getHevyApiKey()) {
      setHevyStatus('Not connected to Hevy yet.');
    } else {
      setHevyStatus('Hevy API key saved. Ready to sync your next session.', 'success');
    }
    return;
  }

  try {
    const lastSync = JSON.parse(lastSyncRaw);
    const syncedAt = lastSync?.syncedAt ? new Date(lastSync.syncedAt).toLocaleString() : 'recently';
    setHevyStatus(`Last Hevy sync: ${syncedAt}`, 'success');
  } catch (error) {
    setHevyStatus('Hevy API key saved. Ready to sync your next session.', 'success');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  restoreHevySyncState();
});
