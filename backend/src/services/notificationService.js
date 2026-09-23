/**
 * Notification Service
 * Centralized helper for creating in-app notifications.
 * Called from complaint controller, assignment service, etc.
 */

const Notification = require('../models/Notification');
const logger = require('../utils/logger');

const NOTIFICATION_TEMPLATES = {
  COMPLAINT_CREATED: (cn) => ({
    title: 'Complaint Submitted',
    message: `Your complaint ${cn} has been submitted and is under review.`,
  }),
  COMPLAINT_ASSIGNED: (cn, dept) => ({
    title: 'Complaint Assigned',
    message: `Your complaint ${cn} has been assigned to ${dept}.`,
  }),
  COMPLAINT_ACCEPTED: (cn) => ({
    title: 'Work Started',
    message: `Maintenance staff has accepted and started working on your complaint ${cn}.`,
  }),
  COMPLAINT_IN_PROGRESS: (cn) => ({
    title: 'In Progress',
    message: `Your complaint ${cn} is currently being worked on.`,
  }),
  COMPLAINT_RESOLVED: (cn) => ({
    title: 'Complaint Resolved',
    message: `Your complaint ${cn} has been marked as resolved. Please verify and provide feedback.`,
  }),
  COMPLAINT_REOPENED: (cn) => ({
    title: 'Complaint Reopened',
    message: `Complaint ${cn} has been reopened and sent back to the department.`,
  }),
  COMPLAINT_CANCELLED: (cn) => ({
    title: 'Complaint Cancelled',
    message: `Your complaint ${cn} has been cancelled.`,
  }),
  COMPLAINT_ESCALATED: (cn) => ({
    title: 'Complaint Escalated',
    message: `Complaint ${cn} has been escalated due to SLA breach.`,
  }),
  SLA_BREACH: (cn) => ({
    title: 'SLA Deadline Exceeded',
    message: `Complaint ${cn} has exceeded its SLA deadline and requires immediate attention.`,
  }),
  FEEDBACK_REQUESTED: (cn) => ({
    title: 'Feedback Requested',
    message: `Please provide feedback for resolved complaint ${cn}.`,
  }),
};

/**
 * Create a notification for a user.
 *
 * @param {object} opts
 * @param {string} opts.userId - recipient user ID
 * @param {string} opts.type - one of NOTIFICATION_TEMPLATES keys
 * @param {string[]} opts.templateArgs - arguments for the template
 * @param {string} opts.entityType
 * @param {string} opts.entityId
 * @param {string} opts.complaintNumber
 */
const notify = async ({ userId, type, templateArgs = [], entityType, entityId, complaintNumber } = {}) => {
  try {
    const template = NOTIFICATION_TEMPLATES[type];
    if (!template) {
      logger.warn(`[Notification] Unknown type: ${type}`);
      return null;
    }

    const { title, message } = template(...templateArgs);

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedEntity: {
        entityType,
        entityId,
        complaintNumber,
      },
    });

    return notification;
  } catch (error) {
    // Notification failure should never crash the main request
    logger.error(`[Notification] Failed to create notification: ${error.message}`);
    return null;
  }
};

/**
 * Notify multiple users at once.
 */
const notifyMany = async (userIds, opts) => {
  return Promise.allSettled(
    userIds.map((userId) => notify({ ...opts, userId }))
  );
};

module.exports = { notify, notifyMany };
