document.getElementById('scheduleButton').addEventListener('click', scheduleFlights);

const weatherBurstTimes = {
  'Fog': 11,
  'Thunderstorms': 9,
  'Heavy Rain': 10,
  'Snow and Ice': 12,
  'Nominal': 8
};

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
      flights.push({
        flightNumber: index + 1,
        arrivalTime: parseInt(arrivalTime, 10),
        typeOfFlight,
        fuelRequirements,
        timeSchedule,
        landingTakeoff,
        burstTime
      });
    }
  });

  flights.sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) {
      return a.arrivalTime - b.arrivalTime;
    }

    const flightTypePriority = { "Emergency": 1, "International": 2, "Domestic": 3 };
    if (flightTypePriority[a.typeOfFlight] !== flightTypePriority[b.typeOfFlight]) {
      return flightTypePriority[a.typeOfFlight] - flightTypePriority[b.typeOfFlight];
    }

    const fuelPriority = { "Low": 1, "Nominal": 2 };
    if (fuelPriority[a.fuelRequirements] !== fuelPriority[b.fuelRequirements]) {
      return fuelPriority[a.fuelRequirements] - fuelPriority[b.fuelRequirements];
    }

    const timePriority = {
      "On time": 1,
      "Delayed < 1": 2,
      "Delayed > 1": 3,
      "Delayed > 3": 4,
      "Delayed > 5": 5
    };
    return timePriority[b.timeSchedule] - timePriority[a.timeSchedule];
  });

  const scheduleTable = document.getElementById('scheduleTable').querySelector('tbody');
  const technicalTable = document.getElementById('technicalTable').querySelector('tbody');

  scheduleTable.innerHTML = '';
  technicalTable.innerHTML = '';

  let currentTime = 0;

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

    const flightTypePriority = { "Emergency": 1, "International": 2, "Domestic": 3 };
    const fuelPriority = { "Low": 1, "Nominal": 2 };
    const timePriority = {
      "On time": 1,
      "Delayed < 1": 2,
      "Delayed > 1": 3,
      "Delayed > 3": 4,
      "Delayed > 5": 5
    };

    const priorityScore = flightTypePriority[flight.typeOfFlight] +
      fuelPriority[flight.fuelRequirements] +
      timePriority[flight.timeSchedule];

    const techRow = technicalTable.insertRow();
    techRow.insertCell(0).innerText = flight.flightNumber;
    techRow.insertCell(1).innerText = flight.arrivalTime;
    techRow.insertCell(2).innerText = flight.burstTime;
    techRow.insertCell(3).innerText = priorityScore;
    techRow.insertCell(4).innerText = completionTime;
    techRow.insertCell(5).innerText = waitingTime;
    techRow.insertCell(6).innerText = turnaroundTime;
  });

  document.getElementById('scheduleContainer').style.display = 'block';
  document.getElementById('technicalContainer').style.display = 'block';
  // Hide Gantt chart container
  document.getElementById('ganttContainer').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function() {
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

document.addEventListener('DOMContentLoaded', function() {
  const dialog = document.getElementById('dialog');
  const closeDialog = document.getElementById('closeDialog');

  setTimeout(() => {
    dialog.style.display = 'block';

    setTimeout(() => {
      dialog.style.display = 'none';
    }, 7000); 
  }, 1000); 

  closeDialog.addEventListener('click', function() {
    dialog.style.display = 'none';
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const weatherSelect = document.getElementById('weatherSelect');

  const weatherImages = {
    'Fog': 'images/fog1.gif',
    'Thunderstorms': 'images/thunderstorms.gif',
    'Heavy Rain': 'images/heavy-rain.gif',
    'Snow and Ice': 'images/snow-ice.gif',
    'Nominal': 'images/nominal.gif'
  };

  function updateBackgroundImage() {
    const selectedWeather = weatherSelect.options[weatherSelect.selectedIndex].value;
    const backgroundImage = weatherImages[selectedWeather];

    if (backgroundImage) {
      document.body.style.backgroundImage = `url(${backgroundImage})`;
      document.body.style.backgroundSize = 'cover'; // Make sure the background covers the whole page
      document.body.style.backgroundPosition = 'center'; // Center the background image
    }
  }

  // Set the initial background image based on the default selected weather
  updateBackgroundImage();

  // Change the background image when the user selects a different weather
  weatherSelect.addEventListener('change', updateBackgroundImage);
});
