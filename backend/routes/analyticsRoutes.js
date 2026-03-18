const express = require('express');
const router = express.Router();
const { getDashboardAnalytics, getMinistryAnalytics } = require('../controllers/analyticsController');

router.route('/')
  .get(getDashboardAnalytics);

router.route('/ministry/:id')
  .get(getMinistryAnalytics);

module.exports = router;
