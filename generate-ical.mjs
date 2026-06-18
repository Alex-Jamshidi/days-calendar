import { getFloatingDay } from "./common.mjs";
import daysData from "./days.json" with { type: "json" };
const start_year = 2020;
const end_year = 2030;
for (let day of daysData) {
    for (let year = start_year; year <= end_year; year++) {
        const dayOfMonth = getFloatingDay(year, day.monthName, day.dayName, day.occurrence);
        console.log(`${day.name}: ${year}-${day.monthName}-${dayOfMonth}`);
    }
}

