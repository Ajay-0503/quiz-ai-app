/* ========== History Logic ========== */

async function loadHistory() {
  const list = document.getElementById('history-list');
  try {
    const res = await fetch('/api/history');
    const history = await res.json();

    // Update badge
    const badge = document.getElementById('history-badge');
    if (history.length > 0) {
      badge.style.display = 'flex';
      badge.textContent = history.length;
    } else {
      badge.style.display = 'none';
    }

    if (history.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><p>No history yet</p><p class="empty-hint">Submit a quiz question to get started!</p></div>`;
      return;
    }

    list.innerHTML = history.map(item => {
      const time = new Date(item.timestamp).toLocaleString();
      const consensusText = item.consensus?.consensusAnswer || 'No consensus';
      const shortConsensus = consensusText.length > 40 ? consensusText.substring(0, 40) + '...' : consensusText;
      const confidence = item.consensus?.confidence || 0;
      const agree = item.consensus?.agreementCount || 0;
      const total = item.consensus?.totalVoters || 0;

      let detailHtml = `<div class="history-detail" id="detail-${item.id}">`;
      detailHtml += `<div style="margin-bottom:10px;padding:10px;background:rgba(74,222,128,0.06);border-radius:8px;"><strong style="color:#4ade80;font-size:12px;">CONSENSUS (${agree}/${total} agree, ${confidence}%)</strong><p style="margin-top:6px;font-size:13px;">${escapeHtml(consensusText)}</p></div>`;

      if (item.responses) {
        item.responses.forEach(r => {
          const statusColor = !r.available ? '#666' : r.error ? '#f87171' : '#4ade80';
          const statusText = !r.available ? 'N/A' : r.error ? 'Error' : 'OK';
          const answerText = !r.available ? 'Not configured' : r.error ? r.error : r.answer;
          detailHtml += `<div style="margin-top:8px;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:13px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              <strong>${r.provider}</strong>
              <span style="color:${statusColor};font-size:10px;font-weight:600;">${statusText}</span>
            </div>
            <p style="color:#8888aa;line-height:1.5;">${escapeHtml(answerText)}</p>
          </div>`;
        });
      }
      detailHtml += '</div>';

      return `<div class="history-item" onclick="toggleDetail('${item.id}')">
        <div class="history-question">${item.isMCQ ? '🔘 ' : '📝 '}${escapeHtml(item.question)}</div>
        <div class="history-meta">
          <span class="history-consensus">${escapeHtml(shortConsensus)}</span>
          <span class="history-time">${time}</span>
          <button class="history-delete" onclick="event.stopPropagation();deleteHistoryItem('${item.id}')" title="Delete">🗑️</button>
        </div>
        ${detailHtml}
      </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Could not load history</p><p class="empty-hint">Is the server running?</p></div>`;
  }
}

function toggleDetail(id) {
  const detail = document.getElementById('detail-' + id);
  if (detail) {
    detail.classList.toggle('open');
  }
}

async function deleteHistoryItem(id) {
  try {
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
    showToast('Entry deleted', 'info');
    loadHistory();
  } catch (err) {
    showToast('Failed to delete', 'error');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Clear all history
document.addEventListener('DOMContentLoaded', () => {
  const clearBtn = document.getElementById('clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('Delete all history?')) return;
      try {
        await fetch('/api/history', { method: 'DELETE' });
        showToast('History cleared', 'info');
        loadHistory();
      } catch (err) {
        showToast('Failed to clear history', 'error');
      }
    });
  }
});
