# AIMS-Campus
## AI-Powered Intelligent Maintenance & Smart Complaint Management System
### NexGen University

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Groq API key (free at https://console.groq.com)
- Cloudinary account (free tier works)

---

## ⚙️ Setup Instructions

### 1. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers |
| `JWT_SECRET` | Any long random string (min 32 chars) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → API Keys |
| `GROQ_API_KEY` | https://console.groq.com → API Keys |

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates demo data including:
- 1 Admin, 2 Managers, 5 Staff, 10 Students
- 9 Departments, 13 Categories, 15 Campus Locations
- 15 sample complaints across all statuses

**Demo Login Credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@nexgen.edu | Admin@12345 |
| Manager | manager.elec@nexgen.edu | Manager@12345 |
| Staff | staff.ramesh@nexgen.edu | Staff@12345 |
| Student | aditya@student.nexgen.edu | User@12345 |

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Backend runs at: http://localhost:5000

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

---

## 📁 Project Structure

```
AIMS-Campus/
├── backend/
│   ├── src/
│   │   ├── config/          # DB + env
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, RBAC, upload, error
│   │   ├── models/          # Mongoose schemas (11 models)
│   │   ├── routes/          # Express routers
│   │   ├── services/        # AI, assignment, notification, analytics
│   │   └── utils/           # Logger, response helpers
│   ├── scripts/
│   │   └── seed.js          # Demo data generator
│   ├── app.js               # Express app
│   └── server.js            # HTTP server
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios API modules
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Page components by role
    │   ├── store/           # Zustand state stores
    │   └── App.jsx          # Router + route definitions
    └── index.html
```

---

## 🏗️ Architecture

```
React Frontend (Vite + Tailwind)
       ↓  REST API
Express Backend (Node.js)
       ↓
  ┌────┼────────────┐
  │    │            │
MongoDB   Groq AI   Cloudinary
  │       (Analysis) (Images)
  └── aims_campus DB
```

---

## 🤖 AI Features

When a complaint is submitted, the Groq LLM (llama3-8b-8192) automatically:

1. **Classifies** the complaint into a category (Electrical, Plumbing, HVAC, etc.)
2. **Determines priority** (LOW / MEDIUM / HIGH / CRITICAL)
3. **Recommends a department** for assignment
4. **Generates** a brief summary and recommended action

The AI result is always validated before being applied and can be overridden by managers/admins.

**Fallback:** If Groq is unavailable, a keyword-rule engine provides instant classification.

---

## 📊 MongoDB Features Demonstrated

| Feature | Usage |
|---|---|
| **Document embedding** | Timeline, AI analysis, attachments in Complaint |
| **References** | User → Complaint → Department → Staff |
| **Indexes** | 8+ indexes on complaints collection |
| **Aggregation** | 7 pipeline queries for analytics |
| **Transactions** | Complaint assignment (multi-document) |
| **Text search** | Full-text on title + description |
| **Geospatial** | 2dsphere index on location coordinates |
| **CRUD** | All collections |

---

## 🔐 Role-Based Access

| Feature | USER | STAFF | MANAGER | ADMIN |
|---|---|---|---|---|
| Create complaint | ✅ | ✅ | ✅ | ✅ |
| View own complaints | ✅ | - | - | ✅ |
| Accept/update tasks | - | ✅ | - | ✅ |
| Assign complaints | - | - | ✅ | ✅ |
| View analytics | - | - | ✅ | ✅ |
| Manage users | - | - | - | ✅ |
| Override AI | - | - | ✅ | ✅ |
| View audit logs | - | - | - | ✅ |

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| POST | /api/complaints | Create complaint |
| GET | /api/complaints | List complaints |
| GET | /api/complaints/:id | Complaint detail |
| POST | /api/complaints/:id/status | Update status |
| POST | /api/complaints/:id/assign | Assign to staff |
| POST | /api/complaints/:id/verify | User verification |
| POST | /api/complaints/:id/feedback | Submit feedback |
| GET | /api/analytics/dashboard | KPI metrics |
| GET | /api/analytics/categories | Category stats |
| GET | /api/analytics/monthly-trend | Monthly data |
| GET | /api/notifications | User notifications |
| GET | /api/admin/users | All users (admin) |

---

## 🎯 Demo Flow

1. Login as **Student** (`aditya@student.nexgen.edu`)
2. Submit a complaint with description and image
3. Watch AI analyze and classify automatically
4. Login as **Admin** (`admin@nexgen.edu`)  
5. Assign complaint to a staff member
6. Login as **Staff** (`staff.ramesh@nexgen.edu`)
7. Accept task → mark IN_PROGRESS → upload work photo → RESOLVED
8. Switch back to student → verify → give 5-star feedback
9. Open Admin Dashboard → see all analytics updated
