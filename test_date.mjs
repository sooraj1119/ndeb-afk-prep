const tempDate = '2026-08-30';
const ms = new Date(tempDate).getTime();
console.log('MS:', ms);
const msLeft = ms - Date.now();
console.log('DaysLeft:', Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24))));