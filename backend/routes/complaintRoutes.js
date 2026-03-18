const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { getComplaints, getComplaintById, createComplaint, updateComplaintStatus, uploadAttachment } = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

router.route('/')
  .get(protect, getComplaints)
  .post(protect, authorize('citizen'), createComplaint);

router.route('/upload')
  .post(protect, upload.single('file'), uploadAttachment);

router.route('/:id')
  .get(protect, getComplaintById);

router.route('/:id/status')
  .put(protect, authorize('ministry_admin', 'gov_admin', 'super_admin'), updateComplaintStatus);

module.exports = router;
