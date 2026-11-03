// ===== 小学数学测试题 =====
const TOTAL = 20;
const STORAGE_KEY = 'math_quiz_rank_v1';

let questions = [];
let current = 0;
let correct = 0;
let startTime = 0;
let timerInterval = null;
let playerName = '';

// DOM
const $ = (id) => document.getElementById(id);
const pages = {
  start: $('page-start'),
  quiz:  $('page-quiz'),
  result:$('page-result'),
  rank:  $('page-rank'),
};

function showPage(name) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  pages[name].classList.add('active');
}

// ===== 出题：100以内加减法 =====
function genQuestion() {
  const isAdd = Math.random() < 0.5;
  let a, b, ans;
  if (isAdd) {
    a = Math.floor(Math.random() * 100) + 1;       // 1~100
    b = Math.floor(Math.random() * (100 - a)) + 1; // 保证和 ≤100
    ans = a + b;
    return { text: `${a} + ${b} = ?`, ans };
  } else {
    a = Math.floor(Math.random() * 100) + 1;  // 1~100
    b = Math.floor(Math.random() * a) + 1;    // 保证结果 ≥0
    ans = a - b;
    return { text: `${a} − ${b} = ?`, ans };
  }
}

// ===== 计时器 =====
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const s = ((Date.now() - startTime) / 1000).toFixed(1);
    $('timer').textContent = `⏱ ${s}秒`;
  }, 100);
}
function stopTimer() {
  clearInterval(timerInterval);
  return (Date.now() - startTime) / 1000;
}

// ===== 开始 =====
$('btn-start').addEventListener('click', () => {
  playerName = $('player-name').value.trim() || '匿名玩家';
  questions = [];
  for (let i = 0; i < TOTAL; i++) questions.push(genQuestion());
  current = 0;
  correct = 0;
  $('correct-count').textContent = '0';
  showPage('quiz');
  renderQuestion();
  startTimer();
  $('answer-input').focus();
});

function renderQuestion() {
  const q = questions[current];
  $('progress').textContent = `第 ${current + 1} / ${TOTAL} 题`;
  const qEl = $('question');
  qEl.textContent = q.text;
  qEl.className = 'question';
  $('answer-input').value = '';
  $('answer-input').focus();
}

// ===== 提交答案 =====
function submitAnswer() {
  const val = parseInt($('answer-input').value, 10);
  if (isNaN(val)) { $('answer-input').focus(); return; }

  const q = questions[current];
  const qEl = $('question');
  if (val === q.ans) {
    correct++;
    qEl.classList.add('correct');
  } else {
    qEl.classList.add('wrong');
  }
  $('correct-count').textContent = correct;

  // 短暂展示对错反馈，再下一题
  setTimeout(() => {
    current++;
    if (current >= TOTAL) {
      finish();
    } else {
      renderQuestion();
    }
  }, 300);
}

$('btn-next').addEventListener('click', submitAnswer);
$('answer-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitAnswer();
});

// ===== 结算 =====
function finish() {
  const totalSec = stopTimer();
  showPage('result');
  $('final-time').textContent = totalSec.toFixed(1) + '秒';
  $('final-score').textContent = `${correct} / ${TOTAL}`;
  const acc = Math.round(correct / TOTAL * 100);
  $('final-accuracy').textContent = acc + '%';

  // 保存排行榜
  const rank = getRank();
  const entry = { name: playerName, time: +totalSec.toFixed(1), score: correct, date: Date.now() };
  rank.push(entry);
  rank.sort((a, b) => a.time - b.time);
  const top10 = rank.slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));

  // 是否进榜
  const isNew = top10.indexOf(entry) !== -1;
  $('rank-badge').classList.toggle('hidden', !isNew);
}

$('btn-retry').addEventListener('click', () => {
  showPage('start');
});

// ===== 排行榜 =====
function getRank() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function renderRank() {
  const rank = getRank();
  const list = $('rank-list');
  list.innerHTML = '';
  if (rank.length === 0) {
    list.innerHTML = '<div class="rank-empty">还没有记录，快来挑战第一名！</div>';
    return;
  }
  rank.forEach((r, i) => {
    const medal = ['🥇','🥈','🥉'][i] || (i + 1);
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="rank-name">${medal} ${escapeHtml(r.name)}</span>
      <span class="rank-time">${r.time.toFixed(1)}秒 · ${r.score}题</span>
    `;
    list.appendChild(li);
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

$('btn-show-rank').addEventListener('click', () => { renderRank(); showPage('rank'); });
$('btn-back').addEventListener('click', () => showPage('start'));

// 回车也能开始
$('player-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('btn-start').click();
});
