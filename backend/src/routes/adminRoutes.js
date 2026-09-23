const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const Location = require('../models/Location');
const AuditLog = require('../models/AuditLog');
const StaffProfile = require('../models/StaffProfile');
const Announcement = require('../models/Announcement');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdmin, isAdminOrManager } = require('../middleware/roleMiddleware');
const { sendSuccess, sendPaginated, sendError, buildPagination } = require('../utils/apiResponse');

router.use(authenticate);

// ─── Users ─────────────────────────────────────────────────────────────────

router.get('/users', isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    return sendPaginated(res, users, buildPagination(pageNum, limitNum, total), 'Users fetched');
  } catch (error) { next(error); }
});

router.patch('/users/:id/role', isAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['USER', 'STAFF', 'MANAGER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return sendError(res, 'Invalid role', 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!user) return sendError(res, 'User not found', 404);

    await AuditLog.create({
      actorId: req.user._id, actorName: req.user.name, actorRole: req.user.role,
      action: 'USER_ROLE_CHANGED',
      entityType: 'User', entityId: user._id, entityLabel: user.email,
      oldValue: { role: user.role }, newValue: { role },
      description: `Role changed to ${role}`,
    });

    return sendSuccess(res, { user }, 'User role updated');
  } catch (error) { next(error); }
});

router.patch('/users/:id/toggle-active', isAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    user.isActive = !user.isActive;
    await user.save();

    return sendSuccess(res, { user }, `User ${user.isActive ? 'activated' : 'deactivated'}`);
  } catch (error) { next(error); }
});

// ─── Departments ────────────────────────────────────────────────────────────

router.get('/departments', async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('managerId', 'name email')
      .sort({ name: 1 });
    return sendSuccess(res, departments, 'Departments fetched');
  } catch (error) { next(error); }
});

router.post('/departments', isAdmin, async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    await AuditLog.create({
      actorId: req.user._id, actorName: req.user.name, actorRole: req.user.role,
      action: 'DEPARTMENT_CREATED', entityType: 'Department', entityId: dept._id,
      entityLabel: dept.name, description: `Department ${dept.name} created`,
    });
    return sendSuccess(res, { department: dept }, 'Department created', 201);
  } catch (error) { next(error); }
});

router.patch('/departments/:id', isAdmin, async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return sendError(res, 'Department not found', 404);
    return sendSuccess(res, { department: dept }, 'Department updated');
  } catch (error) { next(error); }
});

// ─── Categories ─────────────────────────────────────────────────────────────

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .populate('defaultDepartmentId', 'name')
      .sort({ name: 1 });
    return sendSuccess(res, categories, 'Categories fetched');
  } catch (error) { next(error); }
});

router.post('/categories', isAdmin, async (req, res, next) => {
  try {
    const cat = await Category.create(req.body);
    return sendSuccess(res, { category: cat }, 'Category created', 201);
  } catch (error) { next(error); }
});

router.patch('/categories/:id', isAdmin, async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return sendError(res, 'Category not found', 404);
    return sendSuccess(res, { category: cat }, 'Category updated');
  } catch (error) { next(error); }
});

// ─── Locations ──────────────────────────────────────────────────────────────

router.get('/locations', async (req, res, next) => {
  try {
    const { building } = req.query;
    const filter = { isActive: true };
    if (building) filter.building = { $regex: building, $options: 'i' };
    const locations = await Location.find(filter).sort({ building: 1, floor: 1 });
    return sendSuccess(res, locations, 'Locations fetched');
  } catch (error) { next(error); }
});

router.post('/locations', isAdminOrManager, async (req, res, next) => {
  try {
    const loc = await Location.create(req.body);
    return sendSuccess(res, { location: loc }, 'Location created', 201);
  } catch (error) { next(error); }
});

// ─── Staff Management ────────────────────────────────────────────────────────

router.get('/staff', isAdminOrManager, async (req, res, next) => {
  try {
    const { departmentId } = req.query;
    const filter = {};
    if (departmentId) filter.departmentId = departmentId;

    const staff = await StaffProfile.find(filter)
      .populate('userId', 'name email phone profileImage isActive')
      .populate('departmentId', 'name')
      .sort({ activeTaskCount: 1 });

    return sendSuccess(res, staff, 'Staff fetched');
  } catch (error) { next(error); }
});

router.post('/staff', isAdmin, async (req, res, next) => {
  try {
    const { userId, departmentId, skills, shiftStart, shiftEnd } = req.body;

    // Update user role to STAFF
    await User.findByIdAndUpdate(userId, { role: 'STAFF' });

    const profile = await StaffProfile.create({
      userId, departmentId, skills, shiftStart, shiftEnd,
    });

    return sendSuccess(res, { profile }, 'Staff profile created', 201);
  } catch (error) { next(error); }
});

// ─── Audit Logs ─────────────────────────────────────────────────────────────

router.get('/audit-logs', isAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 30, action, entityType } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (entityType) filter.entityType = entityType;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    return sendPaginated(res, logs, buildPagination(pageNum, limitNum, total), 'Audit logs fetched');
  } catch (error) { next(error); }
});

// ─── Announcements ───────────────────────────────────────────────────────────

router.get('/announcements', async (req, res, next) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
    }).populate('createdBy', 'name').sort({ priority: -1, createdAt: -1 });
    return sendSuccess(res, announcements, 'Announcements fetched');
  } catch (error) { next(error); }
});

router.post('/announcements', isAdminOrManager, async (req, res, next) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      createdBy: req.user._id,
    });
    return sendSuccess(res, { announcement }, 'Announcement created', 201);
  } catch (error) { next(error); }
});

module.exports = router;
