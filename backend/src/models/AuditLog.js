const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: String,
    actorRole: String,

    action: {
      type: String,
      required: true,
      // Examples: COMPLAINT_ASSIGNED, USER_ROLE_CHANGED, COMPLAINT_REOPENED,
      //           AI_OVERRIDE, CATEGORY_CREATED, STAFF_ADDED, etc.
    },

    entityType: {
      type: String,
      enum: ['Complaint', 'User', 'Department', 'Category', 'Location', 'Staff', 'Announcement', 'System'],
      required: true,
    },
    entityId: mongoose.Schema.Types.ObjectId,
    entityLabel: String, // e.g. complaint number, user name

    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,

    description: String, // Human-readable description
    ipAddress: String,
  },
  {
    timestamps: true,
    // Audit logs are never updated
    strict: true,
  }
);

auditLogSchema.index({ actorId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
