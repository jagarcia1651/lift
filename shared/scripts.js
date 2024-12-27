/**
 * Shared functionality and constants
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
// Initialize state before any other code that might use it
window.state = {
    program: {
        todayDate: new Date(),
        programStart: new Date(),  // Default to today, will be updated from storage
        squat1RM: 0,
        dead1RM: 0,
        bench1RM: 0
    },
    workout: {
        isActive: false,
        startTime: null,
        timerInterval: null,
        sets: new Map(),
        currentLift: null,
        timerPaused: false,
        pausedTime: null,
        totalPausedTime: 0
    },
    workoutHistory: new Map() // Key: date string (YYYY-MM-DD), Value: workout data
};

// Add state initialization function
function initializeState() {
    try {
        const savedProgramInfo = localStorage.getItem('programInfo');
        if (savedProgramInfo) {
            const { squat1RM, dead1RM, bench1RM, programStart } = JSON.parse(savedProgramInfo);
            state.program = {
                ...state.program,
                squat1RM: squat1RM || 0,
                dead1RM: dead1RM || 0,
                bench1RM: bench1RM || 0,
                programStart: new Date(programStart) || new Date('2024-11-25')
            };
        } else {
            // Set default program start if no saved data
            state.program.programStart = new Date('2024-11-25');
        }
    } catch (error) {
        console.error('Error initializing state:', error);
        // Use default program start on error
        state.program.programStart = new Date('2024-11-25');
    }
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
    if (lift.toLowerCase().includes('squat')) return state.program.squat1RM;
    if (lift.toLowerCase().includes('bench')) return state.program.bench1RM;
    if (lift.toLowerCase().includes('dead')) return state.program.dead1RM;
    return 0;
}

function getSetsAndReps() {
    const lift = getLiftOfTheDay();
    return lift.toLowerCase().includes('light') ? '3x8' : '5x5';
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