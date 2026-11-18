const express = require("express");

const {
  listStudios,
  getFeaturedStudios,
  getCategoryStats,
  listMyStudios,
  getStudioById,
  createStudio,
  updateStudio,
  deleteStudio,
  addStudioReview,
} = require("../controllers/studioController");
const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.get("/", listStudios);
router.get("/featured", getFeaturedStudios);
router.get("/stats/categories", getCategoryStats);
router.get("/mine/list", verifyJWT, listMyStudios);
router.get("/:id", getStudioById);

router.post("/", verifyJWT, createStudio);
router.put("/:id", verifyJWT, updateStudio);
router.delete("/:id", verifyJWT, deleteStudio);
router.post("/:id/reviews", verifyJWT, addStudioReview);

module.exports = router;
