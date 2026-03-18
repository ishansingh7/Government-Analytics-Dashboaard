const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  ministryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ministry', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Resolved'], 
    default: 'Pending' 
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  location: { type: String },
  projectType: { type: String, default: 'General' },
  projectBudget: { type: Number, default: 0 },
  attachments: [{ type: String }], // URLs to attachments
  completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
  pendingWork: { type: String, default: '' },
  spentAmount: { type: Number, default: 0 },
  resolvedAt: { type: Date },
  resolutionRemarks: { type: String },
}, { timestamps: true });

// Virtual for resolution time in hours if resolved
complaintSchema.virtual('resolutionTime').get(function() {
  if (this.resolvedAt) {
    const diff = Math.abs(this.resolvedAt - this.createdAt);
    return diff / (1000 * 60 * 60); // hours
  }
  return null;
});

complaintSchema.set('toJSON', { virtuals: true });
complaintSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Complaint', complaintSchema);
