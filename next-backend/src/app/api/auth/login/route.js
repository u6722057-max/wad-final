//src/app/api/auth/login/route.js

import { getClientPromise } from "../../../../lib/mongodb";
import { comparePassword, signUser } from "../../../../lib/auth";
import { errorResponse, successResponse } from "../../../../lib/utils";
import corsHeaders from "../../../../lib/cors";
import { NextResponse } from "next/server";

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }
import { stringifySetCookie } from "cookie";

export async function POST(req) {
  try { const { username, email, password } = await req.json(); if (typeof password !== "string" || !(username || email)) return errorResponse("Username or email and password are required", 400); const client = await getClientPromise(); const login = String(username || email).trim(); const user = await client.db().collection("users").findOne({ $or: [{ username: login }, { email: login.toLowerCase() }] });
    if (!user || !(await comparePassword(password, user.password))) return errorResponse("Invalid credentials", 401);
    const token = signUser(user); const crossSite = process.env.COOKIE_CROSS_SITE === "true"; return successResponse({ user: { id: user._id, username: user.username, email: user.email, role: user.role } }, 200, { "Set-Cookie": stringifySetCookie({ name: "token", value: token, httpOnly: true, sameSite: crossSite ? "none" : "lax", secure: process.env.NODE_ENV === "production" || crossSite, maxAge: 86400, path: "/" }) });
  } catch (e) { return errorResponse(e.message, 500); }
}
