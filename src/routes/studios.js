const express = require("express");

const {
  listStudios,
  getFeaturedStudios,
  getCategoryStats,
  getStudioById,
} = require("../controllers/studioController");

const router = express.Router();

router.get("/", listStudios);
router.get("/featured", getFeaturedStudios);
router.get("/stats/categories", getCategoryStats);
router.get("/:id", getStudioById);

module.exports = router;
