const getDayName = (dayIndex: number): string => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return daysOfWeek[dayIndex];
};

const getMonthName = (monthIndex: number): string => {
    const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthsOfYear[monthIndex];
};

const getMonthIndex = (monthName: string): number => {
    const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return monthsOfYear.indexOf(monthName);
};

export { getDayName, getMonthName, getMonthIndex };