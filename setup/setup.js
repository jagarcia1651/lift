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

        updateInputFields();
        
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
    updateHeaderInfo();
    loadRecommendedAccessories();
    loadOptionalAccessories();
    setupEventListeners();
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
    
    container.innerHTML = setupState.selectedAccessories.map((exercise, index) => `
        <div class="accessory-item" data-index="${index}">
            <div class="accessory-info">
                <h5>${exercise.exercise}</h5>
                <div class="accessory-details">
                    ${exercise.setsReps} @ ${exercise.weight}
                </div>
            </div>
            <div class="accessory-controls">
                <button class="accessory-btn swap" onclick="swapExercise(${index})" title="Swap Exercise">
                    🔄
                </button>
                <button class="accessory-btn remove" onclick="removeAccessory(${index})" title="Remove Exercise">
                    ✕
                </button>
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
}

function startWorkout() {
    // Save selected accessories and date to localStorage
    const workoutSetup = {
        selectedDate: state.program.todayDate,
        selectedAccessories: setupState.selectedAccessories,
        ...state.workout // Preserve any existing workout state (timer, etc)
    };
    
    localStorage.setItem('workoutSetup', JSON.stringify(workoutSetup));
    window.location.href = '../workout/workout.html';
}

// Update the back button handler
function handleBack() {
    localStorage.removeItem('workoutSetup');
    window.location.href = '../calendar/calendar.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // First check for calendar selected date
    const selectedDate = localStorage.getItem('selectedWorkoutDate');
    if (selectedDate) {
        state.program.todayDate = new Date(selectedDate);
        localStorage.removeItem('selectedWorkoutDate');
    }
    
    // Then check for workout setup (this will override calendar date if coming back from workout)
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
            startTime: workoutSetup.startTime,
            timerPaused: workoutSetup.timerPaused,
            pausedTime: workoutSetup.pausedTime,
            totalPausedTime: workoutSetup.totalPausedTime
        };
    }
    
    initializeSetupPage();
});

function resetToDefault() {
    const workoutType = getLiftOfTheDay();
    const recommended = ACCESSORIES[workoutType] || [];
    setupState.selectedAccessories = [...recommended];
    updateSelectedAccessories();
} 