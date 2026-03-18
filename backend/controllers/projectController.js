const Project = require('../models/Project');
const Ministry = require('../models/Ministry');

// @desc    Get projects (optionally filter by ministry)
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  console.log('GET /api/projects called, user:', req.user ? req.user.email : 'none');
  try {
    const { ministryId } = req.query;
    const query = {};

    // Ministry admins: only their ministry projects
    if (req.user.role === 'ministry_admin') {
      const ministry = await Ministry.findOne({ adminId: req.user._id });
      if (!ministry) return res.json([]);
      query.ministryId = ministry._id;
    }

    // If the user is a ministry admin, always restrict to their own ministry
    if (req.user.role === 'ministry_admin') {
      // already set above
    } else if (ministryId) {
      // Super/Gov admins and other authenticated users can filter by ministryId
      query.ministryId = ministryId;
    }

    const projects = await Project.find(query)
      .populate('ministryId', 'name')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Ministry Admin
exports.createProject = async (req, res) => {
  try {
    const ministry = await Ministry.findOne({ adminId: req.user._id });
    if (!ministry) return res.status(403).json({ message: 'Not assigned to a ministry' });

    const project = await Project.create({
      ...req.body,
      ministryId: ministry._id,
      createdBy: req.user._id,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Ministry Admin or Gov/Super Admin
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Min admin can only update their own projects
    if (req.user.role === 'ministry_admin') {
      const ministry = await Ministry.findOne({ adminId: req.user._id });
      if (!ministry || ministry._id.toString() !== project.ministryId.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    Object.assign(project, req.body);
    const updated = await project.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Ministry Admin or Gov/Super Admin
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.user.role === 'ministry_admin') {
      const ministry = await Ministry.findOne({ adminId: req.user._id });
      if (!ministry || ministry._id.toString() !== project.ministryId.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    await project.remove();
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
