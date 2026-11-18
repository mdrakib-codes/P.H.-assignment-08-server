const { ObjectId } = require("mongodb");

async function hasConfirmedOverlap(db, { studioId, date, startTime, endTime, excludeId }) {
  const filter = {
    status: "Confirmed",
    studioId,
    date,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeId !== undefined && excludeId !== null) {
    const id = typeof excludeId === "string" && ObjectId.isValid(excludeId)
      ? new ObjectId(excludeId)
      : excludeId;
    filter._id = { $ne: id };
  }

  return Boolean(await db.collection("bookings").findOne(filter, { projection: { _id: 1 } }));
}

module.exports = { hasConfirmedOverlap };