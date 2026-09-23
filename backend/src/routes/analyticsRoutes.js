const express = require('express');
const router = express.Router();
const {
  getDashboardKPIs, getComplaintsByCategory, getComplaintsByBuilding,
  getComplaintsByDepartment, getMonthlyTrend, getStaffWorkload,
  getPriorityDistribution, getAverageRating,
} = require('../services/analyticsService');
const { authenticate } = require('../middleware/authMiddleware');
const { isAdminOrManager } = require('../middleware/roleMiddleware');
const { sendSuccess } = require('../utils/apiResponse');

router.use(authenticate, isAdminOrManager);

router.get('/dashboard', async (req, res, next) => {
  try {
    const kpis = await getDashboardKPIs();
    return sendSuccess(res, kpis, 'Dashboard KPIs fetched');
  } catch (error) { next(error); }
});

router.get('/categories', async (req, res, next) => {
  try {
    const data = await getComplaintsByCategory();
    return sendSuccess(res, data, 'Category analytics fetched');
  } catch (error) { next(error); }
});

router.get('/buildings', async (req, res, next) => {
  try {
    const data = await getComplaintsByBuilding();
    return sendSuccess(res, data, 'Building analytics fetched');
  } catch (error) { next(error); }
});

router.get('/departments', async (req, res, next) => {
  try {
    const data = await getComplaintsByDepartment();
    return sendSuccess(res, data, 'Department analytics fetched');
  } catch (error) { next(error); }
});

router.get('/monthly-trend', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await getMonthlyTrend(year);
    return sendSuccess(res, data, 'Monthly trend fetched');
  } catch (error) { next(error); }
});

router.get('/staff-workload', async (req, res, next) => {
  try {
    const data = await getStaffWorkload();
    return sendSuccess(res, data, 'Staff workload fetched');
  } catch (error) { next(error); }
});

router.get('/priority-distribution', async (req, res, next) => {
  try {
    const data = await getPriorityDistribution();
    return sendSuccess(res, data, 'Priority distribution fetched');
  } catch (error) { next(error); }
});

router.get('/ratings', async (req, res, next) => {
  try {
    const data = await getAverageRating();
    return sendSuccess(res, data, 'Rating analytics fetched');
  } catch (error) { next(error); }
});

module.exports = router;
