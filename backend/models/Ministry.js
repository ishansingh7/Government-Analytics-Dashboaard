const mongoose = require('mongoose');

const ministrySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  totalBudget: { type: Number, default: 0 },
  spentBudget: { type: Number, default: 0 },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Virtual for remaining budget
ministrySchema.virtual('remainingBudget').get(function() {
  return this.totalBudget - this.spentBudget;
});

ministrySchema.set('toJSON', { virtuals: true });
ministrySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ministry', ministrySchema);
