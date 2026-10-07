const jwt = require("jsonwebtoken");

let io;

// Every event below is relayed room-to-room, where each user's personal
// room is named by their Mongo user id (joined automatically once the
// socket authenticates — see the connection handler). `fromUserId` is
// always taken from the authenticated socket, never trusted from the
// client payload, so one user can't spoof call/chat events as someone else.
const CALL_RELAY_EVENTS = {
  "call:invite": "call:incoming", // { toUserId, conversationId, callType } -> { fromUserId, conversationId, callType }
  "call:accept": "call:accepted", // { toUserId, conversationId } -> { fromUserId, conversationId }
  "call:reject": "call:rejected", // { toUserId, conversationId, reason? } -> { fromUserId, conversationId, reason? }
  "call:offer": "call:offer", // { toUserId, sdp } -> { fromUserId, sdp }
  "call:answer": "call:answer", // { toUserId, sdp } -> { fromUserId, sdp }
  "call:ice-candidate": "call:ice-candidate", // { toUserId, candidate } -> { fromUserId, candidate }
  "call:end": "call:ended", // { toUserId, conversationId } -> { fromUserId, conversationId }
};

const initializeSocket = (server) => {
  const { Server } = require("socket.io");

  // Same origin rule as the REST API (see app.js) rather than "*" — these
  // sockets carry private notifications, so they shouldn't be openable from
  // any page on the internet. Local dev stays allowed; production domains
  // come from CLIENT_URL.
  const allowedOrigins = [
    "http://localhost:5173",
    ...(process.env.CLIENT_URL || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // No Origin header = a non-browser client (mobile app, curl); the JWT
        // check below is what actually guards the connection.
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 User Connected:", socket.id);

    // Preferred: the client connects with `io(URL, { auth: { token } })`
    // using its normal access token. We verify it once here and auto-join
    // the user's personal room, so chat/call events can trust socket.userId.
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.join(String(decoded.id));
      } catch {
        // Invalid/expired token — fall back to the manual "join" event below
        // rather than dropping the connection outright.
      }
    }

    // Back-compat manual join (also acts as the fallback when no auth token
    // was supplied on connect).
    socket.on("join", (userId) => {
      if (!userId) return;
      socket.userId = socket.userId || userId;
      socket.join(String(userId));
      console.log(`✅ User ${userId} joined room`);
    });

    Object.entries(CALL_RELAY_EVENTS).forEach(([incomingEvent, outgoingEvent]) => {
      socket.on(incomingEvent, (payload = {}) => {
        if (!socket.userId || !payload.toUserId) return;
        io.to(String(payload.toUserId)).emit(outgoingEvent, {
          ...payload,
          toUserId: undefined,
          fromUserId: socket.userId,
        });
      });
    });

    socket.on("disconnect", () => {
      console.log("🔴 User Disconnected:", socket.id);
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};