/**
 * Shared functionality and constants
 */

// -------------------------
// Constants and Config
// -------------------------
const CONFIG = {
    LIGHT_WORKOUT_PERCENTAGE: 0.6,
    PROGRESSION_SCHEMES: [
        { week: 1, sets: 6, reps: 3, percentage: 0.80 },
        { week: 2, sets: 6, reps: 4, percentage: 0.80 },
        { week: 3, sets: 6, reps: 5, percentage: 0.80 },
        { week: 4, sets: 6, reps: 6, percentage: 0.80 },
        { week: 5, sets: 5, reps: 5, percentage: 0.85 },
        { week: 6, sets: 4, reps: 4, percentage: 0.90 },
        { week: 7, sets: 3, reps: 3, percentage: 0.95 },
        { week: 8, sets: 2, reps: 2, percentage: 1.00 },
        { week: 9, sets: 1, reps: 1, percentage: 1.05 }
    ]
};

const DAYS = Object.freeze({
    LIFT_SCHEDULE: ['Rest', 'Heavy Squat', 'Light Bench', 'Deadlift', 'Light Squat', 'Heavy Bench', 'Rest'],
    NAMES: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
});

const ACCESSORIES = Object.freeze({
    "Heavy Squat": [
        { exercise: "Leg Extension", setsReps: "3x15", weight: "~20RM" },
        { exercise: "Leg Curl", setsReps: "3x15", weight: "~20RM" },
        { exercise: "Hanging Leg Raise Variations", setsReps: "3x10", weight: "Bodyweight" }
    ],
    "Light Squat": [
        { exercise: "Romanian Deadlifts", setsReps: "3x10", weight: "~12RM" },
        { exercise: "Back Extensions", setsReps: "3x15", weight: "Bodyweight" },
        { exercise: "Toe Touches", setsReps: "3x15", weight: "Bodyweight" }
    ],
    "Heavy Bench": [
        { exercise: "Paused Barbell Bench", setsReps: "3x8", weight: "~12RM" },
        { exercise: "Dumbbell Lateral Raises", setsReps: "3x12-10-8", weight: "~15RM" },
        { exercise: "Barbell Skull Crushers", setsReps: "3x15", weight: "~20RM" }
    ],
    "Light Bench": [
        { exercise: "Incline Dumbbell Bench", setsReps: "3x8", weight: "~12RM" },
        { exercise: "Incline Dumbbell Chest Flys", setsReps: "3x12-10-8", weight: "~15RM" },
        { exercise: "Narrow Grip Bench", setsReps: "3x15", weight: "~20RM" }
    ],
    "Deadlift": [
        { exercise: "Kroc Rows", setsReps: "3x8", weight: "~10RM" },
        { exercise: "Hanging Leg Raise Variations", setsReps: "3x10", weight: "Bodyweight" },        
        { exercise: "Pull-Ups", setsReps: "3xMax", weight: "Bodyweight" }
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
// Initialize state before any other code that might use it
window.state = {
    program: {
        todayDate: new Date(),
        programStart: new Date(),
        squat1RM: 0,
        dead1RM: 0,
        bench1RM: 0,
        restTimer: 90  // Default 90 seconds
    },
    workout: {
        isActive: false,
        startTime: null,
        timerInterval: null,
        restStartTime: null,
        restInterval: null,
        sets: new Map(),
        currentLift: null,
        timerPaused: false,
        pausedTime: null,
        totalPausedTime: 0
    },
    workoutHistory: new Map(), // Key: date string (YYYY-MM-DD), Value: workout data
    savedWorkouts: new Map()   // Key: date string (YYYY-MM-DD), Value: workout setup & progress
};

// Add state initialization function
function initializeState() {
    loadProgramInfo();
    loadWorkoutHistory();
    loadSavedWorkouts();
}

// Initialize state when the script loads
initializeState();

// -------------------------
// Theme Management
// -------------------------
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Check saved preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial theme
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'dark';
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.checked = true;
    }

    // Add theme toggle listener
    themeToggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}

// Call initTheme on every page load
document.addEventListener('DOMContentLoaded', initTheme);

// -------------------------
// Utility Functions
// -------------------------
function getBaseWeight(workoutType) {
    if (!workoutType || workoutType.toLowerCase().includes('rest')) return 0;
    
    let baseWeight = 0;
    const type = workoutType.toLowerCase();
    
    if (type.includes('squat')) {
        baseWeight = state.program.squat1RM;
    } else if (type.includes('bench')) {
        baseWeight = state.program.bench1RM;
    } else if (type.includes('dead')) {
        baseWeight = state.program.dead1RM;
    }
    
    return baseWeight;
}

function getFormattedDate(date) {
    return date.toISOString().split('T')[0];
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [hours, minutes, seconds]
        .map(n => n.toString().padStart(2, '0'))
        .join(':');
}

function getLiftOfTheDay() {
    const today = getToday();
    const dayOfWeek = today.getDay();
    return DAYS.LIFT_SCHEDULE[dayOfWeek];
}

function getProgramWeek() {
    const today = getToday();
    const start = new Date(state.program.programStart);
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}

function getWeightOfTheDay() {
    const workoutType = getLiftOfTheDay();
    const baseWeight = getBaseWeight(workoutType);
    const percentage = getCurrentPercentage();
    return roundWeight(baseWeight * (percentage / 100));
}

function getOneRepMax(lift) {
    if (lift.toLowerCase().includes('squat')) return state.program.squat1RM;
    if (lift.toLowerCase().includes('bench')) return state.program.bench1RM;
    if (lift.toLowerCase().includes('dead')) return state.program.dead1RM;
    return 0;
}

function getSetsAndReps() {
    const week = getProgramWeek();
    const weekInCycle = (week % 9) + 1;
    const scheme = CONFIG.PROGRESSION_SCHEMES.find(s => s.week === weekInCycle);
    
    if (!scheme) return '5x5';  // Default if no scheme found
    return `${scheme.sets}x${scheme.reps}`;
}

function areAllFieldsFilled() {
    return Boolean(
        document.getElementById('squat-1rm')?.value &&
        document.getElementById('bench-1rm')?.value &&
        document.getElementById('deadlift-1rm')?.value &&
        document.getElementById('program-start')?.value &&
        document.getElementById('today-date')?.value
    );
}

// UI Helper Functions
function generateSetCheckmarks(total, completed) {
    return Array(total).fill()
        .map((_, i) => `
            <div class="set-mark ${i < completed ? 'completed' : ''}">
                <div class="circle"></div>
            </div>
        `).join('');
}

function generateAccessoryRows(accessories) {
    return accessories.map((acc, index) => `
        <div class="exercise-row accessory ${isPrimaryComplete() ? 'available' : ''}" 
             data-exercise-id="accessory-${index}">
            <div class="exercise-info">
                <h3>${acc.exercise}</h3>
                <div class="exercise-details">
                    <span class="weight-detail">${acc.weight}</span>
                    <span class="reps-detail">${acc.setsReps}</span>
                </div>
            </div>
            <div class="exercise-progress">
                <div class="set-checkmarks">
                    ${generateSetCheckmarks(
                        Number(acc.setsReps.split('x')[0]), 
                        state.workout.sets.get(`accessory-${index}`)?.completedSets || 0
                    )}
                </div>
                <div class="set-progress">
                    <span class="sets-completed">
                        ${state.workout.sets.get(`accessory-${index}`)?.completedSets || 0}
                    </span>
                    <span class="sets-divider">/</span>
                    <span class="sets-total">${acc.setsReps.split('x')[0]}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateExerciseUI(exerciseId, exercise) {
    const row = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
    if (!row) return;

    const checkmarks = row.querySelector('.set-checkmarks');
    const completed = row.querySelector('.sets-completed');
    
    if (checkmarks) {
        checkmarks.innerHTML = generateSetCheckmarks(exercise.totalSets, exercise.completedSets);
    }
    
    if (completed) {
        completed.textContent = exercise.completedSets;
    }
}

function resetWorkoutState() {
    state.workout.isActive = false;
    state.workout.startTime = null;
    state.workout.timerInterval = null;
    state.workout.sets.clear();
    state.workout.currentLift = null;
    state.workout.timerPaused = false;
    state.workout.pausedTime = null;
    state.workout.totalPausedTime = 0;
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', initTheme); 

// -------------------------
// Error Handling
// -------------------------
class WorkoutError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'WorkoutError';
        this.code = code;
    }
}

function handleError(error, context = '') {
    console.error(`${context}: ${error.message}`);
    
    if (error instanceof WorkoutError) {
        alert(error.message);
    } else {
        alert('An unexpected error occurred. Please try again.');
    }
}

// Add validation functions
function validateProgramInfo(info) {
    if (!info.squat1RM || !info.bench1RM || !info.dead1RM) {
        throw new WorkoutError('All lift maxes must be greater than 0');
    }
    
    if (new Date(info.programStart) > new Date()) {
        throw new WorkoutError('Program start date cannot be in the future');
    }
}

function validateWeights(weight) {
    if (isNaN(weight) || weight < 0) {
        throw new WorkoutError('Invalid weight value');
    }
} 

// Update getToday to handle potential null
function getToday() {
    return state?.program?.todayDate || new Date();
}

// Add this to the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initializeState();
}); 

// -------------------------
// View Management
// -------------------------
function loadView(page) {
    // Don't reload setup page if we're already on it and it's the first load
    if (page === 'setup' && !document.querySelector('script[data-page-script]')) {
        return;
    }

    const mainContent = document.getElementById('main-content');
    
    // Remove any existing page-specific styles and scripts
    document.querySelectorAll('link[data-page-style]').forEach(el => el.remove());
    document.querySelectorAll('script[data-page-script]').forEach(el => el.remove());
    
    // Load page content
    fetch(`${page}/${page}.html`)
        .then(response => response.text())
        .then(html => {
            // Extract main content from the loaded HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('section').outerHTML;
            
            // Update content
            mainContent.innerHTML = content;
            
            // Load the page's styles
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${page}/${page}.css`;
            link.setAttribute('data-page-style', page);
            document.head.appendChild(link);
            
            // Load and execute the page's script
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `${page}/${page}.js`;
                script.setAttribute('data-page-script', page);
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        })
        .catch(error => {
            console.error('View loading error:', error);
            handleError(error, 'Failed to load view');
        });
}

function returnToHome() {

    window.location.href = '../index.html';
}

// Helper function for backward compatibility
function navigateTo(page) {
    loadView(page);
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initializeState();
    loadView('setup');
}); 

// Add function to save workout results
function saveWorkoutResults(date, results) {
    const dateKey = getFormattedDate(date);
    state.workoutHistory.set(dateKey, results);
    localStorage.setItem('workoutHistory', JSON.stringify(Array.from(state.workoutHistory.entries())));
}

// Add function to load workout history
function loadWorkoutHistory() {
    try {
        const saved = localStorage.getItem('workoutHistory');
        if (saved) {
            state.workoutHistory = new Map(JSON.parse(saved));
        }
    } catch (error) {
        console.error('Error loading workout history:', error);
    }
} 

function updateProgramStart(date) {
    state.program.programStart = new Date(date);
    saveProgramInfo();
    
    // Regenerate the symbolic calendar with current date
    generateSymbolicCalendar(currentDate);
    
    // Update workout status for current date
    updateWorkoutStatus(currentDate);
}

// Update the initialization to set the program start input
document.addEventListener('DOMContentLoaded', () => {
    // ... existing initialization ...
    
    // Set program start input value
    const programStartInput = document.getElementById('program-start');
    if (programStartInput && state.program.programStart) {
        programStartInput.value = getFormattedDate(state.program.programStart);
    }
}); 

// Add to the state management section
function saveProgramInfo() {
    try {
        localStorage.setItem('programInfo', JSON.stringify({
            squat1RM: state.program.squat1RM,
            dead1RM: state.program.dead1RM,
            bench1RM: state.program.bench1RM,
            programStart: state.program.programStart.toISOString()
        }));
    } catch (error) {
        console.error('Error saving program info:', error);
    }
} 

function generateSymbolicCalendar(currentDate) {
    const calendar = document.querySelector('.symbolic-calendar');
    if (!calendar) return;
    
    calendar.innerHTML = '';
    
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDay = firstDay.getDay();
    const monthLength = lastDay.getDate();
    
    // Create grid of dots
    for (let i = 0; i < 35; i++) {
        const dot = document.createElement('div');
        const dayNumber = i - startingDay + 1;
        
        if (dayNumber > 0 && dayNumber <= monthLength) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
            const status = getDotStatus(date);
            
            dot.className = 'calendar-dot';
            dot.classList.add(status);
            
            // Check if this is the selected date
            if (date.getDate() === currentDate.getDate() && 
                date.getMonth() === currentDate.getMonth() && 
                date.getFullYear() === currentDate.getFullYear()) {
                dot.classList.add('selected');
            }
            
            // Make non-rest dots clickable
            if (!status.includes('rest')) {
                dot.addEventListener('click', (e) => {
                    // Remove selected class from all dots
                    document.querySelectorAll('.calendar-dot').forEach(d => d.classList.remove('selected'));
                    // Add selected class to clicked dot
                    dot.classList.add('selected');
                    // Update current date and display
                    currentDate = date;
                    updateDateDisplay(currentDate);
                });
            }
        } else {
            dot.className = 'calendar-dot rest';
        }
        
        calendar.appendChild(dot);
    }
} 

function generateCalendar(currentDate) {
    const calendar = document.querySelector('.simple-calendar');
    if (!calendar) return;
    
    calendar.innerHTML = '';
    
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDay = firstDay.getDay();
    const monthLength = lastDay.getDate();
    
    // Create grid of days
    for (let i = 0; i < 35; i++) {
        const dayDiv = document.createElement('div');
        const dayNumber = i - startingDay + 1;
        
        if (dayNumber > 0 && dayNumber <= monthLength) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
            const status = getDotStatus(date);
            
            dayDiv.className = 'calendar-day';
            dayDiv.classList.add(status);
            dayDiv.textContent = dayNumber;
            
            // Check if this is the selected date
            if (date.getDate() === currentDate.getDate() && 
                date.getMonth() === currentDate.getMonth() && 
                date.getFullYear() === currentDate.getFullYear()) {
                dayDiv.classList.add('selected');
            }
            
            // Make non-rest days clickable
            if (!status.includes('rest')) {
                dayDiv.addEventListener('click', () => {
                    // Remove selected class from all days
                    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    // Add selected class to clicked day
                    dayDiv.classList.add('selected');
                    // Update current date and display
                    currentDate = date;
                    updateDateDisplay(currentDate);
                });
            }
        } else {
            dayDiv.className = 'calendar-day empty';
            dayDiv.textContent = '\u00A0'; // Non-breaking space
        }
        
        calendar.appendChild(dayDiv);
    }
} 

// Add helper function to get current percentage
function getCurrentPercentage() {
    const lift = getLiftOfTheDay();
    const isLight = lift.toLowerCase().includes('light');
    
    if (isLight) {
        return CONFIG.LIGHT_WORKOUT_PERCENTAGE * 100;
    }
    
    const week = getProgramWeek();
    const weekInCycle = (week % 9) + 1;
    const scheme = CONFIG.PROGRESSION_SCHEMES.find(s => s.week === weekInCycle);
    
    return scheme ? scheme.percentage * 100 : 80;
} 

function showResetConfirmation() {
    const modalHtml = `
        <div id="reset-modal" class="modal">
            <div class="modal-content">
                <h3>Reset Program</h3>
                <p>This will clear all program data including your progress and workout history. Are you sure?</p>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeResetModal()">
                        Cancel
                    </button>
                    <button type="button" class="confirm-btn danger" onclick="confirmReset()">
                        Reset Program
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('reset-modal').classList.add('active');
}

function closeResetModal() {
    const modal = document.getElementById('reset-modal');
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
}

function confirmReset() {
    localStorage.clear();
    closeResetModal();
    window.location.reload();
} 

function roundWeight(weight) {
    return Math.round(weight / 5) * 5;
} 

// Add helper function to save workout state
function saveWorkoutState(date) {
    const dateKey = getFormattedDate(date);
    const workoutState = {
        setup: JSON.parse(localStorage.getItem('workoutSetup') || '{}'),
        progress: {
            primaryLift: {
                name: document.querySelector('.primary .lift-name')?.textContent,
                completed: parseInt(document.querySelector('.primary .sets-completed')?.textContent || '0'),
                total: parseInt(document.querySelector('.primary .sets-total')?.textContent || '0')
            },
            accessories: Array.from(document.querySelectorAll('#accessories-list .exercise-row') || []).map(row => ({
                name: row.querySelector('h4')?.textContent,
                completed: parseInt(row.querySelector('.sets-completed')?.textContent || '0'),
                total: parseInt(row.querySelector('.sets-total')?.textContent || '0')
            }))
        }
    };
    
    state.savedWorkouts.set(dateKey, workoutState);
    localStorage.setItem('savedWorkouts', JSON.stringify(Array.from(state.savedWorkouts.entries())));
}

// Add helper function to load saved workouts
function loadSavedWorkouts() {
    try {
        const saved = localStorage.getItem('savedWorkouts');
        if (saved) {
            state.savedWorkouts = new Map(JSON.parse(saved));
        }
    } catch (error) {
        console.error('Error loading saved workouts:', error);
    }
} 

// Add this function to the state management section
function loadProgramInfo() {
    try {
        const savedProgramInfo = localStorage.getItem('programInfo');
        if (savedProgramInfo) {
            const { squat1RM, dead1RM, bench1RM, programStart, restTimer } = JSON.parse(savedProgramInfo);
            
            // Create date object and adjust for timezone
            const startDate = new Date(programStart);
            startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
            
            state.program = {
                ...state.program,
                squat1RM: squat1RM || 0,
                dead1RM: dead1RM || 0,
                bench1RM: bench1RM || 0,
                restTimer: restTimer || 90,
                programStart: startDate || new Date()
            };
        } else {
            // Set default program start if no saved data
            const defaultDate = new Date();
            defaultDate.setMinutes(defaultDate.getMinutes() + defaultDate.getTimezoneOffset());
            state.program.programStart = defaultDate;
        }
    } catch (error) {
        console.error('Error loading program info:', error);
        // Use default program start on error
        const defaultDate = new Date();
        defaultDate.setMinutes(defaultDate.getMinutes() + defaultDate.getTimezoneOffset());
        state.program.programStart = defaultDate;
    }
} 