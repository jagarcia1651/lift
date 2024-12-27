let currentDate = new Date();

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadWorkoutHistory();
    
    // Set program start input value
    const programStartInput = document.getElementById('program-start');
    if (programStartInput && state.program.programStart) {
        programStartInput.value = getFormattedDate(state.program.programStart);
    }
    
    updateDateDisplay(currentDate);
});

function updateDateDisplay(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.querySelector('.selected-date').textContent = date.toLocaleDateString('en-US', options);
    
    const workoutType = DAYS.LIFT_SCHEDULE[date.getDay()];
    document.querySelector('.workout-type').textContent = workoutType;
    
    // Update workout status
    updateWorkoutStatus(date);
    // Update workout overview
    updateWorkoutOverview(date);
    // Update calendar
    generateCalendar(date);
    
    // Update state
    state.program.todayDate = date;
}

function updateWorkoutStatus(date) {
    const dateKey = getFormattedDate(date);
    const workoutData = state.workoutHistory.get(dateKey);
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    statusDot.className = 'status-dot';
    
    if (workoutData) {
        if (workoutData.completed) {
            statusDot.classList.add('complete');
            statusText.textContent = 'Complete';
        } else if (workoutData.primaryCompleted) {
            statusDot.classList.add('partial');
            statusText.textContent = 'Partially Complete';
        } else {
            statusDot.classList.add('missed');
            statusText.textContent = 'Incomplete';
        }
    } else {
        if (checkDate < today) {
            statusDot.classList.add('missed');
            statusText.textContent = 'Not Started';
        } else {
            statusDot.classList.add('upcoming');
            statusText.textContent = 'Not Started';
        }
    }
}

function updateWorkoutOverview(date) {
    const overview = document.getElementById('workout-overview');
    if (!overview) return;
    
    // Get workout info for the day
    const workoutType = DAYS.LIFT_SCHEDULE[date.getDay()];
    const weight = getWeightOfTheDay();
    const setsReps = getSetsAndReps(workoutType);
    
    // Update lift details
    overview.querySelector('.lift-name').textContent = workoutType;
    overview.querySelector('.lift-weight').textContent = `${weight} lbs`;
    overview.querySelector('.lift-sets').textContent = setsReps;
    
    // Update setup button
    const setupBtn = overview.querySelector('.setup-btn');
    setupBtn.onclick = () => window.location.href = '../setup/setup.html';
}

function previousDay() {
    currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    updateDateDisplay(currentDate);
}

function nextDay() {
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    updateDateDisplay(currentDate);
}

function updateProgramStart(date) {
    state.program.programStart = new Date(date);
    saveProgramInfo();
    
    // Regenerate calendar with current date
    generateCalendar(currentDate);
    
    // Update workout status for current date
    updateWorkoutStatus(currentDate);
}

// Update the calendar generation function
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
            const status = getDateStatus(date);
            
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

// Add function to determine date status
function getDateStatus(date) {
    const dayOfWeek = date.getDay();
    const dateKey = getFormattedDate(date);
    const workoutData = state.workoutHistory.get(dateKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const programStart = new Date(state.program.programStart);
    programStart.setHours(0, 0, 0, 0);
    
    // Check if it's a rest day
    if (DAYS.LIFT_SCHEDULE[dayOfWeek].toLowerCase().includes('rest')) {
        return 'rest';
    }
    
    // If date is before program start, show as rest
    if (date < programStart) {
        return 'rest';
    }
    
    if (workoutData) {
        if (workoutData.completed) return 'complete';
        if (workoutData.primaryCompleted) return 'partial';
        return date < today ? 'missed' : 'upcoming';
    }
    
    // Only show missed if the date is between program start and today
    if (date < today && date >= programStart) {
        return 'missed';
    }
    
    return 'upcoming';
} 