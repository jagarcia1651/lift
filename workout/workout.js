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
    
    // Check if this is a completed or partial workout
    const dateKey = getFormattedDate(state.program.todayDate);
    const savedWorkout = state.savedWorkouts.get(dateKey);
    
    // Check if this is a new workout
    const isNewWorkout = !workoutSetup.startTime && !savedWorkout?.progress;
    
    // Initialize workout state
    state.workout = {
        startTime: isNewWorkout ? new Date() : (workoutSetup.startTime ? new Date(workoutSetup.startTime) : new Date()),
        timerInterval: null,
        timerPaused: !isNewWorkout, // Only pause if it's not a new workout
        pausedTime: null,
        totalPausedTime: workoutSetup.totalPausedTime || 0,
        accessories: workoutSetup.selectedAccessories || savedWorkout?.setup?.selectedAccessories || [],
        restStartTime: null,
        restInterval: null
    };
    
    updateHeaderInfo();
    setupPrimaryLift();
    setupAccessories();
    setupEventListeners();
    setupRestTimer();
    
    // Restore workout progress if it exists
    const progressToRestore = workoutSetup.progress || savedWorkout?.progress;
    if (progressToRestore) {
        updateWorkoutProgress(progressToRestore);
    }
    
    // Start the workout timer
    const timerDisplay = document.querySelector('.timer-display');
    const timerBtn = document.querySelector('.timer-btn');
    
    updateTimer(); // Initial display update
    
    if (isWorkoutComplete()) {
        timerBtn.textContent = 'Workout Complete';
        timerBtn.disabled = true;
        timerDisplay.classList.add('completed');
        updateBackButton(true);
    } else if (isNewWorkout) {
        // Start timer automatically for new workouts
        state.workout.timerPaused = false;
        state.workout.startTime = new Date();
        updateTimer();
        state.workout.timerInterval = setInterval(updateTimer, 1000);
        timerBtn.textContent = 'Pause Timer';
    } else {
        // Resume partial workout
        state.workout.timerPaused = false;
        updateTimer();
        state.workout.timerInterval = setInterval(updateTimer, 1000);
        timerBtn.textContent = 'Pause Timer';
        updateBackButton(false);
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
function updateTimer() {
    if (!state.workout.startTime) return;
    
    const now = new Date();
    const elapsed = now - state.workout.startTime - state.workout.totalPausedTime;
    const timerDisplay = document.querySelector('.timer-display');
    
    if (timerDisplay) {
        timerDisplay.textContent = formatTime(elapsed);
    }
}

function toggleTimer() {
    const timerBtn = document.querySelector('.timer-btn');
    const timerDisplay = document.querySelector('.timer-display');
    
    if (state.workout.timerPaused) {
        // Resume timer
        state.workout.timerPaused = false;
        if (state.workout.pausedTime) {
            state.workout.totalPausedTime += (new Date() - state.workout.pausedTime);
        }
        state.workout.pausedTime = null;
        state.workout.timerInterval = setInterval(updateTimer, 1000);
        timerBtn.textContent = 'Pause Timer';
        timerDisplay.classList.remove('paused');
    } else {
        // Pause timer
        state.workout.timerPaused = true;
        state.workout.pausedTime = new Date();
        clearInterval(state.workout.timerInterval);
        state.workout.timerInterval = null;
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
    // Check if trying to complete accessory before primary
    if (exerciseId.startsWith('accessory')) {
        const primaryRow = document.querySelector('.exercise-row.primary');
        const primaryCompleted = parseInt(primaryRow.querySelector('.sets-completed').textContent);
        const primaryTotal = parseInt(primaryRow.querySelector('.sets-total').textContent);
        
        if (primaryCompleted < primaryTotal) {
            // Show error message
            const message = document.createElement('div');
            message.className = 'error-message';
            message.textContent = 'Complete all primary lift sets first';
            message.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--error);
                color: white;
                padding: 1rem;
                border-radius: var(--border-radius);
                z-index: 1000;
                animation: fadeOut 2s forwards;
            `;
            document.body.appendChild(message);
            setTimeout(() => message.remove(), 2000);
            return;
        }
    }
    
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
        
        startRestTimer(exerciseId);
        
        // Check if all sets are complete after this update
        if (isWorkoutComplete()) {
            clearInterval(state.workout.timerInterval);
            clearInterval(state.workout.restInterval);
            
            // Update UI
            const timerBtn = document.querySelector('.timer-btn');
            timerBtn.textContent = 'Workout Complete';
            timerBtn.disabled = true;
            
            // Update back button
            updateBackButton(true);
            
            // Show completion message
            const message = document.createElement('div');
            message.className = 'success-message';
            message.textContent = 'All sets completed! 💪';
            message.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--success);
                color: white;
                padding: 1rem;
                border-radius: var(--border-radius);
                z-index: 1000;
                animation: fadeOut 3s forwards;
            `;
            document.body.appendChild(message);
            setTimeout(() => message.remove(), 3000);
        }
        
        saveWorkoutState(state.program.todayDate);
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
    
    // Save workout state before returning
    saveWorkoutState(state.program.todayDate);
    
    localStorage.setItem('workoutSetup', JSON.stringify(workoutSetup));
    window.location.href = '../setup/setup.html';
}

function setupRestTimer() {
    const timerContainer = document.querySelector('.timer-container');
    if (!timerContainer.querySelector('.rest-timer-container')) {  // Check if it doesn't exist first
        const restTimerHtml = `
            <div class="rest-timer-container">
                <div class="rest-timer-display">Rest: --:--</div>
            </div>
        `;
        timerContainer.insertAdjacentHTML('beforeend', restTimerHtml);
    }
}

function startRestTimer(exerciseId) {
    clearInterval(state.workout.restInterval);
    state.workout.restStartTime = new Date();
    
    // Add extra minute only for heavy primary lifts
    if (isPrimaryLift(exerciseId) && isHeavyLift()) {
        state.program.currentRestTime = state.program.restTimer + 60; // Add 60 seconds for heavy primary lifts
    } else {
        state.program.currentRestTime = state.program.restTimer; // Use default rest time for accessories
    }
    
    updateRestTimer();
    state.workout.restInterval = setInterval(updateRestTimer, 1000);
}

function updateRestTimer() {
    if (!state.workout.restStartTime) return;
    
    const elapsed = new Date() - state.workout.restStartTime;
    const remaining = (state.program.currentRestTime * 1000) - elapsed;
    
    if (remaining <= 0) {
        clearInterval(state.workout.restInterval);
        state.workout.restStartTime = null;
        const restDisplay = document.querySelector('.rest-timer-display');
        restDisplay.textContent = 'Rest: Ready!';
        restDisplay.classList.add('ready');
        return;
    }
    
    const seconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    document.querySelector('.rest-timer-display').textContent = 
        `Rest: ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Add this function to handle page unload
function handleBeforeUnload(event) {
    if (state.workout.startTime && !state.workout.timerPaused) {
        // Save current workout state
        const workoutSetup = {
            selectedDate: state.program.todayDate,
            selectedAccessories: state.workout.accessories,
            startTime: state.workout.startTime,
            timerPaused: true,
            pausedTime: new Date(),
            totalPausedTime: state.workout.totalPausedTime
        };
        localStorage.setItem('workoutSetup', JSON.stringify(workoutSetup));
        
        // Save workout state before unload
        saveWorkoutState(state.program.todayDate);
    }
}

// Update initialization to check for saved workout state
document.addEventListener('DOMContentLoaded', () => {
    initializeWorkoutPage();
});

// Add helper function to check if current lift is heavy
function isHeavyLift() {
    const liftName = document.querySelector('.primary .lift-name').textContent;
    return liftName.toLowerCase().includes('heavy');
}

// Add helper function to check if all sets are complete
function isWorkoutComplete() {
    // Check primary lift
    const primary = document.querySelector('.exercise-row.primary');
    const primaryCompleted = parseInt(primary.querySelector('.sets-completed').textContent);
    const primaryTotal = parseInt(primary.querySelector('.sets-total').textContent);
    if (primaryCompleted < primaryTotal) return false;
    
    // Check accessories
    const accessories = document.querySelectorAll('#accessories-list .exercise-row');
    for (const row of accessories) {
        const completed = parseInt(row.querySelector('.sets-completed').textContent);
        const total = parseInt(row.querySelector('.sets-total').textContent);
        if (completed < total) return false;
    }
    
    return true;
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

// Add helper function to check if we're completing a primary lift set
function isPrimaryLift(exerciseId) {
    return exerciseId === 'primary';
}

function updateCompletedWorkout(progress) {
    // Update primary lift
    if (progress.primaryLift) {
        const primary = document.querySelector('.exercise-row.primary');
        if (primary) {
            primary.dataset.completed = 'true';
            primary.querySelector('.sets-completed').textContent = progress.primaryLift.completed;
            primary.querySelector('.set-checkmarks').innerHTML = 
                generateSetCheckmarks(progress.primaryLift.completed, progress.primaryLift.total);
        }
    }
    
    // Update accessories
    progress.accessories.forEach((acc, index) => {
        const row = document.querySelector(`[data-exercise-id="accessory-${index}"]`);
        if (row) {
            row.dataset.completed = 'true';
            row.querySelector('.sets-completed').textContent = acc.completed;
            row.querySelector('.set-checkmarks').innerHTML = 
                generateSetCheckmarks(acc.completed, acc.total);
        }
    });
    
    // Update back button to return to calendar
    updateBackButton(true);
}

// Add new helper function
function updateBackButton(completed = false) {
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        const backText = backBtn.querySelector('.back-text');
        if (backText) {
            backText.textContent = completed ? 'Return to Calendar' : 'Return to Setup';
        }
        backBtn.onclick = () => {
            window.location.href = completed ? '../calendar/calendar.html' : '../setup/setup.html';
        };
    }
}

// Add new function to handle partial progress
function updateWorkoutProgress(progress) {
    // Update primary lift
    if (progress.primaryLift) {
        const primary = document.querySelector('.exercise-row.primary');
        if (primary) {
            primary.querySelector('.sets-completed').textContent = progress.primaryLift.completed;
            primary.querySelector('.set-checkmarks').innerHTML = 
                generateSetCheckmarks(progress.primaryLift.completed, progress.primaryLift.total);
        }
    }
    
    // Update accessories
    progress.accessories?.forEach((acc, index) => {
        const row = document.querySelector(`[data-exercise-id="accessory-${index}"]`);
        if (row) {
            row.querySelector('.sets-completed').textContent = acc.completed;
            row.querySelector('.set-checkmarks').innerHTML = 
                generateSetCheckmarks(acc.completed, acc.total);
        }
    });
}