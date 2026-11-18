const { ObjectId } = require("mongodb");

const { getDB } = require("../config/db");
const { hasConfirmedOverlap } = require("../utils/overlap");
const { hoursBetween, toMinutes } = require("../utils/time");

const BOOKING_CONFLICT_MESSAGE = "This slot is already booked. Please choose another time.";

function getStudioId(value) {
  return typeof value === "string" && ObjectId.isValid(value)
    ? new ObjectId(value)
    : null;
}

function getBookingId(value) {
  return typeof value === "string" && ObjectId.isValid(value)
    ? new ObjectId(value)
    : null;
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isRequestBody(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function createBooking(req, res) {
  if (!isRequestBody(req.body)) {
    return res.status(400).json({ message: "Request body must be a JSON object" });
  }

  const studioObjectId = getStudioId(req.body.studioId);
  if (!studioObjectId) {
    return res.status(400).json({ message: "studioId must be a valid MongoDB ObjectId" });
  }

  if (!isValidDate(req.body.date)) {
    return res.status(400).json({ message: "date must be a valid YYYY-MM-DD date" });
  }
  if (req.body.date < getLocalDateString(new Date())) {
    return res.status(400).json({ message: "date cannot be in the past" });
  }

  let startMinutes;
  let endMinutes;
  try {
    startMinutes = toMinutes(req.body.startTime);
    endMinutes = toMinutes(req.body.endTime);
  } catch {
    return res.status(400).json({ message: "startTime and endTime must be valid HH:mm times" });
  }

  if (endMinutes <= startMinutes) {
    return res.status(400).json({ message: "endTime must be after startTime" });
  }

  const hours = hoursBetween(req.body.startTime, req.body.endTime);
  if (hours < 1) {
    return res.status(400).json({ message: "A booking must be at least one hour" });
  }

  const db = await getDB();
  const studio = await db.collection("studios").findOne({ _id: studioObjectId });
  if (!studio) {
    return res.status(404).json({ message: "Studio not found" });
  }
  if (studio.ownerEmail === req.user.email) {
    return res.status(403).json({ message: "You cannot book your own studio" });
  }

  if (
    await hasConfirmedOverlap(db, {
      studioId: studio._id.toString(),
      date: req.body.date,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
    })
  ) {
    return res.status(409).json({ message: BOOKING_CONFLICT_MESSAGE });
  }

  if (req.body.notes !== undefined && typeof req.body.notes !== "string") {
    return res.status(400).json({ message: "notes must be a string" });
  }

  const hourlyRate = Number(studio.hourlyRate);
  if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
    throw new Error("Studio hourly rate is invalid");
  }

  const booking = {
    studioId: studio._id.toString(),
    studioTitle: studio.title,
    studioImage: studio.image,
    hostEmail: studio.ownerEmail,
    userEmail: req.user.email,
    userName: req.user.name,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    notes: req.body.notes ? req.body.notes.trim() : "",
    hours,
    totalPrice: hourlyRate * hours,
    status: "Pending",
    createdAt: new Date(),
  };
  const result = await db.collection("bookings").insertOne(booking);

  return res.status(201).json({ ...booking, _id: result.insertedId });
}

async function getMyBookings(req, res) {
  const bookings = await (await getDB())
    .collection("bookings")
    .find({ userEmail: req.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  return res.json(bookings);
}

async function getHostBookings(req, res) {
  const db = await getDB();
  const studios = await db
    .collection("studios")
    .find({ ownerEmail: req.user.email }, { projection: { _id: 1 } })
    .toArray();
  const studioIds = studios.map((studio) => studio._id.toString());

  if (studioIds.length === 0) {
    return res.json([]);
  }

  const bookings = await db
    .collection("bookings")
    .find({ studioId: { $in: studioIds } })
    .sort({ createdAt: -1 })
    .toArray();

  return res.json(bookings);
}

async function getAvailability(req, res) {
  const studioObjectId = getStudioId(req.query.studioId);
  if (!studioObjectId) {
    return res.status(400).json({ message: "studioId must be a valid MongoDB ObjectId" });
  }
  if (!isValidDate(req.query.date)) {
    return res.status(400).json({ message: "date must be a valid YYYY-MM-DD date" });
  }

  const ranges = await (await getDB())
    .collection("bookings")
    .find(
      {
        studioId: studioObjectId.toString(),
        date: req.query.date,
        status: "Confirmed",
      },
      { projection: { _id: 0, startTime: 1, endTime: 1 } },
    )
    .sort({ startTime: 1 })
    .toArray();

  return res.json(ranges);
}

async function cancelBooking(req, res) {
  const bookingId = getBookingId(req.params.id);
  if (!bookingId) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  const db = await getDB();
  const bookings = db.collection("bookings");
  const booking = await bookings.findOne({ _id: bookingId });
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  if (booking.userEmail !== req.user.email) {
    return res.status(403).json({ message: "You are not the owner of this booking" });
  }
  if (booking.status !== "Pending") {
    return res.status(400).json({ message: "Only pending bookings can be cancelled" });
  }

  const result = await bookings.updateOne(
    { _id: bookingId, userEmail: req.user.email, status: "Pending" },
    { $set: { status: "Cancelled" } },
  );
  if (result.matchedCount === 0) {
    const currentBooking = await bookings.findOne({ _id: bookingId });
    if (!currentBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (currentBooking.userEmail !== req.user.email) {
      return res.status(403).json({ message: "You are not the owner of this booking" });
    }
    return res.status(400).json({ message: "Only pending bookings can be cancelled" });
  }

  const cancelledBooking = await bookings.findOne({ _id: bookingId });
  if (!cancelledBooking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  return res.json({
    message: "Booking cancelled successfully",
    booking: cancelledBooking,
  });
}

async function updateBookingStatus(req, res) {
  const bookingId = getBookingId(req.params.id);
  if (!bookingId) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }
  if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "Request body must be a JSON object" });
  }

  const requestedStatus = req.body.status;
  if (!["Confirmed", "Cancelled", "Completed"].includes(requestedStatus)) {
    return res.status(400).json({
      message: "status must be Confirmed, Cancelled, or Completed",
    });
  }

  const db = await getDB();
  const bookings = db.collection("bookings");
  const booking = await bookings.findOne({ _id: bookingId });
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  if (booking.hostEmail !== req.user.email) {
    return res.status(403).json({ message: "Only the host can update this booking" });
  }

  const allowedTransitions = new Map([
    ["Pending", ["Confirmed", "Cancelled"]],
    ["Confirmed", ["Completed", "Cancelled"]],
  ]);
  if (!allowedTransitions.get(booking.status)?.includes(requestedStatus)) {
    return res.status(400).json({
      message: `Cannot change booking status from ${booking.status} to ${requestedStatus}`,
    });
  }

  if (
    requestedStatus === "Confirmed" &&
    await hasConfirmedOverlap(db, {
      studioId: booking.studioId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      excludeId: booking._id,
    })
  ) {
    return res.status(409).json({ message: BOOKING_CONFLICT_MESSAGE });
  }

  const result = await bookings.updateOne(
    { _id: bookingId, hostEmail: req.user.email, status: booking.status },
    { $set: { status: requestedStatus } },
  );
  if (result.matchedCount === 0) {
    const currentBooking = await bookings.findOne({ _id: bookingId });
    if (!currentBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (currentBooking.hostEmail !== req.user.email) {
      return res.status(403).json({ message: "Only the host can update this booking" });
    }
    return res.status(400).json({ message: "Booking status changed; please retry" });
  }

  const updatedBooking = await bookings.findOne({ _id: bookingId });
  if (!updatedBooking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  return res.json({
    message: "Booking status updated successfully",
    booking: updatedBooking,
  });
}

module.exports = {
  createBooking,
  getMyBookings,
  getHostBookings,
  getAvailability,
  cancelBooking,
  updateBookingStatus,
};