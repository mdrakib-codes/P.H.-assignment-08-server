require("dotenv").config();

const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const { getDB } = require("../src/config/db");

const CATEGORIES = [
  "Photo Studio",
  "Film Stage",
  "Podcast Lounge",
  "Music Suite",
  "Workshop",
];
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const now = Date.now();

function imageUrl(seed) {
  return `https://picsum.photos/seed/${seed}/1200/800`;
}

function makeReview(name, role, rating, text, daysAgo) {
  return {
    name,
    role,
    rating,
    text,
    createdAt: new Date(now - daysAgo * DAY_IN_MS),
  };
}

const studios = [
  {
    slug: "gulshan-window-light",
    daysAgo: 1,
    title: "Windowlight Portrait Studio",
    category: "Photo Studio",
    hourlyRate: 48,
    securityDeposit: 100,
    maxCapacity: 8,
    location: "Gulshan 2, Dhaka",
    amenities: ["North-facing windows", "Backdrop stands", "Softbox lighting", "Makeup station", "Changing room", "Tethered shooting desk", "Air conditioning"],
    overview: "A bright portrait space with soft natural light and carefully controlled blackout curtains. The layout suits editorial sessions, headshots, and small product shoots.",
    rating: 4.8,
    reviews: [
      makeReview("Nusrat Jahan", "Portrait Photographer", 5, "The daylight stayed beautifully even through the afternoon, and the team had every stand ready.", 3),
      makeReview("Rafi Chowdhury", "Creative Director", 4.7, "A calm, well-kept room that made our short portrait session run on schedule.", 9),
    ],
  },
  {
    slug: "dhanmondi-copper-frame",
    daysAgo: 3,
    title: "Copper Frame Product Loft",
    category: "Photo Studio",
    hourlyRate: 62,
    securityDeposit: 125,
    maxCapacity: 10,
    location: "Dhanmondi 27, Dhaka",
    amenities: ["Cyclorama wall", "Overhead rig points", "Continuous LED lights", "Product turntable", "Prop shelves", "Client lounge", "High-speed Wi-Fi", "Freight lift"],
    overview: "A flexible product photography loft with a clean white sweep and a separate styling area. There is room for a compact crew to build tabletop scenes without interrupting the shoot.",
    rating: 4.7,
    reviews: [
      makeReview("Farhan Ahmed", "Product Photographer", 4.8, "The sweep was spotless and the loading access made bringing in our props easy.", 5),
      makeReview("Sadia Karim", "Brand Producer", 4.6, "Great equipment choices and a comfortable corner for clients to review images.", 12),
      makeReview("Imran Hossain", "Stylist", 4.7, "The shelves and turntable saved us a lot of setup time.", 16),
    ],
  },
  {
    slug: "sylhet-riverstone-photo",
    daysAgo: 5,
    title: "Riverstone Photo Room",
    category: "Photo Studio",
    hourlyRate: 38,
    securityDeposit: 75,
    maxCapacity: 6,
    location: "Zindabazar, Sylhet",
    amenities: ["Window daylight", "Portable backdrops", "Reflector kit", "Makeup mirror", "Wardrobe rail", "Client seating"],
    overview: "A compact, quiet room designed for family portraits and small fashion shoots. Its warm wood finishes and portable backdrop kit make quick changes simple.",
    rating: 4.6,
    reviews: [
      makeReview("Maliha Sultana", "Family Photographer", 4.6, "The room felt welcoming for families and had enough space for a relaxed setup.", 7),
      makeReview("Tanvir Islam", "Photographer", 4.8, "Easy to reach in town, with helpful hosts and reliable lighting.", 14),
    ],
  },
  {
    slug: "tejgaon-orbit-film-stage",
    daysAgo: 7,
    title: "Orbit Blackbox Film Stage",
    category: "Film Stage",
    hourlyRate: 118,
    securityDeposit: 300,
    maxCapacity: 32,
    location: "Tejgaon Industrial Area, Dhaka",
    amenities: ["Sound-treated walls", "Blackout curtains", "Lighting grid", "Three-phase power", "Green screen", "Production office", "Dressing room", "Loading bay", "Crew parking"],
    overview: "A purpose-built blackbox stage for commercials, interviews, and controlled interior scenes. The high grid and production rooms support a full crew while keeping the set organized.",
    rating: 4.9,
    reviews: [
      makeReview("Arif Mahmud", "Line Producer", 5, "Power, loading, and crew flow were all handled smoothly during our two-day shoot.", 4),
      makeReview("Tania Noor", "Director", 4.8, "The blackout and sound treatment gave us a dependable environment for dialogue scenes.", 11),
      makeReview("Shuvo Das", "Gaffer", 4.9, "Plenty of rigging points and a sensible power layout.", 19),
    ],
  },
  {
    slug: "agrabad-bayline-stage",
    daysAgo: 9,
    title: "Bayline Production Stage",
    category: "Film Stage",
    hourlyRate: 96,
    securityDeposit: 250,
    maxCapacity: 24,
    location: "Agrabad, Chattogram",
    amenities: ["Cyclorama wall", "Acoustic panels", "Lighting stands", "Green screen", "Generator backup", "Wardrobe room", "Makeup mirrors", "Production desk"],
    overview: "A versatile production floor for branded films, training videos, and small set builds. Its generous ceiling height and backup power help crews keep a steady schedule.",
    rating: 4.7,
    reviews: [
      makeReview("Rasheda Akter", "Producer", 4.7, "The stage was clean, quiet, and ready when our crew arrived.", 6),
      makeReview("Faisal Rahman", "Camera Assistant", 4.8, "Good room to shape light, with an easy setup for interviews.", 13),
    ],
  },
  {
    slug: "banani-adda-podcast",
    daysAgo: 12,
    title: "Adda House Podcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 44,
    securityDeposit: 80,
    maxCapacity: 6,
    location: "Banani 11, Dhaka",
    amenities: ["Four broadcast microphones", "Audio interface", "Closed-back headphones", "Acoustic treatment", "Two-camera setup", "Sound engineer desk", "Tea and water station"],
    overview: "A warm conversation room built for interviews, roundtables, and branded podcasts. Microphones and headphones are set up before arrival, leaving hosts time to focus on the discussion.",
    rating: 4.8,
    reviews: [
      makeReview("Mehjabin Sayeed", "Podcast Host", 4.9, "The room sounded balanced and the engineer helped us get levels right quickly.", 3),
      makeReview("Nabil Hasan", "Audio Producer", 4.7, "Comfortable for guests and the camera setup was straightforward.", 10),
    ],
  },
  {
    slug: "amberkhana-mic-garden",
    daysAgo: 15,
    title: "Mic Garden Recording Room",
    category: "Podcast Lounge",
    hourlyRate: 32,
    securityDeposit: 60,
    maxCapacity: 4,
    location: "Amberkhana, Sylhet",
    amenities: ["Two condenser microphones", "USB audio interface", "Acoustic panels", "Pop filters", "Headphone splitter", "Soft seating"],
    overview: "A peaceful recording room for two-person interviews, voice work, and remote conversations. The simple controls and soft seating make it approachable for first-time podcasters.",
    rating: 4.5,
    reviews: [
      makeReview("Ayesha Begum", "Community Host", 4.5, "A quiet and friendly place to record our first interview series.", 8),
      makeReview("Samiul Kabir", "Voice Artist", 4.7, "The room was treated well and booking instructions were clear.", 18),
      makeReview("Rumana Haque", "Producer", 4.6, "Convenient location and a helpful host made the session easy.", 21),
    ],
  },
  {
    slug: "bashundhara-soundwell-suite",
    daysAgo: 18,
    title: "Soundwell Music Suite",
    category: "Music Suite",
    hourlyRate: 72,
    securityDeposit: 160,
    maxCapacity: 7,
    location: "Bashundhara Residential Area, Dhaka",
    amenities: ["Vocal booth", "Digital piano", "Studio monitors", "Audio interface", "Microphone locker", "Acoustic panels", "Lounge seating", "Climate control"],
    overview: "A carefully treated suite for vocal tracking, composing, and small ensemble rehearsals. The isolated booth and monitor setup let artists move from writing to recording in one session.",
    rating: 4.9,
    reviews: [
      makeReview("Ishrat Khan", "Singer-Songwriter", 5, "The vocal booth was quiet and the monitors translated well for our mix.", 5),
      makeReview("Adnan Sarker", "Composer", 4.8, "A focused space with dependable gear and a welcoming engineer.", 15),
    ],
  },
  {
    slug: "gec-sur-live-room",
    daysAgo: 21,
    title: "Sur Live Rehearsal Room",
    category: "Music Suite",
    hourlyRate: 54,
    securityDeposit: 120,
    maxCapacity: 9,
    location: "GEC Circle, Chattogram",
    amenities: ["Drum kit", "Guitar amplifier", "Bass amplifier", "Keyboard", "PA system", "Vocal microphones", "Instrument stands", "Water station"],
    overview: "A lively rehearsal room set up for bands preparing for stage or studio sessions. The backline is arranged for quick sound checks and there is space to store cases during practice.",
    rating: 4.6,
    reviews: [
      makeReview("Zubair Alam", "Guitarist", 4.7, "The backline worked well and we had enough room for the full band.", 9),
      makeReview("Nayeem Barua", "Drummer", 4.5, "Easy booking and a solid drum setup for rehearsal.", 17),
    ],
  },
  {
    slug: "uttara-makers-yard",
    daysAgo: 24,
    title: "Makers' Yard Workshop",
    category: "Workshop",
    hourlyRate: 68,
    securityDeposit: 140,
    maxCapacity: 14,
    location: "Uttara Sector 7, Dhaka",
    amenities: ["Large workbenches", "Hand tool wall", "Sewing machines", "Cutting mats", "Utility sink", "Material storage", "Projector", "Workshop stools", "First-aid kit"],
    overview: "A practical, light-filled workshop for craft classes, prototyping, and small team sessions. Flexible benches and generous storage make it easy to adapt the room to different projects.",
    rating: 4.8,
    reviews: [
      makeReview("Sharmeen Haque", "Textile Artist", 4.9, "Our class had room to spread out, and the sewing stations were ready to use.", 6),
      makeReview("Omar Faruk", "Product Maker", 4.7, "Useful tools, bright worktables, and a thoughtful setup for a group.", 20),
    ],
  },
  {
    slug: "khulshi-clay-colour",
    daysAgo: 27,
    title: "Clay & Colour Creative Workshop",
    category: "Workshop",
    hourlyRate: 58,
    securityDeposit: 110,
    maxCapacity: 12,
    location: "Khulshi, Chattogram",
    amenities: ["Ceramic worktables", "Pottery wheels", "Kiln access by arrangement", "Aprons", "Glazing station", "Utility sink", "Display shelves"],
    overview: "A cheerful making space for pottery lessons, illustration, and hands-on community events. The worktables and washable surfaces support both messy clay work and neat finishing sessions.",
    rating: 4.7,
    reviews: [
      makeReview("Mim Akter", "Ceramic Artist", 4.8, "The tables and sinks made our beginner pottery class simple to run.", 10),
      makeReview("Raihan Kabir", "Workshop Facilitator", 4.6, "A bright, flexible room with helpful storage for materials.", 22),
      makeReview("Samia Islam", "Illustrator", 4.7, "The space felt welcoming and had a good flow for a small group.", 25),
    ],
  },
  {
    slug: "dhanmondi-canvas-craft",
    daysAgo: 29,
    title: "Canvas & Craft Studio",
    category: "Workshop",
    hourlyRate: 42,
    securityDeposit: 85,
    maxCapacity: 10,
    location: "Dhanmondi 8/A, Dhaka",
    amenities: ["Easels", "Drawing boards", "Washable tables", "Brush and tool storage", "Natural light", "Projector", "Tea counter", "Display rail"],
    overview: "An adaptable art room for painting classes, portfolio reviews, and small creative meetups. Natural light and washable surfaces keep the room comfortable for both making and presenting work.",
    rating: 4.6,
    reviews: [
      makeReview("Nabila Tasnim", "Art Educator", 4.7, "The easels were sturdy and the daylight was excellent for a weekend class.", 12),
      makeReview("Hasib Rahman", "Illustrator", 4.5, "A relaxed space with enough room to work without crowding.", 24),
    ],
  },
];

for (const studio of studios) {
  studio.image = imageUrl(`${studio.slug}-cover`);
  studio.gallery = [1, 2, 3, 4].map((number) =>
    imageUrl(`${studio.slug}-gallery-${number}`),
  );
  studio.createdAt = new Date(now - studio.daysAgo * DAY_IN_MS);
  delete studio.slug;
  delete studio.daysAgo;
}

function validateSeedStudios(seedStudios) {
  if (seedStudios.length !== 12) {
    throw new Error(`Expected 12 studio records; received ${seedStudios.length}`);
  }

  const representedCategories = new Set();
  const imageSeeds = new Set();

  for (const [index, studio] of seedStudios.entries()) {
    const requiredFields = [
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
      "ownerEmail",
      "ownerName",
      "rating",
      "reviews",
      "createdAt",
    ];

    for (const field of requiredFields) {
      if (!Object.prototype.hasOwnProperty.call(studio, field) || studio[field] === undefined) {
        throw new Error(`Studio ${index + 1} is missing required field "${field}"`);
      }
    }

    if (!CATEGORIES.includes(studio.category)) {
      throw new Error(`Studio ${index + 1} has an invalid category`);
    }
    representedCategories.add(studio.category);

    if (
      typeof studio.title !== "string" ||
      !studio.title.trim() ||
      typeof studio.location !== "string" ||
      !studio.location.trim() ||
      typeof studio.overview !== "string"
    ) {
      throw new Error(`Studio ${index + 1} has invalid text fields`);
    }
    if (
      typeof studio.hourlyRate !== "number" ||
      !Number.isFinite(studio.hourlyRate) ||
      studio.hourlyRate < 20 ||
      studio.hourlyRate > 120
    ) {
      throw new Error(`Studio ${index + 1} has an hourlyRate outside 20 to 120`);
    }
    if (
      typeof studio.securityDeposit !== "number" ||
      !Number.isFinite(studio.securityDeposit) ||
      studio.securityDeposit < 0
    ) {
      throw new Error(`Studio ${index + 1} has an invalid securityDeposit`);
    }
    if (!Number.isSafeInteger(studio.maxCapacity) || studio.maxCapacity < 1) {
      throw new Error(`Studio ${index + 1} has an invalid maxCapacity`);
    }
    if (
      typeof studio.rating !== "number" ||
      !Number.isFinite(studio.rating) ||
      studio.rating < 4.5 ||
      studio.rating > 4.9
    ) {
      throw new Error(`Studio ${index + 1} has a rating outside 4.5 to 4.9`);
    }
    if (!Array.isArray(studio.gallery) || studio.gallery.length < 4 || studio.gallery.length > 5) {
      throw new Error(`Studio ${index + 1} must have 4 to 5 gallery images`);
    }
    if (
      !Array.isArray(studio.amenities) ||
      studio.amenities.length < 6 ||
      studio.amenities.length > 10
    ) {
      throw new Error(`Studio ${index + 1} must have 6 to 10 amenities`);
    }
    if (!Array.isArray(studio.reviews) || studio.reviews.length < 2 || studio.reviews.length > 3) {
      throw new Error(`Studio ${index + 1} must have 2 to 3 reviews`);
    }

    const imageUrls = [studio.image, ...studio.gallery];
    for (const url of imageUrls) {
      if (typeof url !== "string") {
        throw new Error(`Studio ${index + 1} has an invalid image URL`);
      }
      const match = url.match(/^https:\/\/picsum\.photos\/seed\/([a-z0-9-]+)\/1200\/800$/);
      if (!match) {
        throw new Error(`Studio ${index + 1} has an invalid image URL`);
      }
      if (imageSeeds.has(match[1])) {
        throw new Error(`Duplicate image seed "${match[1]}"`);
      }
      imageSeeds.add(match[1]);
    }

    for (const review of studio.reviews) {
      if (
        !review ||
        typeof review.name !== "string" ||
        typeof review.role !== "string" ||
        typeof review.text !== "string" ||
        typeof review.rating !== "number" ||
        !Number.isFinite(review.rating) ||
        !(review.createdAt instanceof Date) ||
        Number.isNaN(review.createdAt.getTime())
      ) {
        throw new Error(`Studio ${index + 1} has an invalid review`);
      }
    }

    const sentenceCount = (studio.overview.match(/[.!?](?:\s|$)/g) || []).length;
    if (sentenceCount < 2 || sentenceCount > 3) {
      throw new Error(`Studio ${index + 1} overview must contain 2 to 3 sentences`);
    }
    if (studio.ownerEmail !== "demo@studiospace.app" || studio.ownerName !== "Maya Rahman") {
      throw new Error(`Studio ${index + 1} has incorrect owner details`);
    }
    if (!(studio.createdAt instanceof Date) || Number.isNaN(studio.createdAt.getTime())) {
      throw new Error(`Studio ${index + 1} has an invalid createdAt date`);
    }
    if (studio.createdAt < new Date(now - 30 * DAY_IN_MS) || studio.createdAt > new Date(now)) {
      throw new Error(`Studio ${index + 1} createdAt must be within the last 30 days`);
    }
  }

  if (representedCategories.size !== CATEGORIES.length) {
    throw new Error("Seed records must represent all five studio categories");
  }
}

for (const studio of studios) {
  studio.ownerEmail = "demo@studiospace.app";
  studio.ownerName = "Maya Rahman";
}

async function seedDatabase() {
  let db;
  try {
    validateSeedStudios(studios);
    db = await getDB();
    const studiosCollection = db.collection("studios");
    const existingCount = await studiosCollection.countDocuments();

    if (existingCount > 0) {
      console.error(
        `Seed stopped: the studios collection contains ${existingCount} document(s). No data was deleted or overwritten.`,
      );
      process.exitCode = 1;
      return;
    }

    await studiosCollection.insertMany(studios);
    const actualCount = await studiosCollection.countDocuments();
    if (actualCount !== studios.length) {
      throw new Error(`Expected ${studios.length} seeded studios; found ${actualCount}`);
    }

    console.log(`Inserted and verified ${actualCount} studio records.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const safeMessage = process.env.MONGODB_URI
      ? message.split(process.env.MONGODB_URI).join("[redacted MongoDB URI]")
      : message;
    console.error(`Seed failed (${error.name || "Error"}): ${safeMessage}`);
    process.exitCode = 1;
  } finally {
    if (db) {
      try {
        await db.client.close();
      } catch (error) {
        console.error("Failed to close the MongoDB connection:", error.message);
        process.exitCode = 1;
      }
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { studios, validateSeedStudios };