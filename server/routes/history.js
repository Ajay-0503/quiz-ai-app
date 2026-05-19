const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '..', 'data', 'history.json');

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

// GET /api/history — Get all history
router.get('/', (req, res) => {
  const history = loadHistory();
  res.json(history);
});

// DELETE /api/history — Clear all history
router.delete('/', (req, res) => {
  saveHistory([]);
  res.json({ message: 'History cleared' });
});

// DELETE /api/history/:id — Delete a specific entry
router.delete('/:id', (req, res) => {
  const history = loadHistory();
  const filtered = history.filter(h => h.id !== req.params.id);
  if (filtered.length === history.length) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  saveHistory(filtered);
  res.json({ message: 'Entry deleted' });
});

module.exports = router;
