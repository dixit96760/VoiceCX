const Feedback = require('../models/Feedback');
const { getIsConnected } = require('../config/db');

const MEMORY_FEEDBACKS = [
  {
    _id: 'fb_1',
    customerName: 'Michael Scott',
    customerPhone: '+1 (555) 301-4455',
    rating: 5,
    sentiment: 'positive',
    status: 'reviewed',
    summary: 'Customer loved the ribeye steak and excellent table service.',
    categoryRatings: { food: 5, service: 5, ambience: 4, value: 4 },
    ownerNotes: 'Sent 10% discount voucher for next visit.',
    praises: ['Ribeye steak quality', 'Attentive service'],
    topIssues: [],
    date: new Date(Date.now() - 86400000 * 2),
  },
  {
    _id: 'fb_2',
    customerName: 'Pam Beesly',
    customerPhone: '+1 (555) 301-6677',
    rating: 2,
    sentiment: 'negative',
    status: 'action_required',
    summary: 'Soup was served cold and main course had a long 35-minute delay.',
    categoryRatings: { food: 2, service: 2, ambience: 4, value: 2 },
    ownerNotes: 'Need to follow up with head chef regarding kitchen timing.',
    praises: [],
    topIssues: ['Cold soup', 'Long wait time'],
    date: new Date(Date.now() - 86400000 * 5),
  },
];

// Helper function to escape CSV values
const escapeCsv = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

// @desc    Generate and return feedback dataset formatted for CSV export
// @route   GET /api/reports/export
// @access  Private
const exportFeedbackCsv = async (req, res) => {
  try {
    const isDb = getIsConnected();
    const userId = req.user._id;

    const feedbacks = isDb ? await Feedback.find({ user: userId }).sort({ date: -1 }) : MEMORY_FEEDBACKS;

    const headers = [
      'Feedback ID',
      'Date',
      'Customer Name',
      'Phone Number',
      'Rating',
      'Sentiment',
      'Status',
      'Summary',
      'Top Issues',
      'Praises',
      'Food Rating',
      'Service Rating',
      'Ambience Rating',
      'Value Rating',
      'Owner Notes',
    ];

    const csvRows = [headers.join(',')];

    feedbacks.forEach((f) => {
      const row = [
        escapeCsv(f._id),
        escapeCsv(new Date(f.date || f.createdAt).toISOString()),
        escapeCsv(f.customerName),
        escapeCsv(f.customerPhone),
        escapeCsv(f.rating),
        escapeCsv(f.sentiment),
        escapeCsv(f.status),
        escapeCsv(f.summary),
        escapeCsv(Array.isArray(f.topIssues) ? f.topIssues.join('; ') : ''),
        escapeCsv(Array.isArray(f.praises) ? f.praises.join('; ') : ''),
        escapeCsv(f.categoryRatings?.food || 0),
        escapeCsv(f.categoryRatings?.service || 0),
        escapeCsv(f.categoryRatings?.ambience || 0),
        escapeCsv(f.categoryRatings?.value || 0),
        escapeCsv(f.ownerNotes || ''),
      ];
      csvRows.push(row.join(','));
    });

    const csvData = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=feedback_report_${Date.now()}.csv`);
    return res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  exportFeedbackCsv,
};
