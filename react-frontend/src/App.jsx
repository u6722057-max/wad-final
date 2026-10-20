import { HashRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "./context/UserContext";

const emptyCourse = { name: "", duration: 1, topics: "", price: 0, maxStudent: 20 };

function Login() {
  const { login, request } = useContext(UserContext);
  const navigate = useNavigate();
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "Student" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      if (register) { await request("/api/user", { method: "POST", body: JSON.stringify(form) }); setRegister(false); setError("Account created. Sign in with your new account."); }
      else { await login({ username: form.username, password: form.password }); navigate("/"); }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <main className="auth-wrap"><form className="card auth" onSubmit={submit}><div className="brand-mark">OC</div><p className="eyebrow">ONLINE COURSE SERVICE</p><h1>{register ? "Create your account" : "Welcome back"}</h1><p className="muted">{register ? "Join as a student or teacher." : "Sign in to continue to your learning space."}</p>
    <label>Username<input required autoComplete="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>
    {register && <label>Email<input required type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>}
    <label>Password<input required type="password" minLength="8" autoComplete={register ? "new-password" : "current-password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
    {register && <label>Account type<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option>Student</option><option>Teacher</option></select></label>}
    <button className="primary full" disabled={busy}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button><button className="text-button full" type="button" onClick={() => { setRegister(!register); setError(""); }}>{register ? "Already have an account? Sign in" : "New here? Create an account"}</button>{error && <p className={register && error.startsWith("Account") ? "notice" : "error"}>{error}</p>}
  </form></main>;
}

function CourseForm({ course, onSave, onCancel }) {
  const [form, setForm] = useState(course ? { ...course, topics: (course.topics || []).join(", ") } : emptyCourse);
  const [error, setError] = useState("");
  const save = async event => { event.preventDefault(); setError(""); try { await onSave({ ...form, duration: Number(form.duration), price: Number(form.price), maxStudent: Number(form.maxStudent), topics: form.topics.split(",").map(topic => topic.trim()).filter(Boolean) }); } catch (e) { setError(e.message); } };
  return <form className="modal-card" onSubmit={save}><div className="modal-head"><div><p className="eyebrow">COURSE MANAGEMENT</p><h2>{course ? "Edit course" : "Create a course"}</h2></div><button className="icon-button" type="button" onClick={onCancel} aria-label="Close">×</button></div>
    <label>Course name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label><div className="form-row"><label>Duration (days)<input type="number" min="1" required value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} /></label><label>Price<input type="number" min="0" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></label></div><div className="form-row"><label>Maximum students<input type="number" min={course?.enrolled?.length || 1} required value={form.maxStudent} onChange={e => setForm({ ...form, maxStudent: e.target.value })} /></label><label>Topics <span className="muted">comma separated</span><input required value={form.topics} onChange={e => setForm({ ...form, topics: e.target.value })} placeholder="React, APIs, MongoDB" /></label></div>{error && <p className="error">{error}</p>}<div className="actions"><button className="secondary" type="button" onClick={onCancel}>Cancel</button><button className="primary">{course ? "Save changes" : "Create course"}</button></div>
  </form>;
}

function Dashboard() {
  const { user, loading, logout, request } = useContext(UserContext);
  const [courses, setCourses] = useState([]); const [enrolled, setEnrolled] = useState([]); const [query, setQuery] = useState(""); const [message, setMessage] = useState(""); const [detail, setDetail] = useState(null); const [editing, setEditing] = useState(null); const [creating, setCreating] = useState(false); const [tab, setTab] = useState("catalog");
  const load = useCallback(async () => { const data = await request(`/api/course?q=${encodeURIComponent(query)}`); setCourses(data.courses || []); }, [query, request]);
  const loadEnrolled = useCallback(async () => { if (!user || user.role !== "Student") return; const data = await request("/api/course/enrolled"); setEnrolled(data.courses || []); }, [request, user]);
  useEffect(() => { if (!user) return; let active = true; request(`/api/course?q=${encodeURIComponent(query)}`).then(data => { if (active) setCourses(data.courses || []); }).catch(e => { if (active) setMessage(e.message); }); return () => { active = false; }; }, [query, request, user]);
  useEffect(() => { if (user?.role !== "Student") return; let active = true; request("/api/course/enrolled").then(data => { if (active) setEnrolled(data.courses || []); }).catch(e => { if (active) setMessage(e.message); }); return () => { active = false; }; }, [request, user]);
  if (loading) return <div className="loading">Loading your course portal…</div>;
  if (!user) return <Navigate to="/login" replace />;
  const perform = async action => { setMessage(""); try { await action(); await load(); await loadEnrolled(); } catch (e) { setMessage(e.message); } };
  const openDetails = async course => { try { const data = await request(`/api/course/${course._id}`); setDetail(data.course); } catch (e) { setMessage(e.message); } };
  const saveCourse = async (data, existing) => { await request(existing ? `/api/course/${existing._id}` : "/api/course", { method: existing ? "PATCH" : "POST", body: JSON.stringify(data) }); setCreating(false); setEditing(null); setMessage(existing ? "Course updated." : "Course created."); await load(); };
  const visibleCourses = courses.filter(course => user.role === "Teacher" || course.status !== "Cancel");
  const enrolledIds = new Set(enrolled.map(course => course._id));
  return <div className="app-shell"><header className="topbar"><a className="wordmark" href="#/"> <span className="brand-mark small">OC</span> Course Service</a><div className="account"><span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span><span className="account-name"><b>{user.username}</b><small>{user.role}</small></span><button className="logout" onClick={() => logout()}>Sign out</button></div></header>
    <main className="dashboard"><div className="welcome"><div><p className="eyebrow">{user.role === "Teacher" ? "TEACHER WORKSPACE" : "YOUR LEARNING SPACE"}</p><h1>{user.role === "Teacher" ? "Manage your courses" : "Find your next course"}</h1><p className="muted">{user.role === "Teacher" ? "Create, update, and track your course offerings." : "Explore courses and keep your learning on track."}</p></div><div className="welcome-icon">{user.role === "Teacher" ? "✦" : "↗"}</div></div>
    {message && <div className="notice-banner"><span>{message}</span><button onClick={() => setMessage("")}>×</button></div>}
    {user.role === "Student" && <nav className="tabs"><button className={tab === "catalog" ? "active" : ""} onClick={() => setTab("catalog")}>Course catalog <span>{visibleCourses.length}</span></button><button className={tab === "enrolled" ? "active" : ""} onClick={() => setTab("enrolled")}>My courses <span>{enrolled.length}</span></button></nav>}
    <div className="toolbar"><div className="search"><span>⌕</span><input aria-label="Search courses" placeholder="Search by course or teacher" value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></div>{user.role === "Teacher" && <button className="primary" onClick={() => setCreating(true)}>＋ New course</button>}</div>
    {user.role === "Teacher" && <p className="section-label">YOUR COURSES <span>{visibleCourses.length}</span></p>}
    {user.role === "Student" && tab === "enrolled" ? <CourseGrid courses={enrolled} user={user} onDetails={openDetails} enrolledIds={enrolledIds} empty="You have not enrolled in any courses yet." /> : <CourseGrid courses={visibleCourses} user={user} onDetails={openDetails} enrolledIds={enrolledIds} onEnroll={course => perform(() => request(`/api/course/${course._id}`, { method: "POST" }))} onEdit={setEditing} onStatus={(course, status) => perform(() => request(`/api/course/${course._id}`, { method: "PATCH", body: JSON.stringify({ status }) }))} onDelete={course => { if (window.confirm(`Delete “${course.name}”?`)) perform(() => request(`/api/course/${course._id}`, { method: "DELETE" })); }} empty={user.role === "Teacher" ? "You have not created a course yet." : "No courses match your search."} />}
    </main>
    {(creating || editing || detail) && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) { setCreating(false); setEditing(null); setDetail(null); } }}>{detail ? <div className="modal-card detail-modal"><div className="modal-head"><div><p className="eyebrow">COURSE DETAILS</p><h2>{detail.name}</h2></div><button className="icon-button" onClick={() => setDetail(null)}>×</button></div><div className="detail-stats"><div><small>Teacher</small><b>{detail.teacherName}</b></div><div><small>Duration</small><b>{detail.duration} days</b></div><div><small>Price</small><b>{Number(detail.price) === 0 ? "Free" : `$${detail.price}`}</b></div><div><small>Enrollment</small><b>{detail.enrolled?.length || 0} / {detail.maxStudent}</b></div></div><p className="section-label">TOPICS</p><div className="chips">{(detail.topics || []).map(topic => <span className="chip" key={topic}>{topic}</span>)}</div>{user.role === "Teacher" && <><p className="section-label roster-title">ENROLLED STUDENTS <span>{detail.enrolled?.length || 0}</span></p>{detail.enrolled?.length ? <ul className="roster">{detail.enrolled.map(student => <li key={student.userId}><span className="avatar">{student.username.slice(0, 1).toUpperCase()}</span><span>{student.username}</span><small>{new Date(student.enrolledAt).toLocaleDateString()}</small></li>)}</ul> : <p className="muted">No students enrolled yet.</p>}</>}</div> : <CourseForm key={editing?._id || "new"} course={editing} onSave={data => saveCourse(data, editing)} onCancel={() => { setCreating(false); setEditing(null); }} />}</div>}
  </div>;
}

function CourseGrid({ courses, user, onDetails, enrolledIds, onEnroll, onEdit, onStatus, onDelete, empty }) {
  if (!courses.length) return <div className="empty-state"><div>▧</div><h2>Nothing to show yet</h2><p>{empty}</p></div>;
  return <section className="course-grid">{courses.map(course => { const count = course.enrolled?.length || 0; const full = count >= Number(course.maxStudent); const already = enrolledIds.has(course._id); return <article className="course-card" key={course._id}><div className="course-card-top"><span className={`course-symbol symbol-${(course._id || "0").slice(-1)}`}>{(course.name || "C").slice(0, 1).toUpperCase()}</span><span className={`status status-${(course.status || "Open").toLowerCase()}`}>{course.status}</span></div><button className="course-title" onClick={() => onDetails(course)}>{course.name}</button><p className="teacher-line">By <b>{course.teacherName}</b></p><div className="chips">{(course.topics || []).slice(0, 3).map(topic => <span className="chip" key={topic}>{topic}</span>)}</div><div className="course-meta"><span>◷ {course.duration} days</span><span>{Number(course.price) === 0 ? "Free" : `$${course.price}`}</span></div><div className="capacity"><div className="capacity-label"><span>{count} enrolled</span><span>{course.maxStudent} seats</span></div><div className="progress"><i style={{ width: `${Math.min(100, course.maxStudent ? count / course.maxStudent * 100 : 0)}%` }} /></div></div><div className="card-actions"><button className="secondary" onClick={() => onDetails(course)}>Details</button>{user.role === "Student" ? <button className="primary" disabled={course.status !== "Open" || full || already} onClick={() => onEnroll(course)}>{already ? "Enrolled" : full ? "Full" : course.status === "Open" ? "Enroll" : "Closed"}</button> : <><button className="secondary" onClick={() => onEdit(course)}>Edit</button><select aria-label={`Change ${course.name} status`} value={course.status} onChange={e => onStatus(course, e.target.value)}><option>Open</option><option>Close</option><option>Cancel</option></select>{count === 0 && <button className="danger" onClick={() => onDelete(course)} aria-label={`Delete ${course.name}`}>Delete</button>}</>}</div></article>; })}</section>;
}

export default function App() { return <HashRouter><Routes><Route path="/login" element={<Login />} /><Route path="/" element={<Dashboard />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></HashRouter>; }
