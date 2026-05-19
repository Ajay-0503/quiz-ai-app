require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/history', require('./routes/history'));

// SPA fallback — serve index.html for all non-API routes
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  const configured = [
    process.env.OPENAI_API_KEY && 'ChatGPT',
    process.env.ANTHROPIC_API_KEY && 'Claude',
    process.env.GEMINI_API_KEY && 'Gemini'
  ].filter(Boolean);

  console.log(`\n🧠 Quiz AI Consensus App`);
  console.log(`📱 Running at http://localhost:${PORT}`);
  console.log(`🔑 Configured APIs: ${configured.length > 0 ? configured.join(', ') : 'NONE — add keys to .env file'}`);
  if (configured.length === 0) {
    console.log('\n⚠️  No API keys configured! Add at least one key to .env file.');
    console.log('   Get a free Gemini key at: https://aistudio.google.com/apikey\n');
  }
});
