import jwt from "jsonwebtoken";

// Keeps a map of userId -> Set of socket ids, so the reminder scheduler can
// push a "ring" event straight to that user's open browser tab(s) in real time.
const userSockets = new Map();

// Store the io instance so other modules can emit without needing the io
// reference forwarded everywhere (helpers may call emitToUser(userId, ...)).
let ioInstance = null;

function initSocket(io) {
  ioInstance = io;
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No auth token"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);

    socket.on("disconnect", () => {
      userSockets.get(uid)?.delete(socket.id);
    });
  });
}

function emitToUser(ioOrUserId, maybeUserId, event, payload) {
  // Flexible signature:
  // - emitToUser(io, userId, event, payload) (existing usage)
  // - emitToUser(userId, event, payload) (convenience: uses stored io instance)

  let io = null;
  let userId = null;
  if (ioOrUserId && typeof ioOrUserId === "object" && typeof ioOrUserId.to === "function") {
    // first arg is io
    io = ioOrUserId;
    userId = maybeUserId;
  } else {
    // first arg is userId, use stored ioInstance
    io = ioInstance;
    userId = ioOrUserId;
    // shift parameters when called as (userId, event, payload)
    event = maybeUserId;
    payload = event === undefined ? payload : payload; // keep shape; actual values passed in by caller
  }

  if (!io) return false;

  // Accept either a user id string/ObjectId or a populated user object
  let uid = userId;
  if (uid && typeof uid === "object") {
    uid = uid._id || uid.id || uid.toString();
  }
  const ids = userSockets.get(String(uid));
  if (!ids || ids.size === 0) return false;
  ids.forEach((sid) => io.to(sid).emit(event, payload));
  return true;
}

export { initSocket, emitToUser };
