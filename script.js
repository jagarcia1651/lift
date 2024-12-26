const ACCESSORIES = {
    "Heavy Squat": [
        {
            exercise: "Leg Extension",
            setsReps: "3x15",
            weight: "~20RM"
        },
        {
            exercise: "Leg Curl",
            setsReps: "3x15",
            weight: "~20RM"
        },
        {
            exercise: "Calf Raises",
            setsReps: "4x15",
            weight: "~20RM"
        },
        {
            exercise: "Hanging Leg Raise Variations",
            setsReps: "5x10",
            weight: "N/A"
        },
        {
            exercise: "Toe Touches",
            setsReps: "3x10",
            weight: "Bodyweight"
        }
    ],
    "Light Squat": [
        {
            exercise: "Bulgarian Split Squats",
            setsReps: "3x8",
            weight: "~10RM"
        },
        {
            exercise: "Step-Ups",
            setsReps: "3x8",
            weight: "~12RM"
        },
        {
            exercise: "Single Leg RDL",
            setsReps: "3x8",
            weight: "~12RM"
        },
        {
            exercise: "Walking Lunges",
            setsReps: "3x12-10-8",
            weight: "~15RM"
        }
    ],
    "Heavy Bench": [
        {
            exercise: "Incline Dumbbell Chest Flys",
            setsReps: "3x15",
            weight: "~20RM"
        },
        {
            exercise: "Dumbbell Lateral Raises",
            setsReps: "3x12",
            weight: "~15RM"
        },
        {
            exercise: "Barbell Skull Crushers",
            setsReps: "3x15",
            weight: "~20RM"
        }
    ],
    "Light Bench": [
        {
            exercise: "Incline Bench",
            setsReps: "3x8",
            weight: "~10RM"
        },
        {
            exercise: "Incline Dumbbell Bench",
            setsReps: "3x6",
            weight: "~8RM"
        },
        {
            exercise: "Narrow Grip Bench",
            setsReps: "4x6",
            weight: "~8RM"
        },
        {
            exercise: "Dumbbell Overhead Press",
            setsReps: "3x6",
            weight: "~8RM"
        }
    ],
    "Deadlift": [
        {
            exercise: "Barbell Rows",
            setsReps: "3x12-10-8",
            weight: "~15RM"
        },
        {
            exercise: "Dumbbell Rows",
            setsReps: "3x8",
            weight: "~12RM"
        },
        {
            exercise: "Good Mornings",
            setsReps: "3x12",
            weight: "~15RM"
        },
        {
            exercise: "Laying Bicep Curls",
            setsReps: "3x12-10-8",
            weight: "~15RM"
        },
        {
            exercise: "Chin-Ups",
            setsReps: "3xMax",
            weight: "Bodyweight"
        }
    ]
};
const LIFT_DAY = Object.freeze(['Rest', 'Heavy Squat', 'Light Bench', 'Deadlift', 'Light Squat', 'Heavy Bench', 'Rest']);
const DAYS_OF_WEEK = Object.freeze(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);
const LIGHT_WORKOUT_PERCENTAGE = 0.6;
const BASE_HEAVY_PERCENTAGE = 0.8;
const PROGRESSION_INCREMENT = 0.05;

/**
 * @typedef {Object} ProgramInfo
 * @property {Date} todayDate
 * @property {Date} programStart
 * @property {number} squat1RM
 * @property {number} dead1RM
 * @property {number} bench1RM
 */

/** @type {ProgramInfo} */
const programInfo = {
    todayDate: getToday(),
    programStart: new Date(2024, 11, 9),
    squat1RM: 0,
    dead1RM: 0,
    bench1RM: 0
};

document.addEventListener('DOMContentLoaded', init);

function init() {
    setTodayDate(new Date());
    loadProgramInfo();
    
    // Add event listener for date changes
    document.getElementById('today-date').addEventListener('change', () => {
        const programStart = document.getElementById('program-start')?.value;
        const squat1RM = document.getElementById('squat-1rm')?.value;
        const bench1RM = document.getElementById('bench-1rm')?.value;
        const deadlift1RM = document.getElementById('deadlift-1rm')?.value;
        
        if (programStart && squat1RM && bench1RM && deadlift1RM) {
            updateWeights();
        }
    });
    
    // Initial check for auto-update
    const programStart = document.getElementById('program-start')?.value;
    const squat1RM = document.getElementById('squat-1rm')?.value;
    const bench1RM = document.getElementById('bench-1rm')?.value;
    const deadlift1RM = document.getElementById('deadlift-1rm')?.value;
    
    if (programStart && squat1RM && bench1RM && deadlift1RM) {
        updateWeights();
    }
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
    return DAYS_OF_WEEK[getToday().getDay()];
}

function getLiftOfTheDay() {
    return LIFT_DAY[getToday().getDay()];
}

function getWeightOfTheDay() {
    const lift = getLiftOfTheDay();
    if (lift.toLowerCase().includes('rest')) return 'Rest';

    const percent = lift.toLowerCase().includes('light') ? LIGHT_WORKOUT_PERCENTAGE : getHeavyProgressionPercent();
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
    if (programWeek < 5) {
        return BASE_HEAVY_PERCENTAGE;
    }
    
    const loadWeek = programWeek - 4;
    return Number((BASE_HEAVY_PERCENTAGE + (loadWeek * PROGRESSION_INCREMENT)).toFixed(2));
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
    try {
        const programStart = document.getElementById('program-start')?.value;
        const squat1RM = parseFloat(document.getElementById('squat-1rm')?.value || '0');
        const bench1RM = parseFloat(document.getElementById('bench-1rm')?.value || '0');
        const deadlift1RM = parseFloat(document.getElementById('deadlift-1rm')?.value || '0');

        if (!programStart || !squat1RM || !bench1RM || !deadlift1RM) {
            throw new Error('Please fill in all fields');
        }

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
    } catch (error) {
        alert(error.message);
        console.error('Error updating weights:', error);
    }
}

function getRotatedAccessories(primaryLift, programWeek) {
    console.log('Getting accessories for:', primaryLift, 'Week:', programWeek);
    console.log('Available accessories:', ACCESSORIES[primaryLift]);
    
    if (!ACCESSORIES[primaryLift] || !ACCESSORIES[primaryLift].length) {
        console.log('No accessories found for:', primaryLift);
        return [];
    }
    
    const allAccessories = ACCESSORIES[primaryLift];
    // Determine number of accessories based on day type
    const isLightDay = primaryLift.toLowerCase().includes('light');
    const accessoriesPerDay = isLightDay ? 4 : 3; // 4 for light days, 3 for heavy days
    
    const totalAccessories = allAccessories.length;
    const rotationWeeks = Math.ceil(totalAccessories / accessoriesPerDay);
    
    // Calculate which set of accessories to show based on program week
    const startIndex = ((programWeek - 1) % rotationWeeks) * accessoriesPerDay;
    
    // Get accessories for this rotation, wrapping around to the start if needed
    let selectedAccessories = [];
    for (let i = 0; i < accessoriesPerDay; i++) {
        const index = (startIndex + i) % totalAccessories;
        selectedAccessories.push(allAccessories[index]);
    }
    
    console.log('Selected accessories:', selectedAccessories);
    return selectedAccessories;
}

function generateRoutine() {
    const tableBody = document.getElementById('routine-table-body');
    tableBody.innerHTML = '';
    const programWeek = getProgramWeek();
    console.log('Generating routine for week:', programWeek);

    if (programWeek > 9) {
        alert('Program\'s over, go home.');
    } else {
        const lift = getLiftOfTheDay();
        console.log('Lift of the day:', lift);
        const accessories = getRotatedAccessories(lift, programWeek);
        console.log('Retrieved accessories:', accessories);
        
        const rowData = [
            programWeek,
            getDayOfTheWeek(),
            lift,
            getWeightOfTheDay(),
            getSetsAndReps(),
            formatAccessories(accessories)
        ];

        const row = document.createElement('tr');
        rowData.forEach((text, index) => {
            const cell = document.createElement('td');
            if (index === 5) { // Accessories column
                cell.innerHTML = text; // Use innerHTML for formatted accessories
            } else {
                cell.textContent = text;
            }
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    }
}

function formatAccessories(accessories) {
    console.log('Formatting accessories:', accessories);
    if (!accessories || accessories.length === 0) {
        console.log('No accessories to format');
        return 'Rest';
    }
    
    const html = accessories.map(acc => 
        `<div class="accessory">
            <span class="exercise">${acc.exercise}</span>
            <span class="sets-reps">${acc.setsReps}</span>
            <span class="weight">${acc.weight}</span>
        </div>`
    ).join('');
    console.log('Generated HTML:', html);
    return html;
}
