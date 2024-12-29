let currentDate = new Date();

function updateCurrentDate(date) {
    currentDate = date;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendarPage();
    loadWorkoutHistory();
    
    // Set program start input value
    const programStartInput = document.getElementById('program-start');
    if (programStartInput && state.program.programStart) {
        programStartInput.value = getFormattedDate(state.program.programStart);
    }
    
    updateDateDisplay(currentDate);
});

function updateDateDisplay(date) {
    const selectedDate = document.querySelector('.selected-date');
    const workoutType = document.querySelector('.workout-type');
    
    // Format date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    selectedDate.textContent = date.toLocaleDateString('en-US', options);
    
    // Update workout type
    const liftType = DAYS.LIFT_SCHEDULE[date.getDay()];
    workoutType.textContent = liftType;
    
    // Update calendar display
    generateCalendar(date);
    
    // Update workout status and overview
    updateWorkoutStatus(date);
    updateWorkoutOverview(date);
}

function updateWorkoutStatus(date) {
    const dateKey = getFormattedDate(date);
    const savedWorkout = state.savedWorkouts.get(dateKey);
    
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    statusDot.className = 'status-dot';
    
    // Check if date is before program start
    const programStart = new Date(state.program.programStart);
    programStart.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < programStart) {
        statusDot.classList.add('before-program');
        statusText.textContent = 'Program Not Started';
        return;
    }
    
    // Check if program is complete
    if (isProgramComplete(date)) {
        statusDot.classList.add('rest');
        statusText.textContent = 'Program Complete';
        return;
    }
    
    // Check if it's a rest day
    if (DAYS.LIFT_SCHEDULE[date.getDay()].toLowerCase().includes('rest')) {
        statusDot.classList.add('rest');
        statusText.textContent = 'Rest Day';
        return;
    }
    
    if (savedWorkout) {
        // Check for partial completion
        const hasPartialProgress = savedWorkout.progress?.primaryLift?.completed > 0 || 
            savedWorkout.progress?.accessories?.some(acc => acc.completed > 0);
            
        // Check for full completion
        const isFullyComplete = savedWorkout.progress?.primaryLift?.completed === savedWorkout.progress?.primaryLift?.total &&
            savedWorkout.progress?.accessories?.every(acc => acc.completed === acc.total);
        
        if (isFullyComplete) {
            statusDot.classList.add('complete');
            statusText.textContent = 'Complete';
        } else if (hasPartialProgress) {
            statusDot.classList.add('partial');
            statusText.textContent = 'Partial';
        } else {
            statusDot.classList.add('missed');
            statusText.textContent = 'Incomplete';
        }
    } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (checkDate < today) {
            statusDot.classList.add('missed');
            statusText.textContent = 'Missed';
        } else {
            statusDot.classList.add('upcoming');
            statusText.textContent = 'Not Started';
        }
    }
}

function updateWorkoutOverview(date) {
    const overview = document.getElementById('workout-overview');
    if (!overview) return;
    
    // Check if date is before program start
    const programStart = new Date(state.program.programStart);
    programStart.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < programStart) {
        overview.innerHTML = '<div class="program-not-started">Program Not Yet Started</div>';
        return;
    }
    
    // Check if program is complete
    if (isProgramComplete(date)) {
        overview.innerHTML = '<div class="program-over">Program Complete</div>';
        return;
    }
    
    // Get workout info for the day
    const workoutType = DAYS.LIFT_SCHEDULE[date.getDay()];
    const isRestDay = workoutType.toLowerCase().includes('rest');
    
    // Check if workout exists for this date
    const dateKey = getFormattedDate(date);
    const savedWorkout = state.savedWorkouts.get(dateKey);
    
    // Check workout states
    const isWorkoutComplete = savedWorkout?.progress?.primaryLift?.completed === savedWorkout?.progress?.primaryLift?.total &&
        savedWorkout?.progress?.accessories?.every(acc => acc.completed === acc.total);
    
    const hasProgress = savedWorkout?.progress?.primaryLift?.completed > 0 || 
        savedWorkout?.progress?.accessories?.some(acc => acc.completed > 0);
    
    // Ensure the proper HTML structure exists
    if (!overview.querySelector('.lift-details')) {
        overview.innerHTML = `
            <div class="lift-details">
                <span class="lift-name"></span>
                <span class="lift-weight"></span>
                <span class="lift-sets"></span>
            </div>
            <button type="button" class="btn btn-primary setup-btn">
                ${isWorkoutComplete ? 'View Workout' : (hasProgress ? 'Resume Workout' : 'Setup Workout')}
            </button>
        `;
    }
    
    // Update lift details
    const liftName = overview.querySelector('.lift-name');
    const liftWeight = overview.querySelector('.lift-weight');
    const liftSets = overview.querySelector('.lift-sets');
    const setupBtn = overview.querySelector('.setup-btn');
    
    liftName.textContent = workoutType;
    
    if (isRestDay) {
        liftWeight.textContent = '';
        liftSets.textContent = '';
        setupBtn.style.display = 'none';
    } else {
        const baseWeight = getBaseWeight(workoutType);
        const percentage = getCurrentPercentage();
        const weight = roundWeight(baseWeight * (percentage / 100));
        const setsReps = getSetsAndReps();
        
        liftWeight.textContent = `${weight} lbs (${percentage}%)`;
        liftSets.textContent = setsReps;
        setupBtn.style.display = 'block';
        setupBtn.textContent = isWorkoutComplete ? 'View Workout' : 
            (hasProgress ? 'Resume Workout' : 'Setup Workout');
        
        setupBtn.onclick = () => {
            if (isWorkoutComplete) {
                // For completed workouts, go directly to workout view
                localStorage.setItem('workoutSetup', JSON.stringify({
                    ...savedWorkout.setup,
                    selectedDate: date.toISOString()
                }));
                window.location.href = '../workout/workout.html';
            } else if (hasProgress) {
                // For partial workouts, go directly to workout view and resume
                const setupData = {
                    selectedDate: date.toISOString(),
                    selectedAccessories: savedWorkout?.setup?.selectedAccessories || [],
                    startTime: savedWorkout?.setup?.startTime,
                    timerPaused: false, // Start timer automatically
                    totalPausedTime: savedWorkout?.setup?.totalPausedTime || 0,
                    progress: savedWorkout?.progress
                };
                localStorage.setItem('workoutSetup', JSON.stringify(setupData));
                window.location.href = '../workout/workout.html';
            } else {
                // For new workouts, go to setup
                const setupData = {
                    selectedDate: date.toISOString()
                };
                localStorage.setItem('workoutSetup', JSON.stringify(setupData));
                window.location.href = '../setup/setup.html';
            }
        };
    }
}

function previousDay() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    updateCurrentDate(newDate);
    updateDateDisplay(newDate);
}

function nextDay() {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    updateCurrentDate(newDate);
    updateDateDisplay(newDate);
}

function generateCalendar(date) {
    const calendar = document.querySelector('.simple-calendar');
    if (!calendar) return;
    
    // Get first day of the month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    // Get last day of the month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Clear existing calendar
    calendar.innerHTML = '';
    
    // Update current date to maintain selected date in new month
    currentDate = new Date(date);
    
    // Generate calendar grid
    generateCalendarGrid(firstDay, lastDay, currentDate);
}

function generateCalendarGrid(firstDay, lastDay, selectedDate) {
    const calendar = document.querySelector('.simple-calendar');
    if (!calendar) return;
    
    const startingDay = firstDay.getDay();
    const monthLength = lastDay.getDate();
    
    // Always show 6 weeks
    const totalDays = 42;
    
    for (let i = 0; i < totalDays; i++) {
        const dayDiv = document.createElement('div');
        const dayNumber = i - startingDay + 1;
        
        if (dayNumber > 0 && dayNumber <= monthLength) {
            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayNumber);
            const status = getDateStatus(date);
            
            dayDiv.className = 'calendar-day';
            dayDiv.classList.add(status);
            dayDiv.textContent = dayNumber;
            
            // Check if this is the selected date
            if (dayNumber === selectedDate.getDate()) {
                dayDiv.classList.add('selected');
            }
            
            dayDiv.addEventListener('click', () => {
                // Remove selected class from all days
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                // Add selected class to clicked day
                dayDiv.classList.add('selected');
                // Update current date and all displays
                const newDate = new Date(date);
                updateCurrentDate(newDate);
                updateDateDisplay(newDate);
            });
        } else {
            dayDiv.className = 'calendar-day empty';
            dayDiv.textContent = '\u00A0';
        }
        
        calendar.appendChild(dayDiv);
    }
}

// Add function to determine date status
function getDateStatus(date) {
    const dateKey = getFormattedDate(date);
    const savedWorkout = state.savedWorkouts.get(dateKey);
    
    // Check if date is before program start
    const programStart = new Date(state.program.programStart);
    programStart.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < programStart) return 'before-program';
    if (isProgramComplete(date)) return 'rest';
    if (DAYS.LIFT_SCHEDULE[date.getDay()].toLowerCase().includes('rest')) return 'rest';
    
    if (savedWorkout) {
        // Check for partial completion
        const hasPartialProgress = savedWorkout.progress?.primaryLift?.completed > 0 || 
            savedWorkout.progress?.accessories?.some(acc => acc.completed > 0);
            
        // Check for full completion
        const isFullyComplete = savedWorkout.progress?.primaryLift?.completed === savedWorkout.progress?.primaryLift?.total &&
            savedWorkout.progress?.accessories?.every(acc => acc.completed === acc.total);
        
        if (isFullyComplete) return 'complete';
        if (hasPartialProgress) return 'partial';
        return 'missed';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return checkDate < today ? 'missed' : 'upcoming';
}

// Add this function to initialize the calendar page
function initializeCalendarPage() {
    // Display program start date
    const programStartDisplay = document.getElementById('program-start-display');
    if (programStartDisplay && state.program.programStart) {
        // Create a new date object and set it to midnight in local timezone
        const localDate = new Date(state.program.programStart);
        localDate.setMinutes(localDate.getMinutes() + localDate.getTimezoneOffset());
        
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        programStartDisplay.textContent = localDate.toLocaleDateString('en-US', options);
    }
}

function isProgramComplete(date) {
    const programStart = new Date(state.program.programStart);
    const diffTime = Math.abs(date - programStart);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > (9 * 7) - 1; // More than 9 weeks
}

function goToToday() {
    const today = new Date();
    // First update the current date
    updateCurrentDate(today);
    // Then update all displays including the calendar
    updateDateDisplay(today);
    // Remove the extra generateCalendar call since it's already called in updateDateDisplay
} 