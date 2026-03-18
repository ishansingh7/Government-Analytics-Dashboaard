const express = require('express');
const router = express.Router();
const { getMinistries, getMinistryById, createMinistry, updateBudget, updateMinistry, deleteMinistry } = require('../controllers/ministryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getMinistries)
  .post(protect, authorize('super_admin'), createMinistry);

router.route('/:id')
  .get(getMinistryById)
  .put(protect, authorize('super_admin'), updateMinistry)
  .delete(protect, authorize('super_admin'), deleteMinistry);

router.route('/:id/budget')
  .put(protect, authorize('super_admin', 'gov_admin', 'ministry_admin'), updateBudget);

module.exports = router;
