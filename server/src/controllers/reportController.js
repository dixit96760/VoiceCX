const Feedback = require('../models/Feedback');

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
    const userId = req.user._id;

    const feedbacks = await Feedback.find({ user: userId }).sort({ date: -1 });

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
