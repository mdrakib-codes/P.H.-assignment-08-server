const express = require("express");

const {
  createBooking,
  getMyBookings,
  getHostBookings,
  getAvailability,
  cancelBooking,
  updateBookingStatus,
} = require("../controllers/bookingController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.post("/", verifyJWT, createBooking);
router.get("/mine", verifyJWT, getMyBookings);
router.get("/host", verifyJWT, getHostBookings);
router.get("/availability", getAvailability);
router.patch("/:id/cancel", verifyJWT, cancelBooking);
router.patch("/:id/status", verifyJWT, updateBookingStatus);

module.exports = router;