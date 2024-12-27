function handleInitSubmit(event) {
    event.preventDefault();
    
    const programStart = new Date(document.getElementById('program-start').value);
    const squat1RM = Number(document.getElementById('squat-1rm').value);
    const bench1RM = Number(document.getElementById('bench-1rm').value);
    const dead1RM = Number(document.getElementById('dead-1rm').value);
    
    // Update state
    state.program = {
        ...state.program,
        programStart,
        squat1RM,
        bench1RM,
        dead1RM
    };
    
    // Save to localStorage
    saveProgramInfo();
    
    // Redirect to calendar view
    window.location.href = '../calendar/calendar.html';
} 