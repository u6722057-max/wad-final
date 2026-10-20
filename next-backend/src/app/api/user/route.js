//src/app/api/user/route.js

import { getClientPromise } from "../../../lib/mongodb";
import { hashPassword, verifyJWT } from "../../../lib/auth";
import { errorResponse, successResponse } from "../../../lib/utils";
import corsHeaders from "../../../lib/cors";
import { NextResponse } from "next/server";
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }
export async function GET(req) { try { const claims = verifyJWT(req); if (!claims) return errorResponse("Unauthorized", 401); const { ObjectId } = await import("mongodb"); const user = await (await getClientPromise()).db().collection("users").findOne({ _id: new ObjectId(claims.id) }, { projection: { password: 0 } }); return user ? successResponse({ user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role } }) : errorResponse("Unauthorized", 401); } catch { return errorResponse("Unauthorized", 401); } }
export async function POST(req) { try { const body = await req.json(); const username = typeof body.username === "string" ? body.username.trim() : "", email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""; if (!username || !/^\S+@\S+\.\S+$/.test(email) || typeof body.password !== "string" || body.password.length < 8 || !["Student","Teacher"].includes(body.role)) return errorResponse("Provide a username, valid email, password of at least 8 characters, and role", 400); const client = await getClientPromise(); const col = client.db().collection("users"); if (await col.findOne({ $or: [{ username }, { email }] })) return errorResponse("User already exists", 409); const result = await col.insertOne({ username, email, password: await hashPassword(body.password), role: body.role, createdAt: new Date() }); return successResponse({ id: result.insertedId, message: "User created" }, 201); } catch (e) { return errorResponse(e.message, 500); } }
