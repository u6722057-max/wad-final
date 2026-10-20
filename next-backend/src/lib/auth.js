import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyJWT(req) {
  try {
    if (!process.env.JWT_SECRET) return null;
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

export function signUser(user) { if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured"); return jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "1d" }); }
export async function hashPassword(password) { return bcrypt.hash(password, 10); }
export async function comparePassword(password, hash) { return bcrypt.compare(password, hash); }
