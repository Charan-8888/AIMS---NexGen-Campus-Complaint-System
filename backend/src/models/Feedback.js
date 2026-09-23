const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      unique: true, // one feedback per complaint
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Resolution satisfaction
    resolvedSatisfactorily: {
      type: Boolean,
      default: true,
    },
    // How fast was it resolved?
    speedRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    // Staff behavior
    staffRating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ rating: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
