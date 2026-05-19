const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Uses Gemini Vision to extract quiz question text from an image.
 * Falls back to OpenAI if Gemini key is not available.
 */
async function extractTextFromImage(imageBuffer, mimeType = 'image/png') {
  // Try Gemini first (free)
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType
        }
      };

      const result = await model.generateContent([
        'Extract the quiz question and all answer options from this image. Format it clearly with the question first, then each option on a new line prefixed with its letter (A, B, C, D). Only return the extracted text, nothing else.',
        imagePart
      ]);

      const text = result.response.text().trim();
      return { text, error: null, provider: 'Gemini Vision' };
    } catch (err) {
      console.error('Gemini Vision error:', err.message);
    }
  }

  // Try OpenAI as fallback
  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the quiz question and all answer options from this image. Format it clearly with the question first, then each option on a new line prefixed with its letter (A, B, C, D). Only return the extracted text, nothing else.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBuffer.toString('base64')}`
              }
            }
          ]
        }],
        max_tokens: 500
      });

      const text = response.choices[0].message.content.trim();
      return { text, error: null, provider: 'OpenAI Vision' };
    } catch (err) {
      console.error('OpenAI Vision error:', err.message);
    }
  }

  return { text: null, error: 'No vision-capable API key configured. Add GEMINI_API_KEY or OPENAI_API_KEY.', provider: null };
}

module.exports = { extractTextFromImage };
