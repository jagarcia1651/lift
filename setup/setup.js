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
    selectedAccessories: new Set(),
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
    const container = document.getElementById('recommended-accessories');
    
    container.innerHTML = recommended.map((exercise, index) => `
        <div class="accessory-item" data-id="recommended-${index}" onclick="toggleAccessory(this)">
            <div class="accessory-info">
                <h5>${exercise.exercise}</h5>
                <div class="accessory-details">
                    ${exercise.setsReps} @ ${exercise.weight}
                </div>
            </div>
        </div>
    `).join('');
}

function loadOptionalAccessories() {
    const container = document.getElementById('optional-accessories');
    const poolExercises = ACCESSORY_POOLS[setupState.currentPool] || [];
    
    container.innerHTML = poolExercises.map((exercise, index) => `
        <div class="accessory-item" data-id="optional-${index}" onclick="toggleAccessory(this)">
            <div class="accessory-info">
                <h5>${exercise.exercise}</h5>
                <div class="accessory-details">
                    ${exercise.setsReps} @ ${exercise.weight}
                </div>
            </div>
        </div>
    `).join('');
}

function toggleAccessory(element) {
    const id = element.dataset.id;
    if (setupState.selectedAccessories.has(id)) {
        setupState.selectedAccessories.delete(id);
        element.classList.remove('selected');
    } else {
        setupState.selectedAccessories.add(id);
        element.classList.add('selected');
    }
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
    // Save selected accessories to workout state
    const workoutType = getLiftOfTheDay();
    const recommended = ACCESSORIES[workoutType] || [];
    const optional = ACCESSORY_POOLS[setupState.currentPool] || [];
    
    state.workout.accessories = [
        ...Array.from(setupState.selectedAccessories)
            .filter(id => id.startsWith('recommended-'))
            .map(id => recommended[parseInt(id.split('-')[1])]),
        ...Array.from(setupState.selectedAccessories)
            .filter(id => id.startsWith('optional-'))
            .map(id => optional[parseInt(id.split('-')[1])])
    ];
    
    loadView('workout');
}

// Update the back button handler
function handleBack() {
    window.location.href = '../index.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', initializeSetupPage); 