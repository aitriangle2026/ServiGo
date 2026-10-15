/**
 * One-off: drops the `user_1_provider_1` unique index left on `favorites` by
 * an older schema that used `user` instead of `customer`.
 *
 * No current document has a `user` field, so that index saw every favorite
 * as { user: null, provider: <id or null> }. Once one service favorite existed
 * anywhere, every further one collided on { null, null } and was rejected —
 * for every customer.
 *
 * Safe to re-run; it only touches that one index. Run against each database
 * (dev, production) once:
 *
 *   node scripts/drop-stale-favorite-index.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const STALE_INDEX = "user_1_provider_1";

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const favorites = mongoose.connection.collection("favorites");

  const names = (await favorites.indexes()).map((index) => index.name);
  if (names.includes(STALE_INDEX)) {
    await favorites.dropIndex(STALE_INDEX);
    console.log(`Dropped ${STALE_INDEX}.`);
  } else {
    console.log(`${STALE_INDEX} not present — nothing to do.`);
  }

  // Build the indexes the current schema declares (see models/Favorite.js).
  await require("../src/models/Favorite").syncIndexes();
  console.log("Indexes now:", (await favorites.indexes()).map((index) => index.name).join(", "));

  await mongoose.disconnect();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
