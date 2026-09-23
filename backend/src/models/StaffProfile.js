const mongoose = require('mongoose');

const staffProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    employeeId: {
      type: String,
      trim: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ], // e.g. ['electrical', 'plumbing', 'hvac']
    availability: {
      type: String,
      enum: ['AVAILABLE', 'BUSY', 'ON_LEAVE', 'OFFLINE'],
      default: 'AVAILABLE',
    },
    shiftStart: String, // e.g. "09:00"
    shiftEnd: String,   // e.g. "18:00"

    // Live workload counter (updated atomically)
    activeTaskCount: { type: Number, default: 0 },
    totalTasksCompleted: { type: Number, default: 0 },

    // Performance metrics
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    averageResolutionHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

staffProfileSchema.index({ departmentId: 1, availability: 1 });
staffProfileSchema.index({ activeTaskCount: 1 });

const StaffProfile = mongoose.model('StaffProfile', staffProfileSchema);
module.exports = StaffProfile;
