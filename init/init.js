// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize state first
    initializeState();
    initTheme();
    
    // Then set form values
    setInitialFormValues();
});

// Separate function to set form values
function setInitialFormValues() {
    const today = new Date();
    
    // Program Start Date
    const programStartInput = document.getElementById('program-start');
    if (programStartInput) {
        programStartInput.value = state.program.programStart ? 
            getFormattedDate(state.program.programStart) : 
            getFormattedDate(today);
    }
    
    // Squat 1RM
    const squat1RMInput = document.getElementById('squat-1rm');
    if (squat1RMInput) {
        squat1RMInput.value = state.program.squat1RM || 315;
    }
    
    // Bench 1RM
    const bench1RMInput = document.getElementById('bench-1rm');
    if (bench1RMInput) {
        bench1RMInput.value = state.program.bench1RM || 225;
    }
    
    // Deadlift 1RM
    const dead1RMInput = document.getElementById('dead-1rm');
    if (dead1RMInput) {
        dead1RMInput.value = state.program.dead1RM || 405;
    }
    
    // Rest Timer
    const restTimerInput = document.getElementById('rest-timer');
    if (restTimerInput) {
        restTimerInput.value = state.program.restTimer || 90;
    }
}

function handleInitSubmit(event) {
    event.preventDefault();
    
    const programStart = new Date(document.getElementById('program-start').value);
    const squat1RM = Number(document.getElementById('squat-1rm').value);
    const bench1RM = Number(document.getElementById('bench-1rm').value);
    const dead1RM = Number(document.getElementById('dead-1rm').value);
    const restTimer = Number(document.getElementById('rest-timer').value);
    
    // Update state
    state.program = {
        ...state.program,
        programStart,
        squat1RM,
        bench1RM,
        dead1RM,
        restTimer
    };
    
    // Save to localStorage
    saveProgramInfo();
    
    // Redirect to calendar view
    window.location.href = '../calendar/calendar.html';
} 