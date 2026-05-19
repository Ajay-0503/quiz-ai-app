const express = require('express');
const router = express.Router();
const multer = require('multer');
const { askChatGPT } = require('../services/openai');
const { askClaude } = require('../services/anthropic');
const { askGemini } = require('../services/gemini');
const { getConsensus } = require('../services/consensus');
const { extractTextFromImage } = require('../services/vision');
const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '..', 'data', 'history.json');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading history:', err.message);
  }
  return [];
}

function saveHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Error saving history:', err.message);
  }
}

// POST /api/quiz — Submit a quiz question
router.post('/', async (req, res) => {
  try {
    const { question, options, isMCQ } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const mcqOptions = isMCQ && options ? options : null;

    // Call all 3 AIs in parallel
    const [chatgptResult, claudeResult, geminiResult] = await Promise.allSettled([
      askChatGPT(question, mcqOptions),
      askClaude(question, mcqOptions),
      askGemini(question, mcqOptions)
    ]);

    const responses = [
      chatgptResult.status === 'fulfilled' ? chatgptResult.value : { provider: 'ChatGPT', answer: null, error: chatgptResult.reason?.message, available: false },
      claudeResult.status === 'fulfilled' ? claudeResult.value : { provider: 'Claude', answer: null, error: claudeResult.reason?.message, available: false },
      geminiResult.status === 'fulfilled' ? geminiResult.value : { provider: 'Gemini', answer: null, error: geminiResult.reason?.message, available: false }
    ];

    // Get consensus
    const consensus = getConsensus(responses, isMCQ);

    const result = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      question,
      options: mcqOptions,
      isMCQ: !!isMCQ,
      responses,
      consensus,
      timestamp: new Date().toISOString()
    };

    // Save to history
    const history = loadHistory();
    history.unshift(result); // Add to beginning
    if (history.length > 500) history.pop(); // Keep last 500
    saveHistory(history);

    res.json(result);
  } catch (err) {
    console.error('Quiz error:', err);
    res.status(500).json({ error: 'Failed to process quiz question' });
  }
});

// POST /api/quiz/image — Extract question from image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const result = await extractTextFromImage(req.file.buffer, req.file.mimetype);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      extractedText: result.text,
      provider: result.provider
    });
  } catch (err) {
    console.error('Image extraction error:', err);
    res.status(500).json({ error: 'Failed to extract text from image' });
  }
});

// GET /api/quiz/status — Check which APIs are configured
router.get('/status', (req, res) => {
  res.json({
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    totalConfigured: [
      process.env.OPENAI_API_KEY,
      process.env.ANTHROPIC_API_KEY,
      process.env.GEMINI_API_KEY
    ].filter(Boolean).length
  });
});

module.exports = router;
