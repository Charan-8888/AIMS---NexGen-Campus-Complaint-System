# AIMS-Campus: Project Overview

## 🏫 About the Project
**AIMS-Campus (AI-Powered Intelligent Maintenance & Smart Complaint Management System)** is a comprehensive, full-stack digital solution designed for "NexGen University" to streamline and modernize campus facility management. 

It replaces traditional, manual complaint reporting with a smart, automated system that leverages Artificial Intelligence to classify issues, determine priority, and route them to the correct maintenance departments instantly.

---

## 🚀 Core Features

1. **AI-Powered Complaint Analysis**
   - Integrates with the **Groq LLM (llama3-8b-8192)** to automatically analyze incoming complaints.
   - Automatically determines the **Category** (Electrical, Plumbing, HVAC, etc.).
   - Assesses the **Priority Level** (Low, Medium, High, Critical) based on the description.
   - Suggests the appropriate **Department** and recommends immediate actions.
   - Includes a rule-based fallback mechanism if the AI service is temporarily unavailable.

2. **Role-Based Access Control (RBAC)**
   - Secure and customized views/dashboards for **Users/Students**, **Maintenance Staff**, **Managers**, and **Admins**.
   - Distinct permissions for complaint creation, task assignment, and system configuration.

3. **Smart Workflow & Assignment**
   - Managers and Admins can assign verified complaints to specific staff members based on department and workload.
   - Tracks the entire lifecycle of a complaint: `PENDING` ➔ `ASSIGNED` ➔ `ACCEPTED` ➔ `IN_PROGRESS` ➔ `RESOLVED` ➔ `VERIFIED`.

4. **Service Level Agreement (SLA) Tracking**
   - Automatically tracks resolution times against predefined SLA deadlines based on priority.
   - Flags breached SLA deadlines to ensure accountability.

5. **Advanced Analytics & Dashboards**
   - Real-time KPI metrics, monthly trend charts, category breakdowns, and staff workload tracking using complex MongoDB aggregation pipelines.

6. **Rich Media Support**
   - Users can upload images of the issue.
   - Images are securely hosted and served via **Cloudinary**.

---

## 💻 Technology Stack

### **Frontend**
*   **Framework:** React 19 (via Vite)
*   **Styling:** Tailwind CSS (v4)
*   **State Management:** Zustand (with persistence)
*   **Routing:** React Router DOM (v7)
*   **Forms & Validation:** React Hook Form + Zod
*   **Data Visualization:** Recharts
*   **API Communication:** Axios (with custom JWT interceptors for auto-refresh)

### **Backend**
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB Atlas (Mongoose ODM)
*   **Authentication:** JWT (Access & Refresh tokens) + bcryptjs
*   **Security:** Helmet, Express Rate Limit, Mongo Sanitize, CORS

### **External Services**
*   **Groq SDK:** AI inference for text analysis.
*   **Cloudinary:** Image upload and management.

---

## 👥 User Roles & Capabilities

| Role | Key Capabilities |
| :--- | :--- |
| **Student/User** | Submit complaints with images, track real-time status, verify resolutions, and provide 5-star feedback. |
| **Staff (Technician)**| View assigned tasks, accept/update task status, log work records (parts used, time taken), mark as resolved. |
| **Manager** | Oversee specific departments, review AI classifications (and override if needed), assign tasks to staff, view department analytics. |
| **Admin** | Full system oversight, manage all users and departments, view comprehensive campus-wide analytics and audit logs. |

---

## 🔄 The Complaint Lifecycle

1. **Submission:** A student takes a photo of a broken AC and submits it.
2. **AI Processing:** The AI reads "broken AC", classifies it as **HVAC**, marks it **High Priority**, and tags the HVAC department.
3. **Assignment:** An Admin or HVAC Manager sees the ticket and assigns it to an available HVAC technician.
4. **Resolution:** The technician accepts the job, fixes the AC, logs the materials used, and marks the status as `RESOLVED`.
5. **Verification:** The student receives a notification, confirms the AC is working, marks it `VERIFIED`, and leaves a rating for the technician.

---

## 🏗️ Architecture Highlights

*   **RESTful API Design:** Cleanly separated controllers, routes, and services.
*   **Complex Aggregations:** Heavy data lifting (like calculating staff workloads and monthly trends) is done at the database level using MongoDB aggregation pipelines rather than processing large arrays in Node.js.
*   **Security First:** Passwords are hashed with bcrypt. Requests are rate-limited to prevent brute-force attacks. NoSQL injection is mitigated via `express-mongo-sanitize`.
