// script.js

let currentUser = null;
let transactions = [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};

const balanceEl = document.getElementById('balance');
const listEl = document.getElementById('transaction-list');
const categoryFilter = document.getElementById('filter-category');
const alertEl = document.getElementById('budget-alert');
const userInfoEl = document.getElementById('user-info');
const topCatEl = document.getElementById('top-category');
const totalExpEl = document.getElementById('total-expense');
const savingTipEl = document.getElementById('saving-tip');

const chartCtx = document.getElementById('spending-chart').getContext('2d');
let spendingChart;

function updateApp() {
  localStorage.setItem(currentUser, JSON.stringify(transactions));
  displayTransactions();
  updateBalance();
  updateChart();
  showInsights();
  checkBudgets();
}

function displayTransactions() {
  listEl.innerHTML = '';
  const filter = categoryFilter.value;
  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.category === filter);
  filtered.forEach((t, i) => {
    const li = document.createElement('li');
    li.className = t.amount < 0 ? 'expense' : 'income';
    li.textContent = `${t.desc}: $${Math.abs(t.amount)} (${t.category})`;
    listEl.appendChild(li);
  });
}

function updateBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  balanceEl.textContent = `$${total.toFixed(2)}`;
}

function updateChart() {
  const data = {};
  transactions.forEach(t => {
    if (t.amount < 0) {
      data[t.category] = (data[t.category] || 0) + Math.abs(t.amount);
    }
  });
  const labels = Object.keys(data);
  const values = Object.values(data);
  if (spendingChart) spendingChart.destroy();
  spendingChart = new Chart(chartCtx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Expenses', data: values, backgroundColor: '#667eea' }] },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

function showInsights() {
  const expenses = transactions.filter(t => t.amount < 0);
  const totals = {};
  for (let t of expenses) {
    totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount);
  }
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const totalSpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  topCatEl.textContent = top ? `Most spent on: ${top[0]} ($${top[1].toFixed(2)})` : 'No data yet';
  totalExpEl.textContent = `Total expenses: $${totalSpent.toFixed(2)}`;
  savingTipEl.textContent = top && top[0] === 'entertainment'
    ? '💡 Tip: Try cutting entertainment costs.'
    : '💡 Tip: Plan meals to save on food.';
}

function checkBudgets() {
  const spent = {};
  transactions.filter(t => t.amount < 0).forEach(t => {
    spent[t.category] = (spent[t.category] || 0) + Math.abs(t.amount);
  });
  for (let cat in budgets) {
    const used = spent[cat] || 0;
    if (used >= 0.75 * budgets[cat]) {
      alertEl.textContent = `⚠️ Near ${cat} budget: $${used} / $${budgets[cat]}`;
      return;
    }
  }
  alertEl.textContent = '';
}

// Auth
const users = JSON.parse(localStorage.getItem('users')) || {};

function saveUsers() {
  localStorage.setItem('users', JSON.stringify(users));
}

document.getElementById('signup-btn').onclick = () => {
  const u = document.getElementById('signup-username').value;
  const p = document.getElementById('signup-password').value;
  if (users[u]) return showMsg('signup', 'Username taken');
  users[u] = p;
  saveUsers();
  showMsg('signup', 'Signup successful ✅', true);
};

document.getElementById('login-btn').onclick = () => {
  const u = document.getElementById('login-username').value;
  const p = document.getElementById('login-password').value;
  if (users[u] !== p) return showMsg('login', 'Invalid credentials');
  currentUser = u;
  transactions = JSON.parse(localStorage.getItem(currentUser)) || [];
  document.getElementById('auth-forms').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  userInfoEl.textContent = `Logged in as: ${u}`;
  updateApp();
};

document.getElementById('logout-btn').onclick = () => {
  currentUser = null;
  transactions = [];
  document.getElementById('auth-forms').style.display = 'block';
  document.getElementById('app').style.display = 'none';
};

document.getElementById('show-login').onclick = () => {
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
};
document.getElementById('show-signup').onclick = () => {
  document.getElementById('signup-form').style.display = 'block';
  document.getElementById('login-form').style.display = 'none';
};

function showMsg(type, msg, success = false) {
  const el = document.getElementById(`${type}-message`);
  el.textContent = msg;
  el.className = success ? 'message success' : 'message';
}

// Transactions

document.getElementById('transaction-form').onsubmit = e => {
  e.preventDefault();
  const desc = document.getElementById('desc').value;
  const amt = parseFloat(document.getElementById('amount').value);
  const cat = document.getElementById('category').value;
  if (!desc || isNaN(amt)) return;
  transactions.push({ desc, amount: amt, category: cat });
  updateApp();
  e.target.reset();
};

categoryFilter.onchange = updateApp;

document.getElementById('set-budget-btn').onclick = () => {
  const cat = document.getElementById('budget-category').value;
  const amt = parseFloat(document.getElementById('budget-amount').value);
  if (isNaN(amt) || amt <= 0) return alert('Invalid budget');
  budgets[cat] = amt;
  localStorage.setItem('budgets', JSON.stringify(budgets));
  updateApp();
  alert(`Budget set for ${cat}`);
};

// Dark mode
const toggleBtn = document.getElementById('dark-mode-toggle');
toggleBtn.onclick = () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
};
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
}

// PWA Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(err => console.error('SW Error', err));
}
