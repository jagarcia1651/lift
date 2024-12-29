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
    
    // Update workout status
    updateWorkoutStatus(date);
    // Update workout overview
    updateWorkoutOverview(date);
    // Update calendar
    generateCalendar(date);
}

function updateWorkoutStatus(date) {
    const dateKey = getFormattedDate(date);
    const workoutHistory = new Map(JSON.parse(localStorage.getItem('workoutHistory') || '[]'));
    const workoutData = workoutHistory.get(dateKey);
    
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        
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
    
    // Check if program is complete
    if (isProgramComplete(date)) {
        overview.innerHTML = '<div class="program-over">Program Over</div>';
        return;
    }
    
    // Get workout info for the day
    const workoutType = DAYS.LIFT_SCHEDULE[date.getDay()];
    const isRestDay = workoutType.toLowerCase().includes('rest');
    
    // Update lift details
    overview.querySelector('.lift-name').textContent = workoutType;
    
    if (isRestDay) {
        overview.querySelector('.lift-weight').textContent = '';
        overview.querySelector('.lift-sets').textContent = '';
        overview.querySelector('.setup-btn').style.display = 'none';
    } else {
        const weight = getWeightOfTheDay();
        const setsReps = getSetsAndReps();
        const percentage = getCurrentPercentage();
        
        overview.querySelector('.lift-weight').textContent = `${weight} lbs (${percentage}%)`;
        overview.querySelector('.lift-sets').textContent = setsReps;
        overview.querySelector('.setup-btn').style.display = 'block';
        
        // Update setup button to go to setup page with selected date
        const setupBtn = overview.querySelector('.setup-btn');
        setupBtn.onclick = () => {
            // Store both the date string and the full date object
            localStorage.setItem('selectedWorkoutDate', currentDate.toISOString());
            window.location.href = '../setup/setup.html';
        };
    }
}

function previousDay() {
    // Remove selected class from current day
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    
    // Update current date
    const newDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    updateCurrentDate(newDate);
    
    // Update display and state
    updateDateDisplay(newDate);
    
    // Find and select the new current day in the calendar
    const dayDivs = document.querySelectorAll('.calendar-day');
    dayDivs.forEach(div => {
        if (div.textContent === newDate.getDate().toString()) {
            div.classList.add('selected');
        }
    });
}

function nextDay() {
    // Remove selected class from current day
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    
    // Update current date
    const newDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    updateCurrentDate(newDate);
    
    // Update display and state
    updateDateDisplay(newDate);
    
    // Find and select the new current day in the calendar
    const dayDivs = document.querySelectorAll('.calendar-day');
    dayDivs.forEach(div => {
        if (div.textContent === newDate.getDate().toString()) {
            div.classList.add('selected');
        }
    });
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
            
            // Always make days clickable, even if program is complete
            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayDiv.classList.add('selected');
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
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
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