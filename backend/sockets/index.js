import jwt from "jsonwebtoken";

// Keeps a map of userId -> Set of socket ids, so the reminder scheduler can
// push a "ring" event straight to that user's open browser tab(s) in real time.
const userSockets = new Map();

function initSocket(io) {
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

function emitToUser(io, userId, event, payload) {
  const ids = userSockets.get(String(userId));
  if (!ids || ids.size === 0) return false;
  ids.forEach((sid) => io.to(sid).emit(event, payload));
  return true;
}

export { initSocket, emitToUser };
