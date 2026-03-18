const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getProjects, createProject, updateProject, deleteProject } = require('../controllers/projectController');

router.route('/')
  .get(protect, getProjects)
  .post(protect, authorize('ministry_admin'), createProject);

router.route('/:id')
  .put(protect, authorize('ministry_admin', 'gov_admin', 'super_admin'), updateProject)
  .delete(protect, authorize('ministry_admin', 'gov_admin', 'super_admin'), deleteProject);

module.exports = router;
