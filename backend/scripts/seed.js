/**
 * AIMS-Campus Seed Script
 * Run: npm run seed
 *
 * Creates:
 *  - 9 Departments
 *  - 13 Categories
 *  - 1 Admin, 2 Managers, 5 Staff, 10 Students
 *  - Campus locations (4 buildings, multiple floors/rooms)
 *  - 15 sample complaints across all categories and statuses
 *  - Work records, notifications, feedback
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Category = require('../src/models/Category');
const Location = require('../src/models/Location');
const Complaint = require('../src/models/Complaint');
const StaffProfile = require('../src/models/StaffProfile');
const Notification = require('../src/models/Notification');
const Feedback = require('../src/models/Feedback');
const WorkRecord = require('../src/models/WorkRecord');
const AuditLog = require('../src/models/AuditLog');

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌  MONGODB_URI not set in .env');
  process.exit(1);
}

const hashPwd = async (pwd) => bcrypt.hash(pwd, 12);

const generateCmpNumber = (index) =>
  `CMP-2026-${String(index).padStart(6, '0')}`;

// ─── Data ──────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { name: 'Electrical Maintenance', code: 'ELEC', description: 'Handles all electrical issues', email: 'electrical@nexgen.edu', phone: '9000000001' },
  { name: 'Plumbing Maintenance', code: 'PLMB', description: 'Handles plumbing and water supply', email: 'plumbing@nexgen.edu', phone: '9000000002' },
  { name: 'HVAC Maintenance', code: 'HVAC', description: 'Air conditioning and ventilation', email: 'hvac@nexgen.edu', phone: '9000000003' },
  { name: 'IT Support', code: 'ITSP', description: 'Network, computers, and IT infrastructure', email: 'it@nexgen.edu', phone: '9000000004' },
  { name: 'Furniture & Civil', code: 'FURN', description: 'Furniture, civil, and structural maintenance', email: 'civil@nexgen.edu', phone: '9000000005' },
  { name: 'Housekeeping', code: 'HSKP', description: 'Cleaning and sanitation', email: 'housekeeping@nexgen.edu', phone: '9000000006' },
  { name: 'Laboratory Maintenance', code: 'LABM', description: 'Lab equipment and safety', email: 'lab@nexgen.edu', phone: '9000000007' },
  { name: 'Security', code: 'SECY', description: 'Campus security infrastructure', email: 'security@nexgen.edu', phone: '9000000008' },
  { name: 'General Maintenance', code: 'GENM', description: 'General repairs and maintenance', email: 'general@nexgen.edu', phone: '9000000009' },
];

const CATEGORY_MAP = [
  { name: 'Electrical', code: 'ELEC', icon: 'zap', color: '#f59e0b', dept: 'ELEC' },
  { name: 'Plumbing', code: 'PLMB', icon: 'droplets', color: '#3b82f6', dept: 'PLMB' },
  { name: 'HVAC', code: 'HVAC', icon: 'wind', color: '#06b6d4', dept: 'HVAC' },
  { name: 'IT/Network', code: 'ITNT', icon: 'wifi', color: '#8b5cf6', dept: 'ITSP' },
  { name: 'Furniture', code: 'FURN', icon: 'armchair', color: '#10b981', dept: 'FURN' },
  { name: 'Civil', code: 'CIVL', icon: 'building-2', color: '#6b7280', dept: 'FURN' },
  { name: 'Cleaning', code: 'CLEN', icon: 'sparkles', color: '#84cc16', dept: 'HSKP' },
  { name: 'Laboratory', code: 'LABR', icon: 'flask-conical', color: '#ec4899', dept: 'LABM' },
  { name: 'Security', code: 'SECY', icon: 'shield', color: '#ef4444', dept: 'SECY' },
  { name: 'Hostel', code: 'HSTL', icon: 'home', color: '#f97316', dept: 'GENM' },
  { name: 'Transport', code: 'TRNS', icon: 'bus', color: '#a855f7', dept: 'GENM' },
  { name: 'General Maintenance', code: 'GENM', icon: 'wrench', color: '#64748b', dept: 'GENM' },
  { name: 'Other', code: 'OTHR', icon: 'help-circle', color: '#9ca3af', dept: 'GENM' },
];

const BUILDINGS = ['Block A', 'Block B', 'Block C', 'Block D'];

const LOCATIONS = [
  { building: 'Block A', floor: 1, room: 'A-101', area: 'Computer Lab' },
  { building: 'Block A', floor: 1, room: 'A-102', area: 'Lecture Hall' },
  { building: 'Block A', floor: 2, room: 'A-201', area: 'Faculty Room' },
  { building: 'Block A', floor: 3, room: 'A-301', area: 'Seminar Hall' },
  { building: 'Block A', floor: 3, room: 'A-305', area: 'Computer Lab' },
  { building: 'Block B', floor: 1, room: 'B-101', area: 'Chemistry Lab' },
  { building: 'Block B', floor: 2, room: 'B-201', area: 'Classroom' },
  { building: 'Block B', floor: 2, room: 'B-204', area: 'Bathroom' },
  { building: 'Block B', floor: 3, room: 'B-301', area: 'Physics Lab' },
  { building: 'Block C', floor: 1, room: 'C-101', area: 'Library' },
  { building: 'Block C', floor: 2, room: 'C-201', area: 'Cafeteria' },
  { building: 'Block D', floor: 1, room: 'D-101', area: 'Hostel Room' },
  { building: 'Block D', floor: 2, room: 'D-201', area: 'Common Room' },
  { building: 'Block A', floor: 0, room: 'A-GF-01', area: 'Corridor' },
  { building: 'Block B', floor: 0, room: 'B-GF-01', area: 'Entrance' },
];

// Sample complaints data
const SAMPLE_COMPLAINTS = [
  {
    title: 'AC not cooling in Computer Lab A-305',
    description: 'The air conditioning unit in Computer Lab A-305 has stopped cooling. The room temperature is very high and students cannot work properly. The unit is making a strange noise.',
    categoryName: 'HVAC',
    priority: 'HIGH',
    status: 'VERIFIED',
    buildingIndex: 0,
    locationIndex: 4,
  },
  {
    title: 'Water leakage from ceiling in Room B-204',
    description: 'Heavy water is leaking from the ceiling in Room B-204 bathroom area. The floor is wet and slippery which is a safety hazard.',
    categoryName: 'Plumbing',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    buildingIndex: 1,
    locationIndex: 7,
  },
  {
    title: 'Wi-Fi not working on entire 3rd floor of Block A',
    description: 'The Wi-Fi is completely unavailable on the entire 3rd floor of Block A. Students and faculty cannot access the internet for classes and research.',
    categoryName: 'IT/Network',
    priority: 'HIGH',
    status: 'ASSIGNED',
    buildingIndex: 0,
    locationIndex: 3,
  },
  {
    title: 'Projector not displaying in Seminar Hall A-301',
    description: 'The projector in Seminar Hall A-301 is powered on but not displaying any output. Faculty members cannot conduct presentations.',
    categoryName: 'IT/Network',
    priority: 'MEDIUM',
    status: 'PENDING',
    buildingIndex: 0,
    locationIndex: 3,
  },
  {
    title: 'Broken desk in Classroom B-201',
    description: 'Multiple student desks in Classroom B-201 are damaged. Two desks have broken legs and one has a cracked top surface.',
    categoryName: 'Furniture',
    priority: 'LOW',
    status: 'RESOLVED',
    buildingIndex: 1,
    locationIndex: 6,
  },
  {
    title: 'Corridor lights not working in Block A ground floor',
    description: 'All lights in the Block A ground floor corridor are not working. The corridor is very dark and difficult to navigate, especially in the evening.',
    categoryName: 'Electrical',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    buildingIndex: 0,
    locationIndex: 13,
  },
  {
    title: 'Lab computer not starting in Physics Lab B-301',
    description: '3 out of 15 computers in Physics Lab B-301 are not starting up. They show a black screen when powered on.',
    categoryName: 'IT/Network',
    priority: 'MEDIUM',
    status: 'ASSIGNED',
    buildingIndex: 1,
    locationIndex: 8,
  },
  {
    title: 'Washroom tap leaking in Block B bathroom',
    description: 'A tap in the Block B ground floor washroom is constantly leaking water. This is wasting water and causing water logging.',
    categoryName: 'Plumbing',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    buildingIndex: 1,
    locationIndex: 14,
  },
  {
    title: 'Hostel room fan not working in D-101',
    description: 'The ceiling fan in Hostel Room D-101 has completely stopped working. The room has no other ventilation and it is very hot.',
    categoryName: 'Electrical',
    priority: 'HIGH',
    status: 'PENDING',
    buildingIndex: 3,
    locationIndex: 11,
  },
  {
    title: 'Chemistry lab exhaust fan not operational',
    description: 'The exhaust fan in Chemistry Lab B-101 is not working. This is causing chemical fumes to accumulate in the lab which is dangerous for students.',
    categoryName: 'HVAC',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    buildingIndex: 1,
    locationIndex: 5,
  },
  {
    title: 'Library air conditioning insufficient',
    description: 'The air conditioning in the library (C-101) is not sufficient for the number of students. The temperature is very uncomfortable.',
    categoryName: 'HVAC',
    priority: 'MEDIUM',
    status: 'PENDING',
    buildingIndex: 2,
    locationIndex: 9,
  },
  {
    title: 'Cafeteria floor slippery due to water spillage',
    description: 'The cafeteria floor (C-201) has water spillage near the food counter area making it extremely slippery. Multiple students have nearly slipped.',
    categoryName: 'Cleaning',
    priority: 'HIGH',
    status: 'VERIFIED',
    buildingIndex: 2,
    locationIndex: 10,
  },
  {
    title: 'Electrical socket sparking in Faculty Room A-201',
    description: 'An electrical socket in Faculty Room A-201 is sparking when any device is plugged in. This is a serious electrical hazard.',
    categoryName: 'Electrical',
    priority: 'CRITICAL',
    status: 'RESOLVED',
    buildingIndex: 0,
    locationIndex: 2,
  },
  {
    title: 'Network switch down - Block B internet unavailable',
    description: 'The network switch for Block B has gone down. No internet connectivity is available in the entire Block B building.',
    categoryName: 'IT/Network',
    priority: 'CRITICAL',
    status: 'VERIFIED',
    buildingIndex: 1,
    locationIndex: 6,
  },
  {
    title: 'Broken main gate lock at Block B entrance',
    description: 'The main gate lock at Block B entrance is broken. Anyone can enter the building without any security check, which is a serious safety concern.',
    categoryName: 'Security',
    priority: 'HIGH',
    status: 'ASSIGNED',
    buildingIndex: 1,
    locationIndex: 14,
  },
];

// ─── Seed Logic ────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅  Connected to MongoDB\n');

    // Clear existing data
    console.log('🗑️   Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Category.deleteMany({}),
      Location.deleteMany({}),
      Complaint.deleteMany({}),
      StaffProfile.deleteMany({}),
      Notification.deleteMany({}),
      Feedback.deleteMany({}),
      WorkRecord.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('✅  Data cleared\n');

    // ── Departments ────────────────────────────────────────────────
    console.log('🏢  Creating departments...');
    const departments = await Department.insertMany(DEPARTMENTS);
    const deptMap = {};
    departments.forEach((d) => { deptMap[d.code] = d; });
    console.log(`✅  ${departments.length} departments created\n`);

    // ── Categories ─────────────────────────────────────────────────
    console.log('📂  Creating categories...');
    const categoriesData = CATEGORY_MAP.map((c) => ({
      ...c,
      defaultDepartmentId: deptMap[c.dept]?._id,
    }));
    const categories = await Category.insertMany(categoriesData);
    const catMap = {};
    categories.forEach((c) => { catMap[c.name] = c; });
    console.log(`✅  ${categories.length} categories created\n`);

    // ── Locations ──────────────────────────────────────────────────
    console.log('📍  Creating locations...');
    const locationsData = LOCATIONS.map((l) => ({
      ...l,
      campus: 'NexGen University',
      coordinates: {
        type: 'Point',
        coordinates: [78.3861 + Math.random() * 0.01, 17.4399 + Math.random() * 0.01],
      },
    }));
    const locations = await Location.insertMany(locationsData);
    console.log(`✅  ${locations.length} locations created\n`);

    // ── Users: Admin ───────────────────────────────────────────────
    console.log('👤  Creating users...');
    const adminPwd = await hashPwd('Admin@12345');
    const admin = await User.create({
      name: 'Dr. Rajesh Kumar',
      email: 'admin@nexgen.edu',
      phone: '9876543210',
      passwordHash: adminPwd,
      role: 'ADMIN',
      department: 'Administration',
      employeeId: 'EMP001',
      isActive: true,
    });

    // ── Managers ────────────────────────────────────────────────────
    const managerPwd = await hashPwd('Manager@12345');
    const managers = [];
    const managerData = [
      { name: 'Priya Sharma', email: 'manager.elec@nexgen.edu', dept: 'Electrical Maintenance', deptCode: 'ELEC' },
      { name: 'Suresh Patel', email: 'manager.it@nexgen.edu', dept: 'IT Support', deptCode: 'ITSP' },
    ];

    for (const m of managerData) {
      const mgr = await User.create({
        name: m.name,
        email: m.email,
        phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash: managerPwd,
        role: 'MANAGER',
        department: m.dept,
        employeeId: `MGR${managers.length + 1}`.padStart(5, '0'),
        isActive: true,
      });
      managers.push({ user: mgr, deptCode: m.deptCode });

      // Update department manager
      await Department.findOneAndUpdate({ code: m.deptCode }, { managerId: mgr._id });
    }

    // ── Staff ───────────────────────────────────────────────────────
    const staffPwd = await hashPwd('Staff@12345');
    const staffUsers = [];
    const staffData = [
      { name: 'Ramesh Electrician', email: 'staff.ramesh@nexgen.edu', dept: 'Electrical Maintenance', deptCode: 'ELEC', skills: ['electrical', 'wiring', 'switchgear'] },
      { name: 'Kavya Plumber', email: 'staff.kavya@nexgen.edu', dept: 'Plumbing Maintenance', deptCode: 'PLMB', skills: ['plumbing', 'pipe fitting'] },
      { name: 'Arjun IT Tech', email: 'staff.arjun@nexgen.edu', dept: 'IT Support', deptCode: 'ITSP', skills: ['networking', 'hardware', 'wifi'] },
      { name: 'Meena HVAC', email: 'staff.meena@nexgen.edu', dept: 'HVAC Maintenance', deptCode: 'HVAC', skills: ['hvac', 'air conditioning', 'ventilation'] },
      { name: 'Vijay General', email: 'staff.vijay@nexgen.edu', dept: 'General Maintenance', deptCode: 'GENM', skills: ['general', 'carpentry', 'painting'] },
    ];

    for (let i = 0; i < staffData.length; i++) {
      const s = staffData[i];
      const staffUser = await User.create({
        name: s.name,
        email: s.email,
        phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash: staffPwd,
        role: 'STAFF',
        department: s.dept,
        employeeId: `STAFF${i + 1}`.padStart(7, '0'),
        isActive: true,
      });

      const profile = await StaffProfile.create({
        userId: staffUser._id,
        departmentId: deptMap[s.deptCode]._id,
        skills: s.skills,
        availability: 'AVAILABLE',
        shiftStart: '09:00',
        shiftEnd: '18:00',
        activeTaskCount: 0,
        totalTasksCompleted: Math.floor(Math.random() * 30),
        averageRating: 3.5 + Math.random() * 1.5,
        totalRatings: Math.floor(Math.random() * 20),
      });

      staffUsers.push({ user: staffUser, profile, deptCode: s.deptCode });
    }

    // ── Students ────────────────────────────────────────────────────
    const userPwd = await hashPwd('User@12345');
    const students = [];
    const studentData = [
      { name: 'Aditya Reddy', email: 'aditya@student.nexgen.edu', id: 'NGU22CS001' },
      { name: 'Sneha Gupta', email: 'sneha@student.nexgen.edu', id: 'NGU22CS002' },
      { name: 'Ravi Teja', email: 'ravi@student.nexgen.edu', id: 'NGU22EC001' },
      { name: 'Ananya Krishnan', email: 'ananya@student.nexgen.edu', id: 'NGU22ME001' },
      { name: 'Kiran Babu', email: 'kiran@student.nexgen.edu', id: 'NGU22IT001' },
      { name: 'Divya Nair', email: 'divya@student.nexgen.edu', id: 'NGU22CS003' },
      { name: 'Sai Prasad', email: 'sai@student.nexgen.edu', id: 'NGU22EC002' },
      { name: 'Lakshmi Devi', email: 'lakshmi@student.nexgen.edu', id: 'NGU22ME002' },
      { name: 'Harsha Vardhan', email: 'harsha@student.nexgen.edu', id: 'NGU21CS001' },
      { name: 'Pooja Rani', email: 'pooja@student.nexgen.edu', id: 'NGU21CS002' },
    ];

    for (const s of studentData) {
      const student = await User.create({
        name: s.name,
        email: s.email,
        phone: `91234${Math.floor(10000 + Math.random() * 90000)}`,
        passwordHash: userPwd,
        role: 'USER',
        department: 'CSE',
        studentId: s.id,
        isActive: true,
      });
      students.push(student);
    }

    console.log(`✅  Created: 1 admin, ${managers.length} managers, ${staffUsers.length} staff, ${students.length} students\n`);

    // ── Complaints ──────────────────────────────────────────────────
    console.log('📋  Creating sample complaints...');

    const createdComplaints = [];
    const resolvedStatuses = ['RESOLVED', 'VERIFIED'];

    for (let i = 0; i < SAMPLE_COMPLAINTS.length; i++) {
      const sc = SAMPLE_COMPLAINTS[i];
      const student = students[i % students.length];
      const location = locations[sc.locationIndex];
      const category = catMap[sc.categoryName];

      // Find matching department
      let dept = null;
      if (category?.defaultDepartmentId) {
        dept = departments.find((d) => d._id.equals(category.defaultDepartmentId));
      }

      // Find matching staff for the department
      const assignedStaffEntry = staffUsers.find((s) => s.deptCode === dept?.code) || staffUsers[0];

      const complaintNumber = generateCmpNumber(i + 1);

      // Build base complaint
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const resolvedAt = resolvedStatuses.includes(sc.status)
        ? new Date(createdAt.getTime() + Math.random() * 48 * 60 * 60 * 1000)
        : null;

      const resolutionMinutes = resolvedAt
        ? Math.round((resolvedAt - createdAt) / 1000 / 60)
        : null;

      const timeline = [
        {
          status: 'PENDING',
          performedBy: { userId: student._id, name: student.name, role: 'USER' },
          note: 'Complaint created',
          timestamp: createdAt,
        },
      ];

      if (!['PENDING'].includes(sc.status)) {
        timeline.push({
          status: 'ASSIGNED',
          performedBy: { userId: admin._id, name: admin.name, role: 'ADMIN' },
          note: `Assigned to ${dept?.name || 'Maintenance'}`,
          timestamp: new Date(createdAt.getTime() + 30 * 60 * 1000),
        });
      }

      if (['ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED'].includes(sc.status)) {
        timeline.push({
          status: 'IN_PROGRESS',
          performedBy: { userId: assignedStaffEntry.user._id, name: assignedStaffEntry.user.name, role: 'STAFF' },
          note: 'Technician started inspection',
          timestamp: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
        });
      }

      if (resolvedStatuses.includes(sc.status)) {
        timeline.push({
          status: 'RESOLVED',
          performedBy: { userId: assignedStaffEntry.user._id, name: assignedStaffEntry.user.name, role: 'STAFF' },
          note: 'Issue resolved successfully',
          timestamp: resolvedAt,
        });
      }

      if (sc.status === 'VERIFIED') {
        timeline.push({
          status: 'VERIFIED',
          performedBy: { userId: student._id, name: student.name, role: 'USER' },
          note: 'User confirmed issue is resolved',
          timestamp: new Date(resolvedAt.getTime() + 2 * 60 * 60 * 1000),
        });
      }

      const slaHours = { LOW: 48, MEDIUM: 24, HIGH: 8, CRITICAL: 2 };
      const slaDeadline = new Date(createdAt.getTime() + (slaHours[sc.priority] || 24) * 60 * 60 * 1000);
      const slaBreached = resolvedAt
        ? resolvedAt > slaDeadline
        : new Date() > slaDeadline;

      const complaint = await Complaint.create({
        complaintNumber,
        createdBy: { userId: student._id, name: student.name, email: student.email },
        title: sc.title,
        description: sc.description,
        category: {
          categoryId: category?._id,
          name: sc.categoryName,
          code: category?.code,
          confidence: 0.85 + Math.random() * 0.14,
        },
        priority: {
          level: sc.priority,
          score: { LOW: 3, MEDIUM: 5, HIGH: 7, CRITICAL: 9 }[sc.priority],
          reason: `${sc.categoryName} issue requiring ${sc.priority.toLowerCase()} attention`,
          aiSuggested: sc.priority,
          aiConfidence: 0.85 + Math.random() * 0.1,
        },
        department: dept ? {
          departmentId: dept._id,
          name: dept.name,
          code: dept.code,
        } : undefined,
        location: {
          locationId: location._id,
          campus: 'NexGen University',
          building: location.building,
          floor: location.floor,
          room: location.room,
          area: location.area,
        },
        status: sc.status,
        assignedTo: !['PENDING'].includes(sc.status)
          ? {
              staffId: assignedStaffEntry.user._id,
              name: assignedStaffEntry.user.name,
              assignedAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
              assignedBy: admin._id,
            }
          : undefined,
        timeline,
        aiAnalysis: {
          category: sc.categoryName,
          confidence: 0.9,
          priority: sc.priority,
          priorityScore: { LOW: 3, MEDIUM: 5, HIGH: 7, CRITICAL: 9 }[sc.priority],
          department: dept?.name || 'General Maintenance',
          reason: `AI identified ${sc.categoryName.toLowerCase()} issue with ${sc.priority.toLowerCase()} priority based on complaint description.`,
          recommendedAction: `Dispatch ${dept?.name || 'maintenance'} team immediately.`,
          summary: sc.title,
          analyzedAt: new Date(createdAt.getTime() + 5 * 1000),
          provider: 'groq',
          model: 'llama3-8b-8192',
        },
        sla: {
          deadline: slaDeadline,
          breached: slaBreached,
          firstResponseAt: timeline.length > 1 ? timeline[1].timestamp : undefined,
          resolvedAt: resolvedAt || undefined,
          resolutionTimeMinutes: resolutionMinutes,
        },
        resolution: resolvedStatuses.includes(sc.status)
          ? {
              resolvedAt,
              resolvedBy: assignedStaffEntry.user._id,
              summary: 'Issue identified and resolved by maintenance team.',
            }
          : undefined,
        verification: sc.status === 'VERIFIED'
          ? {
              verifiedAt: timeline[timeline.length - 1].timestamp,
              verifiedBy: student._id,
              satisfied: true,
            }
          : undefined,
        createdAt,
        updatedAt: resolvedAt || createdAt,
      });

      createdComplaints.push({ complaint, student, staffEntry: assignedStaffEntry, resolvedAt, sc });

      // Update staff workload for in-progress
      if (['IN_PROGRESS', 'ASSIGNED', 'ACCEPTED'].includes(sc.status)) {
        await StaffProfile.findOneAndUpdate(
          { userId: assignedStaffEntry.user._id },
          { $inc: { activeTaskCount: 1 } }
        );
      }
      if (resolvedStatuses.includes(sc.status)) {
        await StaffProfile.findOneAndUpdate(
          { userId: assignedStaffEntry.user._id },
          { $inc: { totalTasksCompleted: 1 } }
        );
      }
    }

    console.log(`✅  ${createdComplaints.length} complaints created\n`);

    // ── Work Records ────────────────────────────────────────────────
    console.log('🔧  Creating work records...');
    const resolvedComplaints = createdComplaints.filter((c) =>
      ['RESOLVED', 'VERIFIED'].includes(c.sc.status)
    );

    for (const { complaint, staffEntry, resolvedAt } of resolvedComplaints) {
      await WorkRecord.create({
        complaintId: complaint._id,
        technicianId: staffEntry.user._id,
        technicianName: staffEntry.user.name,
        startedAt: new Date(complaint.createdAt.getTime() + 2 * 60 * 60 * 1000),
        completedAt: resolvedAt,
        workPerformed: 'Identified root cause and carried out necessary repairs.',
        materials: [
          { name: 'Spare Part', quantity: 1, unit: 'unit', cost: 150 },
        ],
        totalCost: 150,
        resolutionType: 'REPAIRED',
        remarks: 'Issue resolved successfully. Area cleaned after work.',
      });
    }
    console.log(`✅  ${resolvedComplaints.length} work records created\n`);

    // ── Feedback ────────────────────────────────────────────────────
    console.log('⭐  Creating feedback...');
    const verifiedComplaints = createdComplaints.filter((c) => c.sc.status === 'VERIFIED');
    for (const { complaint, student } of verifiedComplaints) {
      const rating = Math.floor(3 + Math.random() * 3); // 3-5
      await Feedback.create({
        complaintId: complaint._id,
        userId: student._id,
        rating,
        comment: rating >= 4 ? 'Issue was resolved quickly and professionally.' : 'Took some time but eventually resolved.',
        speedRating: rating,
        staffRating: rating,
        resolvedSatisfactorily: rating >= 3,
      });
    }
    console.log(`✅  ${verifiedComplaints.length} feedback records created\n`);

    // ── Notifications ────────────────────────────────────────────────
    console.log('🔔  Creating notifications...');
    const notifPromises = [];
    for (const { complaint, student } of createdComplaints.slice(0, 5)) {
      notifPromises.push(
        Notification.create({
          userId: student._id,
          type: 'COMPLAINT_CREATED',
          title: 'Complaint Submitted',
          message: `Your complaint ${complaint.complaintNumber} has been submitted.`,
          relatedEntity: { entityType: 'Complaint', entityId: complaint._id, complaintNumber: complaint.complaintNumber },
          isRead: false,
        })
      );
    }
    await Promise.all(notifPromises);
    console.log(`✅  ${notifPromises.length} notifications created\n`);

    // ── Summary ─────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(55));
    console.log('  🎉  SEED COMPLETE — AIMS-Campus Demo Data Ready');
    console.log('═'.repeat(55));
    console.log('\n  📧  LOGIN CREDENTIALS:');
    console.log('  ┌─────────────────────────────────────────────┐');
    console.log('  │  ADMIN                                      │');
    console.log('  │  Email   : admin@nexgen.edu                 │');
    console.log('  │  Password: Admin@12345                      │');
    console.log('  │                                             │');
    console.log('  │  MANAGER                                    │');
    console.log('  │  Email   : manager.elec@nexgen.edu          │');
    console.log('  │  Password: Manager@12345                    │');
    console.log('  │                                             │');
    console.log('  │  STAFF                                      │');
    console.log('  │  Email   : staff.ramesh@nexgen.edu          │');
    console.log('  │  Password: Staff@12345                      │');
    console.log('  │                                             │');
    console.log('  │  STUDENT                                    │');
    console.log('  │  Email   : aditya@student.nexgen.edu        │');
    console.log('  │  Password: User@12345                       │');
    console.log('  └─────────────────────────────────────────────┘\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌  Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
