const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'COMPLAINT_CREATED',
        'COMPLAINT_ASSIGNED',
        'COMPLAINT_ACCEPTED',
        'COMPLAINT_IN_PROGRESS',
        'COMPLAINT_RESOLVED',
        'COMPLAINT_REOPENED',
        'COMPLAINT_CANCELLED',
        'COMPLAINT_ESCALATED',
        'FEEDBACK_REQUESTED',
        'SLA_BREACH',
        'ANNOUNCEMENT',
        'SYSTEM',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // Link to related entity
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['Complaint', 'Announcement', 'User'],
      },
      entityId: mongoose.Schema.Types.ObjectId,
      complaintNumber: String, // quick display
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
