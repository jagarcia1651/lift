/**
 * Power Routine Calculator
 * Main JavaScript functionality
 */

// -------------------------
// Constants
// -------------------------
const ACCESSORIES = {
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
};

const LIFT_DAY = Object.freeze(['Rest', 'Heavy Squat', 'Light Bench', 'Deadlift', 'Light Squat', 'Heavy Bench', 'Rest']);
const DAYS_OF_WEEK = Object.freeze(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

const LIGHT_WORKOUT_PERCENTAGE = 0.6;
const BASE_HEAVY_PERCENTAGE = 0.8;
const PROGRESSION_INCREMENT = 0.05;

// -------------------------
// Types
// -------------------------
/**
 * @typedef {Object} ProgramInfo
 * @property {Date} todayDate - Current selected date
 * @property {Date} programStart - Program start date
 * @property {number} squat1RM - Squat one rep maximum
 * @property {number} dead1RM - Deadlift one rep maximum
 * @property {number} bench1RM - Bench press one rep maximum
 */

/**
 * @typedef {Object} AccessoryExercise
 * @property {string} exercise - Name of the exercise
 * @property {string} setsReps - Sets and reps scheme
 * @property {string} weight - Target weight or RPE
 */

// -------------------------
// State
// -------------------------
/** @type {ProgramInfo} */
const programInfo = {
    todayDate: new Date(),
    programStart: new Date(2024, 11, 9),
    squat1RM: 0,
    dead1RM: 0,
    bench1RM: 0
};

// -------------------------
// Initialization
// -------------------------
document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the application
 */
function init() {
    initTheme();
    setTodayDate(new Date());
    loadProgramInfo();
    setupEventListeners();
}

/**
 * Initialize theme handling
 */
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

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const todayDateInput = document.getElementById('today-date');
    if (!todayDateInput) return;

    todayDateInput.addEventListener('change', () => {
        if (areAllFieldsFilled()) {
            updateWeights();
        }
    });

    // Initial update if all fields are filled
    if (areAllFieldsFilled()) {
        updateWeights();
    } else {
        // Disable start workout button if fields aren't filled
        const startButton = document.getElementById('start-workout');
        if (startButton) {
            startButton.disabled = true;
        }
    }
}

// -------------------------
// Utility Functions
// -------------------------
/**
 * Check if all required fields are filled
 * @returns {boolean}
 */
function areAllFieldsFilled() {
    const programStart = document.getElementById('program-start')?.value;
    const squat1RM = document.getElementById('squat-1rm')?.value;
    const bench1RM = document.getElementById('bench-1rm')?.value;
    const deadlift1RM = document.getElementById('deadlift-1rm')?.value;
    
    return Boolean(programStart && squat1RM && bench1RM && deadlift1RM);
}

/**
 * Format a date to YYYY-MM-DD
 * @param {Date} date 
 * @returns {string}
 */
function getFormattedDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Set the today's date input value
 * @param {Date} todayDate 
 */
function setTodayDate(todayDate) {
    const todayInput = document.getElementById('today-date');
    if (todayInput) {
        todayInput.value = getFormattedDate(todayDate);
    }
}

/**
 * Get the current selected date
 * @returns {Date}
 */
function getToday() {
    const todayInput = document.getElementById('today-date')?.value;
    if (!todayInput) return new Date();
    
    const todayDate = new Date(todayInput);
    return new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1);
}

// -------------------------
// Program Info Management
// -------------------------
/**
 * Load program info from localStorage
 */
function loadProgramInfo() {
    try {
        const savedProgramInfo = localStorage.getItem('programInfo');
        if (!savedProgramInfo) return;

        const { squat1RM, dead1RM, bench1RM, programStart } = JSON.parse(savedProgramInfo);
        
        programInfo.squat1RM = squat1RM;
        programInfo.dead1RM = dead1RM;
        programInfo.bench1RM = bench1RM;
        programInfo.programStart = new Date(programStart);

        // Update input fields
        document.getElementById('squat-1rm').value = squat1RM;
        document.getElementById('bench-1rm').value = bench1RM;
        document.getElementById('deadlift-1rm').value = dead1RM;
        document.getElementById('program-start').value = getFormattedDate(new Date(programStart));

        // Generate preview and enable start button if all fields are filled
        if (areAllFieldsFilled()) {
            generateRoutinePreview();
            const startButton = document.getElementById('start-workout');
            if (startButton) {
                startButton.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error loading program info:', error);
    }
}

/**
 * Save program info to localStorage
 */
function saveProgramInfo() {
    try {
        localStorage.setItem('programInfo', JSON.stringify(programInfo));
    } catch (error) {
        console.error('Error saving program info:', error);
    }
}

// -------------------------
// Workout Calculations
// -------------------------
/**
 * Calculate the current program week
 * @returns {number}
 */
function getProgramWeek() {
    const currentDate = getToday();
    const millisPerWeek = 1000 * 60 * 60 * 24 * 7;
    const weeksBetween = Math.floor((currentDate - programInfo.programStart) / millisPerWeek);
    return weeksBetween + 1;
}

/**
 * Get the day of the week
 * @returns {string}
 */
function getDayOfTheWeek() {
    return DAYS_OF_WEEK[getToday().getDay()];
}

/**
 * Get the primary lift for the day
 * @returns {string}
 */
function getLiftOfTheDay() {
    return LIFT_DAY[getToday().getDay()];
}

/**
 * Calculate the working weight for the day
 * @returns {string|number}
 */
function getWeightOfTheDay() {
    const lift = getLiftOfTheDay();
    if (lift.toLowerCase().includes('rest')) return 'Rest';

    const percent = lift.toLowerCase().includes('light') 
        ? LIGHT_WORKOUT_PERCENTAGE 
        : getHeavyProgressionPercent();
        
    const max = lift.toLowerCase().includes('squat') ? programInfo.squat1RM :
                lift.toLowerCase().includes('dead') ? programInfo.dead1RM :
                programInfo.bench1RM;

    return calculateFriendlyLift(max, percent);
}

/**
 * Round the calculated weight to nearest 5
 * @param {number} max 
 * @param {number} percent 
 * @returns {number}
 */
function calculateFriendlyLift(max, percent) {
    return Math.round(max * percent / 5) * 5;
}

/**
 * Calculate the percentage for heavy lifts based on progression
 * @returns {number}
 */
function getHeavyProgressionPercent() {
    const programWeek = getProgramWeek();
    if (programWeek < 5) {
        return BASE_HEAVY_PERCENTAGE;
    }
    
    const loadWeek = programWeek - 4;
    return Number((BASE_HEAVY_PERCENTAGE + (loadWeek * PROGRESSION_INCREMENT)).toFixed(2));
}

/**
 * Get the sets and reps scheme for heavy progression
 * @returns {string}
 */
function getHeavyProgressionSetsAndReps() {
    const programWeek = getProgramWeek();
    const sets = programWeek < 5 ? 6 : 9 - (programWeek - 1);
    const reps = programWeek < 5 ? 2 + programWeek : 9 - (programWeek - 1);
    return `${sets}x${reps}`;
}

/**
 * Get the sets and reps for the day
 * @returns {string}
 */
function getSetsAndReps() {
    const lift = getLiftOfTheDay();
    return lift.toLowerCase().includes('rest') 
        ? 'Rest' 
        : (lift.toLowerCase().includes('light') ? '4x4' : getHeavyProgressionSetsAndReps());
}

// -------------------------
// UI Updates
// -------------------------
/**
 * Update weights and regenerate routine
 */
function updateWeights() {
    try {
        const programStart = document.getElementById('program-start')?.value;
        const squat1RM = parseFloat(document.getElementById('squat-1rm')?.value || '0');
        const bench1RM = parseFloat(document.getElementById('bench-1rm')?.value || '0');
        const deadlift1RM = parseFloat(document.getElementById('deadlift-1rm')?.value || '0');

        if (!programStart || !squat1RM || !bench1RM || !deadlift1RM) {
            throw new Error('Please fill in all fields');
        }

        if (new Date(programStart) >= getToday()) {
            throw new Error('Please enter a Program Start date in the past.');
        }

        if (isNaN(squat1RM) || isNaN(bench1RM) || isNaN(deadlift1RM)) {
            throw new Error('Please enter valid 1RM values.');
        }

        programInfo.programStart = new Date(programStart);
        programInfo.squat1RM = squat1RM;
        programInfo.dead1RM = deadlift1RM;
        programInfo.bench1RM = bench1RM;

        saveProgramInfo();
        
        // Generate preview in setup view
        generateRoutinePreview();
        
        // Enable start workout button
        const startButton = document.getElementById('start-workout');
        if (startButton) {
            startButton.disabled = false;
        }
    } catch (error) {
        alert(error.message);
        console.error('Error updating weights:', error);
    }
}

/**
 * Generate the routine preview in setup view
 */
function generateRoutinePreview() {
    const previewContainer = document.getElementById('routine-preview');
    if (!previewContainer) return;

    const programWeek = getProgramWeek();
    if (programWeek > 9) {
        previewContainer.innerHTML = '<h2>Program\'s over, go home.</h2>';
        return;
    }

    const lift = getLiftOfTheDay();
    if (lift.toLowerCase().includes('rest')) {
        previewContainer.innerHTML = `
            <div class="preview-card">
                <div class="preview-header">
                    <span class="preview-week">Week ${programWeek}</span>
                    <span class="preview-day">${getDayOfTheWeek()}</span>
                </div>
                <h2>Rest Day</h2>
            </div>
        `;
        return;
    }

    const accessories = getRotatedAccessories(lift, programWeek);
    
    previewContainer.innerHTML = `
        <div class="preview-card">
            <div class="preview-header">
                <span class="preview-week">Week ${programWeek}</span>
                <span class="preview-day">${getDayOfTheWeek()}</span>
            </div>
            <div class="preview-main-lift">
                <h2>${lift}</h2>
                <div class="preview-details">
                    <span>${getWeightOfTheDay()} lbs</span>
                    <span>•</span>
                    <span>${getSetsAndReps()}</span>
                </div>
            </div>
            <div class="preview-accessories">
                <h3>Accessories</h3>
                <div class="preview-accessory-list">
                    ${accessories.map(acc => `
                        <div class="preview-accessory">
                            <span class="accessory-name">${acc.exercise}</span>
                            <span class="accessory-scheme">${acc.setsReps}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Get rotated accessories for the day
 * @param {string} primaryLift 
 * @param {number} programWeek 
 * @returns {AccessoryExercise[]}
 */
function getRotatedAccessories(primaryLift, programWeek) {
    if (!ACCESSORIES[primaryLift]?.length) return [];
    
    const allAccessories = ACCESSORIES[primaryLift];
    const isLightDay = primaryLift.toLowerCase().includes('light');
    const accessoriesPerDay = isLightDay ? 4 : 3;
    
    const totalAccessories = allAccessories.length;
    const rotationWeeks = Math.ceil(totalAccessories / accessoriesPerDay);
    const startIndex = ((programWeek - 1) % rotationWeeks) * accessoriesPerDay;
    
    return Array.from({ length: accessoriesPerDay }, (_, i) => {
        const index = (startIndex + i) % totalAccessories;
        return allAccessories[index];
    });
}

/**
 * Generate and display the routine
 */
function generateRoutine() {
    const routineDisplay = document.getElementById('routine-display');
    if (!routineDisplay) return;

    routineDisplay.innerHTML = '';
    const programWeek = getProgramWeek();

    if (programWeek > 9) {
        alert('Program\'s over, go home.');
        return;
    }

    const lift = getLiftOfTheDay();
    if (lift.toLowerCase().includes('rest')) {
        displayRestDay(routineDisplay, programWeek);
        return;
    }

    displayWorkout(routineDisplay, lift, programWeek);
}

/**
 * Display a rest day
 * @param {HTMLElement} container 
 * @param {number} week 
 */
function displayRestDay(container, week) {
    const card = document.createElement('div');
    card.className = 'workout-card';
    card.innerHTML = `
        <div class="workout-header">
            <div class="workout-meta">
                <span>Week ${week}</span>
                <span>${getDayOfTheWeek()}</span>
            </div>
            <div class="primary-lift">
                <h2>Rest Day</h2>
            </div>
        </div>
    `;
    container.appendChild(card);
}

/**
 * Display a workout day
 * @param {HTMLElement} container 
 * @param {string} lift 
 * @param {number} programWeek 
 */
function displayWorkout(container, lift, programWeek) {
    const accessories = getRotatedAccessories(lift, programWeek);
    
    const card = document.createElement('div');
    card.className = 'workout-card';
    
    card.innerHTML = `
        <div class="workout-header">
            <div class="workout-meta">
                <span>Week ${programWeek}</span>
                <span>${getDayOfTheWeek()}</span>
            </div>
            <div class="primary-lift">
                <h2>${lift}</h2>
                <div class="lift-details">
                    <span class="lift-detail">${getWeightOfTheDay()} lbs</span>
                    <span class="lift-detail">${getSetsAndReps()}</span>
                </div>
            </div>
        </div>
        <div class="accessories-section">
            <h3>Accessories</h3>
            ${formatAccessories(accessories)}
        </div>
    `;
    
    container.appendChild(card);
}

/**
 * Format accessories for display
 * @param {AccessoryExercise[]} accessories 
 * @returns {string}
 */
function formatAccessories(accessories) {
    if (!accessories?.length) return '<p>No accessories scheduled</p>';
    
    return `
        <div class="accessory accessory-header">
            <span class="exercise">Exercise</span>
            <span class="sets-reps">Sets × Reps</span>
            <span class="weight">Target Weight</span>
        </div>
        ${accessories.map(acc => `
            <div class="accessory">
                <span class="exercise">${acc.exercise}</span>
                <span class="sets-reps">${acc.setsReps}</span>
                <span class="weight">${acc.weight}</span>
            </div>
        `).join('')}
    `;
}

// -------------------------
// Workout State
// -------------------------
/** @type {Object} */
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

/**
 * Start the workout session
 */
function startWorkout() {
    workoutState.isActive = true;
    workoutState.startTime = new Date();
    workoutState.currentLift = getLiftOfTheDay();
    workoutState.timerPaused = false;
    workoutState.pausedTime = null;
    workoutState.totalPausedTime = 0;
    
    // Switch views
    document.getElementById('setup-view').classList.remove('active');
    document.getElementById('workout-view').classList.add('active');
    
    // Initialize timer
    startWorkoutTimer();
    
    // Add click handler for timer
    const timerDisplay = document.querySelector('.timer-display');
    if (timerDisplay) {
        timerDisplay.addEventListener('click', toggleTimer);
    }
    
    // Generate workout content
    generateWorkoutContent();
    
    // Setup before unload warning
    window.addEventListener('beforeunload', handleBeforeUnload);
}

/**
 * Handle page unload during active workout
 * @param {BeforeUnloadEvent} e 
 */
function handleBeforeUnload(e) {
    if (workoutState.isActive) {
        e.preventDefault();
        e.returnValue = '';
    }
}

/**
 * Start the workout timer
 */
function startWorkoutTimer() {
    workoutState.timerInterval = setInterval(updateTimer, 1000);
}

/**
 * Update the workout timer display
 */
function updateTimer() {
    const timerDisplay = document.getElementById('workout-timer');
    if (!timerDisplay || !workoutState.startTime) return;
    
    const now = new Date();
    const elapsed = now - workoutState.startTime - workoutState.totalPausedTime;
    const seconds = Math.floor((elapsed / 1000) % 60);
    const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    
    timerDisplay.textContent = 
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}`;
}

/**
 * Generate the workout content
 */
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
    
    // Initialize exercise states
    workoutState.sets.clear();
    workoutState.sets.set('primary', { 
        type: 'primary',
        exercise: lift,
        weight,
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
    
    // Render workout content
    container.innerHTML = `
        <div class="exercise-list">
            <div class="exercise-row ${workoutState.sets.get('primary').completedSets === 0 ? 'active' : ''}" 
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
            
            ${accessories.map((acc, i) => {
                const exerciseState = workoutState.sets.get(`accessory-${i}`);
                const [sets, reps] = acc.setsReps.split('x');
                return `
                    <div class="exercise-row ${shouldBeActive(i) ? 'active' : ''}" 
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
            }).join('')}
        </div>
    `;
    
    // Add click handlers
    container.querySelectorAll('.exercise-row').forEach(row => {
        row.addEventListener('click', () => completeSet(row.dataset.exerciseId));
    });
}

/**
 * Check if an accessory exercise should be active
 * @param {number} index 
 * @returns {boolean}
 */
function shouldBeActive(index) {
    const previousId = index === 0 ? 'primary' : `accessory-${index - 1}`;
    const currentId = `accessory-${index}`;
    const previousExercise = workoutState.sets.get(previousId);
    const currentExercise = workoutState.sets.get(currentId);
    
    return previousExercise?.completedSets === previousExercise?.totalSets &&
           currentExercise?.completedSets < currentExercise?.totalSets;
}

/**
 * Complete a set for the given exercise
 * @param {string} exerciseId 
 */
function completeSet(exerciseId) {
    const exercise = workoutState.sets.get(exerciseId);
    if (!exercise || exercise.completedSets >= exercise.totalSets) return;
    
    exercise.completedSets++;
    workoutState.sets.set(exerciseId, exercise);
    
    // Update UI
    const row = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    if (row) {
        // Update the checkmarks
        const checkmarks = row.querySelectorAll('.set-mark');
        checkmarks.forEach((mark, index) => {
            if (index < exercise.completedSets) {
                mark.classList.add('completed');
            } else {
                mark.classList.remove('completed');
            }
        });
        
        // Update the counter
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
}

/**
 * Finish the workout
 */
function finishWorkout() {
    if (!confirm('Are you sure you want to finish this workout?')) return;
    
    clearInterval(workoutState.timerInterval);
    workoutState.isActive = false;
    
    // Switch back to setup view
    document.getElementById('workout-view').classList.remove('active');
    document.getElementById('setup-view').classList.add('active');
    
    // Reset workout state
    workoutState.startTime = null;
    workoutState.sets.clear();
    workoutState.currentLift = null;
    
    // Remove unload warning
    window.removeEventListener('beforeunload', handleBeforeUnload);
}

/**
 * Toggle timer pause state
 */
function toggleTimer() {
    if (!workoutState.isActive) return;
    
    const timerDisplay = document.querySelector('.timer-display');
    if (!timerDisplay) return;
    
    if (workoutState.timerPaused) {
        // Resume timer
        workoutState.timerPaused = false;
        workoutState.totalPausedTime += (new Date() - workoutState.pausedTime);
        workoutState.pausedTime = null;
        timerDisplay.classList.remove('paused');
        workoutState.timerInterval = setInterval(updateTimer, 1000);
    } else {
        // Pause timer
        workoutState.timerPaused = true;
        workoutState.pausedTime = new Date();
        timerDisplay.classList.add('paused');
        clearInterval(workoutState.timerInterval);
    }
}

/**
 * Generate checkmark indicators for sets
 * @param {number} totalSets 
 * @param {number} completedSets 
 * @returns {string}
 */
function generateSetCheckmarks(totalSets, completedSets) {
    return Array.from({ length: totalSets }, (_, i) => `
        <div class="set-mark ${i < completedSets ? 'completed' : ''}">
            <div class="circle"></div>
        </div>
    `).join('');
}
