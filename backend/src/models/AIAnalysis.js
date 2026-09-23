const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    complaintNumber: String,

    // Input sent to AI
    input: {
      title: String,
      description: String,
    },

    // Raw AI response (unparsed)
    rawResponse: mongoose.Schema.Types.Mixed,

    // Validated structured result
    result: {
      category: String,
      confidence: Number,
      priority: String,
      priorityScore: Number,
      department: String,
      reason: String,
      recommendedAction: String,
      summary: String,
    },

    // Provider metadata
    provider: { type: String, default: 'groq' },
    model: String,
    promptTokens: Number,
    completionTokens: Number,
    durationMs: Number,

    // Was the AI result overridden by a human?
    wasOverridden: { type: Boolean, default: false },
    overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    overriddenAt: Date,
    overrideReason: String,

    // Final values after override (if any)
    finalCategory: String,
    finalPriority: String,
    finalDepartment: String,

    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'FALLBACK'],
      default: 'PENDING',
    },
    errorMessage: String,
  },
  { timestamps: true }
);

aiAnalysisSchema.index({ complaintId: 1 });
aiAnalysisSchema.index({ createdAt: -1 });
aiAnalysisSchema.index({ provider: 1, status: 1 });

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);
module.exports = AIAnalysis;
