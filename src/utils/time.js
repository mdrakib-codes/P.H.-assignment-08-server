function toMinutes(value) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) {
    throw new TypeError("Time must use the HH:mm format");
  }

  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) {
    throw new RangeError("Time is outside the valid 24-hour range");
  }

  return hours * 60 + minutes;
}

function hoursBetween(startTime, endTime) {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  if (endMinutes <= startMinutes) {
    throw new RangeError("End time must be after start time");
  }

  return (endMinutes - startMinutes) / 60;
}

module.exports = { toMinutes, hoursBetween };