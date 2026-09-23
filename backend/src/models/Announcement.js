const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Target audience
    targetAudience: {
      type: [String],
      enum: ['ALL', 'USER', 'STAFF', 'MANAGER', 'ADMIN'],
      default: ['ALL'],
    },
    // Optional — specific building affected
    building: String,
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ isActive: 1, startDate: -1 });
announcementSchema.index({ targetAudience: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;
