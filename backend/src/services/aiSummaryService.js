const { analyzeTranscript } = require('./geminiService');

/**
 * Generate structured AI summary, outcome, sentiment, and next action from call transcript
 * @param {string} transcript - Full call conversation transcript text
 * @param {Object} [metadata] - Additional call context (purpose, contact name)
 * @returns {Promise<{ summary: string, outcome: string, sentiment: string, nextAction: string, followUpRequired: boolean, followUpReason: string }>}
 */
async function generateCallSummary(transcript, metadata = {}) {
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    return {
      summary: 'Call completed. No transcript content recorded.',
      outcome: 'completed',
      sentiment: 'neutral',
      nextAction: 'Review call details',
      followUpRequired: false,
      followUpReason: '',
    };
  }

  try {
    // Leverage existing Gemini service for sentiment and summary extraction
    const geminiAnalysis = await analyzeTranscript(transcript);

    // Map sentiment & summary to structured output
    const sentiment = (geminiAnalysis.sentimentLabel || 'neutral').toLowerCase();
    
    // Determine outcome based on sentiment and keywords
    let outcome = 'completed';
    const lowerTranscript = transcript.toLowerCase();
    const lowerSummary = (geminiAnalysis.summary || '').toLowerCase();

    if (lowerTranscript.includes('not interested') || lowerSummary.includes('not interested')) {
      outcome = 'not_interested';
    } else if (lowerTranscript.includes('call back') || lowerTranscript.includes('call me tomorrow') || lowerSummary.includes('callback')) {
      outcome = 'callback_requested';
    } else if (lowerTranscript.includes('interested') || lowerTranscript.includes('yes') || lowerSummary.includes('positive') || lowerSummary.includes('interested')) {
      outcome = 'interested';
    } else if (sentiment === 'positive') {
      outcome = 'positive';
    } else if (sentiment === 'negative') {
      outcome = 'negative';
    }

    const followUpRequired = outcome === 'callback_requested' || outcome === 'interested' || (geminiAnalysis.actionItems && geminiAnalysis.actionItems.length > 0);
    const followUpReason = followUpRequired 
      ? (geminiAnalysis.actionItems?.[0] || `Follow up requested for ${metadata.purpose || 'customer feedback'}`)
      : '';

    const nextAction = (geminiAnalysis.actionItems && geminiAnalysis.actionItems.length > 0)
      ? geminiAnalysis.actionItems.join('. ')
      : (followUpRequired ? 'Schedule follow-up contact with recipient' : 'No immediate action required');

    return {
      summary: geminiAnalysis.summary || 'Customer participated in outbound AI call and shared feedback.',
      outcome,
      sentiment,
      nextAction,
      followUpRequired,
      followUpReason,
    };
  } catch (error) {
    console.error('[aiSummaryService Error]', error);
    // Fault tolerance fallback: return non-blocking default summary so call completion is never disrupted
    return {
      summary: 'Call completed successfully. Transcript recorded for manual review.',
      outcome: 'completed',
      sentiment: 'neutral',
      nextAction: 'Review call transcript',
      followUpRequired: false,
      followUpReason: '',
    };
  }
}

module.exports = {
  generateCallSummary,
};
