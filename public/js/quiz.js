/* ========== Quiz Logic ========== */

function initQuiz() {
  const questionInput = document.getElementById('question-input');
  const mcqToggle = document.getElementById('mcq-toggle');
  const mcqOptions = document.getElementById('mcq-options');
  const submitBtn = document.getElementById('submit-btn');
  const imageInput = document.getElementById('image-input');
  const uploadZone = document.getElementById('upload-zone');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const uploadPreview = document.getElementById('upload-preview');
  const previewImg = document.getElementById('preview-img');
  const removeImage = document.getElementById('remove-image');
  const extractBtn = document.getElementById('extract-btn');
  const extractStatus = document.getElementById('extract-status');

  // MCQ toggle
  mcqToggle.addEventListener('change', () => {
    mcqOptions.style.display = mcqToggle.checked ? 'grid' : 'none';
  });

  // Image upload - click to open file picker
  uploadZone.addEventListener('click', (e) => {
    if (e.target === removeImage || e.target.closest('#remove-image')) return;
    if (e.target === extractBtn || e.target.closest('#extract-btn')) return;
    imageInput.click();
  });

  // Drag and drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  // File input change
  imageInput.addEventListener('change', () => {
    if (imageInput.files.length) {
      handleImageFile(imageInput.files[0]);
    }
  });

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadPlaceholder.style.display = 'none';
      uploadPreview.style.display = 'block';
      extractBtn.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  // Remove image
  removeImage.addEventListener('click', (e) => {
    e.stopPropagation();
    imageInput.value = '';
    uploadPlaceholder.style.display = 'block';
    uploadPreview.style.display = 'none';
    extractBtn.style.display = 'none';
    extractStatus.style.display = 'none';
  });

  // Extract text from image
  extractBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!imageInput.files.length) {
      showToast('Please upload an image first', 'error');
      return;
    }

    extractBtn.disabled = true;
    extractBtn.innerHTML = '<span class="spinner"></span> Extracting...';
    extractStatus.style.display = 'block';
    extractStatus.textContent = 'Sending image to AI for text extraction...';
    extractStatus.style.background = 'rgba(124, 92, 252, 0.1)';
    extractStatus.style.color = '#9d82ff';

    const formData = new FormData();
    formData.append('image', imageInput.files[0]);

    try {
      const res = await fetch('/api/quiz/image', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.error) {
        extractStatus.textContent = `❌ ${data.error}`;
        extractStatus.style.background = 'rgba(248, 113, 113, 0.1)';
        extractStatus.style.color = '#f87171';
        showToast('Failed to extract text', 'error');
      } else {
        // Parse extracted text and fill in the form
        questionInput.value = data.extractedText;
        extractStatus.textContent = `✅ Extracted using ${data.provider}`;
        extractStatus.style.background = 'rgba(74, 222, 128, 0.1)';
        extractStatus.style.color = '#4ade80';
        showToast('Question extracted from image!', 'success');

        // Try to auto-detect MCQ options
        autoDetectMCQ(data.extractedText);
      }
    } catch (err) {
      extractStatus.textContent = '❌ Network error';
      extractStatus.style.background = 'rgba(248, 113, 113, 0.1)';
      extractStatus.style.color = '#f87171';
      showToast('Network error', 'error');
    }

    extractBtn.disabled = false;
    extractBtn.innerHTML = '<span class="btn-icon-left">🔍</span>Extract Question';
  });

  // Auto-detect MCQ from extracted text
  function autoDetectMCQ(text) {
    const optionPatterns = [
      /[Aa]\)\s*(.+)/,
      /[Bb]\)\s*(.+)/,
      /[Cc]\)\s*(.+)/,
      /[Dd]\)\s*(.+)/
    ];

    const matches = optionPatterns.map(p => text.match(p));
    if (matches.every(m => m !== null)) {
      mcqToggle.checked = true;
      mcqOptions.style.display = 'grid';
      document.getElementById('option-a').value = matches[0][1].trim();
      document.getElementById('option-b').value = matches[1][1].trim();
      document.getElementById('option-c').value = matches[2][1].trim();
      document.getElementById('option-d').value = matches[3][1].trim();

      // Clean the question - remove options from textarea
      const questionOnly = text.split(/[Aa]\)/)[0].trim();
      if (questionOnly) questionInput.value = questionOnly;
    }
  }

  // Submit quiz
  submitBtn.addEventListener('click', submitQuiz);

  // Allow Ctrl+Enter to submit
  questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      submitQuiz();
    }
  });

  async function submitQuiz() {
    const question = questionInput.value.trim();
    if (!question) {
      showToast('Please enter a question', 'error');
      questionInput.focus();
      return;
    }

    const isMCQ = mcqToggle.checked;
    let options = null;
    if (isMCQ) {
      const a = document.getElementById('option-a').value.trim();
      const b = document.getElementById('option-b').value.trim();
      const c = document.getElementById('option-c').value.trim();
      const d = document.getElementById('option-d').value.trim();
      if (!a || !b || !c || !d) {
        showToast('Please fill in all MCQ options', 'error');
        return;
      }
      options = { A: a, B: b, C: c, D: d };
    }

    // Show loading state
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options, isMCQ })
      });

      const data = await res.json();

      if (data.error) {
        showToast(data.error, 'error');
      } else {
        displayResults(data);
        showToast('AI consensus ready!', 'success');
        // Update history badge
        updateHistoryBadge();
      }
    } catch (err) {
      showToast('Network error — is the server running?', 'error');
    }

    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    submitBtn.disabled = false;
  }
}

function displayResults(data) {
  const resultsSection = document.getElementById('results-section');
  resultsSection.style.display = 'block';

  // Consensus
  const consensusAnswer = document.getElementById('consensus-answer');
  const confidenceFill = document.querySelector('.confidence-fill');
  const confidenceText = document.querySelector('.confidence-text');

  if (data.consensus.consensusAnswer) {
    consensusAnswer.textContent = data.consensus.consensusAnswer;
  } else {
    consensusAnswer.textContent = 'No consensus could be determined';
  }

  const confidence = data.consensus.confidence || 0;
  const agree = data.consensus.agreementCount || 0;
  const total = data.consensus.totalVoters || 0;

  setTimeout(() => {
    confidenceFill.style.width = confidence + '%';
  }, 100);
  confidenceText.textContent = `${agree}/${total} AIs agree • ${confidence}% confidence`;

  // Individual AI answers
  data.responses.forEach(response => {
    const providerKey = response.provider.toLowerCase().replace(/\s/g, '');
    let cardId, answerId, badgeId;

    if (providerKey === 'chatgpt') {
      cardId = 'chatgpt-card'; answerId = 'chatgpt-answer'; badgeId = 'chatgpt-badge';
    } else if (providerKey === 'claude') {
      cardId = 'claude-card'; answerId = 'claude-answer'; badgeId = 'claude-badge';
    } else if (providerKey === 'gemini') {
      cardId = 'gemini-card'; answerId = 'gemini-answer'; badgeId = 'gemini-badge';
    } else return;

    const card = document.getElementById(cardId);
    const answerEl = document.getElementById(answerId);
    const badge = document.getElementById(badgeId);

    card.className = 'card ai-card';
    badge.className = 'ai-badge';

    if (!response.available) {
      card.classList.add('error');
      answerEl.textContent = 'API key not configured';
      badge.textContent = 'N/A';
      badge.classList.add('unavailable');
    } else if (response.error) {
      card.classList.add('error');
      answerEl.textContent = `Error: ${response.error}`;
      badge.textContent = 'Error';
      badge.classList.add('error');
    } else {
      answerEl.textContent = response.answer;
      // Check if this answer agrees with consensus
      if (data.consensus.method === 'mcq') {
        const option = response.extractedOption;
        if (option === data.consensus.consensusOption) {
          card.classList.add('agreed');
          badge.textContent = '✓ Agrees';
          badge.classList.add('agree');
        } else {
          card.classList.add('disagreed');
          badge.textContent = option ? `Chose ${option}` : 'Unclear';
          badge.classList.add('disagree');
        }
      } else {
        // For descriptive, check if this is the consensus provider
        if (response.provider === data.consensus.consensusProvider) {
          card.classList.add('agreed');
          badge.textContent = '★ Best Match';
          badge.classList.add('agree');
        } else {
          badge.textContent = 'Answered';
          badge.classList.add('agree');
          card.classList.add('agreed');
        }
      }
    }
  });

  // Scroll to results
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateHistoryBadge() {
  fetch('/api/history')
    .then(r => r.json())
    .then(history => {
      const badge = document.getElementById('history-badge');
      if (history.length > 0) {
        badge.style.display = 'flex';
        badge.textContent = history.length;
      } else {
        badge.style.display = 'none';
      }
    })
    .catch(() => {});
}
