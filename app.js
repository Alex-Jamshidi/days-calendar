// Polyfill handle if using CDN
const { Temporal } = window;

let currentYear = Temporal.Now.plainDateISO().year;
let currentMonth = Temporal.Now.plainDateISO().month;
let dynamicEvents = [];

const monthsArray = [
    "January", "February", "March", "April", "May", "June",
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
        // Replace with your real relative or absolute path
        const response = await fetch('days.json');
        dynamicEvents = await response.json();
    } catch (e) {
        console.error("Failed to load days.json", e);
    }
}

function setupDropdowns() {
    const monthSelect = document.getElementById("monthJump");
    const yearSelect = document.getElementById("yearJump");

    monthsArray.forEach((m, idx) => {
        let opt = new Option(m, idx + 1);
        monthSelect.add(opt);
    });

    // Dynamically setup a generous chunk of years (e.g., 1900 to 2100)
    for (let y = 1900; y <= 2100; y++) {
        let opt = new Option(y, y);
        yearSelect.add(opt);
    }
}

function navigateMonth(direction) {
    let date = Temporal.PlainDate.from({ year: currentYear, month: currentMonth, day: 1 });
    date = direction === 1 ? date.add({ months: 1 }) : date.subtract({ months: 1 });

    currentYear = date.year;
    currentMonth = date.month;
    updateCalendar();
}

function handleJump() {
    currentMonth = parseInt(document.getElementById("monthJump").value);
    currentYear = parseInt(document.getElementById("yearJump").value);
    updateCalendar();
}

function updateCalendar() {
    // Sync dropdown UI values
    document.getElementById("monthJump").value = currentMonth;
    document.getElementById("yearJump").value = currentYear;

    const currentMonthName = monthsArray[currentMonth - 1];
    document.getElementById("currentMonthYear").textContent = `${currentMonthName} ${currentYear}`;

    const container = document.getElementById("calendarContainer");
    container.innerHTML = "";

    // 1. Generate Weekday Headers (Sunday first Column)
    const daysOfWeekNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    daysOfWeekNames.forEach(day => {
        const header = document.createElement("div");
        header.className = "day-header";
        header.setAttribute("role", "columnheader");
        header.textContent = day;
        container.appendChild(header);
    });

    // 2. Pre-calculate event day assignments for the targeted month/year
    const dayEventsMap = {};
    dynamicEvents.forEach(event => {
        if (event.monthName === currentMonthName) {
            const targetDay = getFloatingDay(currentYear, event.monthName, event.dayName, event.occurrence);
            if (!dayEventsMap[targetDay]) dayEventsMap[targetDay] = [];
            dayEventsMap[targetDay].push(event);
        }
    });

    // 3. Handle grid offsets. 
    // Temporal dayOfWeek maps Monday=1 ... Sunday=7. We need Sunday=0 for alignment.
    const firstOfMonth = Temporal.PlainDate.from({ year: currentYear, month: currentMonth, day: 1 });
    const startOffset = firstOfMonth.dayOfWeek === 7 ? 0 : firstOfMonth.dayOfWeek;

    for (let i = 0; i < startOffset; i++) {
        const emptyBox = document.createElement("div");
        emptyBox.className = "day-box empty-box";
        container.appendChild(emptyBox);
    }

    // 4. Render actual days
    const daysInMonth = firstOfMonth.daysInMonth;
    for (let day = 1; day <= daysInMonth; day++) {
        const dayBox = document.createElement("div");
        dayBox.className = "day-box";
        dayBox.setAttribute("role", "gridcell");

        const dayLabel = document.createElement("div");
        dayLabel.textContent = day;
        dayBox.appendChild(dayLabel);

        // Inject matching events
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

        container.appendChild(dayBox);
    }
}