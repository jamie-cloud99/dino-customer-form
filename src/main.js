const items = [
  { key: 'fun', label: '有趣程度', sub: '相處起來好不好玩、有沒有驚喜和新鮮感' },
  { key: 'thoughtful', label: '細膩體貼', sub: '有沒有讀懂情緒、接住需求' },
  { key: 'safety', label: '安全感', sub: '提供足夠的愛，讓妳感到安心、被珍視' },
  { key: 'intimacy', label: '親密行為', sub: '身體上的親密相處，滿不滿足、享不享受' },
  { key: 'sync', label: '生活合拍度', sub: '步調、習慣合不合拍' },
];

const ratingsDiv = document.getElementById('ratings');
const scores = {};
const notes = {};
let lastReportText = '';
let reportImageUrl = '';

items.forEach((item) => {
  scores[item.key] = 0;
  notes[item.key] = '';

  const row = document.createElement('div');
  row.className = 'rate-item';
  row.innerHTML = `
    <div class="rate-row">
      <div class="rate-label">${item.label}<small>${item.sub}</small></div>
      <div class="stars" data-key="${item.key}">
        ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-val="${n}">🦕</button>`).join('')}
      </div>
    </div>
    <button type="button" class="note-toggle open" data-key="${item.key}">− 收合加註</button>
    <textarea class="note-field" data-key="${item.key}" placeholder="想補充說明嗎（選填）..."></textarea>
  `;
  ratingsDiv.appendChild(row);
});

document.querySelectorAll('.note-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.key;
    const field = document.querySelector(`.note-field[data-key="${key}"]`);
    const isOpen = !field.hidden;

    field.hidden = isOpen;
    btn.textContent = isOpen ? '+ 加註' : '− 收合加註';
    btn.classList.toggle('open', !isOpen);
  });
});

document.querySelectorAll('.note-field').forEach((field) => {
  field.addEventListener('input', () => {
    notes[field.dataset.key] = field.value;
  });
});

document.addEventListener('input', (event) => {
  if(event.target.tagName === 'TEXTAREA'){
    event.target.style.height = 'auto';
    event.target.style.height = `${event.target.scrollHeight}px`;
  }
});

document.querySelectorAll('.stars').forEach((starsEl) => {
  const key = starsEl.dataset.key;

  starsEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val, 10);
      scores[key] = val;

      [...starsEl.querySelectorAll('button')].forEach((starButton) => {
        starButton.classList.toggle('on', parseInt(starButton.dataset.val, 10) <= val);
      });

      updateGauge();
      updateTrail();
    });
  });
});

const trailSpans = document.querySelectorAll('#trail span');

function updateTrail(){
  const filled = Object.values(scores).filter((value) => value > 0).length;
  const ratio = filled / items.length;
  const activeCount = Math.round(ratio * trailSpans.length);

  trailSpans.forEach((span, index) => {
    span.classList.toggle('active', index < activeCount);
  });
}

const gaugeFill = document.getElementById('gaugeFill');
const gaugeDino = document.getElementById('gaugeDino');
const gaugeCaption = document.getElementById('gaugeCaption');

function currentAverage(){
  const vals = Object.values(scores).filter((value) => value > 0);
  if(vals.length === 0) return 0;
  return vals.reduce((sum, value) => sum + value, 0) / items.length;
}

function captionFor(avg){
  if(avg === 0) return '請先完成上方評分';
  if(avg < 2) return '🦖生氣中，需要立刻改進';
  if(avg < 3.2) return '🦖尚可接受，但有努力空間';
  if(avg < 4.2) return '🦖表示滿意，繼續保持';
  return '🦖非常滿意，予以嘉獎';
}

function updateGauge(){
  const avg = currentAverage();
  const pct = (avg / 5) * 100;

  gaugeFill.style.width = `${pct}%`;
  gaugeDino.style.left = `${pct}%`;
  gaugeCaption.textContent = captionFor(avg);
}

document.getElementById('form').addEventListener('submit', (event) => {
  event.preventDefault();

  try{
    const allRated = Object.values(scores).every((value) => value > 0);

    if(!allRated){
      gaugeCaption.textContent = '⚠️ 還有項目沒評分，客服部門無法結案';
      gaugeCaption.style.color = '#e8703f';

      const gaugeCard = gaugeCaption.closest('.card');
      gaugeCard.style.borderColor = '#ff8a65';
      gaugeCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        gaugeCard.style.borderColor = '';
      }, 1600);
      return;
    }

    const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
    const avg = total / items.length;
    const { tag, verdict } = getVerdict(avg);
    const report = collectReportValues();
    const breakdown = buildScoreBreakdown();

    document.getElementById('resultTag').textContent = tag;
    document.getElementById('resultScore').textContent = `${avg.toFixed(1)} / 5.0`;
    document.getElementById('resultEcho').innerHTML = buildReportHtml(report, breakdown, verdict);

    lastReportText = buildShareText(report, breakdown, tag, avg, verdict);

    document.getElementById('result').classList.add('show');
    prepareReportImage();
    document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }catch(err){
    gaugeCaption.textContent = `⚠️ 發生錯誤：${err.message}`;
    gaugeCaption.style.color = '#e8703f';
  }
});

function getVerdict(avg){
  if(avg < 2){
    return { tag: '瀕臨解約邊緣', verdict: '本期表現亮起紅燈，建議立即啟動補救措施。' };
  }
  if(avg < 3.2){
    return { tag: '待加強', verdict: '整體堪用，但顧客體驗仍有明顯進步空間。' };
  }
  if(avg < 4.2){
    return { tag: '服務良好', verdict: '顧客體驗穩定，維持水準即可續約。' };
  }
  return { tag: '五星優質客服', verdict: '本期表現優異，建議加薪（加宵夜）留任。' };
}

function collectReportValues(){
  const filledDate = document.getElementById('filledDate').value;

  return {
    name: document.getElementById('name').value || '🦖',
    filledDate: filledDate || '未填寫',
    q1: document.getElementById('q1').value || '（未填寫）',
    q2: document.getElementById('q2').value || '（未填寫）',
    q3: document.getElementById('q3').value || '（無客訴，暫且放過）',
    q4: document.getElementById('q4').value || '（未填寫）',
    q5: document.getElementById('q5').value || '（未填寫）',
  };
}

function buildScoreBreakdown(){
  return items.map((item) => {
    const line = `${item.label}：${'🦕'.repeat(scores[item.key])}${'･'.repeat(5 - scores[item.key])} (${scores[item.key]}/5)`;
    const note = notes[item.key] && notes[item.key].trim() ? `\n　　備註：${notes[item.key].trim()}` : '';
    return line + note;
  }).join('\n');
}

function buildReportHtml(report, breakdown, verdict){
  return `<b>填表人：</b>${report.name}　<b>填寫日期：</b>${report.filledDate}\n\n` +
    `<b>各項評分</b>\n${breakdown}\n\n` +
    `<b>總評語：</b>${verdict}\n\n` +
    `<b>印象最深：</b>${report.q1}\n` +
    `<b>心動／溫暖時刻：</b>${report.q2}\n` +
    `<b>客訴內容：</b>${report.q3}\n` +
    `<b>下期期待：</b>${report.q4}\n` +
    `<b>其他想說的話：</b>${report.q5}`;
}

function buildShareText(report, breakdown, tag, avg, verdict){
  return `🦕 小咚服務滿意度調查表 🦕\n` +
    `填表人：${report.name}　填寫日期：${report.filledDate}\n` +
    `總評：${tag}（${avg.toFixed(1)} / 5.0）\n\n` +
    `【各項評分】\n${breakdown.replace(/\n　　備註/g, '\n備註')}\n\n` +
    `總評語：${verdict}\n\n` +
    `印象最深：${report.q1}\n` +
    `心動／溫暖時刻：${report.q2}\n` +
    `客訴內容：${report.q3}\n` +
    `下期期待：${report.q4}\n` +
    `其他想說的話：${report.q5}`;
}

document.getElementById('copyBtn').addEventListener('click', async () => {
  const status = document.getElementById('shareStatus');

  try{
    await navigator.clipboard.writeText(lastReportText);
    status.textContent = '已複製到剪貼簿，可以直接貼上分享囉！';
  }catch(err){
    status.textContent = '複製失敗，請手動選取文字複製。';
  }
});

document.getElementById('imgLink').addEventListener('click', (event) => {
  const status = document.getElementById('shareStatus');
  const link = event.currentTarget;

  if(link.classList.contains('disabled')){
    event.preventDefault();
    status.textContent = '圖片還在準備中，請稍候。';
  }
});

async function prepareReportImage(){
  const status = document.getElementById('shareStatus');
  const link = document.getElementById('imgLink');
  resetImageLink();

  if(typeof html2canvas === 'undefined'){
    status.textContent = '圖片功能載入失敗，請改用「複製報告文字」。';
    return;
  }

  status.textContent = '圖片準備中...';
  const card = document.getElementById('reportCard');

  try{
    await waitForPaint();
    const canvas = await html2canvas(card, { backgroundColor: '#fff8ea', scale: 2 });
    const blob = await canvasToPngBlob(canvas);
    reportImageUrl = URL.createObjectURL(blob);

    link.href = reportImageUrl;
    link.download = 'dino-service-report.png';
    link.classList.remove('disabled');
    link.removeAttribute('aria-disabled');
    link.textContent = '🖼️ 下載成圖片';
    status.textContent = '圖片已準備好。';
  }catch(err){
    status.textContent = `圖片產生失敗：${err.message}`;
  }
}

function waitForPaint(){
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function resetImageLink(){
  const link = document.getElementById('imgLink');
  if(reportImageUrl){
    URL.revokeObjectURL(reportImageUrl);
    reportImageUrl = '';
  }

  link.href = '#';
  link.classList.add('disabled');
  link.setAttribute('aria-disabled', 'true');
  link.textContent = '🖼️ 圖片準備中';
}

function canvasToPngBlob(canvas){
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if(blob && blob.type === 'image/png'){
        resolve(blob);
        return;
      }

      reject(new Error('無法建立 PNG 圖片'));
    }, 'image/png');
  });
}
