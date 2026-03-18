const Complaint = require('../models/Complaint');
const Ministry = require('../models/Ministry');

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = async (req, res) => {
  try {
    let query = {};
    const { ministryId } = req.query;
    
    // If citizen, only see their own complaints
    if (req.user.role === 'citizen') {
      query.userId = req.user._id;
    }
    // If ministry admin, only see complaints for their ministry
    else if (req.user.role === 'ministry_admin') {
      const ministry = await Ministry.findOne({ adminId: req.user._id });
      if (ministry) {
        query.ministryId = ministry._id;
      } else {
        return res.json([]); // Not assigned to any ministry
      }
    }
    // gov_admin / super_admin sees all
    // Allow filtering by ministryId for super/gov admins
    if ((req.user.role === 'gov_admin' || req.user.role === 'super_admin') && ministryId) {
      query.ministryId = ministryId;
    }

    const complaints = await Complaint.find(query)
      .populate('userId', 'name email')
      .populate('ministryId', 'name')
      .sort({ createdAt: -1 });
      
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('ministryId', 'name');
      
    if (complaint) {
        res.json(complaint);
    } else {
      res.status(404).json({ message: 'Complaint not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a complaint
// @route   POST /api/complaints
// @access  Private/Citizen
exports.createComplaint = async (req, res) => {
  const { title, description, ministryId, location, attachments, projectType, projectBudget } = req.body;

  try {
    const complaint = await Complaint.create({
      title,
      description,
      ministryId,
      userId: req.user._id,
      location,
      attachments: attachments || [],
      projectType: projectType || 'General',
      projectBudget: projectBudget || 0,
    });
    
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload attachment (photo)
// @route   POST /api/complaints/upload
// @access  Private
exports.uploadAttachment = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
};

// @desc    Update complaint status and related fields
// @route   PUT /api/complaints/:id/status
// @access  Private/Ministry Admin or Gov Admin
exports.updateComplaintStatus = async (req, res) => {
  const { status, resolutionRemarks, priority, completionPercentage, pendingWork, spentAmount, projectBudget } = req.body;

  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (complaint) {
      complaint.status = status || complaint.status;
      
      if (status === 'Resolved' && !complaint.resolvedAt) {
        complaint.resolvedAt = Date.now();
      }
      
      if (resolutionRemarks) {
        complaint.resolutionRemarks = resolutionRemarks;
      }

      if (priority) {
        complaint.priority = priority;
      }

      if (completionPercentage !== undefined) {
        complaint.completionPercentage = completionPercentage;
      }

      if (pendingWork !== undefined) {
        complaint.pendingWork = pendingWork;
      }

      if (spentAmount !== undefined) {
        complaint.spentAmount = spentAmount;
      }

      if (projectBudget !== undefined) {
        complaint.projectBudget = projectBudget;
      }

      const updatedComplaint = await complaint.save();

      // Keep ministry budget in sync with sum of spent amounts for this ministry
      if (complaint.ministryId) {
        const totalSpent = await Complaint.aggregate([
          { $match: { ministryId: complaint.ministryId } },
          { $group: { _id: null, total: { $sum: '$spentAmount' } } }
        ]);

        const ministry = await Ministry.findById(complaint.ministryId);
        if (ministry) {
          ministry.spentBudget = totalSpent?.[0]?.total || 0;
          await ministry.save();
        }
      }

      res.json(updatedComplaint);
    } else {
      res.status(404).json({ message: 'Complaint not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
