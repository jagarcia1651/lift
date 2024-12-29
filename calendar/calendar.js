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
    // Update state first
    state.program.todayDate = new Date(date);
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.querySelector('.selected-date').textContent = date.toLocaleDateString('en-US', options);
    
    const workoutType = DAYS.LIFT_SCHEDULE[date.getDay()];
    document.querySelector('.workout-type').textContent = workoutType;
    
    // Update Today button visibility
    const todayBtn = document.querySelector('.today-btn');
    const today = new Date();
    if (todayBtn) {
        todayBtn.textContent = 'Select Today';
        if (date.toDateString() === today.toDateString()) {
            todayBtn.style.display = 'none';
        } else {
            todayBtn.style.display = 'block';
        }
    }
    
    // Update workout status
    updateWorkoutStatus(date);
    // Update workout overview
    updateWorkoutOverview(date);
    // Update calendar - this will handle the selected state
    generateCalendar(date);
}

function updateWorkoutStatus(date) {
    const dateKey = getFormattedDate(date);
    const workoutHistory = new Map(JSON.parse(localStorage.getItem('workoutHistory') || '[]'));
    const workoutData = workoutHistory.get(dateKey);
    
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
        statusText.textContent = 'Before Program';
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
    
    if (workoutData) {
        if (workoutData.completed) {
            statusDot.classList.add('complete');
            statusText.textContent = 'Complete';
        } else if (workoutData.primaryCompleted) {
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
    
    // Check if program is complete first
    if (isProgramComplete(date)) {
        overview.innerHTML = '<div class="program-over">Program Complete</div>';
        return;
    }
    
    // Get workout info for the day
    const workoutType = DAYS.LIFT_SCHEDULE[date.getDay()];
    const isRestDay = workoutType.toLowerCase().includes('rest');
    
    // Ensure the proper HTML structure exists
    if (!overview.querySelector('.lift-details')) {
        overview.innerHTML = `
            <div class="lift-details">
                <span class="lift-name"></span>
                <span class="lift-weight"></span>
                <span class="lift-sets"></span>
            </div>
            <button type="button" class="setup-btn">Setup Workout</button>
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
        
        setupBtn.onclick = () => {
            localStorage.setItem('selectedWorkoutDate', date.toISOString());
            window.location.href = '../setup/setup.html';
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

function generateCalendar(currentDate) {
    const calendar = document.querySelector('.simple-calendar');
    if (!calendar) return;
    
    calendar.innerHTML = '';
    
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDay = firstDay.getDay();
    const monthLength = lastDay.getDate();
    
    // Always show 6 weeks
    const totalDays = 42;
    
    for (let i = 0; i < totalDays; i++) {
        const dayDiv = document.createElement('div');
        const dayNumber = i - startingDay + 1;
        
        if (dayNumber > 0 && dayNumber <= monthLength) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
            const status = getDateStatus(date);
            
            dayDiv.className = 'calendar-day';
            dayDiv.classList.add(status);
            dayDiv.textContent = dayNumber;
            
            if (date.getDate() === currentDate.getDate() && 
                date.getMonth() === currentDate.getMonth() && 
                date.getFullYear() === currentDate.getFullYear()) {
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
    // Check if date is before program start
    const programStart = new Date(state.program.programStart);
    programStart.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < programStart) {
        return 'before-program';
    }
    
    const dateKey = getFormattedDate(date);
    const workoutHistory = new Map(JSON.parse(localStorage.getItem('workoutHistory') || '[]'));
    const workoutData = workoutHistory.get(dateKey);
    
    // Add program completion check
    if (isProgramComplete(date)) {
        return 'rest';
    }
    
    // Check if it's a rest day
    if (DAYS.LIFT_SCHEDULE[date.getDay()].toLowerCase().includes('rest')) {
        return 'rest';
    }
    
    if (workoutData) {
        if (workoutData.completed) return 'complete';
        if (workoutData.primaryCompleted) return 'partial';
        return 'missed';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkDate < today) {
        return 'missed';
    }
    
    return 'upcoming';
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