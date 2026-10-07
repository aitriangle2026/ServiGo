const dns = require("dns");
const mongoose = require("mongoose");

// Atlas connections over home wifi drop sometimes — that's normal, not a
// sign anything is broken. The old version treated the very first
// connection error as fatal (process.exit(1)), so a single blip killed the
// whole backend and needed a manual restart every time. This retries a
// few times with a short delay before giving up, and — once connected —
// logs rather than crashes if the connection drops later, since mongoose's
// own driver reconnects automatically in the background.
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

// Fallback resolvers, used ONLY when the network's own DNS can't answer the
// SRV query. This used to be set unconditionally at module load, which
// broke the opposite case: university/office/hotel wifi typically blocks
// outbound port 53 to anything but its own resolver, so forcing public DNS
// there made every lookup fail with
//   querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net
// Trying the system resolver first and only falling back covers both kinds
// of network instead of trading one for the other.
const FALLBACK_DNS = ["8.8.8.8", "8.8.4.4", "1.1.1.1"];

// A "mongodb+srv://" URI can't be used until an SRV record resolves, so DNS
// failures surface as connection errors that look like Atlas is down when
// it isn't. Returns the hostname for +srv URIs, or null for the plain
// "mongodb://" form (which needs no SRV lookup at all).
const getSrvHost = (uri) => {
  if (!uri || !uri.startsWith("mongodb+srv://")) return null;

  try {
    // The URL parser needs a scheme it recognises; the host is all we want.
    return new URL(uri.replace("mongodb+srv://", "https://")).hostname || null;
  } catch {
    return null;
  }
};

/**
 * Makes sure the cluster's SRV record can actually be resolved before
 * handing the URI to mongoose, switching Node to public DNS only if the
 * network's own resolver can't do it.
 *
 * Never throws — if neither resolver works we still let mongoose try, so
 * the driver reports the real failure rather than this helper masking it.
 */
const ensureSrvResolvable = async (uri) => {
  const host = getSrvHost(uri);
  if (!host) return;

  const record = `_mongodb._tcp.${host}`;

  try {
    await dns.promises.resolveSrv(record);
    return; // The network's own DNS is fine — leave it alone.
  } catch (systemDnsError) {
    console.warn(
      `⚠️  This network's DNS couldn't resolve ${record} (${systemDnsError.code || systemDnsError.message}). Trying public DNS...`
    );
  }

  const originalServers = dns.getServers();
  try {
    dns.setServers(FALLBACK_DNS);
    await dns.promises.resolveSrv(record);
    console.log("✅ Resolved via public DNS — using it for this session.");
  } catch (fallbackError) {
    // Put the system resolver back: on a network that blocks external DNS,
    // leaving Node pointed at 8.8.8.8 would break every other lookup too.
    dns.setServers(originalServers);
    console.error(
      `❌ Public DNS failed as well (${fallbackError.code || fallbackError.message}). This network is likely blocking DNS lookups for MongoDB.`
    );
    console.error(
      "   Try a phone hotspot, or switch MONGODB_URI to the non-SRV \"mongodb://host1,host2,host3/...\" form from Atlas → Connect, which needs no SRV lookup."
    );
  }
};

const connectWithRetry = async (attempt = 1) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected Successfully");
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
    if (attempt >= MAX_RETRIES) {
      console.error(
        "❌ Giving up after multiple attempts. Double-check MONGODB_URI in your .env, and that your current IP is allowed in Atlas → Network Access."
      );
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectWithRetry(attempt + 1);
  }
};

const connectDB = async () => {
  // Tracks whether we've ever been connected. Without this, a failed *first*
  // attempt also fires "disconnected", so the logs showed a reconnect
  // warning before the error explaining what actually went wrong.
  let hasConnectedOnce = false;

  // Once the initial connection succeeds, don't crash the process on a
  // later blip — log it and let mongoose reconnect on its own.
  mongoose.connection.on("disconnected", () => {
    if (!hasConnectedOnce) return;
    console.warn("⚠️  MongoDB disconnected — reconnecting automatically...");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("✅ MongoDB reconnected.");
  });
  mongoose.connection.on("error", (err) => {
    if (!hasConnectedOnce) return; // connectWithRetry already reports these
    console.error("❌ MongoDB connection error:", err.message);
  });

  await ensureSrvResolvable(process.env.MONGODB_URI);
  hasConnectedOnce = await connectWithRetry();
};

module.exports = connectDB;
