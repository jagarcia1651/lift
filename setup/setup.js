/**
 * Setup page functionality
 */

// -------------------------
// Program Info Management
// -------------------------
function loadProgramInfo() {
    try {
        const savedProgramInfo = localStorage.getItem('programInfo');
        if (!savedProgramInfo) return;

        const { squat1RM, dead1RM, bench1RM, programStart } = JSON.parse(savedProgramInfo);
        
        state.program.squat1RM = squat1RM;
        state.program.dead1RM = dead1RM;
        state.program.bench1RM = bench1RM;
        state.program.programStart = new Date(programStart);

        const todayInput = document.getElementById('today-date');
        if (todayInput?.value) {
            state.program.todayDate = new Date(todayInput.value);
        } else {
            setTodayDate(new Date());
        }
        
        if (areAllFieldsFilled()) {
            generateRoutinePreview();
            enableStartButton();
        }
    } catch (error) {
        handleError(error, 'Error loading program info');
    }
}

function saveProgramInfo() {
    try {
        localStorage.setItem('programInfo', JSON.stringify(state.program));
    } catch (error) {
        console.error('Error saving program info:', error);
    }
}

// -------------------------
// UI Management
// -------------------------
function updateInputFields() {
    document.getElementById('squat-1rm').value = state.program.squat1RM;
    document.getElementById('bench-1rm').value = state.program.bench1RM;
    document.getElementById('deadlift-1rm').value = state.program.dead1RM;
    document.getElementById('program-start').value = getFormattedDate(state.program.programStart);
}

function enableStartButton() {
    const startButton = document.getElementById('start-workout');
    if (startButton) {
        startButton.disabled = false;
    }
}

function setTodayDate(date) {
    const todayInput = document.getElementById('today-date');
    if (todayInput) {
        todayInput.value = getFormattedDate(date);
    }
}

// -------------------------
// Setup Page State
// -------------------------
const setupState = {
    selectedAccessories: [],
    currentPool: 'legs'
};

// -------------------------
// Page Initialization
// -------------------------
function initializeSetupPage() {
    try {
        // Load workout setup data first
        const workoutSetup = JSON.parse(localStorage.getItem('workoutSetup') || '{}');
        
        // Set the date from workout setup
        if (workoutSetup.selectedDate) {
            state.program.todayDate = new Date(workoutSetup.selectedDate);
        }
        
        updateHeaderInfo();
        
        // Load saved workout state if it exists
        const dateKey = getFormattedDate(state.program.todayDate);
        const savedWorkout = state.savedWorkouts.get(dateKey);
        
        // Handle accessories in this order:
        // 1. Current workout setup accessories
        // 2. Saved workout accessories
        // 3. Default recommended accessories
        if (workoutSetup.selectedAccessories?.length > 0) {
            setupState.selectedAccessories = workoutSetup.selectedAccessories;
        } else if (savedWorkout?.setup?.selectedAccessories?.length > 0) {
            setupState.selectedAccessories = savedWorkout.setup.selectedAccessories;
        } else {
            loadRecommendedAccessories();
        }
        
        // Update UI
        updateSelectedAccessories();
        loadOptionalAccessories();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing setup page:', error);
    }
}

function updateHeaderInfo() {
    const date = state.program.todayDate;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.querySelector('.workout-date').textContent = date.toLocaleDateString('en-US', options);
    
    const workoutType = getLiftOfTheDay();
    const weight = getWeightOfTheDay();
    const setsReps = getSetsAndReps();
    
    document.querySelector('.primary-lift-summary h3').textContent = workoutType;
    document.querySelector('.lift-stats .weight').textContent = `${weight} lbs`;
    document.querySelector('.lift-stats .sets').textContent = setsReps;
}

// -------------------------
// Accessory Management
// -------------------------
function loadRecommendedAccessories() {
    const workoutType = getLiftOfTheDay();
    const recommended = ACCESSORIES[workoutType] || [];
    setupState.selectedAccessories = [...recommended];
    updateSelectedAccessories();
}

function updateSelectedAccessories() {
    const container = document.getElementById('selected-accessories');
    if (!container) return;
    
    container.innerHTML = setupState.selectedAccessories.map((acc, index) => `
        <div class="accessory-item">
            <div class="accessory-info">
                <h5>${acc.exercise}</h5>
                <p>${acc.setsReps} @ ${acc.weight}</p>
            </div>
            <div class="accessory-controls">
                <button class="action-btn" onclick="swapExercise(${index})" title="Swap Exercise">↻</button>
                <button class="action-btn remove" onclick="removeAccessory(${index})" title="Remove Exercise">×</button>
            </div>
        </div>
    `).join('');
}

function loadOptionalAccessories() {
    const container = document.getElementById('optional-accessories');
    const poolExercises = ACCESSORY_POOLS[setupState.currentPool] || [];
    
    container.innerHTML = poolExercises.map((exercise, index) => `
        <div class="accessory-item optional-accessory" onclick="addAccessory(${index})">
            <div class="accessory-info">
                <h5>${exercise.exercise}</h5>
                <div class="accessory-details">
                    ${exercise.setsReps} @ ${exercise.weight}
                </div>
            </div>
        </div>
    `).join('');
}

function removeAccessory(index) {
    setupState.selectedAccessories.splice(index, 1);
    updateSelectedAccessories();
}

function addAccessory(index) {
    const exercise = ACCESSORY_POOLS[setupState.currentPool][index];
    setupState.selectedAccessories.push(exercise);
    updateSelectedAccessories();
}

function swapExercise(index) {
    const currentExercise = setupState.selectedAccessories[index];
    const currentPool = getSimilarExercisePool(currentExercise);
    const poolExercises = ACCESSORY_POOLS[currentPool] || [];
    
    // Find similar exercises (excluding the current one)
    const similarExercises = poolExercises.filter(exercise => 
        exercise.exercise !== currentExercise.exercise
    );
    
    if (similarExercises.length > 0) {
        // Replace the current exercise with a random similar one
        const randomIndex = Math.floor(Math.random() * similarExercises.length);
        setupState.selectedAccessories[index] = similarExercises[randomIndex];
        updateSelectedAccessories();
    }
}

function getSimilarExercisePool(exercise) {
    const exerciseName = exercise.exercise.toLowerCase();
    if (exerciseName.includes('squat') || exerciseName.includes('leg')) return 'legs';
    if (exerciseName.includes('bench') || exerciseName.includes('press')) return 'push';
    if (exerciseName.includes('row') || exerciseName.includes('pull')) return 'pull';
    return 'legs';
}

// -------------------------
// Event Handlers
// -------------------------
function setupEventListeners() {
    // Pool selector buttons
    document.querySelectorAll('.pool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setupState.currentPool = btn.dataset.pool;
            loadOptionalAccessories();
        });
    });

    // Reset button
    const resetBtn = document.querySelector('.reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetToDefault);
    }
}

function startWorkout() {
    const workoutSetup = JSON.parse(localStorage.getItem('workoutSetup') || '{}');
    
    // Save selected accessories and preserve existing state
    const updatedSetup = {
        selectedDate: state.program.todayDate,
        selectedAccessories: setupState.selectedAccessories,
        startTime: workoutSetup.startTime || new Date(),
        timerPaused: true,
        totalPausedTime: workoutSetup.totalPausedTime || 0,
        progress: workoutSetup.progress // Preserve any existing progress
    };
    
    localStorage.setItem('workoutSetup', JSON.stringify(updatedSetup));
    window.location.href = '../workout/workout.html';
}

// Update the back button handler
function handleBack() {
    localStorage.removeItem('workoutSetup');
    window.location.href = '../calendar/calendar.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // First initialize state
    initializeState();
    initTheme();
    
    // Check for calendar selected date
    const selectedDate = localStorage.getItem('selectedWorkoutDate');
    if (selectedDate) {
        state.program.todayDate = new Date(selectedDate);
        localStorage.removeItem('selectedWorkoutDate');
    }
    
    // Check for workout setup
    const workoutSetup = JSON.parse(localStorage.getItem('workoutSetup') || '{}');
    
    if (workoutSetup.selectedDate) {
        state.program.todayDate = new Date(workoutSetup.selectedDate);
    }
    
    if (workoutSetup.selectedAccessories) {
        setupState.selectedAccessories = workoutSetup.selectedAccessories;
    }
    
    // Preserve workout state if exists
    if (workoutSetup.startTime) {
        state.workout = {
            ...state.workout,
            startTime: new Date(workoutSetup.startTime),
            timerPaused: workoutSetup.timerPaused,
            pausedTime: workoutSetup.pausedTime ? new Date(workoutSetup.pausedTime) : null,
            totalPausedTime: workoutSetup.totalPausedTime
        };
    }
    
    // Finally initialize the page content
    initializeSetupPage();
});

function resetToDefault() {
    const workoutType = getLiftOfTheDay();
    const recommended = ACCESSORIES[workoutType] || [];
    setupState.selectedAccessories = [...recommended];
    updateSelectedAccessories();
} 