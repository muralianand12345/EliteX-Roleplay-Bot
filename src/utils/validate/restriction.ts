class Restriction {
    static isTimeRestricted(hours: number, minutes: number, seconds: number): boolean {
        const now = new Date();
        return (
            now.getHours() === hours &&
            now.getMinutes() === minutes &&
            now.getSeconds() === seconds
        );
    }

    static isDateRestricted(year: number, month: number, day: number): boolean {
        const now = new Date();
        return (
            now.getFullYear() === year &&
            now.getMonth() === month - 1 && 
            now.getDate() === day
        );
    }

    static isMonthRestricted(month: number): boolean {
        const now = new Date();
        return now.getMonth() === month - 1;
    }

    static isDayRestricted(dayOfWeek: number): boolean {
        const now = new Date();
        return now.getDay() === dayOfWeek;
    }

    static isTimestampRestricted(timeToRestrict: number, tolerance: number = 1000): boolean {
        const currentTimestamp = Date.now();
        return Math.abs(currentTimestamp - timeToRestrict) <= tolerance;
    }
}

export default Restriction;