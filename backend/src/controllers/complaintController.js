const Complaint = require('../models/Complaint');
const Category = require('../models/Category');
const Department = require('../models/Department');
const Location = require('../models/Location');
const WorkRecord = require('../models/WorkRecord');
const Feedback = require('../models/Feedback');
const AuditLog = require('../models/AuditLog');
const StaffProfile = require('../models/StaffProfile');
const { analyzeComplaint } = require('../services/aiService');
const { assignComplaint, getSlaDeadline } = require('../services/assignmentService');
const { notify } = require('../services/notificationService');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');
const generateComplaintNumber = require('../utils/generateComplaintNumber');
const { sendSuccess, sendPaginated, sendError, buildPagination } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ─── Create Complaint ──────────────────────────────────────────────────────

const createComplaint = async (req, res, next) => {
  try {
    const {
      title, description, categoryId, locationId,
      building, floor, room, area, campus,
      priorityOverride, contactPhone,
    } = req.body;

    // Validate location/category if provided
    let categoryDoc = null;
    let locationDoc = null;
    let departmentDoc = null;

    if (categoryId) {
      categoryDoc = await Category.findById(categoryId).populate('defaultDepartmentId');
    }

    if (locationId) {
      locationDoc = await Location.findById(locationId);
    }

    // Generate complaint number
    const complaintNumber = await generateComplaintNumber();

    // Handle image uploads
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadToCloudinary(
          file.buffer,
          `aims-campus/complaints/${complaintNumber}`,
          `${complaintNumber}_${Date.now()}`
        );
        attachments.push({
          type: 'image',
          url: uploaded.url,
          publicId: uploaded.publicId,
          filename: file.originalname,
          size: file.size,
          uploadedBy: req.user._id,
        });
      }
    }

    // Build the complaint document
    const complaintData = {
      complaintNumber,
      createdBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: contactPhone || req.user.phone,
      },
      title,
      description,
      category: categoryDoc
        ? {
            categoryId: categoryDoc._id,
            name: categoryDoc.name,
            code: categoryDoc.code,
          }
        : undefined,
      department: categoryDoc?.defaultDepartmentId
        ? {
            departmentId: categoryDoc.defaultDepartmentId._id,
            name: categoryDoc.defaultDepartmentId.name,
            code: categoryDoc.defaultDepartmentId.code,
          }
        : undefined,
      location: locationDoc
        ? {
            locationId: locationDoc._id,
            campus: locationDoc.campus,
            building: locationDoc.building,
            floor: locationDoc.floor,
            room: locationDoc.room,
            area: locationDoc.area,
          }
        : {
            campus: campus || 'NexGen University',
            building,
            floor: floor ? parseInt(floor) : undefined,
            room,
            area,
          },
      priority: {
        level: 'MEDIUM', // Default until AI sets it
        score: 5,
        reason: 'Pending AI analysis',
      },
      attachments,
      status: 'PENDING',
      timeline: [
        {
          status: 'PENDING',
          performedBy: { userId: req.user._id, name: req.user.name, role: req.user.role },
          note: 'Complaint created',
          timestamp: new Date(),
        },
      ],
    };

    const complaint = await Complaint.create(complaintData);

    // Trigger AI analysis asynchronously (don't block the response)
    analyzeComplaint(title, description, complaint._id.toString(), complaintNumber)
      .then(async (analysis) => {
        if (!analysis || analysis.status === 'FAILED') return;

        const aiResult = analysis.result;
        const slaDeadline = getSlaDeadline(aiResult.priority);

        // Find the matching department document for AI's suggestion
        let aiDept = null;
        try {
          aiDept = await Department.findOne({
            name: { $regex: aiResult.department, $options: 'i' },
          });
        } catch { /* ignore */ }

        // Update complaint with AI results
        await Complaint.findByIdAndUpdate(complaint._id, {
          'category.name': aiResult.category,
          'category.confidence': aiResult.confidence,
          'priority.level': priorityOverride || aiResult.priority,
          'priority.score': aiResult.priorityScore,
          'priority.reason': aiResult.reason,
          'priority.aiSuggested': aiResult.priority,
          'priority.aiConfidence': aiResult.confidence,
          'department.departmentId': aiDept?._id,
          'department.name': aiResult.department,
          'sla.deadline': slaDeadline,
          aiAnalysis: {
            category: aiResult.category,
            confidence: aiResult.confidence,
            priority: aiResult.priority,
            priorityScore: aiResult.priorityScore,
            department: aiResult.department,
            reason: aiResult.reason,
            recommendedAction: aiResult.recommendedAction,
            summary: aiResult.summary,
            analyzedAt: new Date(),
            provider: analysis.provider,
            model: analysis.model,
          },
        });

        logger.info(`[Complaint] AI analysis applied to ${complaintNumber}`);
      })
      .catch((err) => {
        logger.error(`[Complaint] AI analysis error for ${complaintNumber}: ${err.message}`);
      });

    // Send creation notification
    await notify({
      userId: req.user._id,
      type: 'COMPLAINT_CREATED',
      templateArgs: [complaintNumber],
      entityType: 'Complaint',
      entityId: complaint._id,
      complaintNumber,
    });

    logger.info(`[Complaint] Created: ${complaintNumber} by ${req.user.name}`);

    return sendSuccess(res, { complaint }, 'Complaint submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

// ─── List Complaints ───────────────────────────────────────────────────────

const getComplaints = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, status, priority, category, building,
      department, assignedTo, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'USER') {
      filter['createdBy.userId'] = req.user._id;
    } else if (req.user.role === 'STAFF') {
      filter['assignedTo.staffId'] = req.user._id;
    } else if (req.user.role === 'MANAGER') {
      // Managers see their department's complaints
      const staffProfile = await StaffProfile.findOne({ userId: req.user._id });
      if (staffProfile) {
        filter['department.departmentId'] = staffProfile.departmentId;
      }
    }
    // ADMIN sees all

    if (status) filter.status = status;
    if (priority) filter['priority.level'] = priority;
    if (category) filter['category.name'] = { $regex: category, $options: 'i' };
    if (building) filter['location.building'] = { $regex: building, $options: 'i' };
    if (department) filter['department.name'] = { $regex: department, $options: 'i' };
    if (assignedTo) filter['assignedTo.staffId'] = assignedTo;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Full-text search
    if (search) {
      filter.$text = { $search: search };
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .select('-timeline -aiAnalysis') // Exclude heavy embedded arrays from list view
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    return sendPaginated(
      res,
      complaints,
      buildPagination(pageNum, limitNum, total),
      'Complaints fetched'
    );
  } catch (error) {
    next(error);
  }
};

// ─── Get Single Complaint ──────────────────────────────────────────────────

const getComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id)
      .populate('createdBy.userId', 'name email profileImage')
      .populate('assignedTo.staffId', 'name email profileImage')
      .lean();

    if (!complaint) {
      return sendError(res, 'Complaint not found', 404);
    }

    // Access control: users can only see their own complaints
    if (
      req.user.role === 'USER' &&
      complaint.createdBy.userId._id?.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Access denied', 403);
    }

    // Fetch related work record if resolved
    let workRecord = null;
    if (['RESOLVED', 'VERIFIED'].includes(complaint.status)) {
      workRecord = await WorkRecord.findOne({ complaintId: id }).lean();
    }

    // Fetch feedback if verified
    let feedback = null;
    if (complaint.status === 'VERIFIED') {
      feedback = await Feedback.findOne({ complaintId: id }).lean();
    }

    return sendSuccess(res, { complaint, workRecord, feedback }, 'Complaint fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Update Complaint Status ───────────────────────────────────────────────

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validTransitions = {
      STAFF: ['ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED'],
      MANAGER: ['IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CANCELLED'],
      ADMIN: ['PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CANCELLED'],
    };

    const allowed = validTransitions[req.user.role] || [];
    if (!allowed.includes(status)) {
      return sendError(
        res,
        `Your role cannot set status to ${status}`,
        403
      );
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found', 404);

    // Staff can only update their own assigned complaints
    if (
      req.user.role === 'STAFF' &&
      complaint.assignedTo?.staffId?.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'You are not assigned to this complaint', 403);
    }

    const timelineEntry = {
      status,
      performedBy: { userId: req.user._id, name: req.user.name, role: req.user.role },
      note: note || `Status updated to ${status}`,
      timestamp: new Date(),
    };

    const updates = {
      status,
      $push: { timeline: timelineEntry },
    };

    // Track resolution time
    if (status === 'RESOLVED') {
      const now = new Date();
      const resolutionMs = now - complaint.createdAt;
      updates['sla.resolvedAt'] = now;
      updates['sla.resolutionTimeMinutes'] = Math.round(resolutionMs / 1000 / 60);
      updates['resolution.resolvedAt'] = now;
      updates['resolution.resolvedBy'] = req.user._id;
      updates['resolution.summary'] = note;

      // Decrement staff workload
      if (complaint.assignedTo?.staffId) {
        await StaffProfile.findOneAndUpdate(
          { userId: complaint.assignedTo.staffId },
          {
            $inc: {
              activeTaskCount: -1,
              totalTasksCompleted: 1,
            },
          }
        );
      }
    }

    await Complaint.findByIdAndUpdate(id, updates);

    // Send notification to complaint creator
    const notifTypeMap = {
      ACCEPTED: 'COMPLAINT_ACCEPTED',
      IN_PROGRESS: 'COMPLAINT_IN_PROGRESS',
      RESOLVED: 'COMPLAINT_RESOLVED',
    };

    if (notifTypeMap[status]) {
      await notify({
        userId: complaint.createdBy.userId,
        type: notifTypeMap[status],
        templateArgs: [complaint.complaintNumber],
        entityType: 'Complaint',
        entityId: complaint._id,
        complaintNumber: complaint.complaintNumber,
      });
    }

    // Audit log
    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: `STATUS_CHANGED_TO_${status}`,
      entityType: 'Complaint',
      entityId: complaint._id,
      entityLabel: complaint.complaintNumber,
      oldValue: { status: complaint.status },
      newValue: { status },
      description: note,
    });

    const updated = await Complaint.findById(id);
    return sendSuccess(res, { complaint: updated }, `Complaint status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

// ─── Assign Complaint ──────────────────────────────────────────────────────

const assignComplaintHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!staffId) {
      return sendError(res, 'staffId is required', 400);
    }

    const complaint = await assignComplaint(id, staffId, req.user);
    return sendSuccess(res, { complaint }, 'Complaint assigned successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Verify Resolution ─────────────────────────────────────────────────────

const verifyResolution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { satisfied, reopenReason } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found', 404);

    // Only the original reporter can verify
    if (complaint.createdBy.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Only the original reporter can verify resolution', 403);
    }

    if (complaint.status !== 'RESOLVED') {
      return sendError(res, 'Complaint is not in RESOLVED status', 400);
    }

    const isResolved = satisfied !== false;
    const newStatus = isResolved ? 'VERIFIED' : 'REOPENED';

    const updates = {
      status: newStatus,
      verification: {
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
        satisfied: isResolved,
        reopenReason: isResolved ? undefined : reopenReason,
      },
      $push: {
        timeline: {
          status: newStatus,
          performedBy: { userId: req.user._id, name: req.user.name, role: req.user.role },
          note: isResolved ? 'User confirmed issue is resolved' : `User reopened: ${reopenReason || 'Issue still exists'}`,
          timestamp: new Date(),
        },
      },
    };

    if (!isResolved) {
      updates.$inc = { reopenCount: 1 };
    }

    await Complaint.findByIdAndUpdate(id, updates);

    if (!isResolved) {
      await notify({
        userId: complaint.createdBy.userId,
        type: 'COMPLAINT_REOPENED',
        templateArgs: [complaint.complaintNumber],
        entityType: 'Complaint',
        entityId: complaint._id,
        complaintNumber: complaint.complaintNumber,
      });
    }

    const updated = await Complaint.findById(id);
    return sendSuccess(
      res,
      { complaint: updated },
      isResolved ? 'Complaint marked as verified' : 'Complaint reopened'
    );
  } catch (error) {
    next(error);
  }
};

// ─── Add Work Update (Staff) ───────────────────────────────────────────────

const addWorkUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note, workPerformed, materials, remarks, resolutionType } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found', 404);

    if (complaint.assignedTo?.staffId?.toString() !== req.user._id.toString()) {
      return sendError(res, 'You are not assigned to this complaint', 403);
    }

    // Handle after images
    const afterImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadToCloudinary(
          file.buffer,
          `aims-campus/work-records/${complaint.complaintNumber}`
        );
        afterImages.push({ url: uploaded.url, publicId: uploaded.publicId });
      }
    }

    // Upsert work record
    await WorkRecord.findOneAndUpdate(
      { complaintId: id, technicianId: req.user._id },
      {
        $setOnInsert: { startedAt: new Date(), technicianName: req.user.name },
        $set: { workPerformed, remarks, resolutionType },
        $push: { afterImages: { $each: afterImages } },
        ...(materials && { $set: { materials: JSON.parse(materials) } }),
      },
      { upsert: true, new: true }
    );

    // Append timeline note
    await Complaint.findByIdAndUpdate(id, {
      $push: {
        timeline: {
          status: complaint.status,
          performedBy: { userId: req.user._id, name: req.user.name, role: 'STAFF' },
          note: note || workPerformed,
          timestamp: new Date(),
        },
      },
    });

    return sendSuccess(res, null, 'Work update added successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Submit Feedback ───────────────────────────────────────────────────────

const submitFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment, speedRating, staffRating } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found', 404);

    if (!['RESOLVED', 'VERIFIED'].includes(complaint.status)) {
      return sendError(res, 'Feedback can only be submitted for resolved complaints', 400);
    }

    if (complaint.createdBy.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Only the original reporter can submit feedback', 403);
    }

    // Check if feedback already exists
    const existing = await Feedback.findOne({ complaintId: id });
    if (existing) {
      return sendError(res, 'Feedback already submitted for this complaint', 409);
    }

    const feedback = await Feedback.create({
      complaintId: id,
      userId: req.user._id,
      rating,
      comment,
      speedRating,
      staffRating,
      resolvedSatisfactorily: rating >= 3,
    });

    // Update staff average rating
    if (complaint.assignedTo?.staffId) {
      const profile = await StaffProfile.findOne({ userId: complaint.assignedTo.staffId });
      if (profile) {
        const newTotal = profile.totalRatings + 1;
        const newAvg = ((profile.averageRating * profile.totalRatings) + rating) / newTotal;
        await StaffProfile.findOneAndUpdate(
          { userId: complaint.assignedTo.staffId },
          { averageRating: Math.round(newAvg * 10) / 10, totalRatings: newTotal }
        );
      }
    }

    return sendSuccess(res, { feedback }, 'Feedback submitted. Thank you!', 201);
  } catch (error) {
    next(error);
  }
};

// ─── Override AI Analysis ──────────────────────────────────────────────────

const overrideAI = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, priority, department, reason } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found', 404);

    const updates = {};
    if (category) updates['category.name'] = category;
    if (priority) {
      updates['priority.level'] = priority;
      updates['priority.finalSetBy'] = req.user._id;
      updates['priority.finalSetAt'] = new Date();
    }
    if (department) updates['department.name'] = department;

    // Mark AI analysis as overridden
    updates['aiAnalysis.overriddenBy'] = req.user._id;
    updates['aiAnalysis.overriddenAt'] = new Date();
    updates['aiAnalysis.overrideReason'] = reason;

    await Complaint.findByIdAndUpdate(id, updates);

    await AuditLog.create({
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'AI_OVERRIDE',
      entityType: 'Complaint',
      entityId: complaint._id,
      entityLabel: complaint.complaintNumber,
      oldValue: {
        category: complaint.category?.name,
        priority: complaint.priority?.level,
      },
      newValue: { category, priority, department },
      description: reason,
    });

    const updated = await Complaint.findById(id);
    return sendSuccess(res, { complaint: updated }, 'AI analysis overridden');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaint,
  updateStatus,
  assignComplaintHandler,
  verifyResolution,
  addWorkUpdate,
  submitFeedback,
  overrideAI,
};
