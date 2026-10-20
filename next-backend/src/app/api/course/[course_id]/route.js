import { ObjectId } from "mongodb";
import { getClientPromise } from "../../../../lib/mongodb";
import { verifyJWT } from "../../../../lib/auth";
import { errorResponse, successResponse } from "../../../../lib/utils";
import corsHeaders from "../../../../lib/cors";
import { NextResponse } from "next/server";

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }

async function getContext(req, params) {
  const claims = verifyJWT(req);
  if (!claims) return { error: errorResponse("Unauthorized", 401) };
  const { course_id } = await params;
  if (!ObjectId.isValid(course_id)) return { error: errorResponse("Invalid course id", 400) };
  const db = (await getClientPromise()).db();
  const [user, course] = await Promise.all([
    db.collection("users").findOne({ _id: new ObjectId(claims.id) }),
    db.collection("courses").findOne({ _id: new ObjectId(course_id) }),
  ]);
  if (!user) return { error: errorResponse("Unauthorized", 401) };
  if (!course) return { error: errorResponse("Course not found", 404) };
  return { db, user, course };
}

export async function GET(req, context) {
  try {
    const result = await getContext(req, context.params);
    if (result.error) return result.error;
    const { user, course } = result;
    if (course.status === "Cancel" && (user.role !== "Teacher" || course.teacherId !== user._id.toString())) return errorResponse("Course not found", 404);
    if (user.role === "Teacher" && course.teacherId !== user._id.toString()) return errorResponse("Forbidden", 403);
    return successResponse({ course });
  } catch (e) { return errorResponse(e.message, 500); }
}

export async function PATCH(req, context) {
  try {
    const result = await getContext(req, context.params);
    if (result.error) return result.error;
    const { db, user, course } = result;
    if (user.role !== "Teacher" || course.teacherId !== user._id.toString()) return errorResponse("Forbidden", 403);
    const body = await req.json();
    const allowed = {};
    if (body.name !== undefined) { if (typeof body.name !== "string" || !body.name.trim()) return errorResponse("Course name is required", 400); allowed.name = body.name.trim(); }
    if (body.duration !== undefined) { const n = Number(body.duration); if (!Number.isFinite(n) || n < 1) return errorResponse("Duration must be positive", 400); allowed.duration = n; }
    if (body.price !== undefined) { const n = Number(body.price); if (!Number.isFinite(n) || n < 0) return errorResponse("Price must be zero or greater", 400); allowed.price = n; }
    if (body.maxStudent !== undefined) { const n = Number(body.maxStudent); if (!Number.isInteger(n) || n < course.enrolled?.length || n < 1) return errorResponse("Capacity cannot be below current enrollment", 400); allowed.maxStudent = n; }
    if (body.topics !== undefined) { const topics = Array.isArray(body.topics) ? body.topics : typeof body.topics === "string" ? body.topics.split(",") : null; if (!topics) return errorResponse("Topics must be a list", 400); allowed.topics = topics.map(String).map(x => x.trim()).filter(Boolean); if (!allowed.topics.length) return errorResponse("At least one topic is required", 400); }
    if (body.status !== undefined) { if (!["Open", "Close", "Cancel"].includes(body.status)) return errorResponse("Invalid course status", 400); allowed.status = body.status; }
    if (!Object.keys(allowed).length) return errorResponse("No valid course fields provided", 400);
    await db.collection("courses").updateOne({ _id: course._id, teacherId: user._id.toString() }, { $set: allowed });
    return successResponse({ message: "Course updated" });
  } catch (e) { return errorResponse(e.message, 500); }
}

export async function DELETE(req, context) {
  try {
    const result = await getContext(req, context.params);
    if (result.error) return result.error;
    const { db, user, course } = result;
    if (user.role !== "Teacher" || course.teacherId !== user._id.toString()) return errorResponse("Forbidden", 403);
    if (course.enrolled?.length) return errorResponse("Courses with enrolled students cannot be deleted", 409);
    await db.collection("courses").deleteOne({ _id: course._id, teacherId: user._id.toString(), $or: [{ enrolled: { $exists: false } }, { enrolled: { $size: 0 } }] });
    return successResponse({ message: "Course deleted" });
  } catch (e) { return errorResponse(e.message, 500); }
}

export async function POST(req, context) {
  try {
    const result = await getContext(req, context.params);
    if (result.error) return result.error;
    const { db, user, course } = result;
    if (user.role !== "Student") return errorResponse("Student access required", 403);
    if (course.status !== "Open") return errorResponse("Course is not open for enrollment", 409);
    if (course.enrolled?.some(entry => entry.userId === user._id.toString())) return errorResponse("Already enrolled", 409);
    const enrolled = { userId: user._id.toString(), username: user.username, enrolledAt: new Date() };
    const update = await db.collection("courses").updateOne(
      { _id: course._id, status: "Open", "enrolled.userId": { $ne: user._id.toString() }, $expr: { $lt: [{ $size: { $ifNull: ["$enrolled", []] } }, { $toInt: "$maxStudent" }] } },
      { $push: { enrolled } },
    );
    if (!update.modifiedCount) return errorResponse("Course is full or enrollment has already changed", 409);
    return successResponse({ message: "Enrolled" }, 201);
  } catch (e) { return errorResponse(e.message, 500); }
}
