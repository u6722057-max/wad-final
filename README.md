# wad-final

# Online Course Service

Course management portal with a Next.js API, React/Vite frontend, and MongoDB. The API enforces login, role permissions, course ownership, enrollment status, duplicate enrollment, and course capacity.

## Requirements

- Node.js 20 or newer
- MongoDB connection string (local MongoDB or MongoDB Atlas)

## Configure and run

1. Create `next-backend/.env.local`:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/course_service
   JWT_SECRET=replace-with-a-long-random-secret
   FRONTEND_ORIGIN=http://localhost:5173
   COOKIE_CROSS_SITE=false
   ```

   For deployment, set `FRONTEND_ORIGIN` to the deployed frontend origin and set the same `MONGODB_URI` and a private `JWT_SECRET` in the backend host environment. If frontend and API are on different site domains, set `COOKIE_CROSS_SITE=true`; production cross-site cookies require HTTPS.

2. Start the API:

   ```sh
   cd next-backend
   npm install
   npm run dev
   ```

3. In another terminal, create `react-frontend/.env`:

   ```env
   VITE_API_URL=http://localhost:3000
   ```

   Then run:

   ```sh
   cd react-frontend
   npm install
   npm run dev
   ```

4. Open the Vite URL (normally `http://localhost:5173`) and register accounts using the role selector. The first time setup requires six users: at least three Students and three Teachers. There are no hard-coded demo credentials; each grader/tester can register and use their own accounts. The password must be at least 8 characters.

## Test walkthrough

1. Register a Teacher account and sign in. Create a course with a name, duration, topics, price, and maximum capacity. Review the course details and enrolled-student roster.
2. Create a second Teacher account. Confirm each teacher sees and can update only their own courses.
3. Register a Student account. Search by course or teacher name, open course details, enroll in an Open course, and confirm it appears under **My courses**.
4. Try enrolling twice and enroll from a second Student until capacity is reached. The API rejects duplicate, closed, cancelled, and full course enrollments.
5. As the course owner, change status to Close and verify the course remains visible but cannot be enrolled in. Change to Cancel and verify it disappears from student listings. A course with students cannot be deleted.
6. Try the same protected API calls while signed out; they should return `401` or `403`.

## Students
   Username - 
   password -

<img width="711" height="578" alt="Screenshot 2026-10-20 at 10 50 43 AM" src="https://github.com/user-attachments/assets/92af646f-1c77-4ea7-883b-fe9f2f754451" />

<img width="733" height="300" alt="Screenshot 2026-10-20 at 10 50 36 AM" src="https://github.com/user-attachments/assets/8acd0b82-9be3-40bb-8d46-bb9f0ba1f074" />



   

## Teachers
   Username - 
   password -
   
<img width="703" height="683" alt="Screenshot 2026-10-20 at 10 50 21 AM" src="https://github.com/user-attachments/assets/4dc646be-c3ed-4a28-8aa9-e094b5b1bf1b" />

<img width="719" height="601" alt="Screenshot 2026-10-20 at 10 50 27 AM" src="https://github.com/user-attachments/assets/82328d54-c029-4e17-9795-f29eb1113a5e" />

<img width="740" height="316" alt="Screenshot 2026-10-20 at 10 52 15 AM" src="https://github.com/user-attachments/assets/6460b497-f21b-46ab-8167-cc5ee5f67cc8" />



