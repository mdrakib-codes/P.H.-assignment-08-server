const express = require("express");

const {
  getWishlist,
  getWishlistIds,
  toggleWishlist,
} = require("../controllers/wishlistController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.get("/", verifyJWT, getWishlist);
router.get("/ids", verifyJWT, getWishlistIds);
router.post("/:studioId", verifyJWT, toggleWishlist);

module.exports = router;