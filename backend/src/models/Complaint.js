const mongoose = require('mongoose');

// ─── Sub-schemas ───────────────────────────────────────────────────────────

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    performedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      role: String,
    },
    note: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['image', 'video', 'document'],
      default: 'image',
    },
    url: { type: String, required: true },
    publicId: String, // Cloudinary public_id
    filename: String,
    size: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    category: String,
    confidence: Number,
    priority: String,
    priorityScore: Number,
    department: String,
    reason: String,
    recommendedAction: String,
    summary: String,
    analyzedAt: { type: Date, default: Date.now },
    provider: { type: String, default: 'groq' },
    model: String,
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    overriddenAt: Date,
    overrideReason: String,
  },
  { _id: false }
);

const prioritySchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    score: { type: Number, min: 1, max: 10, default: 5 },
    reason: String,
    // AI vs final priority tracking
    aiSuggested: String,
    aiConfidence: Number,
    finalSetBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    finalSetAt: Date,
  },
  { _id: false }
);

// ─── Main Complaint Schema ─────────────────────────────────────────────────

const complaintSchema = new mongoose.Schema(
  {
    complaintNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Who submitted the complaint
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: { type: String, required: true },
      email: String,
      phone: String,
    },

    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // Embedded category info (denormalized for quick display)
    category: {
      categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
      name: String,
      code: String,
      confidence: Number, // AI confidence in classification
    },

    priority: prioritySchema,

    // Embedded department info
    department: {
      departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
      name: String,
      code: String,
    },

    // Embedded location (snapshot at time of complaint)
    location: {
      locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
      campus: { type: String, default: 'NexGen University' },
      building: String,
      floor: Number,
      room: String,
      area: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Status workflow
    status: {
      type: String,
      enum: [
        'PENDING',
        'ASSIGNED',
        'ACCEPTED',
        'IN_PROGRESS',
        'ON_HOLD',
        'RESOLVED',
        'VERIFIED',
        'REOPENED',
        'CANCELLED',
      ],
      default: 'PENDING',
    },

    // Staff assignment
    assignedTo: {
      staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      assignedAt: Date,
      assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },

    // Embedded timeline (append-only)
    timeline: [timelineEntrySchema],

    // Uploaded files
    attachments: [attachmentSchema],

    // AI analysis snapshot (embedded for quick access)
    aiAnalysis: aiAnalysisSchema,

    // SLA tracking
    sla: {
      deadline: Date,
      breached: { type: Boolean, default: false },
      firstResponseAt: Date,
      resolvedAt: Date,
      resolutionTimeMinutes: Number,
    },

    // Resolution info
    resolution: {
      resolvedAt: Date,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      summary: String,
    },

    // User verification
    verification: {
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      satisfied: Boolean,
      reopenReason: String,
    },

    // How many times the complaint was reopened
    reopenCount: { type: Number, default: 0 },

    // Admin notes (internal)
    adminNotes: String,

    // Escalation tracking
    escalated: { type: Boolean, default: false },
    escalatedAt: Date,
    escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────
complaintSchema.index({ 'createdBy.userId': 1 });
complaintSchema.index({ status: 1, 'department.departmentId': 1 });
complaintSchema.index({ 'assignedTo.staffId': 1, status: 1 });
complaintSchema.index({ 'priority.level': 1, createdAt: -1 });
complaintSchema.index({ 'location.building': 1 });
complaintSchema.index({ 'category.name': 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ 'sla.deadline': 1 });

// Full-text search index
complaintSchema.index(
  { title: 'text', description: 'text', 'location.room': 'text' },
  { weights: { title: 10, description: 5 } }
);

// ─── Virtual ──────────────────────────────────────────────────────────────
complaintSchema.virtual('isOverdue').get(function () {
  if (!this.sla || !this.sla.deadline) return false;
  if (['RESOLVED', 'VERIFIED', 'CANCELLED'].includes(this.status)) return false;
  return new Date() > this.sla.deadline;
});

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
