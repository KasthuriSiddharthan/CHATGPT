import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ msg: "No token provided" });
    }

    const token = header.split(" ")[1];
    if (!token) {
      return res.status(401).json({ msg: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
     req.user = { _id: decoded.id };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ msg: "Unauthorized" });
  }
}
