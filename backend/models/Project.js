const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  workingArea: { type: String, default: '' },
  ministryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ministry', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed', 'On Hold'],
    default: 'Planned'
  },
  projectBudget: { type: Number, default: 0 },
  spentAmount: { type: Number, default: 0 },
  completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
  pendingWork: { type: String, default: '' },
  attachments: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
