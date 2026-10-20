import { ObjectId } from "mongodb";
import { getClientPromise } from "../../../../lib/mongodb";
import { verifyJWT } from "../../../../lib/auth";
import { errorResponse, successResponse } from "../../../../lib/utils";
import corsHeaders from "../../../../lib/cors";
import { NextResponse } from "next/server";

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }
export async function GET(req) {
  try {
    const claims = verifyJWT(req);
    if (!claims) return errorResponse("Unauthorized", 401);
    const db = (await getClientPromise()).db();
    const user = await db.collection("users").findOne({ _id: new ObjectId(claims.id) });
    if (!user) return errorResponse("Unauthorized", 401);
    if (user.role !== "Student") return errorResponse("Student access required", 403);
    const courses = await db.collection("courses").find({ "enrolled.userId": user._id.toString(), status: { $ne: "Cancel" } }).sort({ createdAt: -1 }).toArray();
    return successResponse({ courses });
  } catch (e) { return errorResponse(e.message, 500); }
}
