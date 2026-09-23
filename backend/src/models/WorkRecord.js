const mongoose = require('mongoose');

const workRecordSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    technicianName: String,

    startedAt: Date,
    completedAt: Date,
    durationMinutes: Number, // calculated on save

    workPerformed: {
      type: String,
      trim: true,
    },

    materials: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unit: String,
        cost: Number,
      },
    ],

    totalCost: { type: Number, default: 0 },

    // Before/after images
    beforeImages: [
      {
        url: String,
        publicId: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    afterImages: [
      {
        url: String,
        publicId: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    remarks: String,

    resolutionType: {
      type: String,
      enum: ['REPAIRED', 'REPLACED', 'ADJUSTED', 'CLEANED', 'ESCALATED', 'OTHER'],
      default: 'REPAIRED',
    },
  },
  { timestamps: true }
);

// Calculate duration on save
workRecordSchema.pre('save', function (next) {
  if (this.startedAt && this.completedAt) {
    this.durationMinutes = Math.round(
      (this.completedAt - this.startedAt) / 1000 / 60
    );
  }
  // Calculate total cost from materials
  if (this.materials && this.materials.length > 0) {
    this.totalCost = this.materials.reduce((sum, m) => sum + (m.cost || 0) * (m.quantity || 1), 0);
  }
  next();
});

workRecordSchema.index({ complaintId: 1 });
workRecordSchema.index({ technicianId: 1 });
workRecordSchema.index({ createdAt: -1 });

const WorkRecord = mongoose.model('WorkRecord', workRecordSchema);
module.exports = WorkRecord;
