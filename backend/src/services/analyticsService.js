/**
 * Analytics Service
 * MongoDB aggregation pipelines for dashboard data.
 * All analytics computed server-side via aggregation — not in frontend JS.
 */

const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const StaffProfile = require('../models/StaffProfile');
const logger = require('../utils/logger');

// ─── Dashboard Summary KPIs ────────────────────────────────────────────────

const getDashboardKPIs = async (departmentId = null) => {
  const baseMatch = departmentId
    ? { 'department.departmentId': departmentId }
    : {};

  const [statusCounts, priorityCounts, slaStats, avgResolution] = await Promise.all([
    // Status breakdown
    Complaint.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Priority breakdown
    Complaint.aggregate([
      { $match: { ...baseMatch, status: { $nin: ['VERIFIED', 'CANCELLED'] } } },
      { $group: { _id: '$priority.level', count: { $sum: 1 } } },
    ]),

    // SLA breach count
    Complaint.aggregate([
      { $match: { ...baseMatch, 'sla.breached': true } },
      { $count: 'slaBreached' },
    ]),

    // Average resolution time (minutes)
    Complaint.aggregate([
      {
        $match: {
          ...baseMatch,
          status: { $in: ['RESOLVED', 'VERIFIED'] },
          'sla.resolutionTimeMinutes': { $exists: true, $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgMinutes: { $avg: '$sla.resolutionTimeMinutes' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Transform status counts
  const statusMap = {};
  statusCounts.forEach((s) => { statusMap[s._id] = s.count; });

  const total = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const open = (statusMap.PENDING || 0) + (statusMap.ASSIGNED || 0) + (statusMap.ACCEPTED || 0);
  const inProgress = statusMap.IN_PROGRESS || 0;
  const resolved = (statusMap.RESOLVED || 0) + (statusMap.VERIFIED || 0);
  const critical = (priorityCounts.find((p) => p._id === 'CRITICAL') || {}).count || 0;

  const avgRes = avgResolution[0];

  return {
    total,
    open,
    inProgress,
    resolved,
    cancelled: statusMap.CANCELLED || 0,
    reopened: statusMap.REOPENED || 0,
    critical,
    slaBreached: slaStats[0]?.slaBreached || 0,
    avgResolutionHours: avgRes
      ? Math.round((avgRes.avgMinutes / 60) * 10) / 10
      : null,
    slaCompliance: total > 0
      ? Math.round(((total - (slaStats[0]?.slaBreached || 0)) / total) * 100)
      : 100,
    statusBreakdown: statusMap,
    priorityBreakdown: Object.fromEntries(
      priorityCounts.map((p) => [p._id, p.count])
    ),
  };
};

// ─── Complaints by Category ────────────────────────────────────────────────

const getComplaintsByCategory = async () => {
  return Complaint.aggregate([
    {
      $group: {
        _id: '$category.name',
        count: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'VERIFIED']] }, 1, 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        category: '$_id',
        count: 1,
        resolved: 1,
        pending: 1,
        resolutionRate: {
          $cond: [
            { $gt: ['$count', 0] },
            { $multiply: [{ $divide: ['$resolved', '$count'] }, 100] },
            0,
          ],
        },
      },
    },
  ]);
};

// ─── Complaints by Building ────────────────────────────────────────────────

const getComplaintsByBuilding = async () => {
  return Complaint.aggregate([
    { $match: { 'location.building': { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$location.building',
        count: { $sum: 1 },
        critical: {
          $sum: { $cond: [{ $eq: ['$priority.level', 'CRITICAL'] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'VERIFIED']] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        building: '$_id',
        count: 1,
        critical: 1,
        resolved: 1,
      },
    },
  ]);
};

// ─── Complaints by Department ──────────────────────────────────────────────

const getComplaintsByDepartment = async () => {
  return Complaint.aggregate([
    {
      $group: {
        _id: '$department.name',
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
        resolved: {
          $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'VERIFIED']] }, 1, 0] },
        },
        avgResolution: { $avg: '$sla.resolutionTimeMinutes' },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        department: '$_id',
        total: 1, pending: 1, inProgress: 1, resolved: 1,
        avgResolutionHours: {
          $cond: [
            { $gt: ['$avgResolution', 0] },
            { $divide: ['$avgResolution', 60] },
            null,
          ],
        },
      },
    },
  ]);
};

// ─── Monthly Trend ─────────────────────────────────────────────────────────

const getMonthlyTrend = async (year = new Date().getFullYear()) => {
  return Complaint.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' } },
        total: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'VERIFIED']] }, 1, 0] },
        },
        critical: {
          $sum: { $cond: [{ $eq: ['$priority.level', 'CRITICAL'] }, 1, 0] },
        },
      },
    },
    { $sort: { '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        total: 1,
        resolved: 1,
        critical: 1,
      },
    },
  ]);
};

// ─── Staff Workload ────────────────────────────────────────────────────────

const getStaffWorkload = async (departmentId = null) => {
  const match = departmentId ? { departmentId } : {};

  return StaffProfile.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentId',
        foreignField: '_id',
        as: 'dept',
      },
    },
    { $unwind: { path: '$dept', preserveNullAndEmpty: true } },
    {
      $project: {
        _id: 0,
        staffId: '$userId',
        name: '$user.name',
        email: '$user.email',
        department: '$dept.name',
        activeTaskCount: 1,
        totalTasksCompleted: 1,
        averageRating: 1,
        availability: 1,
      },
    },
    { $sort: { activeTaskCount: -1 } },
  ]);
};

// ─── Priority Distribution ─────────────────────────────────────────────────

const getPriorityDistribution = async () => {
  return Complaint.aggregate([
    {
      $group: {
        _id: '$priority.level',
        count: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $in: ['$status', ['RESOLVED', 'VERIFIED']] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        priority: '$_id',
        count: 1,
        resolved: 1,
      },
    },
    {
      $sort: {
        priority: 1,
      },
    },
  ]);
};

// ─── Average Rating ────────────────────────────────────────────────────────

const getAverageRating = async () => {
  const result = await Feedback.aggregate([
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        total: { $sum: 1 },
        fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        oneStars: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
      },
    },
  ]);
  return result[0] || { avgRating: 0, total: 0 };
};

module.exports = {
  getDashboardKPIs,
  getComplaintsByCategory,
  getComplaintsByBuilding,
  getComplaintsByDepartment,
  getMonthlyTrend,
  getStaffWorkload,
  getPriorityDistribution,
  getAverageRating,
};
