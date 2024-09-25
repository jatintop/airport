document.addEventListener('DOMContentLoaded', function () {
    // Event listeners
    document.getElementById('scheduleButton').addEventListener('click', scheduleFlights);
    document.getElementById('setDefaultButton').addEventListener('click', setDefaultValues);
    document.getElementById('backgroundToggle').addEventListener('change', handleBackgroundToggle);

    // Initialize
    updateBackgroundImage();
    showDialog();
});

const weatherBurstTimes = {
    'Fog': 11,
    'Thunderstorms': 9,
    'Heavy Rain': 10,
    'Snow and Ice': 12,
    'Nominal': 8
};

const weatherImages = {
    'Fog': 'images/fog1.gif',
    'Thunderstorms': 'images/thunderstorms.gif',
    'Heavy Rain': 'images/heavy-rain.gif',
    'Snow and Ice': 'images/snow-ice.gif',
    'Nominal': 'images/nominal.gif'
};

function setDefaultValues() {
    const defaultValues = [
        { typeOfFlight: 'Domestic', fuelRequirements: 'Nominal', timeSchedule: 'On time', landingTakeoff: 'Take Off', arrivalTime: 1 },
        { typeOfFlight: 'International', fuelRequirements: 'Low', timeSchedule: 'Delayed > 3', landingTakeoff: 'Take Off', arrivalTime: 1 },
        { typeOfFlight: 'Emergency', fuelRequirements: 'Nominal', timeSchedule: 'On time', landingTakeoff: 'Landing', arrivalTime: 3 },
        { typeOfFlight: 'Emergency', fuelRequirements: 'Low', timeSchedule: 'Delayed > 5', landingTakeoff: 'Landing', arrivalTime: 3 },
        { typeOfFlight: 'International', fuelRequirements: 'Nominal', timeSchedule: 'Delayed < 1', landingTakeoff: 'Landing', arrivalTime: 4 }
    ];

    const entries = document.querySelectorAll('.flight-entry');

    defaultValues.forEach((value, index) => {
        const entry = entries[index];
        entry.querySelector('.type-of-flight').value = value.typeOfFlight;
        entry.querySelector('.fuel-requirements').value = value.fuelRequirements;
        entry.querySelector('.time-schedule').value = value.timeSchedule;
        entry.querySelector('.landing-takeoff').value = value.landingTakeoff;
        entry.querySelector('.arrival-time').value = value.arrivalTime;
    });
}

let ganttChart;

function scheduleFlights() {
    const weatherSelect = document.getElementById('weatherSelect');
    const selectedWeather = weatherSelect.options[weatherSelect.selectedIndex].value;
    const burstTime = weatherBurstTimes[selectedWeather];

    if (typeof burstTime === 'undefined') {
        alert('Please select a valid weather condition.');
        return;
    }

    const flights = [];
    const entries = document.querySelectorAll('.flight-entry');

    entries.forEach((entry, index) => {
        const arrivalTime = entry.querySelector('.arrival-time').value;
        const typeOfFlight = entry.querySelector('.type-of-flight').value;
        const fuelRequirements = entry.querySelector('.fuel-requirements').value;
        const timeSchedule = entry.querySelector('.time-schedule').value;
        const landingTakeoff = entry.querySelector('.landing-takeoff').value;

        if (typeOfFlight && fuelRequirements && timeSchedule && landingTakeoff && arrivalTime) {
            const waitingTime = parseInt(entry.getAttribute('data-waiting-time') || '0', 10);
            flights.push({
                flightNumber: index + 1,
                arrivalTime: parseInt(arrivalTime, 10),
                typeOfFlight,
                fuelRequirements,
                timeSchedule,
                landingTakeoff,
                burstTime,
                waitingTime
            });
        }
    });

    // Increment waiting time for all unscheduled flights
    flights.forEach(flight => {
        flight.waitingTime += 1;
    });

    flights.sort((a, b) => {
        // Sort by arrival time first
        if (a.arrivalTime !== b.arrivalTime) {
            return a.arrivalTime - b.arrivalTime;
        }

        // Priority calculation with aging
        const flightTypePriority = { "Emergency": 1, "International": 2, "Domestic": 3 };
        const fuelPriority = { "Low": 1, "Nominal": 2 };
        const timePriority = {
            "On time": 1,
            "Delayed < 1": 2,
            "Delayed > 1": 3,
            "Delayed > 3": 4,
            "Delayed > 5": 5
        };

        const priorityA = flightTypePriority[a.typeOfFlight] + fuelPriority[a.fuelRequirements] + timePriority[a.timeSchedule] - a.waitingTime;
        const priorityB = flightTypePriority[b.typeOfFlight] + fuelPriority[b.fuelRequirements] + timePriority[b.timeSchedule] - b.waitingTime;

        return priorityB - priorityA;
    });

    const scheduleTable = document.getElementById('scheduleTable').querySelector('tbody');
    const technicalTable = document.getElementById('technicalTable').querySelector('tbody');

    scheduleTable.innerHTML = '';
    technicalTable.innerHTML = '';

    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    let delayedFlights = 0;
    let emergencyFlights = 0;

    flights.forEach(flight => {
        const row = scheduleTable.insertRow();
        row.insertCell(0).innerText = `Flight ${flight.flightNumber}`;
        row.insertCell(1).innerText = flight.arrivalTime;
        row.insertCell(2).innerText = flight.typeOfFlight;
        row.insertCell(3).innerText = flight.fuelRequirements;
        row.insertCell(4).innerText = flight.timeSchedule;
        row.insertCell(5).innerText = flight.landingTakeoff;

        const startTime = Math.max(currentTime, flight.arrivalTime);
        const endTime = startTime + flight.burstTime;
        currentTime = endTime;

        const completionTime = endTime;
        const waitingTime = startTime - flight.arrivalTime;
        const turnaroundTime = completionTime - flight.arrivalTime;

        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnaroundTime;

        if (flight.typeOfFlight === 'Emergency') {
            emergencyFlights++;
        }

        if (flight.timeSchedule.startsWith('Delayed')) {
            delayedFlights++;
        }

        // Priority calculation for display purposes
        const flightTypePriority = { "Emergency": 1, "International": 2, "Domestic": 3 };
        const fuelPriority = { "Low": 1, "Nominal": 2 };
        const timePriority = {
            "On time": 1,
            "Delayed < 1": 2,
            "Delayed > 1": 3,
            "Delayed > 3": 4,
            "Delayed > 5": 5
        };

        const priority = flightTypePriority[flight.typeOfFlight] + fuelPriority[flight.fuelRequirements] + timePriority[flight.timeSchedule] - flight.waitingTime;

        const techRow = technicalTable.insertRow();
        techRow.insertCell(0).innerText = flight.flightNumber;
        techRow.insertCell(1).innerText = flight.arrivalTime;
        techRow.insertCell(2).innerText = flight.burstTime;
        techRow.insertCell(3).innerText = priority; // Now showing the calculated priority
        techRow.insertCell(4).innerText = completionTime;
        techRow.insertCell(5).innerText = waitingTime;
        techRow.insertCell(6).innerText = turnaroundTime;

        // Update the waiting time attribute for aging
        const entry = entries[flight.flightNumber - 1];
        entry.setAttribute('data-waiting-time', flight.waitingTime);

        generateGanttChart(flights);
        document.getElementById('ganttChartContainer').classList.remove('hidden');
    });

    const totalFlights = flights.length;
    const averageWaitingTime = (totalFlights > 0) ? (totalWaitingTime / totalFlights).toFixed(2) : 0;
    const averageTurnaroundTime = (totalFlights > 0) ? (totalTurnaroundTime / totalFlights).toFixed(2) : 0;

    // Update dashboard stats
    document.getElementById('totalFlights').innerText = totalFlights;
    document.getElementById('delayedFlights').innerText = delayedFlights;
    document.getElementById('emergencyFlights').innerText = emergencyFlights;
    document.getElementById('averageResponseTime').innerText = averageWaitingTime;
    document.getElementById('averageTurnaroundTime').innerText = averageTurnaroundTime;

    // Show dashboard container
    document.getElementById('scheduleContainer').style.display = 'block';
    document.getElementById('technicalContainer').style.display = 'block';
    document.getElementById('dashboardContainer').style.display = 'block';

    // Hide Gantt chart container
    generateGanttChart(flights);

    // Show the Gantt chart container
    document.getElementById('ganttChartContainer').classList.remove('hidden');
}

function setDefaultValues() {
    const defaultValues = [
        { typeOfFlight: 'Domestic', fuelRequirements: 'Nominal', timeSchedule: 'On time', landingTakeoff: 'Take Off', arrivalTime: 1 },
        { typeOfFlight: 'International', fuelRequirements: 'Low', timeSchedule: 'Delayed > 3', landingTakeoff: 'Take Off', arrivalTime: 1 },
        { typeOfFlight: 'Emergency', fuelRequirements: 'Nominal', timeSchedule: 'On time', landingTakeoff: 'Landing', arrivalTime: 3 },
        { typeOfFlight: 'Emergency', fuelRequirements: 'Low', timeSchedule: 'Delayed > 5', landingTakeoff: 'Landing', arrivalTime: 3 },
        { typeOfFlight: 'International', fuelRequirements: 'Nominal', timeSchedule: 'Delayed < 1', landingTakeoff: 'Landing', arrivalTime: 4 }
    ];

    const entries = document.querySelectorAll('.flight-entry');

    defaultValues.forEach((value, index) => {
        const entry = entries[index];
        entry.querySelector('.type-of-flight').value = value.typeOfFlight;
        entry.querySelector('.fuel-requirements').value = value.fuelRequirements;
        entry.querySelector('.time-schedule').value = value.timeSchedule;
        entry.querySelector('.landing-takeoff').value = value.landingTakeoff;
        entry.querySelector('.arrival-time').value = value.arrivalTime;
    });
}

// Event listener for weather icon update
document.addEventListener('DOMContentLoaded', function () {
    const weatherSelect = document.getElementById('weatherSelect');
    const weatherIcon = document.querySelector('.weather-icon i');

    function updateWeatherIcon() {
        const selectedOption = weatherSelect.options[weatherSelect.selectedIndex];
        const iconClass = selectedOption.getAttribute('data-icon');
        weatherIcon.className = `fas ${iconClass}`;
    }

    updateWeatherIcon();

    weatherSelect.addEventListener('change', updateWeatherIcon);
});

// Dialog box for displaying initial information
document.addEventListener('DOMContentLoaded', function () {
    const dialog = document.getElementById('dialog');
    const closeDialog = document.getElementById('closeDialog');

    setTimeout(() => {
        dialog.style.display = 'block';

        setTimeout(() => {
            dialog.style.display = 'none';
        }, 7000);
    }, 1000);

    closeDialog.addEventListener('click', function () {
        dialog.style.display = 'none';
    });
});

// Background image update based on selected weather
document.addEventListener('DOMContentLoaded', function () {
    const weatherSelect = document.getElementById('weatherSelect');

    const weatherImages = {
        'Fog': 'images/fog1.gif',
        'Thunderstorms': 'images/thunderstorms.gif',
        'Heavy Rain': 'images/heavy-rain.gif',
        'Snow and Ice': 'images/snow-ice.gif',
        'Nominal': 'images/nominal.gif'
    };

    function updateBackgroundImage() {
        const selectedWeather = weatherSelect.value;
        const backgroundImageUrl = weatherImages[selectedWeather];

        document.body.style.backgroundImage = `url('${backgroundImageUrl}')`;
    }

    weatherSelect.addEventListener('change', updateBackgroundImage);

    updateBackgroundImage(); // Set initial background image on page load
});

document.getElementById('backgroundToggle').addEventListener('change', function() {
    if (this.checked) {
        // Hide the background image
        document.body.style.backgroundImage = 'none';
    } else {
        // Show the background image based on the current weather condition
        const weatherSelect = document.getElementById('weatherSelect');
        const weatherImages = {
            'Fog': 'images/fog1.gif',
            'Thunderstorms': 'images/thunderstorms.gif',
            'Heavy Rain': 'images/heavy-rain.gif',
            'Snow and Ice': 'images/snow-ice.gif',
            'Nominal': 'images/nominal.gif'
        };

        function updateBackgroundImage() {
            const selectedWeather = weatherSelect.value;
            const backgroundImageUrl = weatherImages[selectedWeather];
            document.body.style.backgroundImage = `url('${backgroundImageUrl}')`;
        }

        updateBackgroundImage(); // Update to current weather condition
    }
});

document.getElementById('backgroundToggle').addEventListener('change', function() {
    const backgroundImageUrl = document.body.getAttribute('data-background-image');
    
    if (this.checked) {
        // Show the background image if toggle is on
        document.body.style.backgroundImage = `url('${backgroundImageUrl}')`;
        document.body.style.backgroundSize = 'cover'; // Ensure the image covers the entire background
        document.body.style.backgroundRepeat = 'no-repeat'; // Prevent repeating of the image
    } else {
        // Hide the background image if toggle is off
        document.body.style.backgroundImage = 'none';
    }
});

// Set the initial background image and toggle state
document.addEventListener('DOMContentLoaded', function () {
    const weatherSelect = document.getElementById('weatherSelect');
    const weatherImages = {
        'Fog': 'images/fog1.gif',
        'Thunderstorms': 'images/thunderstorms.gif',
        'Heavy Rain': 'images/heavy-rain.gif',
        'Snow and Ice': 'images/snow-ice.gif',
        'Nominal': 'images/nominal.gif'
    };

    // Set initial background image based on weather selection
    function updateBackgroundImage() {
        const selectedWeather = weatherSelect.value;
        const backgroundImageUrl = weatherImages[selectedWeather];
        document.body.setAttribute('data-background-image', backgroundImageUrl);
        if (document.getElementById('backgroundToggle').checked) {
            document.body.style.backgroundImage = `url('${backgroundImageUrl}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundRepeat = 'no-repeat';
        } else {
            document.body.style.backgroundImage = 'none';
        }
    }

    updateBackgroundImage(); // Set initial background image on page load

    weatherSelect.addEventListener('change', updateBackgroundImage); // Update background image when weather changes
});

function generateGanttChart(flights) {
    const ctx = document.getElementById('ganttChart').getContext('2d');

    if (ganttChart) {
        ganttChart.destroy();
    }

    const datasets = [];
    const colors = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
    ];

    flights.forEach((flight, index) => {
        const startTime = Math.max(flight.arrivalTime, flights.slice(0, index).reduce((acc, f) => acc + f.burstTime, 0));
        const waitTime = startTime - flight.arrivalTime;
        const endTime = startTime + flight.burstTime;

        datasets.push({
            label: `Flight ${flight.flightNumber}`,
            data: [
                {
                    x: [flight.arrivalTime, startTime],
                    y: flight.flightNumber,
                    type: 'wait'
                },
                {
                    x: [startTime, endTime],
                    y: flight.flightNumber,
                    type: 'burst'
                }
            ],
            backgroundColor: (context) => {
                const type = context.raw.type;
                return type === 'wait' ? 'rgba(200, 200, 200, 0.8)' : colors[index % colors.length];
            },
            barPercentage: 0.4,
            categoryPercentage: 0.8
        });
    });

    ganttChart = new Chart(ctx, {
        type: 'bar',
        data: { datasets },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 0,
                    right: 10,
                    bottom: 55,
                    left: 10
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'top',
                    title: {
                        display: true,
                        text: 'Time',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: {
                            top: 5,
                            bottom: 5
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        },
                        padding: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    offset: true,
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Flight Number',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        padding: 5
                    },
                    offset: true,
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `Flight ${context[0].dataset.label.split(' ')[1]}`;
                        },
                        label: function(context) {
                            const type = context.raw.type;
                            const duration = context.raw.x[1] - context.raw.x[0];
                            
                            if (type === 'wait') {
                                return `Wait Time - ${duration} units`;
                            } else {
                                return `Burst Time - ${duration} units`;
                            }
                        }
                    }
                },
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

