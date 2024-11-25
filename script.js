const liftDay = ['Rest', 'Heavy Squat', 'Light Bench', 'Deadlift', 'Light Squat', 'Heavy Bench', 'Rest'];
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const programInfo = {
    todayDate: getToday(),
    programStart: new Date(2024, 11, 25),
    squat1RM: 0,
    dead1RM: 0,
    bench1RM: 0
};

init();

function init() {
    setTodayDate(new Date());
    loadProgramInfo();  // Load saved program info from localStorage
}

function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function setTodayDate(todayDate) {
    document.getElementById('today-date').value = getFormattedDate(todayDate);
}

function getToday() {
    const todayInput = document.getElementById('today-date').value;
    const todayDate = new Date(todayInput);
    return new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1);
}

function loadProgramInfo() {
    const savedProgramInfo = localStorage.getItem('programInfo');
    if (savedProgramInfo) {
        const { squat1RM, dead1RM, bench1RM, programStart } = JSON.parse(savedProgramInfo);
        programInfo.squat1RM = squat1RM;
        programInfo.dead1RM = dead1RM;
        programInfo.bench1RM = bench1RM;
        programInfo.programStart = new Date(programStart);

        document.getElementById('squat-1rm').value = squat1RM;
        document.getElementById('bench-1rm').value = bench1RM;
        document.getElementById('deadlift-1rm').value = dead1RM;
    }
}

function saveProgramInfo() {
    localStorage.setItem('programInfo', JSON.stringify(programInfo));
}

function getProgramWeek() {
    const currentDate = getToday();
    const millisPerWeek = 1000 * 60 * 60 * 24 * 7;
    const weeksBetween = Math.floor((currentDate - programInfo.programStart) / millisPerWeek);
    return weeksBetween + 1;
}

function getDayOfTheWeek() {
    return daysOfWeek[getToday().getDay()];
}

function getLiftOfTheDay() {
    return liftDay[getToday().getDay()];
}

function getWeightOfTheDay() {
    const lift = getLiftOfTheDay();
    if (lift.toLowerCase().includes('rest')) return 'Rest';

    const percent = lift.toLowerCase().includes('light') ? 0.6 : getHeavyProgressionPercent();
    const max = lift.toLowerCase().includes('squat') ? programInfo.squat1RM :
                lift.toLowerCase().includes('dead') ? programInfo.dead1RM :
                programInfo.bench1RM;

    return calculateFriendlyLift(max, percent);
}

function calculateFriendlyLift(max, percent) {
    return Math.round(max * percent / 5) * 5;
}

function getHeavyProgressionPercent() {
    const programWeek = getProgramWeek();
    return (0.8 + (programWeek - 1) * 0.05).toFixed(2);
}

function getHeavyProgressionSetsAndReps() {
    const programWeek = getProgramWeek();
    const sets = programWeek < 5 ? 6 : 9 - (programWeek - 1);
    const reps = programWeek < 5 ? 2 + programWeek : 9 - (programWeek - 1);
    return `${sets}x${reps}`;
}

function getSetsAndReps() {
    const lift = getLiftOfTheDay();
    return lift.toLowerCase().includes('rest') ? 'Rest' : (lift.toLowerCase().includes('light') ? '4x4' : getHeavyProgressionSetsAndReps());
}

function updateWeights() {
    const programStart = document.getElementById('program-start').value;
    const squat1RM = parseFloat(document.getElementById('squat-1rm').value);
    const bench1RM = parseFloat(document.getElementById('bench-1rm').value);
    const deadlift1RM = parseFloat(document.getElementById('deadlift-1rm').value);

    if (programStart >= getToday()) {
        alert('Please enter a Program Start date in the past.');
        return;
    }

    programInfo.programStart = new Date(programStart);
    programInfo.squat1RM = squat1RM;
    programInfo.dead1RM = deadlift1RM;
    programInfo.bench1RM = bench1RM;

    if (isNaN(squat1RM) || isNaN(bench1RM) || isNaN(deadlift1RM)) {
        alert('Please enter valid 1RM values.');
        return;
    }

    saveProgramInfo();  // Save updated program info to localStorage
    generateRoutine();
}

function generateRoutine() {
    const tableBody = document.getElementById('routine-table-body');
    tableBody.innerHTML = '';
    const programWeek = getProgramWeek();

    if (programWeek > 8) {
        alert('Program\'s over, go home.');
    } else {
        const rowData = [
            programWeek,
            getDayOfTheWeek(),
            getLiftOfTheDay(),
            getWeightOfTheDay(),
            getSetsAndReps()
        ];

        const row = document.createElement('tr');
        rowData.forEach(text => {
            const cell = document.createElement('td');
            cell.textContent = text;
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    }
}
