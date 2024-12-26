/**
 * Power Routine Calculator
 * Main JavaScript functionality
 */

// -------------------------
// Constants and Config
// -------------------------
const CONFIG = {
    LIGHT_WORKOUT_PERCENTAGE: 0.6,
    BASE_HEAVY_PERCENTAGE: 0.8,
    PROGRESSION_INCREMENT: 0.05
};

const DAYS = Object.freeze({
    LIFT_SCHEDULE: ['Rest', 'Heavy Squat', 'Light Bench', 'Deadlift', 'Light Squat', 'Heavy Bench', 'Rest'],
    NAMES: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
});

const ACCESSORIES = Object.freeze({
    "Heavy Squat": [
        { exercise: "Leg Extension", setsReps: "3x15", weight: "~20RM" },
        { exercise: "Leg Curl", setsReps: "3x15", weight: "~20RM" },
        { exercise: "Calf Raises", setsReps: "4x15", weight: "~20RM" },
        { exercise: "Hanging Leg Raise Variations", setsReps: "5x10", weight: "N/A" },
        { exercise: "Toe Touches", setsReps: "3x10", weight: "Bodyweight" }
    ],
    "Light Squat": [
        { exercise: "Bulgarian Split Squats", setsReps: "3x8", weight: "~10RM" },
        { exercise: "Step-Ups", setsReps: "3x8", weight: "~12RM" },
        { exercise: "Single Leg RDL", setsReps: "3x8", weight: "~12RM" },
        { exercise: "Walking Lunges", setsReps: "3x12-10-8", weight: "~15RM" }
    ],
    "Heavy Bench": [
        { exercise: "Incline Dumbbell Chest Flys", setsReps: "3x15", weight: "~20RM" },
        { exercise: "Dumbbell Lateral Raises", setsReps: "3x12", weight: "~15RM" },
        { exercise: "Barbell Skull Crushers", setsReps: "3x15", weight: "~20RM" }
    ],
    "Light Bench": [
        { exercise: "Incline Bench", setsReps: "3x8", weight: "~10RM" },
        { exercise: "Incline Dumbbell Bench", setsReps: "3x6", weight: "~8RM" },
        { exercise: "Narrow Grip Bench", setsReps: "4x6", weight: "~8RM" },
        { exercise: "Dumbbell Overhead Press", setsReps: "3x6", weight: "~8RM" }
    ],
    "Deadlift": [
        { exercise: "Barbell Rows", setsReps: "3x12-10-8", weight: "~15RM" },
        { exercise: "Dumbbell Rows", setsReps: "3x8", weight: "~12RM" },
        { exercise: "Good Mornings", setsReps: "3x12", weight: "~15RM" },
        { exercise: "Laying Bicep Curls", setsReps: "3x12-10-8", weight: "~15RM" },
        { exercise: "Chin-Ups", setsReps: "3xMax", weight: "Bodyweight" }
    ]
});

const ACCESSORY_POOLS = {
    "legs": [
        { exercise: "Leg Extension", setsReps: "3x15", weight: "~20RM" },
        { exercise: "Leg Press", setsReps: "3x15", weight: "~20RM" },
        { exercise: "Hack Squat", setsReps: "3x12", weight: "~15RM" },
        { exercise: "Front Squat", setsReps: "3x8", weight: "~12RM" },
        { exercise: "Bulgarian Split Squats", setsReps: "3x8", weight: "~10RM" },
        { exercise: "Walking Lunges", setsReps: "3x12-10-8", weight: "~15RM" }
    ],
    "push": [
        { exercise: "Incline Bench", setsReps: "3x8", weight: "~10RM" },
        { exercise: "Dumbbell Press", setsReps: "3x10", weight: "~12RM" },
        { exercise: "Military Press", setsReps: "3x8", weight: "~10RM" },
        { exercise: "Lateral Raises", setsReps: "3x12", weight: "~15RM" },
        { exercise: "Tricep Extensions", setsReps: "3x15", weight: "~20RM" },
        { exercise: "Skull Crushers", setsReps: "3x12", weight: "~15RM" }
    ],
    "pull": [
        { exercise: "Barbell Rows", setsReps: "3x12-10-8", weight: "~15RM" },
        { exercise: "Pull-ups", setsReps: "3xMax", weight: "Bodyweight" },
        { exercise: "Face Pulls", setsReps: "3x15", weight: "~20RM" },
        { exercise: "Lat Pulldowns", setsReps: "3x12", weight: "~15RM" },
        { exercise: "Hammer Curls", setsReps: "3x12", weight: "~15RM" },
        { exercise: "Preacher Curls", setsReps: "3x12", weight: "~15RM" }
    ]
};

// -------------------------
// State Management
// -------------------------
const workoutState = {
    isActive: false,
    startTime: null,
    timerInterval: null,
    sets: new Map(),
    currentLift: null,
    timerPaused: false,
    pausedTime: null,
    totalPausedTime: 0
};

const programInfo = {
    todayDate: new Date(),
    programStart: new Date(2024, 11, 9),
    squat1RM: 0,
    dead1RM: 0,
    bench1RM: 0
};

// -------------------------
// Theme Management
// -------------------------
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'dark';
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
    }
    
    themeToggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}

// -------------------------
// Program Info Management
// -------------------------
function loadProgramInfo() {
    try {
        const savedProgramInfo = localStorage.getItem('programInfo');
        if (!savedProgramInfo) return;

        const { squat1RM, dead1RM, bench1RM, programStart } = JSON.parse(savedProgramInfo);
        
        // Load weights and program start from storage
        programInfo.squat1RM = squat1RM;
        programInfo.dead1RM = dead1RM;
        programInfo.bench1RM = bench1RM;
        programInfo.programStart = new Date(programStart);

        // Always use today's date from input instead of storage
        const todayInput = document.getElementById('today-date');
        if (todayInput?.value) {
            programInfo.todayDate = new Date(todayInput.value);
        } else {
            setTodayDate(new Date());
        }

        updateInputFields();
        
        if (areAllFieldsFilled()) {
            generateRoutinePreview();
            enableStartButton();
        }
    } catch (error) {
        console.error('Error loading program info:', error);
    }
}

function saveProgramInfo() {
    try {
        localStorage.setItem('programInfo', JSON.stringify(programInfo));
    } catch (error) {
        console.error('Error saving program info:', error);
    }
}

// -------------------------
// UI Management
// -------------------------
function updateInputFields() {
    document.getElementById('squat-1rm').value = programInfo.squat1RM;
    document.getElementById('bench-1rm').value = programInfo.bench1RM;
    document.getElementById('deadlift-1rm').value = programInfo.dead1RM;
    document.getElementById('program-start').value = getFormattedDate(programInfo.programStart);
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
// Event Handlers
// -------------------------
function setupEventListeners() {
    const todayDateInput = document.getElementById('today-date');
    if (!todayDateInput) return;

    todayDateInput.addEventListener('change', () => {
        if (areAllFieldsFilled()) {
            updateWeights();
        }
    });

    if (areAllFieldsFilled()) {
        updateWeights();
    } else {
        const startButton = document.getElementById('start-workout');
        if (startButton) {
            startButton.disabled = true;
        }
    }

    // Add timer click handler
    const timerDisplay = document.querySelector('.timer-display');
    if (timerDisplay) {
        timerDisplay.addEventListener('click', toggleTimer);
    }

    // Add validation for number inputs
    ['squat-1rm', 'bench-1rm', 'deadlift-1rm'].forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;
        
        input.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value < 0) {
                e.target.value = 0;
            }
        });
    });

    // Add date validation
    const programStartInput = document.getElementById('program-start');
    
    if (programStartInput && todayDateInput) {
        todayDateInput.addEventListener('change', (e) => {
            const today = new Date(e.target.value);
            const start = new Date(programStartInput.value);
            
            if (start > today) {
                alert('Program start date cannot be after today');
                e.target.value = getFormattedDate(new Date());
            }
        });
    }
}

// -------------------------
// Workout Management
// -------------------------
function startWorkout() {
    try {
        workoutState.isActive = true;
        workoutState.startTime = new Date();
        workoutState.currentLift = getLiftOfTheDay();
        workoutState.timerPaused = false;
        workoutState.pausedTime = null;
        workoutState.totalPausedTime = 0;
        
        switchToWorkoutView();
        startWorkoutTimer();
        generateWorkoutContent();
        
        window.addEventListener('beforeunload', handleBeforeUnload);
    } catch (error) {
        console.error('Error starting workout:', error);
        workoutState.isActive = false;
        switchToSetupView();
    }
}

function completeSet(exerciseId) {
    const exercise = workoutState.sets.get(exerciseId);
    if (!exercise || exercise.completedSets >= exercise.totalSets) return;
    
    // Prevent accessory completion if primary isn't done
    if (exerciseId !== 'primary' && !isPrimaryComplete()) return;
    
    exercise.completedSets++;
    workoutState.sets.set(exerciseId, exercise);
    
    updateExerciseUI(exerciseId, exercise);
    
    // If primary was just completed, refresh to enable accessories
    if (exerciseId === 'primary' && isPrimaryComplete()) {
        generateWorkoutContent();
    }
}

function finishWorkout() {
    if (!confirm('Are you sure you want to finish this workout?')) return;
    
    clearInterval(workoutState.timerInterval);
    workoutState.isActive = false;
    
    switchToSetupView();
    resetWorkoutState();
    
    window.removeEventListener('beforeunload', handleBeforeUnload);
}

// -------------------------
// Timer Management
// -------------------------
function startWorkoutTimer() {
    workoutState.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const timerDisplay = document.getElementById('workout-timer');
    if (!timerDisplay || !workoutState.startTime) return;
    
    const now = new Date();
    const elapsed = now - workoutState.startTime - workoutState.totalPausedTime;
    
    timerDisplay.textContent = formatTime(elapsed);
}

function toggleTimer() {
    if (!workoutState.isActive) return;
    
    const timerDisplay = document.querySelector('.timer-display');
    if (!timerDisplay) return;
    
    if (workoutState.timerPaused) {
        resumeTimer(timerDisplay);
    } else {
        pauseTimer(timerDisplay);
    }
}

// -------------------------
// Utility Functions
// -------------------------
function getFormattedDate(date) {
    return date.toISOString().split('T')[0];
}

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
}

function padNumber(num) {
    return num.toString().padStart(2, '0');
}

function areAllFieldsFilled() {
    return Boolean(
        document.getElementById('program-start')?.value &&
        document.getElementById('squat-1rm')?.value &&
        document.getElementById('bench-1rm')?.value &&
        document.getElementById('deadlift-1rm')?.value
    );
}

// -------------------------
// Initialize App
// -------------------------
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setTodayDate(new Date());
    loadProgramInfo();
    setupEventListeners();
});

// -------------------------
// View Management
// -------------------------
function switchToWorkoutView() {
    document.getElementById('setup-view').classList.remove('active');
    document.getElementById('workout-view').classList.add('active');
}

function switchToSetupView() {
    document.getElementById('workout-view').classList.remove('active');
    document.getElementById('setup-view').classList.add('active');
}

// -------------------------
// Exercise Management
// -------------------------
function updateExerciseUI(exerciseId, exercise) {
    const row = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    if (!row) return;

    // Update checkmarks
    const checkmarks = row.querySelectorAll('.set-mark');
    checkmarks.forEach((mark, index) => {
        if (index < exercise.completedSets) {
            mark.classList.add('completed');
        } else {
            mark.classList.remove('completed');
        }
    });
    
    // Update counter
    const setsCompleted = row.querySelector('.sets-completed');
    if (setsCompleted) {
        setsCompleted.textContent = exercise.completedSets;
    }
    
    // Update active states
    if (exercise.completedSets === exercise.totalSets) {
        row.classList.remove('active');
        const nextRow = row.nextElementSibling;
        if (nextRow) {
            nextRow.classList.add('active');
        }
    }
}

function generateWorkoutContent() {
    const container = document.getElementById('workout-content');
    if (!container) return;
    
    const lift = workoutState.currentLift;
    if (lift.toLowerCase().includes('rest')) {
        container.innerHTML = '<h2>Rest Day</h2>';
        return;
    }
    
    const weight = getWeightOfTheDay();
    const setsReps = getSetsAndReps();
    const [totalSets, reps] = setsReps.split('x').map(Number);
    const accessories = getRotatedAccessories(lift, getProgramWeek());
    
    // Only initialize states if they don't exist
    if (workoutState.sets.size === 0) {
        initializeExerciseStates(totalSets, reps, accessories);
    }
    
    renderWorkoutContent(container, lift, weight, totalSets, reps, accessories);
    addExerciseClickHandlers();
}

function initializeExerciseStates(totalSets, reps, accessories) {
    workoutState.sets.clear();
    workoutState.sets.set('primary', { 
        type: 'primary',
        exercise: workoutState.currentLift,
        weight: getWeightOfTheDay(),
        reps,
        totalSets,
        completedSets: 0
    });
    
    accessories.forEach((acc, i) => {
        const [sets, reps] = acc.setsReps.split('x');
        workoutState.sets.set(`accessory-${i}`, {
            type: 'accessory',
            exercise: acc.exercise,
            weight: acc.weight,
            reps: Number(reps),
            totalSets: Number(sets),
            completedSets: 0
        });
    });
}

function renderWorkoutContent(container, lift, weight, totalSets, reps, accessories) {
    container.innerHTML = `
        <div class="exercise-list">
            <div class="exercise-row primary ${workoutState.sets.get('primary').completedSets === 0 ? 'active' : ''}" 
                 data-exercise-id="primary">
                <div class="exercise-info">
                    <h3>${lift}</h3>
                    <div class="exercise-details">
                        <span class="weight-detail">${weight} lbs</span>
                        <span class="reps-detail">${reps} reps</span>
                    </div>
                </div>
                <div class="exercise-progress">
                    <div class="set-checkmarks">
                        ${generateSetCheckmarks(totalSets, workoutState.sets.get('primary').completedSets)}
                    </div>
                    <div class="set-progress">
                        <span class="sets-completed">${workoutState.sets.get('primary').completedSets}</span>
                        <span class="sets-divider">/</span>
                        <span class="sets-total">${totalSets}</span>
                    </div>
                </div>
            </div>
            
            ${generateAccessoryRows(accessories)}
        </div>
    `;
}

function generateAccessoryRows(accessories) {
    const primaryComplete = isPrimaryComplete();
    
    return accessories.map((acc, i) => {
        const exerciseState = workoutState.sets.get(`accessory-${i}`);
        const [sets, reps] = acc.setsReps.split('x');
        const isAvailable = primaryComplete || exerciseState.completedSets > 0;
        
        return `
            <div class="exercise-row accessory ${isAvailable ? 'available' : ''} ${shouldBeActive(i) ? 'active' : ''}" 
                 data-exercise-id="accessory-${i}">
                <div class="exercise-info">
                    <h3>${acc.exercise}</h3>
                    <div class="exercise-details">
                        <span class="weight-detail">${acc.weight}</span>
                        <span class="reps-detail">${reps} reps</span>
                    </div>
                </div>
                <div class="exercise-progress">
                    <div class="set-checkmarks">
                        ${generateSetCheckmarks(Number(sets), exerciseState.completedSets)}
                    </div>
                    <div class="set-progress">
                        <span class="sets-completed">${exerciseState.completedSets}</span>
                        <span class="sets-divider">/</span>
                        <span class="sets-total">${sets}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function generateSetCheckmarks(totalSets, completedSets) {
    return Array.from({ length: totalSets }, (_, i) => `
        <div class="set-mark ${i < completedSets ? 'completed' : ''}">
            <div class="circle"></div>
        </div>
    `).join('');
}

function addExerciseClickHandlers() {
    const container = document.getElementById('workout-content');
    if (!container) return;
    
    container.querySelectorAll('.exercise-row').forEach(row => {
        row.addEventListener('click', () => completeSet(row.dataset.exerciseId));
        
        // Add keyboard support
        row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                completeSet(row.dataset.exerciseId);
            }
        });
    });
}

// -------------------------
// Timer Helpers
// -------------------------
function resumeTimer(timerDisplay) {
    workoutState.timerPaused = false;
    workoutState.totalPausedTime += (new Date() - workoutState.pausedTime);
    workoutState.pausedTime = null;
    timerDisplay.classList.remove('paused');
    workoutState.timerInterval = setInterval(updateTimer, 1000);
}

function pauseTimer(timerDisplay) {
    workoutState.timerPaused = true;
    workoutState.pausedTime = new Date();
    timerDisplay.classList.add('paused');
    clearInterval(workoutState.timerInterval);
}

function resetWorkoutState() {
    workoutState.startTime = null;
    workoutState.sets.clear();
    workoutState.currentLift = null;
}

// -------------------------
// Workout Calculations
// -------------------------
function getLiftOfTheDay() {
    const today = getToday();
    const dayOfWeek = today.getDay();
    return DAYS.LIFT_SCHEDULE[dayOfWeek];
}

function getProgramWeek() {
    const today = getToday();
    const start = new Date(programInfo.programStart);
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}

function getWeightOfTheDay() {
    const lift = getLiftOfTheDay();
    if (lift.toLowerCase().includes('rest')) return 0;
    
    const isLight = lift.toLowerCase().includes('light');
    const week = getProgramWeek();
    const percentage = isLight ? CONFIG.LIGHT_WORKOUT_PERCENTAGE : 
                               CONFIG.BASE_HEAVY_PERCENTAGE + (week * CONFIG.PROGRESSION_INCREMENT);
    
    const maxWeight = getOneRepMax(lift);
    return Math.round(maxWeight * percentage);
}

function getOneRepMax(lift) {
    if (lift.toLowerCase().includes('squat')) return programInfo.squat1RM;
    if (lift.toLowerCase().includes('bench')) return programInfo.bench1RM;
    if (lift.toLowerCase().includes('dead')) return programInfo.dead1RM;
    return 0;
}

function getSetsAndReps() {
    const lift = getLiftOfTheDay();
    return lift.toLowerCase().includes('light') ? '3x8' : '5x5';
}

function getRotatedAccessories(lift, week) {
    // Try to get saved accessories first
    const key = `accessories_${lift}_${week}`;
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    
    // Fall back to default accessories
    return ACCESSORIES[lift] || [];
}

function handleBeforeUnload(e) {
    e.preventDefault();
    e.returnValue = '';
    return '';
}

function getToday() {
    const todayInput = document.getElementById('today-date');
    if (!todayInput?.value) return new Date();
    
    // Create date with timezone adjustment
    const [year, month, day] = todayInput.value.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-based in JavaScript
}

function updateWeights() {
    try {
        const lift = getLiftOfTheDay();
        const weight = getWeightOfTheDay();
        
        // Update program info from input fields
        const squat = document.getElementById('squat-1rm')?.value;
        const bench = document.getElementById('bench-1rm')?.value;
        const dead = document.getElementById('deadlift-1rm')?.value;
        const start = document.getElementById('program-start')?.value;
        
        if (!squat || !bench || !dead || !start) {
            throw new Error('Missing required fields');
        }
        
        programInfo.squat1RM = Number(squat);
        programInfo.bench1RM = Number(bench);
        programInfo.dead1RM = Number(dead);
        programInfo.programStart = new Date(start);
        
        generateRoutinePreview();
        saveProgramInfo();
        enableStartButton();
    } catch (error) {
        console.error('Error updating weights:', error);
        // Could add user notification here
    }
}

function generateRoutinePreview() {
    const container = document.getElementById('routine-preview');
    if (!container) return;
    
    const lift = getLiftOfTheDay();
    if (lift.toLowerCase().includes('rest')) {
        container.innerHTML = '<h2>Rest Day</h2>';
        return;
    }
    
    const weight = getWeightOfTheDay();
    const setsReps = getSetsAndReps();
    const accessories = getRotatedAccessories(lift, getProgramWeek());
    
    container.innerHTML = `
        <h2>${lift}</h2>
        <div class="exercise-preview">
            <div class="main-lift">
                <p>${weight} lbs × ${setsReps}</p>
            </div>
            <div class="accessories">
                ${accessories.map((acc, index) => `
                    <div class="accessory" data-index="${index}">
                        <div class="accessory-info">
                            <p>${acc.exercise}: ${acc.setsReps} @ ${acc.weight}</p>
                        </div>
                        <div class="accessory-controls">
                            <button 
                                type="button" 
                                class="change-accessory-btn" 
                                onclick="changeAccessory(${index})"
                                aria-label="Change accessory exercise"
                            >
                                ↻
                            </button>
                            <button 
                                type="button" 
                                class="remove-accessory-btn" 
                                onclick="removeAccessory(${index})"
                                aria-label="Remove accessory exercise"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                `).join('')}
                <button 
                    type="button" 
                    class="add-accessory-btn" 
                    onclick="addAccessory()"
                    aria-label="Add accessory exercise"
                >
                    + Add Accessory
                </button>
            </div>
        </div>
    `;
}

// Add this function for exercise row active state
function shouldBeActive(index) {
    if (index === 0) {
        const primaryExercise = workoutState.sets.get('primary');
        return primaryExercise.completedSets === primaryExercise.totalSets;
    }
    
    const previousExercise = workoutState.sets.get(`accessory-${index - 1}`);
    const currentExercise = workoutState.sets.get(`accessory-${index}`);
    
    return previousExercise?.completedSets === previousExercise?.totalSets &&
           currentExercise?.completedSets < currentExercise?.totalSets;
}

// Add new functions for accessory management
function changeAccessory(index) {
    const lift = getLiftOfTheDay();
    const pool = getAccessoryPool(lift);
    const currentAccessories = getRotatedAccessories(lift, getProgramWeek());
    const currentExercise = currentAccessories[index];
    
    // Get new random exercise from pool that's not currently used
    const availableExercises = ACCESSORY_POOLS[pool].filter(exercise => 
        !currentAccessories.some(acc => acc.exercise === exercise.exercise)
    );
    
    if (availableExercises.length === 0) return; // No more options available
    
    const randomIndex = Math.floor(Math.random() * availableExercises.length);
    currentAccessories[index] = availableExercises[randomIndex];
    
    // Save to localStorage
    const key = `accessories_${lift}_${getProgramWeek()}`;
    localStorage.setItem(key, JSON.stringify(currentAccessories));
    
    // Refresh display
    generateRoutinePreview();
}

function getAccessoryPool(lift) {
    if (lift.toLowerCase().includes('squat')) return 'legs';
    if (lift.toLowerCase().includes('bench')) return 'push';
    if (lift.toLowerCase().includes('dead')) return 'pull';
    return '';
}

// Add new function to remove accessories
function removeAccessory(index) {
    const lift = getLiftOfTheDay();
    const currentAccessories = getRotatedAccessories(lift, getProgramWeek());
    
    // Remove the accessory at the specified index
    currentAccessories.splice(index, 1);
    
    // Save to localStorage
    const key = `accessories_${lift}_${getProgramWeek()}`;
    localStorage.setItem(key, JSON.stringify(currentAccessories));
    
    // Refresh display
    generateRoutinePreview();
}

// Add new function to add accessories
function addAccessory() {
    const lift = getLiftOfTheDay();
    const pool = getAccessoryPool(lift);
    const currentAccessories = getRotatedAccessories(lift, getProgramWeek());
    
    // Get available exercises not currently in use
    const availableExercises = ACCESSORY_POOLS[pool].filter(exercise => 
        !currentAccessories.some(acc => acc.exercise === exercise.exercise)
    );
    
    if (availableExercises.length === 0) {
        alert('No more exercises available in this category');
        return;
    }
    
    // Add random exercise from available pool
    const randomIndex = Math.floor(Math.random() * availableExercises.length);
    currentAccessories.push(availableExercises[randomIndex]);
    
    // Save to localStorage
    const key = `accessories_${lift}_${getProgramWeek()}`;
    localStorage.setItem(key, JSON.stringify(currentAccessories));
    
    // Refresh display
    generateRoutinePreview();
}

// Add helper function to check primary completion
function isPrimaryComplete() {
    const primary = workoutState.sets.get('primary');
    return primary.completedSets === primary.totalSets;
}
