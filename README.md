# StudioSpace Server

StudioSpace Server is the Express and MongoDB REST API for StudioSpace, a platform for discovering creative studios, managing studio listings, booking time slots, and saving studios to a wishlist.

Live URL: [Add the deployed API URL here]

## Features

- Public studio browsing, featured studios, category counts, and studio details.
- Authenticated studio creation and owner-only listing updates and deletion.
- Studio reviews with server-derived reviewer identity.
- Booking creation, availability lookup, owner and host booking lists, and booking status management.
- Confirmed-booking overlap checks to prevent conflicting reservations.
- Authenticated wishlist listing and toggle endpoints with duplicate protection.
- Central JSON error responses and MongoDB indexes initialized at startup.

## Technology

- Node.js (20.19 or later, required by the MongoDB driver)
- Express 5
- MongoDB native Node.js driver
- JSON Web Tokens and `cookie-parser`
- `cors` and `dotenv`
- `nodemon` for local development

## Project structure

```text
studiospace-server/
├── scripts/
│   └── seed.js
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── bookingController.js
│   │   ├── studioController.js
│   │   └── wishlistController.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── verifyJWT.js
│   ├── routes/
│   │   ├── bookings.js
│   │   ├── studios.js
│   │   └── wishlist.js
│   ├── utils/
│   │   ├── overlap.js
│   │   └── time.js
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Environment variables

Copy `.env.example` to `.env` and set values for your environment. Do not commit `.env`.

| Variable | Purpose |
| --- | --- |
| `PORT` | Port for the HTTP server. Defaults to `5000` when unset; Render provides this automatically. |
| `MONGODB_URI` | MongoDB connection URI. The server uses the `studiospace` database. |
| `JWT_SECRET` | Secret used to verify signed JWTs. Use a long, unique, random value outside local development. |
| `CLIENT_URL` | Exact web-client origin allowed by CORS, for example `http://localhost:3000`. |

Protected routes read a signed token from the `token` cookie. This API does not provide a login route or issue that cookie. The trusted authentication component that sets it must use `httpOnly`, `secure` in production, `sameSite: "lax"`, and `path: "/"`. Browser clients making credentialed requests must send cookies.

## Installation and local development

Requirements: Node.js 20.19 or later and access to a MongoDB deployment.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env`, then configure `MONGODB_URI` and `JWT_SECRET`. For local development, set `CLIENT_URL` to the client origin and choose whether to enable the development-only auth bypass.

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Check the API at `http://localhost:5000/`. It responds with `StudioSpace API running`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with Nodemon. |
| `npm start` | Start the API with Node.js. |
| `npm run seed` | Insert the 12 sample studios if and only if the studios collection is empty. The script refuses to overwrite an existing studio collection. |

## Database setup

Create a MongoDB database deployment, create a database user with read/write access, and allow the server environment to connect to it. Put the deployment URI in `MONGODB_URI`; do not include it in source control or public logs. The application connects to the database named `studiospace` and creates the wishlist uniqueness, booking lookup, and studio creation-time indexes during startup.

To load the sample studios, run `npm run seed` after configuring the environment. The seed script only inserts when the studios collection is empty; it will not delete or overwrite existing studio records.

## API

All error responses use JSON in the form `{ "message": "..." }`. Protected endpoints require the `token` JWT cookie unless the local development bypass is enabled.

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/` | No | API health check. |
| `GET` | `/api/studios` | No | List studios; supports pagination, category, search, price-range, and sorting query parameters. |
| `GET` | `/api/studios/featured` | No | Get featured studios. |
| `GET` | `/api/studios/stats/categories` | No | Get studio counts by category. |
| `GET` | `/api/studios/:id` | No | Get a studio by MongoDB ID. |
| `GET` | `/api/studios/mine/list` | Yes | List studios owned by the authenticated user. |
| `POST` | `/api/studios` | Yes | Create a studio owned by the authenticated user. |
| `PUT` | `/api/studios/:id` | Yes | Update a studio owned by the authenticated user. |
| `DELETE` | `/api/studios/:id` | Yes | Delete a studio owned by the authenticated user. |
| `POST` | `/api/studios/:id/reviews` | Yes | Add a review using the authenticated user's identity. |
| `POST` | `/api/bookings` | Yes | Create a pending booking for a studio and time slot. |
| `GET` | `/api/bookings/mine` | Yes | List the authenticated user's bookings. |
| `GET` | `/api/bookings/host` | Yes | List bookings for studios owned by the authenticated user. |
| `GET` | `/api/bookings/availability` | No | List confirmed time ranges for a studio and date. |
| `PATCH` | `/api/bookings/:id/cancel` | Yes | Cancel the authenticated user's pending booking. |
| `PATCH` | `/api/bookings/:id/status` | Yes | Let the host confirm, cancel, or complete a booking according to allowed transitions. |
| `GET` | `/api/wishlist` | Yes | List the authenticated user's saved studio records. |
| `GET` | `/api/wishlist/ids` | Yes | List the authenticated user's saved studio IDs. |
| `POST` | `/api/wishlist/:studioId` | Yes | Toggle a studio in or out of the authenticated user's wishlist. |

## Deploying to Render

1. Create a Render **Web Service** connected to the server repository.
2. Set the build command to `npm install`.
3. Set the start command to `npm start`.
4. Add these environment variables in the Render service settings:
   - `MONGODB_URI`: the deployment's private MongoDB URI.
   - `JWT_SECRET`: a strong, unique secret.
   - `CLIENT_URL`: the deployed web-client origin.
   - `PORT`: normally omit this on Render; Render supplies it.
5. Configure the MongoDB provider's network access to permit connections from the deployed service, using the provider's recommended secure configuration.
6. Deploy and verify the service root URL returns `StudioSpace API running`.

Do not put credentials, database URIs, JWT secrets, or other private values in this README, source files, or client-visible configuration.
