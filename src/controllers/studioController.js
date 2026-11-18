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
const STUDIO_CATEGORIES = [
  "Photo Studio",
  "Film Stage",
  "Podcast Lounge",
  "Music Suite",
  "Workshop",
];
const EDITABLE_STUDIO_FIELDS = [
  "title",
  "category",
  "hourlyRate",
  "securityDeposit",
  "maxCapacity",
  "location",
  "image",
  "gallery",
  "amenities",
  "overview",
];
const REQUIRED_STUDIO_FIELDS = EDITABLE_STUDIO_FIELDS;

function getStudioId(value) {
  return typeof value === "string" && ObjectId.isValid(value)
    ? new ObjectId(value)
    : null;
}

function parseNumericInput(value) {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }
  if (typeof value === "string") {
    const numericString = value.trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(numericString)) {
      return null;
    }
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStudioInput(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const providedFields = EDITABLE_STUDIO_FIELDS.filter((field) =>
    Object.prototype.hasOwnProperty.call(body, field),
  );
  if (partial && providedFields.length === 0) {
    return { error: "At least one editable studio field is required" };
  }

  if (!partial) {
    const missingField = REQUIRED_STUDIO_FIELDS.find((field) =>
      !Object.prototype.hasOwnProperty.call(body, field),
    );
    if (missingField) {
      return { error: `${missingField} is required` };
    }
  }

  const studio = {};
  for (const field of providedFields) {
    const value = body[field];

    if (field === "hourlyRate" || field === "securityDeposit" || field === "maxCapacity") {
      const parsed = parseNumericInput(value);
      if (parsed === null) {
        return { error: `${field} must be a valid number` };
      }
      if (field === "hourlyRate" && parsed <= 0) {
        return { error: "hourlyRate must be greater than 0" };
      }
      if (field === "securityDeposit" && parsed < 0) {
        return { error: "securityDeposit cannot be negative" };
      }
      if (field === "maxCapacity" && (!Number.isSafeInteger(parsed) || parsed < 1)) {
        return { error: "maxCapacity must be a positive integer" };
      }
      studio[field] = parsed;
      continue;
    }

    if (field === "category") {
      if (typeof value !== "string" || !STUDIO_CATEGORIES.includes(value.trim())) {
        return { error: "category must be a supported studio category" };
      }
      studio[field] = value.trim();
      continue;
    }

    if (field === "gallery" || field === "amenities") {
      if (
        !Array.isArray(value) ||
        (field === "gallery" && value.length === 0) ||
        !value.every((item) => typeof item === "string" && item.trim() !== "")
      ) {
        return { error: `${field} must be an array of non-empty strings` };
      }
      studio[field] = value.map((item) => item.trim());
      continue;
    }

    if (typeof value !== "string" || value.trim() === "") {
      return { error: `${field} must be a non-empty string` };
    }
    studio[field] = value.trim();
  }

  return { studio };
}

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

async function listMyStudios(req, res) {
  const studios = await (await getDB())
    .collection("studios")
    .find({ ownerEmail: req.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  return res.json(studios);
}

async function createStudio(req, res) {
  const parsed = parseStudioInput(req.body);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const studio = {
    ...parsed.studio,
    ownerEmail: req.user.email,
    ownerName: req.user.name,
    rating: 4.5,
    reviews: [],
    createdAt: new Date(),
  };
  const result = await (await getDB()).collection("studios").insertOne(studio);

  return res.status(201).json({ ...studio, _id: result.insertedId });
}

async function updateStudio(req, res) {
  const id = getStudioId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid studio ID" });
  }

  const parsed = parseStudioInput(req.body, { partial: true });
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const studiosCollection = (await getDB()).collection("studios");
  const studio = await studiosCollection.findOne({ _id: id });
  if (!studio) {
    return res.status(404).json({ message: "Studio not found" });
  }
  if (studio.ownerEmail !== req.user.email) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const result = await studiosCollection.updateOne(
    { _id: id, ownerEmail: req.user.email },
    { $set: parsed.studio },
  );
  if (result.matchedCount === 0) {
    const currentStudio = await studiosCollection.findOne({ _id: id });
    if (!currentStudio) {
      return res.status(404).json({ message: "Studio not found" });
    }
    return res.status(403).json({ message: "Forbidden" });
  }

  const updatedStudio = await studiosCollection.findOne({ _id: id });
  if (!updatedStudio) {
    return res.status(404).json({ message: "Studio not found" });
  }

  return res.json(updatedStudio);
}

async function deleteStudio(req, res) {
  const id = getStudioId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid studio ID" });
  }

  const studiosCollection = (await getDB()).collection("studios");
  const studio = await studiosCollection.findOne({ _id: id });
  if (!studio) {
    return res.status(404).json({ message: "Studio not found" });
  }
  if (studio.ownerEmail !== req.user.email) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const result = await studiosCollection.deleteOne({ _id: id, ownerEmail: req.user.email });
  if (result.deletedCount === 0) {
    const currentStudio = await studiosCollection.findOne({ _id: id });
    if (!currentStudio) {
      return res.status(404).json({ message: "Studio not found" });
    }
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({ message: "Studio deleted successfully" });
}

async function addStudioReview(req, res) {
  const id = getStudioId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid studio ID" });
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "Request body must be a JSON object" });
  }

  const rating = parseNumericInput(req.body.rating);
  if (rating === null || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "rating must be a number between 1 and 5" });
  }
  if (typeof req.body.text !== "string" || req.body.text.trim() === "") {
    return res.status(400).json({ message: "text must be a non-empty string" });
  }

  const review = {
    name: req.user.name,
    role: "StudioSpace member",
    rating,
    text: req.body.text.trim(),
    createdAt: new Date(),
  };
  const studiosCollection = (await getDB()).collection("studios");
  const result = await studiosCollection.updateOne(
    { _id: id },
    [
      {
        $set: {
          reviews: {
            $concatArrays: [
              { $ifNull: ["$reviews", []] },
              [{ $literal: review }],
            ],
          },
        },
      },
      {
        $set: {
          rating: {
            $divide: [
              {
                $floor: {
                  $add: [
                    { $multiply: [{ $avg: "$reviews.rating" }, 10] },
                    0.5,
                  ],
                },
              },
              10,
            ],
          },
        },
      },
    ],
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ message: "Studio not found" });
  }

  const updatedStudio = await studiosCollection.findOne(
    { _id: id },
    { projection: { rating: 1 } },
  );
  if (!updatedStudio) {
    return res.status(404).json({ message: "Studio not found" });
  }

  return res.status(201).json({ rating: updatedStudio.rating, review });
}

async function getStudioById(req, res) {
  const id = getStudioId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid studio ID" });
  }

  const studio = await (await getDB())
    .collection("studios")
    .findOne({ _id: id });

  if (!studio) {
    return res.status(404).json({ message: "Studio not found" });
  }

  return res.json(studio);
}

module.exports = {
  listStudios,
  getFeaturedStudios,
  getCategoryStats,
  listMyStudios,
  getStudioById,
  createStudio,
  updateStudio,
  deleteStudio,
  addStudioReview,
};
