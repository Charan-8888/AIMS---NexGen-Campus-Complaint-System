const express = require('express');
const router = express.Router();
const {
  createComplaint, getComplaints, getComplaint,
  updateStatus, assignComplaintHandler, verifyResolution,
  addWorkUpdate, submitFeedback, overrideAI,
} = require('../controllers/complaintController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// All complaint routes require auth
router.use(authenticate);

// Create — users, staff, managers, admins can create
router.post('/', upload.array('images', 5), createComplaint);

// List — role-filtered automatically in controller
router.get('/', getComplaints);

// Single complaint detail
router.get('/:id', getComplaint);

// Status update — staff, manager, admin
router.post('/:id/status', authorize('STAFF', 'MANAGER', 'ADMIN'), updateStatus);

// Assign — manager, admin
router.post('/:id/assign', authorize('MANAGER', 'ADMIN'), assignComplaintHandler);

// User verification
router.post('/:id/verify', authorize('USER'), verifyResolution);

// Staff work update with optional after images
router.post('/:id/work-update', authorize('STAFF'), upload.array('images', 5), addWorkUpdate);

// Submit feedback
router.post('/:id/feedback', authorize('USER'), submitFeedback);

// Override AI analysis
router.post('/:id/override-ai', authorize('MANAGER', 'ADMIN'), overrideAI);

module.exports = router;
