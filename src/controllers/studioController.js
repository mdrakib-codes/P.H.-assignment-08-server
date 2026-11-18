const { ObjectId } = require("mongodb");

const { getDB } = require("../config/db");

const DEFAULT_PAGE_SIZE = 9;
const MAX_PAGE_SIZE = 100;
const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  price_asc: { hourlyRate: 1 },
  price_desc: { hourlyRate: -1 },
  rating: { rating: -1 },
};

function readQueryString(value) {
  if (value === undefined) {
    return "";
  }

  return typeof value === "string" ? value.trim() : null;
}

function parsePositiveInteger(value, defaultValue, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    return null;
  }

  return parsed;
}

function parsePrice(value) {
  if (value === undefined) {
    return { valid: true, value: undefined };
  }

  if (typeof value !== "string" || !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim())) {
    return { valid: false };
  }

  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? { valid: true, value: parsed }
    : { valid: false };
}

async function listStudios(req, res) {
  const category = readQueryString(req.query.category);
  const search = readQueryString(req.query.search);
  const sortBy = req.query.sort === undefined ? "newest" : readQueryString(req.query.sort);

  if (
    category === null ||
    search === null ||
    sortBy === null ||
    !Object.prototype.hasOwnProperty.call(SORT_OPTIONS, sortBy)
  ) {
    return res.status(400).json({ message: "Invalid category, search, or sort query" });
  }

  const page = parsePositiveInteger(req.query.page, 1);
  if (page === null) {
    return res.status(400).json({ message: "page must be a positive safe integer" });
  }

  const limit = parsePositiveInteger(req.query.limit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  if (limit === null) {
    return res.status(400).json({ message: `limit must be between 1 and ${MAX_PAGE_SIZE}` });
  }

  const minPrice = parsePrice(req.query.minPrice);
  const maxPrice = parsePrice(req.query.maxPrice);
  if (!minPrice.valid || !maxPrice.valid) {
    return res.status(400).json({ message: "minPrice and maxPrice must be non-negative numbers" });
  }

  if (
    minPrice.value !== undefined &&
    maxPrice.value !== undefined &&
    minPrice.value > maxPrice.value
  ) {
    return res.status(400).json({ message: "minPrice cannot exceed maxPrice" });
  }

  const skip = (page - 1) * limit;
  if (!Number.isSafeInteger(skip)) {
    return res.status(400).json({ message: "page and limit produce an invalid offset" });
  }

  const filter = {};
  if (category) {
    filter.category = category;
  }

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    filter.$or = [
      { title: searchRegex },
      { location: searchRegex },
    ];
  }

  const hourlyRate = {};
  if (minPrice.value !== undefined) {
    hourlyRate.$gte = minPrice.value;
  }
  if (maxPrice.value !== undefined) {
    hourlyRate.$lte = maxPrice.value;
  }
  if (Object.keys(hourlyRate).length > 0) {
    filter.hourlyRate = hourlyRate;
  }

  const studiosCollection = (await getDB()).collection("studios");
  const [studios, total] = await Promise.all([
    studiosCollection
      .find(filter)
      .sort(SORT_OPTIONS[sortBy])
      .skip(skip)
      .limit(limit)
      .toArray(),
    studiosCollection.countDocuments(filter),
  ]);

  return res.json({ studios, total });
}

async function getFeaturedStudios(req, res) {
  const studios = await (await getDB())
    .collection("studios")
    .find({})
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();

  return res.json(studios);
}

async function getCategoryStats(req, res) {
  const categories = await (await getDB())
    .collection("studios")
    .aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
        },
      },
      { $sort: { category: 1 } },
    ])
    .toArray();

  return res.json(categories);
}

async function getStudioById(req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid studio ID" });
  }

  const studio = await (await getDB())
    .collection("studios")
    .findOne({ _id: new ObjectId(req.params.id) });

  if (!studio) {
    return res.status(404).json({ message: "Studio not found" });
  }

  return res.json(studio);
}

module.exports = {
  listStudios,
  getFeaturedStudios,
  getCategoryStats,
  getStudioById,
};
