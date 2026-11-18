const { ObjectId } = require("mongodb");

const { getDB } = require("../config/db");

function getStudioObjectId(value) {
  if (value instanceof ObjectId) {
    return value;
  }

  return typeof value === "string" && ObjectId.isValid(value)
    ? new ObjectId(value)
    : null;
}

function getStudioIdString(value) {
  if (value instanceof ObjectId) {
    return value.toString();
  }
  return typeof value === "string" ? value : null;
}

async function getWishlist(req, res) {
  const db = await getDB();
  const entries = await db
    .collection("wishlists")
    .find({ userEmail: req.user.email })
    .toArray();

  const studioIds = [...new Set(entries.map((entry) => getStudioIdString(entry.studioId)).filter(Boolean))];
  const objectIds = studioIds.map(getStudioObjectId).filter(Boolean);
  if (objectIds.length === 0) {
    return res.json([]);
  }

  const studios = await db.collection("studios").find({ _id: { $in: objectIds } }).toArray();
  const studiosById = new Map(studios.map((studio) => [studio._id.toString(), studio]));

  return res.json(studioIds.map((id) => studiosById.get(id)).filter(Boolean));
}

async function getWishlistIds(req, res) {
  const entries = await (await getDB())
    .collection("wishlists")
    .find({ userEmail: req.user.email }, { projection: { _id: 0, studioId: 1 } })
    .toArray();

  const studioIds = entries
    .map((entry) => getStudioIdString(entry.studioId))
    .filter((studioId) => studioId !== null);

  return res.json(studioIds);
}

async function toggleWishlist(req, res) {
  const studioObjectId = getStudioObjectId(req.params.studioId);
  if (!studioObjectId) {
    return res.status(400).json({ message: "Invalid studio ID" });
  }

  const db = await getDB();
  const studio = await db
    .collection("studios")
    .findOne({ _id: studioObjectId }, { projection: { _id: 1 } });
  if (!studio) {
    return res.status(404).json({ message: "Studio not found" });
  }

  const wishlist = db.collection("wishlists");
  const studioId = studioObjectId.toString();
  const filter = { userEmail: req.user.email, studioId };
  const existing = await wishlist.findOne(filter, { projection: { _id: 1 } });

  if (existing) {
    const result = await wishlist.deleteOne({ _id: existing._id, ...filter });
    if (result.deletedCount === 1) {
      return res.json({ saved: false });
    }
  }

  try {
    await wishlist.insertOne(filter);
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ saved: true });
    }
    throw error;
  }

  return res.json({ saved: true });
}

module.exports = {
  getWishlist,
  getWishlistIds,
  toggleWishlist,
};