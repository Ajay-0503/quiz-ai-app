const OpenAI = require('openai');

let client = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

async function askChatGPT(question, options = null) {
  const openai = getClient();
  if (!openai) {
    return { provider: 'ChatGPT', answer: null, error: 'API key not configured', available: false };
  }

  const systemPrompt = `You are a quiz answering assistant. Answer the question directly and concisely.
${options ? 'This is a multiple choice question. You MUST respond with ONLY the correct option letter (A, B, C, or D) followed by a brief explanation.' : 'Give a clear, concise answer.'}
Do NOT add unnecessary preamble. Get straight to the answer.`;

  const userMessage = options
    ? `Question: ${question}\n\nOptions:\nA) ${options.A}\nB) ${options.B}\nC) ${options.C}\nD) ${options.D}`
    : `Question: ${question}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.1
    });

    const answer = response.choices[0].message.content.trim();
    return { provider: 'ChatGPT', answer, error: null, available: true };
  } catch (err) {
    return { provider: 'ChatGPT', answer: null, error: err.message, available: true };
  }
}

module.exports = { askChatGPT };
