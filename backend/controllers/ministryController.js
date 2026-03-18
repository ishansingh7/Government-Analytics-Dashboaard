const Ministry = require('../models/Ministry');

// @desc    Get all ministries
// @route   GET /api/ministries
// @access  Public
exports.getMinistries = async (req, res) => {
  try {
    const ministries = await Ministry.find().populate('adminId', 'name email');
    res.json(ministries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ministry by ID
// @route   GET /api/ministries/:id
// @access  Public
exports.getMinistryById = async (req, res) => {
  try {
    const ministry = await Ministry.findById(req.params.id).populate('adminId', 'name email');
    if (ministry) {
      res.json(ministry);
    } else {
      res.status(404).json({ message: 'Ministry not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a ministry
// @route   POST /api/ministries
// @access  Private/Super Admin
exports.createMinistry = async (req, res) => {
  const { name, description, totalBudget, adminId, adminEmail, adminName, adminPassword } = req.body;

  try {
    const ministryExists = await Ministry.findOne({ name });
    if (ministryExists) {
      return res.status(400).json({ message: 'Ministry already exists' });
    }

    let finalAdminId = adminId;
    if (adminEmail) {
      const User = require('../models/User'); // Required locally to avoid circular dependency
      const adminUser = await User.findOne({ email: adminEmail, role: { $in: ['ministry_admin', 'gov_admin', 'super_admin'] } });
      if (adminUser) {
        finalAdminId = adminUser._id;
      }
    }

    // If the request provides new admin credentials, create a new ministry admin user
    if (!finalAdminId && adminName && adminEmail && adminPassword) {
      const User = require('../models/User');
      const existing = await User.findOne({ email: adminEmail });
      if (existing) {
        return res.status(400).json({ message: 'Admin email already registered' });
      }
      const newAdmin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'ministry_admin'
      });
      finalAdminId = newAdmin._id;
    }

    const ministry = await Ministry.create({
      name,
      description,
      totalBudget,
      adminId: finalAdminId
    });
    res.status(201).json(ministry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ministry budget
// @route   PUT /api/ministries/:id/budget
// @access  Private/Ministry Admin or Gov Admin
exports.updateBudget = async (req, res) => {
  try {
    const ministry = await Ministry.findById(req.params.id);
    if (ministry) {
      ministry.totalBudget = req.body.totalBudget !== undefined ? req.body.totalBudget : ministry.totalBudget;
      ministry.spentBudget = req.body.spentBudget !== undefined ? req.body.spentBudget : ministry.spentBudget;
      
      const updatedMinistry = await ministry.save();
      res.json(updatedMinistry);
    } else {
      res.status(404).json({ message: 'Ministry not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ministry details (name/description/budget)
// @route   PUT /api/ministries/:id
// @access  Private/Super Admin
exports.updateMinistry = async (req, res) => {
  try {
    const ministry = await Ministry.findById(req.params.id);
    if (!ministry) {
      return res.status(404).json({ message: 'Ministry not found' });
    }

    const { name, description, totalBudget } = req.body;

    if (name) ministry.name = name;
    if (description) ministry.description = description;
    if (totalBudget !== undefined) ministry.totalBudget = totalBudget;

    const updatedMinistry = await ministry.save();
    res.json(updatedMinistry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a ministry
// @route   DELETE /api/ministries/:id
// @access  Private/Super Admin
exports.deleteMinistry = async (req, res) => {
  try {
    const ministry = await Ministry.findById(req.params.id);
    if (!ministry) {
      return res.status(404).json({ message: 'Ministry not found' });
    }

    await ministry.remove();
    res.json({ message: 'Ministry removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
