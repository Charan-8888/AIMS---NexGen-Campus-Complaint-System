/**
 * Assignment Service
 * Handles automatic and manual complaint-to-staff assignment.
 * Uses MongoDB transactions to ensure atomicity:
 *   complaint update + staff workload update + notification + audit log
 */

const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const StaffProfile = require('../models/StaffProfile');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { notify } = require('./notificationService');
const env = require('../config/environment');
const logger = require('../utils/logger');

/**
 * Find the most suitable available staff member for a department.
 * Algorithm: filter by department + AVAILABLE status, sort by activeTaskCount ASC.
 *
 * @param {string} departmentId
 * @returns {Promise<StaffProfile | null>}
 */
const findBestAvailableStaff = async (departmentId) => {
  const profile = await StaffProfile.findOne({
    departmentId,
    availability: { $in: ['AVAILABLE', 'BUSY'] }, // BUSY staff can still take tasks
  })
    .sort({ activeTaskCount: 1 }) // Least loaded first
    .populate('userId', 'name email isActive')
    .lean();

  if (!profile || !profile.userId || !profile.userId.isActive) {
    return null;
  }

  return profile;
};

/**
 * Assign a complaint to a staff member using a MongoDB transaction.
 *
 * @param {string} complaintId
 * @param {string} staffUserId - the User._id of the technician
 * @param {object} assignedByUser - req.user (the manager/admin doing the assignment)
 * @returns {Promise<Complaint>}
 */
const assignComplaint = async (complaintId, staffUserId, assignedByUser) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate complaint exists and is assignable
    const complaint = await Complaint.findById(complaintId).session(session);
    if (!complaint) throw new Error('Complaint not found');

    if (['VERIFIED', 'CANCELLED'].includes(complaint.status)) {
      throw new Error(`Cannot assign a complaint with status ${complaint.status}`);
    }

    // 2. Validate staff member exists
    const staffUser = await User.findById(staffUserId).session(session);
    if (!staffUser || staffUser.role !== 'STAFF') {
      throw new Error('Invalid staff member');
    }

    const oldAssignedTo = complaint.assignedTo?.staffId;

    // 3. Update complaint
    const timelineEntry = {
      status: 'ASSIGNED',
      performedBy: {
        userId: assignedByUser._id,
        name: assignedByUser.name,
        role: assignedByUser.role,
      },
      note: `Assigned to ${staffUser.name} by ${assignedByUser.name}`,
      timestamp: new Date(),
    };

    await Complaint.findByIdAndUpdate(
      complaintId,
      {
        status: 'ASSIGNED',
        assignedTo: {
          staffId: staffUser._id,
          name: staffUser.name,
          assignedAt: new Date(),
          assignedBy: assignedByUser._id,
        },
        $push: { timeline: timelineEntry },
        'sla.firstResponseAt': complaint.sla?.firstResponseAt || new Date(),
      },
      { session }
    );

    // 4. Update staff workload counter
    // If reassigning, decrement old staff's counter
    if (oldAssignedTo && oldAssignedTo.toString() !== staffUserId) {
      await StaffProfile.findOneAndUpdate(
        { userId: oldAssignedTo },
        { $inc: { activeTaskCount: -1 } },
        { session }
      );
    }

    // Increment new staff's counter (only if not already assigned to them)
    if (!oldAssignedTo || oldAssignedTo.toString() !== staffUserId) {
      await StaffProfile.findOneAndUpdate(
        { userId: staffUserId },
        { $inc: { activeTaskCount: 1 } },
        { session }
      );
    }

    // 5. Create audit log
    await AuditLog.create(
      [
        {
          actorId: assignedByUser._id,
          actorName: assignedByUser.name,
          actorRole: assignedByUser.role,
          action: oldAssignedTo ? 'COMPLAINT_REASSIGNED' : 'COMPLAINT_ASSIGNED',
          entityType: 'Complaint',
          entityId: complaint._id,
          entityLabel: complaint.complaintNumber,
          oldValue: oldAssignedTo ? { staffId: oldAssignedTo } : null,
          newValue: { staffId: staffUserId, name: staffUser.name },
          description: `Complaint ${complaint.complaintNumber} assigned to ${staffUser.name}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // 6. Send notifications (outside transaction — not critical)
    await notify({
      userId: complaint.createdBy.userId,
      type: 'COMPLAINT_ASSIGNED',
      templateArgs: [complaint.complaintNumber, complaint.department?.name || 'Maintenance'],
      entityType: 'Complaint',
      entityId: complaint._id,
      complaintNumber: complaint.complaintNumber,
    });

    logger.info(
      `[Assignment] Complaint ${complaint.complaintNumber} assigned to ${staffUser.name} by ${assignedByUser.name}`
    );

    return await Complaint.findById(complaintId);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`[Assignment] Transaction failed: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Auto-assign complaint to the least-loaded available staff in the department.
 */
const autoAssign = async (complaintId, departmentId, systemUser) => {
  const bestStaff = await findBestAvailableStaff(departmentId);

  if (!bestStaff) {
    logger.warn(`[Assignment] No available staff found for department ${departmentId}`);
    return null;
  }

  return assignComplaint(complaintId, bestStaff.userId._id.toString(), systemUser);
};

// SLA deadline helpers
const getSlaDeadline = (priority) => {
  const hoursMap = {
    LOW: env.SLA_HOURS.LOW,
    MEDIUM: env.SLA_HOURS.MEDIUM,
    HIGH: env.SLA_HOURS.HIGH,
    CRITICAL: env.SLA_HOURS.CRITICAL,
  };
  const hours = hoursMap[priority] || hoursMap.MEDIUM;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

module.exports = { assignComplaint, autoAssign, findBestAvailableStaff, getSlaDeadline };
