const isoStr = "2026-08-12T10:00:00+00:00"; // 10:00 UTC = 07:00 BRT = 05:00 COT

const getPartsInTimezone = (isoStr, timeZone) => {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return null;
  const offsetHours = timeZone === "America/Sao_Paulo" ? -3 : -5;
  const targetDate = new Date(d.getTime() + offsetHours * 3600 * 1000);
  return {
    year: targetDate.getUTCFullYear(),
    month: targetDate.getUTCMonth(),
    date: targetDate.getUTCDate(),
    hours: targetDate.getUTCHours(),
    minutes: targetDate.getUTCMinutes(),
  };
};

console.log("Brasil (America/Sao_Paulo):", getPartsInTimezone(isoStr, "America/Sao_Paulo"));
console.log("Colombia (America/Bogota):", getPartsInTimezone(isoStr, "America/Bogota"));
