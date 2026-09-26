# Heritage Explorer

Heritage Explorer is a React Native app and Express API for discovering Indian heritage sites, building saved trails, and tracking favourites and visits. Experiments 11–12 move all account, site, favourite, trail, and visited-site CRUD to MongoDB through a JWT-protected REST API.

## Installation

Install the React Native app dependencies from the project root:

```bash
npm install
```

Install API dependencies:

```bash
cd backend
npm install
```

## Environment setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGO_URI` to a local MongoDB or MongoDB Atlas connection string.
3. Set a long, private `JWT_SECRET`.
4. Set `PORT` if 5000 is already in use.
5. `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are development seed credentials; change them before using a shared database.

Never commit `.env`. It is ignored by Git.

The mobile API address is configured once in `src/config/api.js`:

- Android emulator uses `http://10.0.2.2:5000/api`.
- iOS simulator uses `http://localhost:5000/api`.
- On a physical Android device, replace `10.0.2.2:5000` in that file with the development PC’s LAN address, such as `192.168.1.20:5000`. Do not use `localhost` on a phone.

## Database setup

Start MongoDB, then seed the database from `backend/`:

```bash
npm run seed
```

The idempotent seed command creates/updates the heritage sites and a development admin user. It logs `MongoDB connected successfully` and does not duplicate sites when rerun.

In MongoDB Compass, connect using the same `MONGO_URI` and open the `heritage_explorer` database (or the database named in your URI).

## Run the app

Start the backend in one terminal:

```bash
cd backend
npm start
```

Start Metro from the project root in another terminal:

```bash
npm start
```

Run Android:

```bash
npm run android
```

For iOS, install pods in `ios/` first if required, then run `npm run ios`.

## Experiments 11–12 implementation

- Mongoose models persist `users`, `heritagesites`, `favourites`, `trails`, and `visitedsites`.
- Passwords are bcrypt hashes; login returns a seven-day JWT containing the user role.
- Protected APIs identify the owner from the JWT, not a client-supplied user ID.
- Unique compound indexes prevent duplicate favourites and duplicate visited records.
- Stable string site IDs (such as `taj-mahal`) and latitude/longitude fields are retained for current detail, map, favourite, trail, and visited UI compatibility.
- Admin-only heritage-site creation, editing, and deletion are enforced by both role middleware and an admin mobile screen.
- The existing tab/stack UI remains in use. Profile, favourites, trails, visited sites, and admin actions refresh from the REST API after a mutation.

## API documentation

Protected calls require `Authorization: Bearer <token>`.

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register and receive JWT |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/users/profile` | User | Get current profile |
| PUT | `/api/users/profile` | User | Update current profile |
| POST | `/api/favourites` | User | Add favourite (`siteId`) |
| GET | `/api/favourites` | User | List current user favourites |
| DELETE | `/api/favourites/:siteId` | User | Remove favourite |
| POST | `/api/trails` | User | Create ordered trail |
| GET | `/api/trails` | User | List current user trails |
| GET | `/api/trails/:id` | User | Get one owned trail |
| PUT | `/api/trails/:id` | User | Update owned trail |
| DELETE | `/api/trails/:id` | User | Delete owned trail |
| POST | `/api/visitedsites` | User | Mark site visited |
| GET | `/api/visitedsites` | User | List visited sites |
| DELETE | `/api/visitedsites/:siteId` | User | Unmark visited |
| GET | `/api/heritagesites` | Public | List heritage sites |
| GET | `/api/heritagesites/:id` | Public | Get site by stable ID |
| POST | `/api/heritagesites` | Admin | Create heritage site |
| PUT | `/api/heritagesites/:id` | Admin | Update heritage site |
| DELETE | `/api/heritagesites/:id` | Admin | Delete heritage site |

`/api/heritage-sites` and `/api/visited-sites` are retained as compatibility aliases for the existing app path style; new frontend code uses the documented paths.

## Lab demonstration checklist

1. Start MongoDB, seed it, and start the API. Confirm the server prints `MongoDB connected successfully`.
2. Register a new user. Confirm a successful alert and automatic transition to the main tabs.
3. Edit the profile and save it; reload the app to confirm the latest server profile remains.
4. Open a site, add/remove it from favourites, and open the Favourites tab to confirm the refreshed list.
5. Mark a site visited, open Profile → View visited sites, then unmark it.
6. On Trail, generate/select a draft, use the arrows to alter order, save it, edit it, and delete it.
7. Log in with the development admin email/password configured in `backend/.env`, open Profile → Manage heritage sites, and add, edit, then delete a test site.
8. Use a normal user token in Postman to call an admin endpoint and confirm the `403` JSON response.
9. Try favouriting or marking the same site twice and confirm the `409` JSON response.
10. Use the detail page’s View on Map action to verify latitude/longitude links still open correctly.

## MongoDB Compass checklist

Open the database named by `MONGO_URI` and capture these collections:

- `users`: seeded admin and registered users. `password` is a bcrypt hash, never plaintext; admin has `role: "admin"`.
- `heritagesites`: seeded Indian sites with `siteId`, location/state, images, `latitude`, `longitude`, and `coordinates`.
- `favourites`: a user/site relation with one record per `userId` + `siteId`.
- `trails`: owned trails with `trailName`, `description`, and an ordered `siteIds` array.
- `visitedsites`: user/site relation with a `visitedAt` date and no duplicate user/site pair.

## Verification notes

`node --check` was run on all backend JavaScript files and `npm run lint` completed successfully. A live API/seed run requires a reachable MongoDB URI, which is intentionally not stored in this repository.
