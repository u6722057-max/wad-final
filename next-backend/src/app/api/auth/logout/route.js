//src/app/api/auth/logout/route.js

import { NextResponse } from "next/server";
import { stringifySetCookie } from "cookie";
import corsHeaders from "../../../../lib/cors";
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }
export async function POST() { const crossSite = process.env.COOKIE_CROSS_SITE === "true"; return new NextResponse(JSON.stringify({ message: "Logged out" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json", "Set-Cookie": stringifySetCookie({ name: "token", value: "", httpOnly: true, sameSite: crossSite ? "none" : "lax", secure: process.env.NODE_ENV === "production" || crossSite, maxAge: 0, path: "/" }) } }); }
