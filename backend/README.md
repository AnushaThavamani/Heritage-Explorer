# Heritage Explorer API

## Setup

1. Install MongoDB locally or create a MongoDB Atlas database.
2. In `backend/`, run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`.
4. Run `npm run seed`, then `npm start` (the API defaults to `http://localhost:5000`).

All protected requests use `Authorization: Bearer <token>`. Registration returns a token, so its response can be used directly for testing. IDs in site requests use the seeded string IDs such as `taj-mahal`; user IDs are MongoDB ObjectIds.

## Endpoints

- `POST /api/auth/register` body `{ "name": "Asha Rao", "email": "asha@example.com", "password": "secret123" }` -> `201 { "token": "...", "user": { "id": "...", "name": "Asha Rao", "email": "asha@example.com" } }`
- `POST /api/auth/login` body `{ "email": "asha@example.com", "password": "secret123" }` -> `200 { "token": "...", "user": { "id": "...", "name": "Asha Rao", "email": "asha@example.com" } }`
- `GET /api/heritage-sites` -> `200 [{ "siteId": "taj-mahal", "name": "Taj Mahal", "location": "Agra, Uttar Pradesh", "image": "...", "visitorTimings": "Sunrise - Sunset (closed Fridays)", "description": "...", "category": "UNESCO Sites" }]`
- `GET /api/heritage-sites/:id` -> one heritage site or `404`.
- `POST /api/favourites` body `{ "userId": "USER_ID", "siteId": "taj-mahal" }` -> `201` favourite.
- `GET /api/favourites/:userId` -> `200 [{ "userId": "...", "siteId": "taj-mahal" }]`.
- `DELETE /api/favourites/:userId/:siteId` -> `204`.
- `POST /api/trails` body `{ "userId": "USER_ID", "trailName": "Golden Triangle", "siteIds": ["taj-mahal", "qutb-minar"] }` -> `201` trail.
- `GET /api/trails/:userId` -> saved trails.
- `PUT /api/trails/:trailId` body `{ "trailName": "Updated trail", "siteIds": ["hampi"] }` -> updated trail.
- `DELETE /api/trails/:trailId` -> `204`.
- `POST /api/quiz-scores` body `{ "userId": "USER_ID", "quizId": "india-heritage", "score": 8, "dateTaken": "2026-09-18T00:00:00.000Z" }` -> `201` score.
- `GET /api/quiz-scores/:userId` -> score history.
- `POST /api/visited-sites` body `{ "userId": "USER_ID", "siteId": "taj-mahal" }` -> `201` visited site.
- `GET /api/visited-sites/:userId` -> visited sites.
- `GET /api/health` -> `{ "status": "ok" }`.

Validation failures return `400`, missing/invalid tokens return `401`, ownership failures return `403`, duplicates return `409`, and missing resources return `404`.
