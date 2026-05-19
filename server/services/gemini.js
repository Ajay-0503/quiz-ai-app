const { GoogleGenerativeAI } = require('@google/generative-ai');

let client = null;

function getClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

async function askGemini(question, options = null) {
  const genAI = getClient();
  if (!genAI) {
    return { provider: 'Gemini', answer: null, error: 'API key not configured', available: false };
  }

  const systemPrompt = `You are a quiz answering assistant. Answer the question directly and concisely.
${options ? 'This is a multiple choice question. You MUST respond with ONLY the correct option letter (A, B, C, or D) followed by a brief explanation.' : 'Give a clear, concise answer.'}
Do NOT add unnecessary preamble. Get straight to the answer.`;

  const userMessage = options
    ? `Question: ${question}\n\nOptions:\nA) ${options.A}\nB) ${options.B}\nC) ${options.C}\nD) ${options.D}`
    : `Question: ${question}`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: systemPrompt
    });

    const result = await model.generateContent(userMessage);
    const answer = result.response.text().trim();
    return { provider: 'Gemini', answer, error: null, available: true };
  } catch (err) {
    return { provider: 'Gemini', answer: null, error: err.message, available: true };
  }
}

module.exports = { askGemini };
