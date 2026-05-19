# 🧠 Quiz AI Consensus App

A mobile-first web app that sends quiz questions to **ChatGPT**, **Claude**, and **Gemini** simultaneously, then shows the **most agreed-upon answer** (consensus).

## Features

- 🤖 **3 AI Providers** — ChatGPT, Claude & Gemini answer your questions
- ✅ **Consensus Engine** — Shows the most repeated/agreed answer with confidence %
- 📸 **Screenshot OCR** — Upload a quiz screenshot and auto-extract the question
- 🔘 **MCQ Mode** — Special handling for multiple choice questions (A/B/C/D)
- 📜 **Answer History** — All past questions & answers saved
- 📱 **Mobile PWA** — Install on your phone like a native app
- 🎨 **Premium Dark UI** — Glassmorphism, gradients, and smooth animations
- 🔄 **Graceful Degradation** — Works even with just 1 API key

## Quick Start

### 1. Get API Keys (at least one)

| Provider | Get Key | Cost |
|----------|---------|------|
| **Gemini** (recommended) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | **FREE** |
| OpenAI (ChatGPT) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | $5 free credits |
| Anthropic (Claude) | [console.anthropic.com](https://console.anthropic.com) | $5 free credits |

### 2. Add Keys to `.env`

Open the `.env` file in the project root and paste your keys:

```env
GEMINI_API_KEY=your-gemini-key-here
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
```

### 3. Run the App

```bash
npm start
```

Then open **http://localhost:3000** on your phone or browser.

### 4. Install as Mobile App (PWA)

On your phone browser, tap **"Add to Home Screen"** to install it like a native app.

## How Consensus Works

### MCQ Questions
1. All 3 AIs answer the question
2. The app extracts the chosen option letter (A/B/C/D) from each
3. Majority vote wins → shown as consensus
4. Confidence: 3/3 agree = 100%, 2/3 = 67%

### Descriptive Questions
1. All 3 AIs answer the question
2. Answers are compared using keyword similarity scoring
3. The answer most similar to the other two is picked as consensus

## Project Structure

```
quiz-ai-app/
├── server/
│   ├── index.js              # Express server
│   ├── routes/
│   │   ├── quiz.js            # Quiz API endpoints
│   │   └── history.js         # History API endpoints
│   ├── services/
│   │   ├── openai.js          # ChatGPT integration
│   │   ├── anthropic.js       # Claude integration
│   │   ├── gemini.js          # Gemini integration
│   │   ├── consensus.js       # Answer comparison logic
│   │   └── vision.js          # Screenshot OCR
│   └── data/
│       └── history.json       # Saved history
├── public/
│   ├── index.html             # Main page
│   ├── css/styles.css         # Dark theme styles
│   ├── js/
│   │   ├── app.js             # Navigation & toast system
│   │   ├── quiz.js            # Quiz submission logic
│   │   └── history.js         # History display
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── .env                       # API keys (edit this!)
└── package.json
```

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JS
- **APIs**: OpenAI, Anthropic, Google Generative AI
- **Storage**: JSON file
- **PWA**: Service Worker + Manifest
