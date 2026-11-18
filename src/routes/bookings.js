const express = require("express");

const {
  createBooking,
  getMyBookings,
  getHostBookings,
  getAvailability,
} = require("../controllers/bookingController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.post("/", verifyJWT, createBooking);
router.get("/mine", verifyJWT, getMyBookings);
router.get("/host", verifyJWT, getHostBookings);
router.get("/availability", getAvailability);

module.exports = router;