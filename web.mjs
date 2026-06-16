import { Temporal } from 'https://esm.run/@js-temporal/polyfill@0.4.4';
import { getFloatingDay } from './common.mjs';

// 1. Initialize automatically to the current real-world Month and Year
let currentYear = Temporal.Now.plainDateISO().year;
let currentMonth = Temporal.Now.plainDateISO().month;
let dynamicEvents = [];

const MONTHS_MAP = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

document.addEventListener("DOMContentLoaded", async () => {
    await fetchEvents();
    setupDropdowns();
    updateCalendar();

    document.getElementById("prevBtn").addEventListener("click", () => navigateMonth(-1));
    document.getElementById("nextBtn").addEventListener("click", () => navigateMonth(1));
    document.getElementById("monthJump").addEventListener("change", handleJump);
    document.getElementById("yearJump").addEventListener("change", handleJump);
});

async function fetchEvents() {
    try {
        const response = await fetch('days.json');
        dynamicEvents = await response.json();
    } catch (e) {
        console.error("Could not load days.json", e);
    }
}

function setupDropdowns() {
    const monthSelect = document.getElementById("monthJump");
    for (let m = 1; m <= 12; m++) {
        monthSelect.add(new Option(MONTHS_MAP[m], m));
    }
    syncYearDropdownBounds(currentYear);
}

/**
 * Ensures previous/next buttons never crash at selector endpoints
 * by automatically adding missing options on the fly.
 */
function syncYearDropdownBounds(targetYear) {
    const yearSelect = document.getElementById("yearJump");
    let options = Array.from(yearSelect.options).map(o => parseInt(o.value, 10));

    if (!options.includes(targetYear)) {
        const start = Math.min(targetYear, 1900);
        const end = Math.max(targetYear, 2100);
        yearSelect.innerHTML = "";
        for (let y = start; y <= end; y++) {
            yearSelect.add(new Option(y, y));
        }
    }
}

function navigateMonth(direction) {
    let date = Temporal.PlainDate.from({ year: currentYear, month: currentMonth, day: 1 });
    date = direction === 1 ? date.add({ months: 1 }) : date.subtract({ months: 1 });

    currentYear = date.year;
    currentMonth = date.month;

    syncYearDropdownBounds(currentYear);
    updateCalendar();
}

function handleJump() {
    currentMonth = parseInt(document.getElementById("monthJump").value, 10);
    currentYear = parseInt(document.getElementById("yearJump").value, 10);
    updateCalendar();
}


function updateCalendar() {
    document.getElementById("monthJump").value = currentMonth;
    document.getElementById("yearJump").value = currentYear;

    const currentMonthName = MONTHS_MAP[currentMonth];
    document.getElementById("currentMonthYear").textContent = `${currentMonthName} ${currentYear}`;

    const container = document.getElementById("calendarContainer");
    container.innerHTML = "";

    // FIX 1: Set the main container role to 'table' instead of a naked grid
    container.setAttribute("role", "table");
    container.setAttribute("aria-label", `${currentMonthName} ${currentYear}`);

    // 1. Create a dedicated Header Row Container
    const headerRow = document.createElement("div");
    headerRow.style.display = "contents"; // Prevents layout fracturing
    headerRow.setAttribute("role", "row");

    const daysOfWeekNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    daysOfWeekNames.forEach(day => {
        const header = document.createElement("div");
        header.className = "day-header";
        header.setAttribute("role", "columnheader"); // Fixes day-header structural warning
        header.textContent = day;
        headerRow.appendChild(header);
    });
    container.appendChild(headerRow);

    // 2. Pre-Map calculated events for this exact view
    const dayEventsMap = {};
    dynamicEvents.forEach(event => {
        if (event.monthName.trim().toLowerCase() === currentMonthName.toLowerCase()) {
            const targetDay = getFloatingDay(currentYear, currentMonth, event.dayName.trim(), event.occurrence.trim());
            if (!dayEventsMap[targetDay]) dayEventsMap[targetDay] = [];
            dayEventsMap[targetDay].push(event);
        }
    });

    // 3. Spacing Boxes Calculation (Transforms Temporal Sunday=7 to Grid Column 0)
    const firstOfMonth = Temporal.PlainDate.from({ year: currentYear, month: currentMonth, day: 1 });
    const startOffset = firstOfMonth.dayOfWeek === 7 ? 0 : firstOfMonth.dayOfWeek;

    // FIX 2: Create a semantic wrapper for data gridcells
    const bodyRow = document.createElement("div");
    bodyRow.style.display = "contents";
    bodyRow.setAttribute("role", "row");

    for (let i = 0; i < startOffset; i++) {
        const emptyBox = document.createElement("div");
        emptyBox.className = "day-box empty-box";
        emptyBox.setAttribute("role", "cell"); // Explicitly mark empty spacers as structural cells
        bodyRow.appendChild(emptyBox);
    }

    // 4. Generate Days and Append matching items dynamically
    const daysInMonth = firstOfMonth.daysInMonth;
    for (let day = 1; day <= daysInMonth; day++) {
        const dayBox = document.createElement("div");
        dayBox.className = "day-box";
        dayBox.setAttribute("role", "cell"); // Fixes day-box orphan role warning

        const dayLabel = document.createElement("div");
        dayLabel.className = "day-label";
        dayLabel.textContent = day;
        dayBox.appendChild(dayLabel);

        if (dayEventsMap[day]) {
            dayEventsMap[day].forEach(event => {
                const evDiv = document.createElement("div");
                evDiv.className = "event-tag";

                const link = document.createElement("a");
                link.href = event.descriptionURL;
                link.textContent = event.name;

                evDiv.appendChild(link);
                dayBox.appendChild(evDiv);
            });
        }
        bodyRow.appendChild(dayBox);
    }

    container.appendChild(bodyRow);
}