# Single-Runway Airport Flight Scheduler

## Overview
This **Single-Runway Airport Flight Scheduler** is a web application designed to manage flight operations for a single runway airport. The scheduler assigns priority to incoming and outgoing flights based on factors such as flight type, fuel requirements, and time schedule while considering the current weather conditions. The app helps visualize the flight schedule through a Gantt chart and provides performance statistics such as total flights, delayed flights, emergency flights, and average waiting/turnaround times.

## Features
- **Flight Scheduling:** Automatically prioritizes flights based on arrival time, fuel status, flight type (Domestic, International, Emergency), and delay status.
- **Weather Integration:** Changes in weather conditions affect flight scheduling. Different weather types alter flight burst times (service duration on the runway).
- **Statistics Dashboard:** Displays overall statistics such as total flights, delayed flights, emergency flights, average waiting times, and turnaround times.
- **Gantt Chart Visualization:** A Gantt chart provides a visual timeline for scheduled flights.
- **Default Flight Entry:** Pre-defined default flight values can be loaded to quickly initialize the scheduler.
- **Dynamic Background:** The background image dynamically changes based on the selected weather condition.
- **Flight Aging:** Waiting time for flights is incremented with each scheduling iteration, improving the fairness of scheduling.

## Getting Started

### Prerequisites
To run this project locally, you need:
- A modern web browser (Chrome, Firefox, etc.)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/airport-flight-scheduler.git
   ```
2. Navigate to the project directory:
   ```bash
   cd airport-flight-scheduler
   ```

3. Open the `index.html` file in your browser.

### Running the Scheduler
1. Select a weather condition from the dropdown.
2. Either:
   - Enter flight details manually in the provided input fields.
   - Use the **Set Default Values** button to auto-populate flight entries.
3. Click the **Schedule Flights** button to view the prioritized schedule and performance statistics.

## Files Structure

- **index.html**: Main HTML structure with inputs for flight details, weather selection, and the Gantt chart container.
- **styles.css**: Custom styles for the layout and design of the application.
- **scripts.js**: Main JavaScript logic that handles scheduling, flight prioritization, Gantt chart generation, and background updates.

## Key Functions

- **scheduleFlights():** Schedules flights based on the input data and weather conditions, computes priorities, and updates the Gantt chart and statistics.
- **setDefaultValues():** Populates flight entries with predefined values to simulate different scenarios.
- **generateGanttChart():** Generates the visual representation of the flight schedule as a Gantt chart.
- **updateBackgroundImage():** Dynamically changes the background image based on the selected weather condition.

## Customization
You can modify the default flight entries, burst times, and weather conditions in the JavaScript file. Update the corresponding sections under `defaultValues`, `weatherBurstTimes`, and `weatherImages` to customize your airport scheduling environment.

## License
This project is licensed under the MIT License.

---

Feel free to contribute by reporting issues or submitting pull requests to enhance this scheduler!

---

**Developed by Jatin**
