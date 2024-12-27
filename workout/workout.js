/**
 * Workout page functionality
 */

// -------------------------
// Workout Page State
// -------------------------
const workoutState = {
    selectedAccessories: [],
    primaryComplete: false
};

// -------------------------
// Page Initialization
// -------------------------
function initializeWorkoutPage() {
    updateHeaderInfo();
    initializeTimer();
    setupPrimaryLift();
    setupAccessories();
    setupEventListeners();
    state.workout.isActive = true;
}

function updateHeaderInfo() {
    const date = state.program.todayDate;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.querySelector('.workout-date').textContent = date.toLocaleDateString('en-US', options);
}

// -------------------------
// Timer Management
// -------------------------
function initializeTimer() {
    state.workout.startTime = new Date();
    state.workout.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    if (!state.workout.startTime) return;
    
    const elapsed = new Date() - state.workout.startTime - state.workout.totalPausedTime;
    document.querySelector('.timer-display').textContent = formatTime(elapsed);
}

function toggleTimer() {
    const timerDisplay = document.querySelector('.timer-display');
    if (!timerDisplay) return;
    
    if (state.workout.timerPaused) {
        resumeTimer(timerDisplay);
    } else {
        pauseTimer(timerDisplay);
    }
}

function resumeTimer(timerDisplay) {
    state.workout.timerPaused = false;
    state.workout.totalPausedTime += (new Date() - state.workout.pausedTime);
    state.workout.pausedTime = null;
    timerDisplay.classList.remove('paused');
    state.workout.timerInterval = setInterval(updateTimer, 1000);
}

function pauseTimer(timerDisplay) {
    state.workout.timerPaused = true;
    state.workout.pausedTime = new Date();
    timerDisplay.classList.add('paused');
    clearInterval(state.workout.timerInterval);
}

// -------------------------
// Exercise Management
// -------------------------
function setupPrimaryLift() {
    const workoutType = getLiftOfTheDay();
    const weight = getWeightOfTheDay();
    const setsReps = getSetsAndReps();
    const [totalSets] = setsReps.split('x').map(Number);
    
    const primary = document.querySelector('.exercise-row.primary');
    if (!primary) return;
    
    primary.querySelector('.lift-name').textContent = workoutType;
    primary.querySelector('.weight-detail').textContent = `${weight} lbs`;
    primary.querySelector('.reps-detail').textContent = setsReps;
    primary.querySelector('.sets-total').textContent = totalSets;
    
    updateSetCheckmarks(primary, 0, totalSets);
}

function setupAccessories() {
    const container = document.getElementById('accessories-list');
    if (!container || !state.workout.accessories) return;
    
    container.innerHTML = state.workout.accessories.map((acc, index) => `
        <div class="exercise-row" data-exercise-id="accessory-${index}" onclick="completeSet('accessory-${index}')">
            <div class="exercise-info">
                <h4>${acc.exercise}</h4>
                <div class="exercise-details">
                    <span class="weight-detail">${acc.weight}</span>
                    <span class="reps-detail">${acc.setsReps}</span>
                </div>
            </div>
            <div class="exercise-progress">
                <div class="set-checkmarks">
                    ${generateSetCheckmarks(0, Number(acc.setsReps.split('x')[0]))}
                </div>
                <div class="set-progress">
                    <span class="sets-completed">0</span>
                    <span class="sets-divider">/</span>
                    <span class="sets-total">${acc.setsReps.split('x')[0]}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function generateSetCheckmarks(completed, total) {
    return Array(total).fill(0).map((_, i) => `
        <div class="set-mark${i < completed ? ' completed' : ''}"></div>
    `).join('');
}

function completeSet(exerciseId) {
    const exercise = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    if (!exercise) return;
    
    const progress = exercise.querySelector('.set-progress');
    const completed = parseInt(progress.querySelector('.sets-completed').textContent);
    const total = parseInt(progress.querySelector('.sets-total').textContent);
    
    if (completed < total) {
        const newCompleted = completed + 1;
        progress.querySelector('.sets-completed').textContent = newCompleted;
        updateSetCheckmarks(exercise, newCompleted, total);
        
        if (exerciseId === 'primary' && newCompleted === total) {
            workoutState.primaryComplete = true;
        }
    }
}

function updateSetCheckmarks(exercise, completed, total) {
    const checkmarks = exercise.querySelector('.set-checkmarks');
    checkmarks.innerHTML = generateSetCheckmarks(completed, total);
}

// -------------------------
// Workout Completion
// -------------------------
function finishWorkout() {
    const unfinishedSets = checkUnfinishedSets();
    const modal = document.getElementById('finish-modal');
    const message = document.getElementById('finish-message');
    
    if (unfinishedSets > 0) {
        message.textContent = `You have ${unfinishedSets} unfinished sets. Are you sure you want to finish?`;
    } else {
        message.textContent = 'Great work! Ready to finish this workout?';
    }
    
    modal.classList.add('active');
}

function checkUnfinishedSets() {
    let unfinished = 0;
    document.querySelectorAll('.exercise-row').forEach(row => {
        const completed = parseInt(row.querySelector('.sets-completed').textContent);
        const total = parseInt(row.querySelector('.sets-total').textContent);
        if (completed < total) unfinished++;
    });
    return unfinished;
}

function confirmFinishWorkout() {
    const date = state.program.todayDate;
    const workoutResults = {
        date,
        primaryCompleted: workoutState.primaryComplete,
        completed: checkUnfinishedSets() === 0,
        duration: new Date() - state.workout.startTime - state.workout.totalPausedTime,
        exercises: Array.from(document.querySelectorAll('.exercise-row')).map(row => ({
            name: row.querySelector('h4').textContent,
            completed: parseInt(row.querySelector('.sets-completed').textContent),
            total: parseInt(row.querySelector('.sets-total').textContent)
        }))
    };
    
    saveWorkoutResults(date, workoutResults);
    resetWorkoutState();
    loadView('home');
}

// -------------------------
// Event Listeners
// -------------------------
function setupEventListeners() {
    const timerDisplay = document.querySelector('.timer-display');
    if (timerDisplay) {
        timerDisplay.addEventListener('click', toggleTimer);
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload);
}

// Initialize page
document.addEventListener('DOMContentLoaded', initializeWorkoutPage); 