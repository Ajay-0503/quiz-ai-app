/**
 * Consensus Engine
 * Compares answers from multiple AI providers and determines the most agreed-upon answer.
 */

function extractMCQOption(answer) {
  if (!answer) return null;
  // Match patterns like "A", "A)", "A.", "Option A", "Answer: A", etc.
  const match = answer.match(/^(?:option\s*|answer\s*[:=]\s*)?([A-Da-d])[\s).:,\-]/i)
    || answer.match(/^([A-Da-d])$/i)
    || answer.match(/\b(?:correct\s+answer\s+is\s+|answer\s+is\s+)([A-Da-d])\b/i)
    || answer.match(/^([A-Da-d])\b/i);
  return match ? match[1].toUpperCase() : null;
}

function calculateMCQConsensus(responses) {
  const votes = {};
  const validResponses = responses.filter(r => r.answer);

  validResponses.forEach(r => {
    const option = extractMCQOption(r.answer);
    r.extractedOption = option;
    if (option) {
      votes[option] = (votes[option] || 0) + 1;
    }
  });

  if (Object.keys(votes).length === 0) {
    return {
      consensusAnswer: null,
      consensusOption: null,
      confidence: 0,
      totalVoters: validResponses.length,
      agreementCount: 0,
      method: 'mcq',
      votes
    };
  }

  // Find the option with the most votes
  const sortedVotes = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const winnerOption = sortedVotes[0][0];
  const winnerCount = sortedVotes[0][1];

  // Find the full answer from the provider that chose this option
  const winnerResponse = validResponses.find(r => r.extractedOption === winnerOption);

  return {
    consensusAnswer: winnerResponse ? winnerResponse.answer : `Option ${winnerOption}`,
    consensusOption: winnerOption,
    confidence: Math.round((winnerCount / validResponses.length) * 100),
    totalVoters: validResponses.length,
    agreementCount: winnerCount,
    method: 'mcq',
    votes
  };
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2); // Remove short words
}

function calculateSimilarity(text1, text2) {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));

  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size; // Jaccard similarity
}

function calculateDescriptiveConsensus(responses) {
  const validResponses = responses.filter(r => r.answer);

  if (validResponses.length === 0) {
    return {
      consensusAnswer: null,
      confidence: 0,
      totalVoters: 0,
      agreementCount: 0,
      method: 'descriptive'
    };
  }

  if (validResponses.length === 1) {
    return {
      consensusAnswer: validResponses[0].answer,
      consensusProvider: validResponses[0].provider,
      confidence: 100,
      totalVoters: 1,
      agreementCount: 1,
      method: 'descriptive'
    };
  }

  // Calculate pairwise similarity and find the answer most similar to others
  const scores = validResponses.map((response, i) => {
    let totalSimilarity = 0;
    validResponses.forEach((other, j) => {
      if (i !== j) {
        totalSimilarity += calculateSimilarity(response.answer, other.answer);
      }
    });
    return {
      ...response,
      similarityScore: totalSimilarity / (validResponses.length - 1)
    };
  });

  scores.sort((a, b) => b.similarityScore - a.similarityScore);
  const bestMatch = scores[0];

  // Determine how many answers are "similar enough" (threshold: 0.3)
  const agreementThreshold = 0.3;
  const agreeing = scores.filter(s => {
    if (s.provider === bestMatch.provider) return true;
    return calculateSimilarity(s.answer, bestMatch.answer) >= agreementThreshold;
  });

  return {
    consensusAnswer: bestMatch.answer,
    consensusProvider: bestMatch.provider,
    confidence: Math.round((agreeing.length / validResponses.length) * 100),
    totalVoters: validResponses.length,
    agreementCount: agreeing.length,
    method: 'descriptive',
    similarityScore: bestMatch.similarityScore
  };
}

function getConsensus(responses, isMCQ = false) {
  if (isMCQ) {
    return calculateMCQConsensus(responses);
  }
  return calculateDescriptiveConsensus(responses);
}

module.exports = { getConsensus, extractMCQOption };
