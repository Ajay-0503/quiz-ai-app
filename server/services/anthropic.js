const Anthropic = require('@anthropic-ai/sdk');

let client = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

async function askClaude(question, options = null) {
  const anthropic = getClient();
  if (!anthropic) {
    return { provider: 'Claude', answer: null, error: 'API key not configured', available: false };
  }

  const systemPrompt = `You are a quiz answering assistant. Answer the question directly and concisely.
${options ? 'This is a multiple choice question. You MUST respond with ONLY the correct option letter (A, B, C, or D) followed by a brief explanation.' : 'Give a clear, concise answer.'}
Do NOT add unnecessary preamble. Get straight to the answer.`;

  const userMessage = options
    ? `Question: ${question}\n\nOptions:\nA) ${options.A}\nB) ${options.B}\nC) ${options.C}\nD) ${options.D}`
    : `Question: ${question}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ]
    });

    const answer = response.content[0].text.trim();
    return { provider: 'Claude', answer, error: null, available: true };
  } catch (err) {
    return { provider: 'Claude', answer: null, error: err.message, available: true };
  }
}

module.exports = { askClaude };
