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
    // Load workout setup data
    const workoutSetup = JSON.parse(localStorage.getItem('workoutSetup') || '{}');
    
    if (workoutSetup.selectedDate) {
        state.program.todayDate = new Date(workoutSetup.selectedDate);
    }
    
    // Initialize workout state
    state.workout = {
        startTime: workoutSetup.startTime ? new Date(workoutSetup.startTime) : null,
        timerInterval: null,
        timerPaused: workoutSetup.timerPaused || false,
        pausedTime: workoutSetup.pausedTime ? new Date(workoutSetup.pausedTime) : null,
        totalPausedTime: workoutSetup.totalPausedTime || 0,
        accessories: workoutSetup.selectedAccessories || []
    };
    
    updateHeaderInfo();
    setupPrimaryLift();
    setupAccessories();
    setupEventListeners();
    
    // Initialize timer display
    const timerDisplay = document.querySelector('.timer-display');
    const timerBtn = document.querySelector('.timer-btn');
    
    if (state.workout.startTime) {
        updateTimer();
        timerBtn.textContent = state.workout.timerPaused ? 'Resume Timer' : 'Pause Timer';
        if (!state.workout.timerPaused) {
            state.workout.timerInterval = setInterval(updateTimer, 1000);
        }
    } else {
        timerDisplay.textContent = '00:00:00';
        timerBtn.textContent = 'Start Timer';
    }
}

function updateHeaderInfo() {
    const date = state.program.todayDate;
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
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
    const timerBtn = document.querySelector('.timer-btn');
    const timerDisplay = document.querySelector('.timer-display');
    
    if (!state.workout.startTime) {
        // Start timer
        state.workout.startTime = new Date();
        state.workout.timerInterval = setInterval(updateTimer, 1000);
        timerBtn.textContent = 'Pause Timer';
        timerDisplay.classList.remove('paused');
    } else if (state.workout.timerPaused) {
        // Resume timer
        state.workout.timerPaused = false;
        state.workout.totalPausedTime += (new Date() - state.workout.pausedTime);
        state.workout.timerInterval = setInterval(updateTimer, 1000);
        timerBtn.textContent = 'Pause Timer';
        timerDisplay.classList.remove('paused');
    } else {
        // Pause timer
        state.workout.timerPaused = true;
        state.workout.pausedTime = new Date();
        clearInterval(state.workout.timerInterval);
        timerBtn.textContent = 'Resume Timer';
        timerDisplay.classList.add('paused');
    }
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
    
    // Add click handler for primary lift
    primary.onclick = () => completeSet('primary');
    
    // Setup checkmarks
    const checkmarksDiv = primary.querySelector('.set-checkmarks');
    checkmarksDiv.innerHTML = generateSetCheckmarks(0, totalSets);
    primary.querySelector('.sets-completed').textContent = '0';
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
    return Array(total).fill()
        .map((_, i) => `
            <div class="set-mark${i < completed ? ' completed' : ''}" data-set="${i + 1}">
                ${i < completed ? '✓' : ''}
            </div>
        `).join('');
}

function completeSet(exerciseId) {
    const row = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    if (!row) return;
    
    const completedElement = row.querySelector('.sets-completed');
    const totalElement = row.querySelector('.sets-total');
    const checkmarksDiv = row.querySelector('.set-checkmarks');
    
    const completed = parseInt(completedElement.textContent);
    const total = parseInt(totalElement.textContent);
    
    if (completed < total) {
        const newCompleted = completed + 1;
        completedElement.textContent = newCompleted;
        checkmarksDiv.innerHTML = generateSetCheckmarks(newCompleted, total);
        
        if (exerciseId === 'primary') {
            workoutState.primaryComplete = newCompleted === total;
        }
    }
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

function closeModal() {
    const modal = document.getElementById('finish-modal');
    modal.classList.remove('active');
}

function confirmFinishWorkout() {
    const workoutResults = {
        date: getFormattedDate(state.program.todayDate),
        primaryCompleted: workoutState.primaryComplete,
        completed: checkUnfinishedSets() === 0,
        duration: state.workout.startTime ? 
            new Date() - state.workout.startTime - state.workout.totalPausedTime : 0,
        exercises: [
            // Primary lift
            {
                name: document.querySelector('.primary .lift-name').textContent,
                completed: parseInt(document.querySelector('.primary .sets-completed').textContent),
                total: parseInt(document.querySelector('.primary .sets-total').textContent)
            },
            // Accessories
            ...Array.from(document.querySelectorAll('#accessories-list .exercise-row')).map(row => ({
                name: row.querySelector('h4').textContent,
                completed: parseInt(row.querySelector('.sets-completed').textContent),
                total: parseInt(row.querySelector('.sets-total').textContent)
            }))
        ]
    };
    
    // Save to workout history
    const workoutHistory = new Map(JSON.parse(localStorage.getItem('workoutHistory') || '[]'));
    workoutHistory.set(workoutResults.date, workoutResults);
    localStorage.setItem('workoutHistory', JSON.stringify(Array.from(workoutHistory.entries())));
    
    // Clear workout setup state
    localStorage.removeItem('workoutSetup');
    
    // Navigate to calendar
    window.location.href = '../calendar/calendar.html';
}

function checkUnfinishedSets() {
    let unfinished = 0;
    
    // Check primary lift
    const primary = document.querySelector('.exercise-row.primary');
    const primaryCompleted = parseInt(primary.querySelector('.sets-completed').textContent);
    const primaryTotal = parseInt(primary.querySelector('.sets-total').textContent);
    if (primaryCompleted < primaryTotal) unfinished++;
    
    // Check accessories
    document.querySelectorAll('#accessories-list .exercise-row').forEach(row => {
        const completed = parseInt(row.querySelector('.sets-completed').textContent);
        const total = parseInt(row.querySelector('.sets-total').textContent);
        if (completed < total) unfinished++;
    });
    
    return unfinished;
}

// -------------------------
// Event Listeners
// -------------------------
function setupEventListeners() {
    const timerBtn = document.querySelector('.timer-btn');
    if (timerBtn) {
        timerBtn.addEventListener('click', toggleTimer);
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload);
}

function returnToSetup() {
    // Pause timer if running
    if (!state.workout.timerPaused && state.workout.startTime) {
        toggleTimer();
    }
    
    // Save current workout state including accessories
    const workoutSetup = {
        selectedDate: state.program.todayDate,
        selectedAccessories: state.workout.accessories,
        startTime: state.workout.startTime,
        timerPaused: state.workout.timerPaused,
        pausedTime: state.workout.pausedTime,
        totalPausedTime: state.workout.totalPausedTime
    };
    
    localStorage.setItem('workoutSetup', JSON.stringify(workoutSetup));
    window.location.href = '../setup/setup.html';
}

// Update initialization to check for saved workout state
document.addEventListener('DOMContentLoaded', () => {
    initializeWorkoutPage();
}); 