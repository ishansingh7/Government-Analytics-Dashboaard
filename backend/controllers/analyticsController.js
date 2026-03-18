const Complaint = require('../models/Complaint');
const Ministry = require('../models/Ministry');

// @desc    Get complete analytics data
// @route   GET /api/analytics
// @access  Public
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // 1. Complaint Status Distribution (Pie Chart)
    const statusDistribution = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Format for easier consumption
    const formattedStatus = {
      Pending: 0,
      'In Progress': 0,
      Resolved: 0
    };
    
    statusDistribution.forEach(item => {
      formattedStatus[item._id] = item.count;
    });

    // 2. Ministry Performance Leaderboard (Bar Chart / Leaderboard)
    const ministriesMap = await Ministry.find().lean();
    
    const ministryStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$ministryId',
          totalComplaints: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $and: [{ $ifNull: ['$resolvedAt', false] }, { $ifNull: ['$createdAt', false] }] },
                { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
                null
              ]
            }
          }
        }
      }
    ]);
    
    // Merge stats with ministry details and calculate score
    const leaderboard = ministryStats.map(stat => {
      const ministry = ministriesMap.find(m => m._id.toString() === stat._id.toString());
      const resolutionRate = stat.totalComplaints > 0 ? (stat.resolvedCount / stat.totalComplaints) * 100 : 0;
      
      // Basic performance score algorithm: Custom weights (70% resolution rate, 30% speed - inverse of time)
      // Normalize time assuming 720 hours (30 days) is the max acceptable limit (0 score for speed)
      let timeScore = 0;
      if (stat.avgResolutionTime) {
          timeScore = Math.max(0, 100 - (stat.avgResolutionTime / 7.2)); 
      } else if (stat.resolvedCount > 0) {
          timeScore = 100; // instant
      }

      const performanceScore = (resolutionRate * 0.7) + (timeScore * 0.3);

      return {
        ministryId: stat._id,
        ministryName: ministry ? ministry.name : 'Unknown',
        totalComplaints: stat.totalComplaints,
        resolvedComplaints: stat.resolvedCount,
        resolutionRate: resolutionRate.toFixed(2),
        avgResolutionTimeDays: stat.avgResolutionTime ? (stat.avgResolutionTime / 24).toFixed(1) : null,
        performanceScore: performanceScore.toFixed(2)
      };
    });

    // Sort leaderboard by top score
    leaderboard.sort((a, b) => b.performanceScore - a.performanceScore);

    // 3. Overall Stats
    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
    const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });

    const resolutionStats = await Complaint.aggregate([
      { $match: { status: 'Resolved' } },
      {
        $group: {
          _id: null,
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $and: [{ $ifNull: ['$resolvedAt', false] }, { $ifNull: ['$createdAt', false] }] },
                { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
                null
              ]
            }
          }
        }
      }
    ]);

    const avgResolutionTime = resolutionStats?.[0]?.avgResolutionTime || 0;

    // Determine top / worst performing ministries using the leaderboard sorted by performanceScore
    const topPerforming = leaderboard.slice(0, 5);
    const worstPerforming = leaderboard.slice(-5).reverse();

    res.json({
      overall: {
        totalComplaints,
        resolvedComplaints,
        pendingComplaints,
        resolutionRate: totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0,
        avgResolutionTimeHours: avgResolutionTime ? Number(avgResolutionTime.toFixed(2)) : null,
      },
      statusDistribution: formattedStatus,
      leaderboard,
      topPerforming,
      worstPerforming,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get analytics for a specific ministry
// @route   GET /api/ministries/:id/analytics
// @access  Public
exports.getMinistryAnalytics = async (req, res) => {
    try {
        const ministryId = req.params.id;
        const ministry = await Ministry.findById(ministryId);
        
        if (!ministry) {
            return res.status(404).json({ message: 'Ministry not found' });
        }

        const totalComplaints = await Complaint.countDocuments({ ministryId });
        const resolvedComplaints = await Complaint.countDocuments({ ministryId, status: 'Resolved' });
        const pendingComplaints = await Complaint.countDocuments({ ministryId, status: 'Pending' });

        const resolutionStats = await Complaint.aggregate([
            { $match: { ministryId: ministry._id, status: 'Resolved' } },
            {
                $group: {
                    _id: null,
                    avgResolutionTime: {
                        $avg: {
                            $cond: [
                                { $and: [{ $ifNull: ['$resolvedAt', false] }, { $ifNull: ['$createdAt', false] }] },
                                { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
                                null
                            ]
                        }
                    }
                }
            }
        ]);

        const avgResolutionTimeHours = resolutionStats?.[0]?.avgResolutionTime || 0;

        const statusDistribution = await Complaint.aggregate([
            { $match: { ministryId: ministry._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            ministry: {
                name: ministry.name,
                totalBudget: ministry.totalBudget,
                spentBudget: ministry.spentBudget,
                remainingBudget: ministry.totalBudget - ministry.spentBudget
            },
            stats: {
                totalComplaints,
                resolvedComplaints,
                pendingComplaints,
                resolutionRate: totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0,
                avgResolutionTimeHours: avgResolutionTimeHours ? Number(avgResolutionTimeHours.toFixed(2)) : null,
            },
            statusDistribution
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
