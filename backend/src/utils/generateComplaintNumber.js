/**
 * Generates a unique complaint number in the format CMP-YYYY-NNNNNN.
 * Uses the last complaint's number + 1, with fallback to timestamp-based sequence.
 */

const Complaint = require('../models/Complaint');

const generateComplaintNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `CMP-${year}-`;

  // Find the highest number for this year
  const lastComplaint = await Complaint.findOne(
    { complaintNumber: { $regex: `^${prefix}` } },
    { complaintNumber: 1 },
    { sort: { complaintNumber: -1 } }
  ).lean();

  if (lastComplaint) {
    const lastSeq = parseInt(lastComplaint.complaintNumber.split('-')[2], 10);
    const nextSeq = (lastSeq + 1).toString().padStart(6, '0');
    return `${prefix}${nextSeq}`;
  }

  return `${prefix}000001`;
};

module.exports = generateComplaintNumber;
