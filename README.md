# 🎓 Smart Dynamic QR Attendance System

A full-stack, production-ready attendance system where teachers generate time-limited dynamic QR codes that students scan to mark attendance in real time.

---

## 📁 Folder Structure

```
qr-attendance/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── class.controller.js
│   │   │   ├── session.controller.js
│   │   │   └── attendance.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── models/
│   │   │   ├── teacher.model.js
│   │   │   ├── class.model.js
│   │   │   ├── session.model.js
│   │   │   └── attendance.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── class.routes.js
│   │   │   ├── session.routes.js
│   │   │   └── attendance.routes.js
│   │   ├── utils/
│   │   │   ├── db.js
│   │   │   └── qrCrypto.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── SessionPage.jsx
    │   │   └── MarkAttendance.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## ⚙️ Setup Instructions

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📦 npm Install Commands

### Backend
```bash
npm install express mongoose jsonwebtoken bcryptjs dotenv cors qrcode xlsx
npm install --save-dev nodemon
```

### Frontend
```bash
npm install axios react-router-dom
npm install --save-dev tailwindcss postcss autoprefixer @vitejs/plugin-react vite
npx tailwindcss init -p
```

---

## 🔐 .env File

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/qr-attendance?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
QR_ENCRYPTION_KEY=32characterlongsecretkeyforqr!!!
NODE_ENV=development
```

> ⚠️ QR_ENCRYPTION_KEY must be exactly 32 characters (AES-256)

---

## 🗺️ API Reference

### Phase 1 – Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register teacher |
| POST | `/api/auth/login` | ❌ | Login teacher |
| GET | `/api/test` | ✅ JWT | Protected test route |

### Phase 2 – Classes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/classes` | ✅ | Create class |
| GET | `/api/classes` | ✅ | Get teacher's classes |
| DELETE | `/api/classes/:id` | ✅ | Delete class |

### Phase 3 – Sessions / QR

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/sessions/start` | ✅ | Start 40-second session |
| GET | `/api/sessions/:id/qr` | ✅ | Get current QR (call every 4s) |
| PUT | `/api/sessions/:id/end` | ✅ | Manually end session |

### Phase 4 – Attendance

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/attendance/mark` | ❌ | Student marks attendance |

### Phase 5 – Export

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/sessions/:id/attendance` | ✅ | Get all attendance records |
| GET | `/api/sessions/:id/attendance/export` | ✅ | Download Excel file |

---

## 🧪 Postman Testing Guide

### Phase 1 – Auth

**1. Signup**
```
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "Dr. Smith",
  "email": "smith@college.edu",
  "password": "password123"
}
```
→ Copy the `token` from response

**2. Login**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "smith@college.edu",
  "password": "password123"
}
```

**3. Test Protected Route**
```
GET http://localhost:5000/api/test
Authorization: Bearer <your_token>
```

---

### Phase 2 – Class Management

**4. Create Class**
```
POST http://localhost:5000/api/classes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "CSE-A",
  "subject": "Operating Systems"
}
```
→ Copy the `_id` as `classId`

**5. Get All Classes**
```
GET http://localhost:5000/api/classes
Authorization: Bearer <token>
```

**6. Delete Class**
```
DELETE http://localhost:5000/api/classes/<classId>
Authorization: Bearer <token>
```

---

### Phase 3 – QR Session

**7. Start Session**
```
POST http://localhost:5000/api/sessions/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "classId": "<classId>"
}
```
→ Copy `sessionId` from response

**8. Get Dynamic QR** *(Call every 4 seconds)*
```
GET http://localhost:5000/api/sessions/<sessionId>/qr
Authorization: Bearer <token>
```
Response includes `qrImage` (base64 PNG) and `encryptedPayload`.
Copy the `encryptedPayload` for Phase 4 testing.

**9. End Session Manually**
```
PUT http://localhost:5000/api/sessions/<sessionId>/end
Authorization: Bearer <token>
```

---

### Phase 4 – Mark Attendance

**10. Mark Attendance** *(No auth required – student-facing)*
```
POST http://localhost:5000/api/attendance/mark
Content-Type: application/json

{
  "encryptedPayload": "<paste from step 8>",
  "rollNo": "CSE101",
  "name": "Alice Johnson",
  "department": "Computer Science"
}
```

**Expected error responses:**
- Session expired → `"QR Expired – Scan Again"` (410)
- Duplicate roll → `"Attendance already marked for this session."` (409)
- Invalid QR → `"Invalid QR code."` (400)

---

### Phase 5 – Dashboard

**11. View Attendance**
```
GET http://localhost:5000/api/sessions/<sessionId>/attendance
Authorization: Bearer <token>
```

**12. Export Excel**
```
GET http://localhost:5000/api/sessions/<sessionId>/attendance/export
Authorization: Bearer <token>
```
→ Set Postman to "Send and Download" to save the .xlsx file

---

## 🔄 Dynamic QR Flow Explained

```
Teacher starts session (40s window)
         │
         ▼
Every 4 seconds → GET /api/sessions/:id/qr
         │
         ├── Backend computes current "window index" = floor(elapsed / 4000)
         ├── Encrypts { classId, sessionId, windowIndex, expiry }
         ├── Generates QR PNG from encrypted string
         └── Returns base64 QR image
         │
         ▼
Student scans QR → extracts encryptedPayload
         │
         ▼
POST /api/attendance/mark
         │
         ├── Decrypt payload → validate session is active
         ├── Check expiry timestamp
         ├── Check current windowIndex matches QR's window (4s window)
         ├── Check no duplicate roll number
         └── Save attendance ✅ or reject ❌
```

---

## 🖥️ Frontend Pages

| Route | Page | Who |
|-------|------|-----|
| `/login` | Login | Teacher |
| `/signup` | Signup | Teacher |
| `/dashboard` | Class management + Start Session | Teacher |
| `/session/:id` | Live QR display + attendance list + export | Teacher |
| `/attend?payload=...` | Student attendance form | Student |

### QR Refresh Logic (Frontend)
```js
// In SessionPage.jsx
setInterval(() => {
  api.get(`/sessions/${id}/qr`).then(({ data }) => {
    setQrImage(data.data.qrImage);
  });
}, 4000); // Every 4 seconds
```

---

## 🔒 Security Design

- **AES-256-CBC encryption** on all QR payloads (server-side key never leaves backend)
- **4-second window validation** — old QR payloads are cryptographically valid but rejected by server window check
- **JWT-protected** all teacher routes
- **Unique index** on (sessionId + rollNo) prevents duplicate attendance at DB level
- **Server-side only** validation — no client-side trust

---

## 🚀 Production Tips

1. Store `JWT_SECRET` and `QR_ENCRYPTION_KEY` in a secrets manager (AWS Secrets Manager, etc.)
2. Add rate limiting with `express-rate-limit` on `/api/attendance/mark`
3. Use `helmet` middleware for security headers
4. Enable MongoDB Atlas IP allowlist
5. Set `NODE_ENV=production` and use `pm2` to run the server
6. Use HTTPS — QR payload interception otherwise possible on open networks
