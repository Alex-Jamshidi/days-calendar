import daysData from "./days.json" with { type: "json" };
// Map for converting text occurrences to indices
const OCCURRENCE_MAP = { first: 1, second: 2, third: 3, fourth: 4 };

/**
 * Calculates the day of the month for a specific dynamic event rule using Temporal.
 * @param {number} year - e.g., 2024
 * @param {string} monthName - e.g., "October"
 * @param {string} dayName - e.g., "Tuesday"
 * @param {string} occurrence - "first", "second", "third", "fourth", or "last"
 * @returns {number} The day of the month (1-31)
 */
export function getFloatingDay(year, monthInput, dayName, occurrence) {
    const monthMap = {
        January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
        July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
    };
    const dayMap = {
        Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7
    };

    // If monthInput is a string ("October"), map it. If it's a number (10), use it directly.
    const month = typeof monthInput === "string" ? monthMap[monthInput.trim()] : monthInput;
    const targetDayOfWeek = dayMap[dayName.trim()];

    if (occurrence === "last") {
        let date = Temporal.PlainDate.from({ year, month, day: 1 });
        date = date.with({ day: date.daysInMonth });

        while (date.dayOfWeek !== targetDayOfWeek) {
            date = date.subtract({ days: 1 });
        }
        return date.day;
    } else {
        let date = Temporal.PlainDate.from({ year, month, day: 1 });

        while (date.dayOfWeek !== targetDayOfWeek) {
            date = date.add({ days: 1 });
        }

        const occurrenceMap = { first: 1, second: 2, third: 3, fourth: 4 };
        const targetOccurrence = occurrenceMap[occurrence];

        date = date.add({ weeks: targetOccurrence - 1 });
        return date.day;
    }
}