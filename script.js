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

function calculatePriority(flight) {
    const flightTypePriority = { "Emergency": 3, "International": 2, "Domestic": 1 };
    const fuelPriority = { "Low": 2, "Nominal": 1 };
    const timePriority = {
        "On time": 1,
        "Delayed < 1": 2,
        "Delayed > 1": 3,
        "Delayed > 3": 4,
        "Delayed > 5": 5
    };

    return (flightTypePriority[flight.typeOfFlight] * 100) + 
           (fuelPriority[flight.fuelRequirements] * 10) + 
           timePriority[flight.timeSchedule];
}

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
        const arrivalTime = parseInt(entry.querySelector('.arrival-time').value, 10);
        const typeOfFlight = entry.querySelector('.type-of-flight').value;
        const fuelRequirements = entry.querySelector('.fuel-requirements').value;
        const timeSchedule = entry.querySelector('.time-schedule').value;
        const landingTakeoff = entry.querySelector('.landing-takeoff').value;

        if (typeOfFlight && fuelRequirements && timeSchedule && landingTakeoff && arrivalTime) {
            flights.push({
                flightNumber: index + 1,
                arrivalTime,
                typeOfFlight,
                fuelRequirements,
                timeSchedule,
                landingTakeoff,
                burstTime,
                priority: calculatePriority({
                    typeOfFlight,
                    fuelRequirements,
                    timeSchedule
                })
            });
        }
    });

    let currentTime = 1; // Start at time 1
    let scheduledFlights = [];
    let remainingFlights = [...flights];

    // First, handle all flights with arrival time 1
    let arrivalTime1Flights = remainingFlights.filter(flight => flight.arrivalTime === 1);
    
    if (arrivalTime1Flights.length > 0) {
        // Sort arrival time 1 flights by priority
        arrivalTime1Flights.sort((a, b) => b.priority - a.priority);
        
        // Schedule the first flight (highest priority among arrival time 1)
        const firstFlight = arrivalTime1Flights[0];
        scheduledFlights.push({
            ...firstFlight,
            startTime: currentTime,
            completionTime: currentTime + firstFlight.burstTime
        });
        
        // Update current time and remove scheduled flight
        currentTime += firstFlight.burstTime;
        remainingFlights = remainingFlights.filter(f => f.flightNumber !== firstFlight.flightNumber);
        
        // Handle remaining arrival time 1 flights along with others
        while (remainingFlights.length > 0) {
            // Find all flights that have arrived by the current time
            const availableFlights = remainingFlights.filter(flight => 
                flight.arrivalTime <= currentTime
            );

            if (availableFlights.length === 0) {
                // If no flights are available, jump to the next arrival time
                currentTime = Math.min(...remainingFlights.map(f => f.arrivalTime));
                continue;
            }

            // Sort available flights by priority
            availableFlights.sort((a, b) => b.priority - a.priority);

            // Schedule the highest priority flight
            const selectedFlight = availableFlights[0];
            scheduledFlights.push({
                ...selectedFlight,
                startTime: currentTime,
                completionTime: currentTime + selectedFlight.burstTime
            });

            // Remove the scheduled flight from remaining flights
            remainingFlights = remainingFlights.filter(f => f.flightNumber !== selectedFlight.flightNumber);

            // Update current time
            currentTime += selectedFlight.burstTime;
        }
    } else {
        // If no flights at time 1, start with the earliest arrival time
        currentTime = Math.min(...remainingFlights.map(f => f.arrivalTime));
        
        while (remainingFlights.length > 0) {
            const availableFlights = remainingFlights.filter(flight => 
                flight.arrivalTime <= currentTime
            );

            if (availableFlights.length === 0) {
                currentTime = Math.min(...remainingFlights.map(f => f.arrivalTime));
                continue;
            }

            availableFlights.sort((a, b) => b.priority - a.priority);

            const selectedFlight = availableFlights[0];
            scheduledFlights.push({
                ...selectedFlight,
                startTime: currentTime,
                completionTime: currentTime + selectedFlight.burstTime
            });

            remainingFlights = remainingFlights.filter(f => f.flightNumber !== selectedFlight.flightNumber);
            currentTime += selectedFlight.burstTime;
        }
    }

    // Update tables and visualizations
    updateTables(scheduledFlights);
    updateDashboard(scheduledFlights);
    generateGanttChart(scheduledFlights);

    // Show containers
    document.getElementById('scheduleContainer').style.display = 'block';
    document.getElementById('technicalContainer').style.display = 'block';
    document.getElementById('dashboardContainer').style.display = 'block';
    document.getElementById('ganttChartContainer').classList.remove('hidden');
}

// [Rest of the code remains the same as in the previous version]
function updateTables(scheduledFlights) {
    const scheduleTable = document.getElementById('scheduleTable').querySelector('tbody');
    const technicalTable = document.getElementById('technicalTable').querySelector('tbody');

    scheduleTable.innerHTML = '';
    technicalTable.innerHTML = '';

    scheduledFlights.forEach(flight => {
        // Update Schedule Table
        const scheduleRow = scheduleTable.insertRow();
        scheduleRow.insertCell(0).innerText = `Flight ${flight.flightNumber}`;
        scheduleRow.insertCell(1).innerText = flight.arrivalTime;
        scheduleRow.insertCell(2).innerText = flight.typeOfFlight;
        scheduleRow.insertCell(3).innerText = flight.fuelRequirements;
        scheduleRow.insertCell(4).innerText = flight.timeSchedule;
        scheduleRow.insertCell(5).innerText = flight.landingTakeoff;

        // Update Technical Table
        const waitingTime = flight.startTime - flight.arrivalTime;
        const turnaroundTime = flight.completionTime - flight.arrivalTime;

        const techRow = technicalTable.insertRow();
        techRow.insertCell(0).innerText = flight.flightNumber;
        techRow.insertCell(1).innerText = flight.arrivalTime;
        techRow.insertCell(2).innerText = flight.burstTime;
        techRow.insertCell(3).innerText = flight.priority;
        techRow.insertCell(4).innerText = flight.completionTime;
        techRow.insertCell(5).innerText = waitingTime;
        techRow.insertCell(6).innerText = turnaroundTime;
    });
}

function updateDashboard(scheduledFlights) {
    const totalFlights = scheduledFlights.length;
    const delayedFlights = scheduledFlights.filter(f => f.timeSchedule.startsWith('Delayed')).length;
    const emergencyFlights = scheduledFlights.filter(f => f.typeOfFlight === 'Emergency').length;
    
    const totalWaitingTime = scheduledFlights.reduce((sum, flight) => 
        sum + (flight.startTime - flight.arrivalTime), 0);
    const totalTurnaroundTime = scheduledFlights.reduce((sum, flight) => 
        sum + (flight.completionTime - flight.arrivalTime), 0);

    document.getElementById('totalFlights').innerText = totalFlights;
    document.getElementById('delayedFlights').innerText = delayedFlights;
    document.getElementById('emergencyFlights').innerText = emergencyFlights;
    document.getElementById('averageResponseTime').innerText = (totalWaitingTime / totalFlights).toFixed(2);
    document.getElementById('averageTurnaroundTime').innerText = (totalTurnaroundTime / totalFlights).toFixed(2);
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
        datasets.push({
            label: `Flight ${flight.flightNumber}`,
            data: [
                {
                    x: [flight.arrivalTime, flight.startTime],
                    y: flight.flightNumber,
                    type: 'wait'
                },
                {
                    x: [flight.startTime, flight.completionTime],
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
                            return type === 'wait' ? 
                                `Wait Time - ${duration} units` : 
                                `Burst Time - ${duration} units`;
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

