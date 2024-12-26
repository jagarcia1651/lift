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
        generateRoutine();
    } catch (error) {
        alert(error.message);
        console.error('Error updating weights:', error);
    }
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
