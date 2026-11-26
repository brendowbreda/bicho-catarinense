const state = {
  user: null,
  balance: 0,
  balanceVisible: true,
  currentView: "home",
  viewHistory: [],
  selectedAnimal: null,
};

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  initForms();
  renderResults();
  renderBichoGrid("bicho-animal-grid");
  renderBichosGallery();
  renderCotacoes();
  initLanding();

  const saved = localStorage.getItem("app_user");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      state.user = data.user;
      state.balance = data.balance || 0;
      showPage("app");
      updateBalance();
    } catch (_) {}
  }
});

// ============ THEME ============

function applyTheme() {
  document.title = APP_CONFIG.name;
  const brand = document.getElementById("header-brand");
  if (brand) brand.textContent = APP_CONFIG.name.toUpperCase();

  ["login-logo", "register-logo", "forgot-logo"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (APP_CONFIG.logo) {
      el.innerHTML = `<img src="${APP_CONFIG.logo}" alt="${APP_CONFIG.name}">`;
    } else {
      const short = APP_CONFIG.shortName || APP_CONFIG.name.substring(0, 2);
      el.innerHTML = `<div class="auth-logo-text"><span>${short[0]}</span><span>${short[1] || ""}</span></div>`;
    }
  });
}

// ============ NAVIGATION ============

function showPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add("active");
  if (page === "app") goHome();
  if (page === "register") resetReg();
}

function openView(view) {
  if (state.currentView !== "home" && state.currentView !== view) {
    state.viewHistory.push(state.currentView);
  } else if (state.currentView === "home") {
    state.viewHistory = [];
  }

  document.querySelectorAll("#app-content > div").forEach((v) => v.classList.add("hidden"));
  const el = document.getElementById(`view-${view}`);
  if (el) el.classList.remove("hidden");

  state.currentView = view;

  if (view === "carteira") {
    updateBalance();
    renderExtrato("todos");
    renderApostas("aguardando");
  }
  if (view === "resultados") renderResultsLotteries();
  if (view === "roletinha") { initReels(); startWinnerTicker(); renderSlotsTabela(); updateSlotsGanha(); }
  if (view === "roleta-wheel") { initWheelGame(); startLiveCounter(); startWinnerTickerWheel(); }
  if (view === "notificacoes") renderNotifications();
  if (view === "configuracoes") loadConfigSummary();
  if (view === "config-pessoal") loadConfigPessoal();

  const mainHeader = document.getElementById("main-header");
  const subHeader = document.getElementById("sub-header");
  const titleEl = document.getElementById("sub-header-title");

  const titles = {
    home: "",
    carteira: "Minha Carteira",
    jogos: "Jogo do Bicho",
    "apostar-bicho": "Apostar — Bicho",
    "roleta-menu": "Roleta dos Bichos",
    roletinha: "Slots",
    "roleta-wheel": "Roleta dos Bichos",
    recarga: "Recarga PIX",
    saque: "Novo Saque",
    apostas: "Minhas Apostas",
    resultados: "Resultados",
    cotacoes: "Cotações",
    "bichos-lista": "Bichos",
    bingo: "Bingo",
    raspadinha: "Raspadinha",
    notificacoes: "Notificações",
    configuracoes: "Configurações",
    "config-pessoal": "Informações pessoais",
    "config-acesso": "Informações de acesso",
    "config-endereco": "Meu endereço",
  };

  const saldoBar = document.querySelector(".saldo-bar");
  const homeActions = document.getElementById("home-actions");

  if (view === "home") {
    mainHeader.classList.remove("hidden");
    subHeader.classList.add("hidden");
    if (saldoBar) saldoBar.classList.remove("hidden");
    if (homeActions) homeActions.classList.remove("hidden");
  } else {
    mainHeader.classList.add("hidden");
    subHeader.classList.remove("hidden");
    if (saldoBar) saldoBar.classList.add("hidden");
    if (homeActions) homeActions.classList.add("hidden");
    titleEl.textContent = titles[view] || view;

    const headerColors = {
      jogos: "var(--blue)",
      "apostar-bicho": "var(--blue)",
      "bichos-lista": "var(--blue)",
      "roleta-menu": "#C0392B",
      roletinha: "#B8860B",
      "roleta-wheel": "#C0392B",
      bingo: "#4A2078",
      raspadinha: "#C0392B",
      cotacoes: "#B8860B",
    };
    const whiteHeaders = ['notificacoes','configuracoes','config-pessoal','config-acesso','config-endereco'];
    const backBtn = subHeader.querySelector('.sub-header-back');
    const menuBtn = subHeader.querySelector('.sub-header-menu');
    if (whiteHeaders.includes(view)) {
      subHeader.style.background = '#fff';
      subHeader.style.color = 'var(--fg)';
      subHeader.style.borderBottom = '1px solid var(--border)';
      if (backBtn) backBtn.style.color = 'var(--fg)';
      if (menuBtn) menuBtn.style.color = 'var(--fg)';
    } else {
      subHeader.style.background = headerColors[view] || "var(--blue)";
      subHeader.style.color = '#fff';
      subHeader.style.borderBottom = 'none';
      if (backBtn) backBtn.style.color = '#fff';
      if (menuBtn) menuBtn.style.color = '#fff';
    }
  }
}

function goHome() {
  state.viewHistory = [];
  openView("home");
}

function goBack() {
  if (state.viewHistory.length > 0) {
    openView(state.viewHistory.pop());
  } else {
    goHome();
  }
}

// ============ AUTH ============

function initForms() {
  document.getElementById("form-login").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!fd.get("cpf") || !fd.get("senha")) {
      toast("Preencha todos os campos", "error");
      return;
    }
    state.user = { cpf: formatCPF(fd.get("cpf")), name: "Jogador" };
    state.balance = 0;
    saveState();
    showPage("app");
    updateBalance();
    toast("Bem-vindo!", "success");
  });

  document.getElementById("form-forgot").addEventListener("submit", (e) => {
    e.preventDefault();
    toast("Instruções enviadas por WhatsApp!", "success");
    setTimeout(() => showPage("login"), 1500);
  });
}

function logout() {
  state.user = null;
  state.balance = 0;
  localStorage.removeItem("app_user");
  showPage("login");
  toast("Você saiu", "info");
}

// ============ BALANCE ============

function updateBalance() {
  const el = document.getElementById("balance-display");
  const saqueEl = document.getElementById("balance-saque");
  const carteiraBalance = document.getElementById("carteira-balance");
  const carteiraSaque = document.getElementById("carteira-saque");

  if (state.balanceVisible) {
    const formatted = `R$ ${formatMoney(state.balance)}`;
    el.textContent = formatted;
    if (carteiraBalance) carteiraBalance.textContent = formatted;
  } else {
    el.textContent = "R$ ••••";
    if (carteiraBalance) carteiraBalance.textContent = "R$ ••••";
  }

  const saqueFormatted = `R$ ${formatMoney(state.balance)}`;
  if (saqueEl) saqueEl.textContent = saqueFormatted;
  if (carteiraSaque) carteiraSaque.textContent = saqueFormatted;
  updateDrawerBalance();
}

function toggleBalanceVisibility() {
  state.balanceVisible = !state.balanceVisible;
  updateBalance();
  const icon = document.getElementById("eye-icon");
  if (state.balanceVisible) {
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>';
  }
}

// ============ DRAWER ============

function openDrawer() {
  document.getElementById("drawer-overlay").classList.add("open");
}

function closeDrawer() {
  document.getElementById("drawer-overlay").classList.remove("open");
}

// ============ RECARGA / SAQUE ============

function setDeposit(amount) {
  const el = document.getElementById("deposit-amount");
  const current = parseFloat((el.value || '0').replace('R$','').replace(/\s/g,'').replace(',','.')) || 0;
  const total = current + amount;
  el.value = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function confirmDeposit() {
  const raw = document.getElementById("deposit-amount").value;
  const amount = parseFloat(raw.replace('R$','').replace(/\s/g,'').replace(",", "."));
  if (!amount || amount < 5) {
    toast("Valor mínimo: R$ 5,00", "error");
    return;
  }
  state.balance += amount;
  saveState();
  updateBalance();
  document.getElementById("pix-value").textContent = `R$ ${formatMoney(amount)}`;
  document.getElementById("modal-pix").classList.add("open");
  document.getElementById("deposit-amount").value = "";
}

function toggleDepositHistory() {
  const el = document.getElementById('deposit-history');
  if (!el.classList.contains('hidden')) {
    el.classList.add('hidden');
    return;
  }
  const deposits = [
    { date: '23/11/2026, 14:30', value: 50, status: 'Confirmado' },
    { date: '20/11/2026, 09:15', value: 20, status: 'Confirmado' },
    { date: '18/11/2026, 21:00', value: 10, status: 'Confirmado' },
    { date: '15/11/2026, 16:45', value: 100, status: 'Confirmado' },
  ];
  el.innerHTML = `<div class="white-card" style="padding:1rem;">
    <h4 style="margin:0 0 0.75rem;font-size:0.9375rem;">Seus depósitos</h4>
    ${deposits.length === 0 ? '<p style="color:var(--fg-muted);font-size:0.875rem;">Nenhum depósito realizado.</p>' :
    deposits.map(d => `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border);">
      <div><div style="font-size:0.8125rem;font-weight:600;">R$ ${formatMoney(d.value)}</div><div style="font-size:0.6875rem;color:var(--fg-muted);">${d.date}</div></div>
      <span style="font-size:0.6875rem;font-weight:600;color:var(--green);">${d.status}</span>
    </div>`).join('')}
  </div>`;
  el.classList.remove('hidden');
}

function confirmWithdraw() {
  const amount = parseFloat(document.getElementById("withdraw-amount").value);
  const key = document.getElementById("withdraw-pix-key").value;
  if (!key) { toast("Informe a chave PIX", "error"); return; }
  if (!amount || amount < 1) { toast("Valor mínimo: R$ 1,00", "error"); return; }
  if (amount > state.balance) { toast("Saldo insuficiente", "error"); return; }
  state.balance -= amount;
  saveState();
  updateBalance();
  toast("Saque solicitado com sucesso!", "success");
  document.getElementById("withdraw-amount").value = "";
  document.getElementById("withdraw-pix-key").value = "";
}

function closeModal(name) {
  document.getElementById(`modal-${name}`).classList.remove("open");
}

function copyPixCode() {
  const code = "00020126580014br.gov.bcb.pix0136" + (APP_CONFIG.pixKey || "pix@empresa.com");
  navigator.clipboard?.writeText(code).then(() => toast("Código PIX copiado!", "success")).catch(() => toast("PIX gerado", "info"));
}

function copyReferral() {
  const link = document.getElementById("referral-link").textContent;
  navigator.clipboard?.writeText(link).then(() => toast("Link copiado!", "success")).catch(() => toast("Link copiado", "info"));
}

// ============ ROLETINHA ============

let liveCount = 282;
let liveCountInterval = null;
let winnerTickerInterval = null;
let roletinhaBetType = null;
let roletinhaSpinning = false;

const fakeNames = [
  'Ana','Bruno','Carla','Daniel','Eduardo','Fernanda','Gabriel','Helena',
  'Igor','Julia','Karen','Lucas','Maria','Nicolas','Olivia','Pedro',
  'Rafaela','Samuel','Tatiana','Victor','Wesley','Yasmin','Zeca',
  'Amanda','Beatriz','Caio','Diego','Elisa','Felipe','Gustavo','Henrique',
  'Isabela','João','Larissa','Mateus','Natalia','Oscar','Patricia','Renato',
  'Sandra','Thiago','Vanessa','William','Cristina','Rodrigo','Luana','Marcos'
];

const fakeBets = ['Par','Ímpar','Dourado'];
let tickerCycleCount = 0;

function startLiveCounter() {
  if (liveCountInterval) return;
  liveCount = 137 + Math.floor(Math.random() * 231);
  updateLiveCount();
  liveCountInterval = setInterval(() => {
    const delta = (Math.random() < 0.5 ? -1 : 1) * (7 + Math.floor(Math.random() * 7));
    liveCount = Math.max(137, Math.min(368, liveCount + delta));
    updateLiveCount();
  }, 60000);
}

function updateLiveCount() {
  const el = document.getElementById('live-count');
  if (el) el.textContent = liveCount;
}

function startWinnerTicker() {
  if (winnerTickerInterval) return;
  updateWinnerTicker();
  winnerTickerInterval = setInterval(updateWinnerTicker, 8000);
}

function updateWinnerTicker() {
  const el = document.getElementById('winner-ticker');
  if (!el) return;
  const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
  const initial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const bet = fakeBets[Math.floor(Math.random() * fakeBets.length)];
  const smallAmounts = [1,1,5,5,10];
  const posInCycle = tickerCycleCount % 6;
  let baseAmount;
  if (posInCycle < 5) {
    baseAmount = smallAmounts[posInCycle];
  } else {
    baseAmount = 25;
  }
  const fullCycle = Math.floor(tickerCycleCount / 6);
  if (fullCycle > 0 && fullCycle % 2 === 0 && posInCycle === 0) {
    baseAmount = 100;
  }
  tickerCycleCount++;
  const mult = bet === 'Dourado' ? 50 : 2;
  const value = baseAmount * mult;
  const formatted = value.toFixed(2).replace('.', ',');
  el.innerHTML = `${name} ${initial}. ganhou <strong style="color:var(--green)">R$ ${formatted}</strong> no ${bet}`;
}

const ITEM_H = 120;
const GOLDEN = { name: 'Dourado', img: null, special: 'dourado' };

function buildReelStrip() {
  const a = APP_CONFIG.animals;
  const strip = [];
  for (let i = 0; i < 14; i++) strip.push(a[i]);
  strip.push(GOLDEN);
  for (let i = 14; i < 25; i++) strip.push(a[i]);
  strip.push(GOLDEN);
  return strip;
}

function renderReelItem(sym) {
  if (sym.special === 'dourado') {
    return `<div class="reel-item golden-item"><span class="golden-star">⭐</span></div>`;
  }
  return `<div class="reel-item"><img src="${sym.img}" alt="${sym.name}"></div>`;
}

function initReels() {
  const strip = buildReelStrip();
  for (let r = 0; r < 3; r++) {
    const reel = document.querySelector(`#reel-${r} .reel-inner`);
    if (!reel) continue;
    const start = Math.floor(Math.random() * strip.length);
    let html = '';
    for (let i = -1; i <= 1; i++) {
      html += renderReelItem(strip[(start + i + strip.length) % strip.length]);
    }
    reel.innerHTML = html;
    reel.style.transform = `translateY(-${ITEM_H - 40}px)`;
  }
}

function spinReels(betType) {
  if (roletinhaSpinning) return;
  roletinhaSpinning = true;
  const strip = buildReelStrip();
  const result = determineResult(betType);

  for (let r = 0; r < 3; r++) {
    const reel = document.querySelector(`#reel-${r} .reel-inner`);
    if (!reel) continue;
    const spins = 20 + r * 6;
    let html = '';
    for (let i = 0; i < spins; i++) {
      html += renderReelItem(strip[Math.floor(Math.random() * strip.length)]);
    }
    const above = strip[Math.floor(Math.random() * strip.length)];
    html += renderReelItem(above);
    html += renderReelItem(result[r]);
    const below = strip[Math.floor(Math.random() * strip.length)];
    html += renderReelItem(below);

    reel.innerHTML = html;
    reel.style.transition = 'none';
    reel.style.transform = 'translateY(0)';

    const finalPos = -(spins * ITEM_H) - (ITEM_H - 40);
    const delay = r * 400;
    setTimeout(() => {
      reel.style.transition = `transform ${1.5 + r * 0.5}s cubic-bezier(0.15, 0.6, 0.15, 1)`;
      reel.style.transform = `translateY(${finalPos}px)`;
    }, delay);
  }

  const totalTime = 1500 + 2 * 400 + 2 * 500 + 500;
  setTimeout(() => {
    showRoletinhaResult(betType, result);
    roletinhaSpinning = false;
  }, totalTime);
}

function determineResult(betType) {
  const animals = APP_CONFIG.animals;
  const parAnimals = animals.filter(a => a.id % 2 === 0);
  const imparAnimals = animals.filter(a => a.id % 2 !== 0);
  const rand = Math.random();

  if (betType === 'bc' && rand < 0.02) {
    return [GOLDEN, GOLDEN, GOLDEN];
  }

  if (betType === 'par' && rand < 0.40) {
    return [
      parAnimals[Math.floor(Math.random() * parAnimals.length)],
      parAnimals[Math.floor(Math.random() * parAnimals.length)],
      parAnimals[Math.floor(Math.random() * parAnimals.length)]
    ];
  }
  if (betType === 'impar' && rand < 0.40) {
    return [
      imparAnimals[Math.floor(Math.random() * imparAnimals.length)],
      imparAnimals[Math.floor(Math.random() * imparAnimals.length)],
      imparAnimals[Math.floor(Math.random() * imparAnimals.length)]
    ];
  }

  const mix = [];
  for (let i = 0; i < 3; i++) {
    if (Math.random() < 0.07) mix.push(GOLDEN);
    else mix.push(animals[Math.floor(Math.random() * animals.length)]);
  }
  return mix;
}

function showRoletinhaResult(betType, result) {
  const amount = parseFloat(document.getElementById('roletinha-amount').value) || 1;
  let won = false;
  let mult = 0;

  const allGolden = result.every(r => r.special === 'dourado');
  const allPar = !allGolden && result.every(r => r.special !== 'dourado' && r.id % 2 === 0);
  const allImpar = !allGolden && result.every(r => r.special !== 'dourado' && r.id % 2 !== 0);

  if (betType === 'bc' && allGolden) { won = true; mult = 50; }
  else if (betType === 'par' && allPar) { won = true; mult = 2; }
  else if (betType === 'impar' && allImpar) { won = true; mult = 2; }

  const prize = won ? amount * mult : 0;

  setTimeout(() => {
    if (won) {
      toast(`Você ganhou R$ ${prize.toFixed(2).replace('.', ',')}! (${mult}x)`, 'success');
    } else {
      toast('Não foi dessa vez, tente novamente!', 'error');
    }
  }, 300);
}

function selectSlotsBet(type) {
  roletinhaBetType = type;
  document.querySelectorAll('.bet-btn-par,.bet-btn-impar,.bet-btn-dourado').forEach(el => el.classList.remove('selected'));
  if (type === 'par') document.getElementById('btn-par').classList.add('selected');
  else if (type === 'impar') document.getElementById('btn-impar').classList.add('selected');
  else if (type === 'bc') document.getElementById('btn-bc').classList.add('selected');
  updateSlotsGanha();
}

function girarSlots() {
  if (!roletinhaBetType) { toast('Escolha PAR, ÍMPAR ou DOURADO', 'error'); return; }
  spinReels(roletinhaBetType);
}

function updateSlotsGanha() {
  const el = document.getElementById('slots-ganha');
  if (!el) return;
  const amount = parseFloat(document.getElementById('roletinha-amount')?.value) || 1;
  const mult = roletinhaBetType === 'bc' ? 50 : 2;
  const prize = (amount * mult).toFixed(2).replace('.', ',');
  el.textContent = `Ganha R$ ${prize}`;
}

function adjustRoletinha(delta) {
  const el = document.getElementById("roletinha-amount");
  let val = parseFloat(el.value) || 1;
  val = Math.max(0.10, Math.min(1000, val + delta));
  el.value = val.toFixed(2);
  updateSlotsGanha();
}

function renderSlotsTabela() {
  const grid = document.getElementById('slots-tabela-grid');
  if (!grid) return;
  const animals = APP_CONFIG.animals;
  const goldenCard = `<div class="slots-bicho-item" style="border-color:#DAA520;background:linear-gradient(135deg,#ffd700,#ffaa00)">
    <span style="font-size:2.5rem">⭐</span>
    <div class="slots-bicho-name" style="color:#fff;font-weight:900">DOURADO</div>
    <div class="slots-bicho-nums" style="color:rgba(255,255,255,0.8)">50x</div>
    <div class="slots-bicho-tag" style="background:#B8860B">DOURADO</div>
  </div>`;
  let html = goldenCard;
  for (let i = 0; i < 14; i++) {
    const a = animals[i];
    const isEven = a.id % 2 === 0;
    const color = isEven ? 'var(--green)' : 'var(--red)';
    const label = isEven ? 'PAR' : 'ÍMPAR';
    html += `<div class="slots-bicho-item" style="border-color:${color}">
      <img src="${a.img}" alt="${a.name}">
      <div class="slots-bicho-name">${a.name}</div>
      <div class="slots-bicho-nums">${a.numbers}</div>
      <div class="slots-bicho-tag" style="background:${color}">${label}</div>
    </div>`;
  }
  html += goldenCard;
  for (let i = 14; i < 25; i++) {
    const a = animals[i];
    const isEven = a.id % 2 === 0;
    const color = isEven ? 'var(--green)' : 'var(--red)';
    const label = isEven ? 'PAR' : 'ÍMPAR';
    html += `<div class="slots-bicho-item" style="border-color:${color}">
      <img src="${a.img}" alt="${a.name}">
      <div class="slots-bicho-name">${a.name}</div>
      <div class="slots-bicho-nums">${a.numbers}</div>
      <div class="slots-bicho-tag" style="background:${color}">${label}</div>
    </div>`;
  }
  grid.innerHTML = html;
}

// ============ BICHO BET ============

function renderBichoGrid(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = APP_CONFIG.animals
    .map(
      (a) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;border-radius:8px;background:#fff;border:2px solid transparent;cursor:pointer;text-align:center;border:1px solid var(--border);" onclick="selectAnimal(${a.id},this,'${containerId}')">
      <span style="font-size:1.5rem;line-height:1;">${a.emoji}</span>
      <span style="font-size:0.5625rem;font-weight:600;color:var(--fg);line-height:1.2;">${a.name}</span>
      <span style="font-size:0.5rem;color:var(--fg-muted);">${a.numbers}</span>
    </div>
  `
    )
    .join("");
}

function renderBichosGallery() {
  const container = document.getElementById("bichos-gallery-grid");
  if (!container) return;
  container.innerHTML = APP_CONFIG.animals
    .map(
      (a) => `
    <div class="bicho-gallery-card">
      <div class="bicho-gallery-num">${String(a.id).padStart(2, "0")}</div>
      <div class="bicho-gallery-img-wrap">
        <img src="${a.img}" alt="${a.name}" class="bicho-gallery-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
        <div class="bicho-gallery-emoji" style="display:none;">${a.emoji}</div>
      </div>
      <div class="bicho-gallery-name">${a.name}</div>
      <div class="bicho-gallery-numbers">${a.numbers}</div>
    </div>
  `
    )
    .join("");
}

function selectAnimal(id, el, containerId) {
  const container = document.getElementById(containerId);
  container.querySelectorAll("div[onclick]").forEach((c) => {
    c.style.borderColor = "var(--border)";
    c.style.background = "#fff";
  });
  el.style.borderColor = "var(--blue)";
  el.style.background = "rgba(74,127,212,0.08)";
  state.selectedAnimal = id;
}

function placeBichoBet() {
  if (!state.selectedAnimal) { toast("Selecione um bicho", "error"); return; }
  const amount = parseFloat(document.getElementById("bicho-bet-amount").value);
  if (!amount || amount < 1) { toast("Informe o valor", "error"); return; }
  if (amount > state.balance) { toast("Saldo insuficiente", "error"); return; }

  const animal = APP_CONFIG.animals.find((a) => a.id === state.selectedAnimal);
  state.balance -= amount;
  saveState();
  updateBalance();
  toast(`Aposta ${animal.emoji} ${animal.name} R$ ${formatMoney(amount)} realizada!`, "success");
  document.getElementById("bicho-bet-amount").value = "";
  state.selectedAnimal = null;
}

// ============ RESULTS ============

const RESULT_LOTTERIES = [
  { id:'rio-federal', name:'RIO/FEDERAL', times:['PT RIO 09:20H','LT MALUCA PT RIO 09:20H','PT RIO 11:20H','LT MALUCA PT RIO 11:20H','PT RIO 14:20H','LT MALUCA PT RIO 14:20H','PT RIO 16:20H','LT MALUCA PT RIO 16:20H','PT RIO 18:20H','LT MALUCA PT RIO 18:20H','PT RIO 21:20H','LT MALUCA PT RIO 21:20H'] },
  { id:'nacional', name:'NACIONAL', times:['PT NACIONAL 14:00H','PT NACIONAL 16:00H','PT NACIONAL 18:00H','PT NACIONAL 21:00H'] },
  { id:'look-goias', name:'LOOK/GOIÁS', times:['LOOK GOIÁS 11:20H','LOOK GOIÁS 14:20H','LOOK GOIÁS 16:20H','LOOK GOIÁS 18:20H','LOOK GOIÁS 21:20H'] },
  { id:'bahia', name:'BAHIA', times:['PT BAHIA 12:00H','PT BAHIA 15:00H','PT BAHIA 19:00H'] },
  { id:'lotep', name:'LOTEP', times:['LOTEP 11:00H','LOTEP 14:00H','LOTEP 18:00H'] },
  { id:'lotece', name:'LOTECE', times:['LOTECE 11:00H','LOTECE 14:00H','LOTECE 18:00H'] },
  { id:'sao-paulo', name:'SAO PAULO', times:['PT SP 11:20H','PT SP 14:20H','PT SP 16:20H','PT SP 18:20H'] },
  { id:'minas-gerais', name:'MINAS GERAIS', times:['PT MG 11:00H','PT MG 14:00H','PT MG 18:00H'] },
  { id:'sorte', name:'SORTE', times:['SORTE 11:00H','SORTE 14:00H','SORTE 18:00H'] },
  { id:'boasorte-goias', name:'BOASORTE/GOIÁS', times:['BOASORTE 11:20H','BOASORTE 14:20H','BOASORTE 18:20H'] },
  { id:'tradicional', name:'TRADICIONAL', times:['TRADICIONAL 09:20H','TRADICIONAL 14:20H','TRADICIONAL 21:20H'] },
  { id:'pernambuco', name:'PERNAMBUCO', times:['PT PE 11:00H','PT PE 14:00H','PT PE 18:00H'] },
  { id:'paraiba', name:'PARAÍBA', times:['PT PB 11:00H','PT PB 14:00H','PT PB 18:00H'] },
];

function renderResultsLotteries() {
  const list = document.getElementById("results-lottery-list");
  if (!list) return;
  list.innerHTML = RESULT_LOTTERIES.map(l => `
    <div class="results-lottery-card" id="rl-${l.id}">
      <div class="results-lottery-header" onclick="toggleResultLottery('${l.id}')">
        <span class="results-lottery-name">${l.name}</span>
        <svg class="results-lottery-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      <div class="results-lottery-body">
        ${l.times.map(t => {
          const now = new Date();
          const hourMatch = t.match(/(\d{2}):(\d{2})H/);
          const h = hourMatch ? parseInt(hourMatch[1]) : 24;
          const m = hourMatch ? parseInt(hourMatch[2]) : 0;
          const available = (now.getHours() > h) || (now.getHours() === h && now.getMinutes() >= m);
          return `<div class="results-time-wrap">
            <div class="results-time-item${available?'':' unavailable'}" onclick="${available ? `showResultDetail(this,'${t}')` : ''}">
              <span class="results-time-name">${t}</span>
              ${!available ? '<span class="results-time-na">Resultado ainda não disponível</span>' : ''}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="results-time-chevron"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function toggleResultLottery(id) {
  document.getElementById(`rl-${id}`).classList.toggle('open');
}

function showResultDetail(el, timeName) {
  const wrap = el.closest('.results-time-wrap');
  const existing = wrap.querySelector('.result-detail-inline');
  if (existing) { existing.remove(); return; }

  document.querySelectorAll('.result-detail-inline').forEach(e => e.remove());

  const animals = APP_CONFIG.animals;
  let html = `<div class="result-detail-inline">
    <div class="result-detail-header">
      <div class="result-detail-title">RESULTADOS</div>
      <div class="result-detail-date">${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
    <div class="result-detail-time">${timeName}</div>`;
  for (let i = 1; i <= 5; i++) {
    const num = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const dezena = parseInt(num.slice(-2));
    const grupo = Math.floor((dezena - 1) / 4) + 1;
    const grupoIdx = Math.max(0, Math.min(24, grupo - 1));
    const animal = animals[grupoIdx];
    html += `<div class="result-detail-row">
      <span class="result-detail-pos">${i}:</span>
      <span class="result-detail-num">${num}</span>
      <span class="result-detail-grupo">G.${String(grupo).padStart(2,'0')}</span>
      <span class="result-detail-animal">${animal.name}</span>
    </div>`;
  }
  html += '</div>';
  wrap.insertAdjacentHTML('beforeend', html);
  wrap.querySelector('.result-detail-inline').scrollIntoView({behavior:'smooth', block:'nearest'});
}

function renderResults() {}

// ============ COTAÇÕES ============

function renderCotacoes() {
  const el = document.getElementById("cotacoes-content");
  if (!el) return;
  el.innerHTML = APP_CONFIG.gameTypes
    .map(
      (g) => `
    <div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border);">
      <span style="font-weight:500;">${g.name}</span>
      <span style="font-weight:700;color:var(--blue);">${g.payout}</span>
    </div>
  `
    )
    .join("");
}

// ============ CARTEIRA / TABS ============

function switchTab(section, tab, btn) {
  const tabBar = btn.parentElement;
  tabBar.querySelectorAll(".tab-item").forEach((t) => t.classList.remove("active"));
  btn.classList.add("active");

  if (section === "extrato") {
    renderExtrato(tab);
  } else if (section === "apostas") {
    renderApostas(tab);
  }
}

function openSaqueInfo() {
  document.getElementById("modal-saque-info").classList.add("open");
}

function renderExtrato(filter) {
  const container = document.getElementById("extrato-list");
  if (!container) return;

  const mockData = [
    { type: "deposito", label: "Depósito PIX", date: "13/10/2026, 14:32", value: 50, positive: true },
    { type: "aposta", label: "Aposta — Bicho", date: "13/10/2026, 14:45", value: -10, positive: false },
    { type: "premio", label: "Prêmio — Bicho", date: "13/10/2026, 15:10", value: 180, positive: true },
    { type: "saque", label: "Saque PIX", date: "12/10/2026, 18:20", value: -100, positive: false },
    { type: "deposito", label: "Depósito PIX", date: "12/10/2026, 10:05", value: 30, positive: true },
    { type: "aposta", label: "Aposta — Roletinha", date: "11/10/2026, 22:10", value: -5, positive: false },
    { type: "saque", label: "Saque PIX", date: "11/10/2026, 09:00", value: -25, positive: false },
  ];

  let items = mockData;
  if (filter === "depositos") items = mockData.filter((i) => i.type === "deposito" || i.type === "premio");
  else if (filter === "saques") items = mockData.filter((i) => i.type === "saque");

  if (items.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--fg-muted);font-size:0.875rem;">Nenhuma movimentação encontrada.</div>';
    return;
  }

  container.innerHTML = items
    .map(
      (i) => `
    <div class="extrato-item">
      <div class="extrato-item-left">
        <div class="extrato-item-label">${i.label}</div>
        <div class="extrato-item-date">${i.date}</div>
      </div>
      <div class="extrato-item-value ${i.positive ? "positive" : "negative"}">${i.positive ? "+" : ""}R$ ${formatMoney(Math.abs(i.value))}</div>
    </div>
  `
    )
    .join("");
}

function renderApostas(filter) {
  const container = document.getElementById("apostas-carteira-list");
  if (!container) return;

  const mockBets = [
    { type: "Bicho — Grupo", animal: "Tigre 🐅", value: 10, premio: 180, status: "aguardando", date: "13/10/2026, 14:45 — PTN 18:20" },
    { type: "Roletinha — Par", animal: "", value: 5, premio: 10, status: "ganhou", date: "12/10/2026, 21:30" },
    { type: "Bicho — Milhar", animal: "Cobra 🐍", value: 20, premio: 0, status: "perdeu", date: "12/10/2026, 14:20 — PT" },
    { type: "Bicho — Dezena", animal: "Leão 🦁", value: 5, premio: 300, status: "ganhou", date: "11/10/2026, 11:20 — PTM" },
    { type: "Roletinha — Ímpar", animal: "", value: 2, premio: 0, status: "perdeu", date: "11/10/2026, 20:15" },
  ];

  let items = mockBets;
  if (filter !== "aguardando" || filter === undefined) {
    items = mockBets.filter((b) => b.status === filter);
  }

  if (items.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--fg-muted);font-size:0.875rem;">Nenhuma aposta encontrada.</div>';
    return;
  }

  container.innerHTML = items
    .map(
      (b) => `
    <div class="aposta-card">
      <div class="aposta-card-header">
        <span class="aposta-card-type">${b.type}</span>
        <span class="aposta-badge ${b.status}">${b.status === "aguardando" ? "Aguardando" : b.status === "ganhou" ? "Ganhou" : "Perdeu"}</span>
      </div>
      ${b.animal ? `<div class="aposta-card-row"><span>Bicho</span><span>${b.animal}</span></div>` : ""}
      <div class="aposta-card-row"><span>Valor apostado</span><span>R$ ${formatMoney(b.value)}</span></div>
      ${b.premio > 0 ? `<div class="aposta-card-premio"><span>Prêmio</span><span>R$ ${formatMoney(b.premio)}</span></div>` : ""}
      <div class="aposta-card-date">${b.date}</div>
    </div>
  `
    )
    .join("");
}

// ============ MISC ============

function openSupport() {
  const number = APP_CONFIG.supportWhatsapp || "5511999999999";
  window.open(`https://wa.me/${number}?text=Olá, preciso de ajuda!`, "_blank");
}

function togglePassword(btn) {
  const wrap = btn.closest(".form-group") || btn.closest(".wizard-input-wrap");
  const input = wrap.querySelector("input");
  if (input.type === "password") {
    input.type = "text";
    if (btn.classList.contains("wizard-toggle-pass")) btn.textContent = "Ocultar";
  } else {
    input.type = "password";
    if (btn.classList.contains("wizard-toggle-pass")) btn.textContent = "Mostrar";
  }
}

// ============ REGISTER WIZARD ============

let regStep = 1;

function regNext() {
  if (regStep === 1) {
    const cpf = document.getElementById("reg-cpf").value.trim();
    if (!cpf) { toast("Digite seu CPF", "error"); return; }
  } else if (regStep === 2) {
    const nome = document.getElementById("reg-nome").value.trim();
    if (!nome) { toast("Digite seu nome", "error"); return; }
  } else if (regStep === 3) {
    const wpp = document.getElementById("reg-whatsapp").value.trim();
    if (!wpp) { toast("Digite seu WhatsApp", "error"); return; }
  }
  if (regStep < 4) {
    document.getElementById(`reg-step-${regStep}`).classList.remove("active");
    regStep++;
    document.getElementById(`reg-step-${regStep}`).classList.add("active");
    updateRegProgress();
  }
}

function regBack() {
  if (regStep > 1) {
    document.getElementById(`reg-step-${regStep}`).classList.remove("active");
    regStep--;
    document.getElementById(`reg-step-${regStep}`).classList.add("active");
    updateRegProgress();
  } else {
    showPage("login");
  }
}

function updateRegProgress() {
  const pct = (regStep / 4) * 100;
  document.getElementById("reg-progress-fill").style.width = pct + "%";
  document.getElementById("reg-step-label").textContent = `PASSO ${regStep} DE 4`;
}

function regSubmit() {
  const senha = document.getElementById("reg-senha").value;
  const confirmVal = document.getElementById("reg-senha-confirm").value;
  if (!senha || senha.length < 6) { toast("Senha mínima: 6 caracteres", "error"); return; }
  if (senha !== confirmVal) { toast("As senhas não coincidem", "error"); return; }
  const cpf = document.getElementById("reg-cpf").value;
  const nome = document.getElementById("reg-nome").value || "Jogador";
  state.user = { cpf: formatCPF(cpf), name: nome };
  state.balance = 0;
  saveState();
  showPage("app");
  updateBalance();
  toast("Conta criada!", "success");
}

function resetReg() {
  regStep = 1;
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`reg-step-${i}`);
    if (el) el.classList.toggle("active", i === 1);
  }
  const fill = document.getElementById("reg-progress-fill");
  if (fill) fill.style.width = "25%";
  const label = document.getElementById("reg-step-label");
  if (label) label.textContent = "PASSO 1 DE 4";
}

// ============ TOAST ============

function toast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.3s";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ============ HELPERS ============

function formatMoney(v) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCPF(cpf) {
  const n = cpf.replace(/\D/g, "");
  if (n.length <= 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function maskCPF(input) {
  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g, '').slice(0, 14);
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      v = v.replace(/(\d{2})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1/$2');
      v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    input.value = v;
  });
}

document.querySelectorAll('input[name="cpf"]').forEach(maskCPF);

function saveState() {
  localStorage.setItem("app_user", JSON.stringify({ user: state.user, balance: state.balance }));
}

// ============ BINGO ============

let bingoQtyValue = 1;
const bingoPrice = 0.20;

function setBingoQty(qty) {
  bingoQtyValue = qty;
  document.getElementById("bingo-qty").textContent = qty;
  document.getElementById("bingo-total").textContent = "R$ " + formatMoney(qty * bingoPrice);
  document.querySelectorAll(".bingo-chip").forEach(c => c.classList.remove("active"));
}

function changeBingoQty(delta) {
  bingoQtyValue = Math.max(1, bingoQtyValue + delta);
  document.getElementById("bingo-qty").textContent = bingoQtyValue;
  document.getElementById("bingo-total").textContent = "R$ " + formatMoney(bingoQtyValue * bingoPrice);
  document.querySelectorAll(".bingo-chip").forEach(c => {
    c.classList.toggle("active", parseInt(c.textContent) === bingoQtyValue);
  });
}

// ============ RASPADINHA ============

function toggleCotacao(header) {
  header.parentElement.classList.toggle("open");
}

function scratchCell(el) {
  if (el.classList.contains("scratched")) return;
  const pool = APP_CONFIG.animals;
  const a = pool[Math.floor(Math.random() * pool.length)];
  el.textContent = "";
  const img = document.createElement("img");
  img.src = a.img;
  img.alt = a.name;
  img.style.cssText = "width:100%;height:100%;object-fit:contain;border-radius:50%;";
  el.appendChild(img);
  el.classList.add("scratched");
}

// ============ BET WIZARD ============

const MODALITIES = [
  { id:'milhar', name:'Milhar', digits:4, mults:{1:8000,3:2666.67,5:1600}, badge:'MAIOR COTAÇÃO', hl:'green' },
  { id:'milhar-centena', name:'Milhar e Centena', digits:4, mults:{1:4400,3:1466.67,5:880} },
  { id:'milhar-invertida', name:'Milhar Invertida', digits:4, mults:{1:333.33,3:111.11,5:66.67} },
  { id:'centena', name:'Centena', digits:3, mults:{1:800,3:266.67,5:160} },
  { id:'centena-invertida', name:'Centena Invertida', digits:3, mults:{1:66.67,3:22.22,5:13.33} },
  { id:'dezena', name:'Dezena', digits:2, mults:{1:80,3:26.67,5:16} },
  { id:'dezena-invertida', name:'Dezena Invertida', digits:2, mults:{1:13.33,3:4.44,5:2.67} },
  { id:'grupo', name:'Grupo', digits:0, type:'animal', count:1, mults:{1:20,3:6.67,5:4}, badge:'DESTAQUE', hl:'gold' },
  { id:'duque-grupo', name:'Duque de Grupo', digits:0, type:'animal', count:2, mults:{3:66.66,5:20} },
  { id:'terno-grupo', name:'Terno de Grupo', digits:0, type:'animal', count:3, mults:{3:1500,5:150} },
];

const LOTTERIES = [
  { id:'instantanea', name:'Instantânea', badge:'LOTERIA DA CASA' },
  { id:'rio', name:'Rio de Janeiro', badge:'6 HORÁRIOS' },
  { id:'sp', name:'São Paulo' },
  { id:'federal', name:'Federal' },
  { id:'nacional', name:'Nacional' },
  { id:'brasilia', name:'Brasília' },
  { id:'mg', name:'Minas Gerais' },
  { id:'pe', name:'Pernambuco' },
  { id:'ce', name:'Ceará' },
];

const wiz = { step:1, date:null, modality:null, digits:[], palpites:[], colocacao:null, amount:0, lottery:null, animals:[], presetLottery:null, totalSteps:8 };

function fmtMult(v) {
  const dec = v % 1 !== 0;
  return v.toLocaleString('pt-BR',{minimumFractionDigits:dec?2:0,maximumFractionDigits:2})+'x';
}

function openBetWizard(presetLotteryId) {
  const preset = presetLotteryId ? LOTTERIES.find(l=>l.id===presetLotteryId) || {id:presetLotteryId, name:presetLotteryId.charAt(0).toUpperCase()+presetLotteryId.slice(1)} : null;
  Object.assign(wiz,{step:1,date:null,modality:null,digits:[],palpites:[],colocacao:null,amount:0,lottery:preset,animals:[],presetLottery:!!preset,totalSteps:preset?7:8});
  document.getElementById('wizard-bet').classList.remove('hidden');
  renderWiz();
}

function wizardClose() { document.getElementById('wizard-bet').classList.add('hidden'); }

function wizardBack() {
  if (wiz.step > 1) {
    wiz.step--;
    renderWiz();
  } else wizardClose();
}

function renderWiz() {
  const body = document.getElementById('wizard-body');
  const ts = wiz.totalSteps;
  document.getElementById('wizard-step-label').textContent = `PASSO ${wiz.step} DE ${ts}`;
  document.getElementById('wizard-progress-bar').style.width = `${(wiz.step/ts)*100}%`;
  document.getElementById('wizard-back-btn').style.visibility = (wiz.step===1||wiz.step===ts)?'hidden':'visible';
  const steps8 = [null,wizS1,wizS2,wizS3,wizS4,wizS5,wizS6,wizS7,wizS8];
  const steps7 = [null,wizS1,wizS2,wizS3,wizS4,wizS5,wizS7,wizS8];
  (wiz.presetLottery?steps7:steps8)[wiz.step](body);
  body.scrollTop = 0;
}

function wizS1(body) {
  const today = new Date();
  const da = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
  const federalDays = [0,3];
  let c = '';
  let first = true;
  const maxDays = wiz.presetLottery ? 14 : 6;
  let found = 0;
  for (let i=0;i<maxDays;i++) {
    const d = new Date(today); d.setDate(d.getDate()+i);
    if (wiz.presetLottery && !federalDays.includes(d.getDay())) continue;
    if (wiz.presetLottery && found>=2) break;
    found++;
    const lbl = i===0?'HOJE':i===1?'AMANHÃ':da[d.getDay()];
    const ds = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    const sel = first?' selected':'';
    first = false;
    c += `<div class="wiz-date-card${sel}" onclick="wizPickDate(${i})"><span class="wiz-date-day">${lbl}</span><span class="wiz-date-num">${ds}</span></div>`;
  }
  const sub = wiz.presetLottery
    ? 'Sorteios toda <strong>quarta-feira</strong> e <strong>domingo</strong>.'
    : 'Escolha o dia do sorteio.<br>Você pode agendar para os próximos dias.';
  body.innerHTML = `<div class="wiz-step-content"><h2 class="wiz-title">Quando você quer apostar?</h2><p class="wiz-subtitle">${sub}</p><div class="wiz-date-grid">${c}</div></div>`;
}

function wizPickDate(i) {
  const d = new Date(); d.setDate(d.getDate()+i);
  const da = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
  wiz.date = { label:i===0?'Hoje':i===1?'Amanhã':da[d.getDay()], dateStr:`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}` };
  wiz.step=2; renderWiz();
}

function wizS2(body) {
  let c = '';
  MODALITIES.forEach((m,i) => {
    const hl = m.hl==='green'?' hl-green':m.hl==='gold'?' hl-gold':'';
    const badge = m.badge?`<span class="wiz-mod-badge ${m.hl==='green'?'bg-green':'bg-gold'}">${m.badge}</span>`:'';
    const top = Object.values(m.mults)[0];
    c += `<div class="wiz-mod-card${hl}" onclick="wizPickMod(${i})"><span class="wiz-mod-name">${m.name}</span>${badge}<span class="wiz-mod-mult">${fmtMult(top)}</span></div>`;
  });
  body.innerHTML = `<div class="wiz-step-content"><h2 class="wiz-title">Escolha a modalidade</h2><p class="wiz-subtitle">Cada modalidade tem sua cotação e forma de jogar.</p><div class="wiz-mod-list">${c}</div></div>`;
}

function wizPickMod(i) {
  wiz.modality = MODALITIES[i];
  wiz.digits=[]; wiz.palpites=[]; wiz.animals=[];
  wiz.step=3; renderWiz();
}

function wizS3Desc() {
  const m = wiz.modality;
  const nd = m.digits;
  if (m.id==='milhar-centena') return `A cada ${nd} dígitos, um novo palpite é adicionado — você pode colocar até 10 palpites no mesmo bilhete.\n\nAcertando os 4 números, você ganha a Milhar e a Centena juntas. Acertando só os 3 últimos, ganha a Centena.`;
  return `A cada ${nd} dígitos, um novo palpite é adicionado — você pode colocar até 10 palpites no mesmo bilhete.`;
}

function wizS3(body) {
  if (wiz.modality.type==='animal') { wizS3Animal(body); return; }
  const nd = wiz.modality.digits;
  let slots = '';
  for (let i=0;i<nd;i++) {
    const v = wiz.digits[i];
    slots += `<div class="wiz-slot${v===undefined?' empty':''}">${v!==undefined?v:'—'}</div>`;
  }
  let chips = '';
  wiz.palpites.forEach((p,i) => { chips += `<div class="wiz-palpite-chip">${p} <button class="wiz-palpite-remove" onclick="wizRmPalp(${i})">✕</button></div>`; });
  body.innerHTML = `<div class="wiz-step-content">
    <h2 class="wiz-title">${wiz.modality.name}</h2>
    <p class="wiz-subtitle">${wizS3Desc()}</p>
    <div class="wiz-palpites-header"><span class="wiz-palpites-label">SEUS PALPITES</span><span class="wiz-palpites-label">${wiz.palpites.length} DE 10</span></div>
    ${chips?`<div class="wiz-palpite-list">${chips}</div>`:''}
    <div class="wiz-slots">${slots}</div>
    <div class="wiz-numpad">
      ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="wiz-key" onclick="wizDig(${n})">${n}</button>`).join('')}
      <button class="wiz-key fn" onclick="wizClrDig()">Limpar</button>
      <button class="wiz-key" onclick="wizDig(0)">0</button>
      <button class="wiz-key fn" onclick="wizBksp()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg></button>
    </div>
  </div>
  <div class="wiz-footer"><button class="wiz-btn-continue" onclick="wizS3Next()" ${wiz.palpites.length===0?'disabled':''}>Continuar</button></div>`;
}

function wizDig(n) {
  if (wiz.digits.length>=wiz.modality.digits||wiz.palpites.length>=10) return;
  wiz.digits.push(n);
  if (wiz.digits.length===wiz.modality.digits) { wiz.palpites.push(wiz.digits.join('')); wiz.digits=[]; }
  renderWiz();
}

function wizBksp() { if (wiz.digits.length>0) { wiz.digits.pop(); renderWiz(); } }
function wizClrDig() { wiz.digits=[]; renderWiz(); }
function wizRmPalp(i) { wiz.palpites.splice(i,1); renderWiz(); }
function wizS3Next() { if (wiz.palpites.length>0) { wiz.step=4; renderWiz(); } }

function wizS3Animal(body) {
  const needed = wiz.modality.count;
  const animals = APP_CONFIG.animals;
  const selectedIds = new Set();
  wiz.palpites.forEach(p => { if (p.ids) p.ids.forEach(id => selectedIds.add(id)); });
  wiz.animals.forEach(id => selectedIds.add(id));
  let grid = '';
  animals.forEach(a => {
    const sel = selectedIds.has(a.id)?' selected':'';
    const num = String(a.id).padStart(2,'0');
    const dots = a.numbers.replace(/-/g,'·');
    grid += `<div class="wiz-animal-card${sel}" onclick="wizTogAnimal(${a.id})">
      <img src="${a.img}" alt="${a.name}" class="wiz-animal-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
      <span class="wiz-animal-emoji-fb" style="display:none;">${a.emoji}</span>
      <div class="wiz-animal-info"><span class="wiz-animal-num">${num}</span><span class="wiz-animal-label">${a.name.toUpperCase()}</span><span class="wiz-animal-dots">${dots}</span></div>
    </div>`;
  });
  const descs = {
    1: 'No Grupo você não digita números — escolha o bicho em que quer apostar. Cada um representa 4 dezenas.',
    2: 'Escolha 2 bichos. A cada 2 escolhidos, um novo palpite é adicionado — você pode colocar até 10 palpites no mesmo bilhete.',
    3: 'Escolha 3 bichos. A cada 3 escolhidos, um novo palpite é adicionado — você pode colocar até 10 palpites no mesmo bilhete.'
  };
  body.innerHTML = `<div class="wiz-step-content">
    <h2 class="wiz-title">${wiz.modality.name}</h2>
    <p class="wiz-subtitle">${descs[needed]}</p>
    <div class="wiz-palpites-header"><span class="wiz-palpites-label">SEUS PALPITES</span><span class="wiz-palpites-label">${wiz.palpites.length} DE 10</span></div>
    <div class="wiz-animal-grid">${grid}</div>
  </div>
  <div class="wiz-footer"><button class="wiz-btn-continue" onclick="wizS3Next()" ${wiz.palpites.length===0?'disabled':''}>Continuar</button></div>`;
}

function wizTogAnimal(id) {
  if (wiz.palpites.length>=10 && !wiz.animals.includes(id)) return;
  const idx = wiz.animals.indexOf(id);
  if (idx>=0) { wiz.animals.splice(idx,1); }
  else {
    wiz.animals.push(id);
    if (wiz.animals.length===wiz.modality.count) {
      const ids = [...wiz.animals];
      const names = ids.map(aid => APP_CONFIG.animals.find(a=>a.id===aid)).map(a=>a.name).join(', ');
      wiz.palpites.push({ids, label:names});
      wiz.animals=[];
    }
  }
  renderWiz();
}

function wizS4(body) {
  const m = wiz.modality.mults;
  const opts = [];
  if (m[1]!==undefined) opts.push({key:1,label:'1º Prêmio'});
  if (m[3]!==undefined) opts.push({key:3,label:'1º ao 3º'});
  if (m[5]!==undefined) opts.push({key:5,label:'1º ao 5º'});
  const cards = opts.map(o=>`<button class="wiz-coloc-card" onclick="wizPickColoc(${o.key})">${o.label}</button>`).join('');
  body.innerHTML = `<div class="wiz-step-content"><h2 class="wiz-title">Colocação</h2><div class="wiz-coloc-list">${cards}</div></div>`;
}

function wizPickColoc(key) {
  const labels = {1:'1º Prêmio',3:'1º ao 3º',5:'1º ao 5º'};
  wiz.colocacao = {key, label:labels[key]};
  wiz.step=5; renderWiz();
}

function wizS5(body) {
  const amounts = [1,5,10,50];
  const mult = wiz.modality.mults[wiz.colocacao.key];
  let cards = amounts.map((a,i) => {
    const sel = wiz.amount===a?' selected':'';
    const badge = i===1?'<span class="wiz-amount-badge">MAIS ESCOLHIDO</span>':'';
    return `<div class="wiz-amount-card${sel}" onclick="wizPickAmt(${a})">${badge}<span class="wiz-amount-value">R$ ${formatMoney(a)}</span></div>`;
  }).join('');
  const inputVal = wiz.amount>0?formatMoney(wiz.amount):'0,00';
  const premio = wiz.amount>0?`<div class="wiz-premio-bar"><span class="wiz-premio-label">PRÊMIO ESTIMADO</span><span class="wiz-premio-value">R$ ${formatMoney(wiz.amount*mult)}</span></div>`:'';
  body.innerHTML = `<div class="wiz-step-content">
    <h2 class="wiz-title">Quanto quer apostar?</h2>
    <p class="wiz-subtitle">Mínimo R$ 0,10 — máximo R$ 5.000,00 por bilhete.</p>
    <div class="wiz-amount-grid">${cards}</div>
    <div class="wiz-amount-input-wrap"><span class="wiz-amount-prefix">R$</span><input type="text" class="wiz-amount-input" id="wiz-custom-amt" value="${inputVal}" inputmode="decimal" onchange="wizCustomAmt(this.value)" onclick="this.select()"></div>
    ${premio}
  </div>
  <div class="wiz-footer"><button class="wiz-btn-continue" onclick="wizS5Next()" ${wiz.amount<=0?'disabled':''}>Continuar</button></div>`;
}

function wizPickAmt(a) { wiz.amount=a; renderWiz(); }
function wizCustomAmt(v) { wiz.amount=parseFloat(v.replace(/\./g,'').replace(',','.'))||0; renderWiz(); }
function wizS5Next() { if (wiz.amount>0) { wiz.step=6; renderWiz(); } }


function wizS6(body) {
  let cards = LOTTERIES.map((l,i) => {
    const badge = l.badge?`<span class="wiz-lottery-badge">${l.badge}</span>`:'';
    return `<button class="wiz-lottery-card" onclick="wizPickLot(${i})"><span>${l.name}</span>${badge}</button>`;
  }).join('');
  body.innerHTML = `<div class="wiz-step-content">
    <h2 class="wiz-title">Escolha uma loteria / sorteio</h2>
    <p class="wiz-subtitle">Além das loterias nacional e estaduais, temos a <strong>Instantânea</strong> — a loteria da casa, com resultado a cada minuto.</p>
    <div class="wiz-lottery-list">${cards}</div>
  </div>`;
}

function wizPickLot(i) { wiz.lottery=LOTTERIES[i]; wiz.step=7; renderWiz(); }

function wizConfirmTable() {
  const mult = wiz.modality.mults[wiz.colocacao.key];
  const premio = wiz.amount*mult;
  const palps = wiz.palpites.map(p => typeof p === 'object' ? p.label : p).join(', ');
  return `<div class="wiz-confirm-table">
    <div class="wiz-confirm-row"><span class="wiz-confirm-label">Modalidade</span><span class="wiz-confirm-value">${wiz.modality.name}</span></div>
    <div class="wiz-confirm-row"><span class="wiz-confirm-label">Sorteio</span><span class="wiz-confirm-value">${wiz.lottery.name}</span></div>
    <div class="wiz-confirm-row"><span class="wiz-confirm-label">Palpites (${wiz.palpites.length})</span><span class="wiz-confirm-value">${palps}</span></div>
    <div class="wiz-confirm-row"><span class="wiz-confirm-label">Colocação</span><span class="wiz-confirm-value">${wiz.colocacao.label}</span></div>
    <div class="wiz-confirm-row"><span class="wiz-confirm-label">Valor total apostado</span><span class="wiz-confirm-value">R$ ${formatMoney(wiz.amount)}</span></div>
    <div class="wiz-confirm-row"><span class="wiz-confirm-label">Prêmio estimado (por palpite)</span><span class="wiz-confirm-value green">R$ ${formatMoney(premio)}</span></div>
  </div>`;
}

function wizS7(body) {
  body.innerHTML = `<div class="wiz-step-content"><h2 class="wiz-title">Confirme sua aposta</h2>${wizConfirmTable()}</div>
  <div class="wiz-footer"><button class="wiz-btn-continue" onclick="wizDoConfirm()">Confirmar Aposta</button></div>`;
}

function wizDoConfirm() {
  if (wiz.amount>state.balance) { toast('Saldo insuficiente','error'); return; }
  state.balance -= wiz.amount;
  saveState(); updateBalance();
  wiz.step=wiz.totalSteps; renderWiz();
}

function wizS8(body) {
  body.innerHTML = `<div class="wiz-step-content"><div class="wiz-success">
    <div class="wiz-success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg></div>
    <h2 class="wiz-success-title">Aposta confirmada!</h2>
    <p class="wiz-success-sub">Boa sorte! Você verá o resultado em Minhas Apostas.</p>
    ${wizConfirmTable()}
  </div></div>
  <div class="wiz-footer"><button class="wiz-btn-continue" onclick="wizardClose();goHome()">Voltar para o site</button></div>`;
}

// ============ LANDING PAGE ============

function initLanding() {
  const track = document.getElementById('landing-bichos-track');
  if (track) {
    const animals = APP_CONFIG.animals;
    let html = '';
    const items = [...animals, ...animals];
    items.forEach(a => {
      html += `<div class="landing-bicho-item"><img src="${a.img}" alt="${a.name}"></div>`;
    });
    track.innerHTML = html;
  }

  initRoletaWheel();
}

let selectedAnimalIdx = 2;

function initRoletaWheel() {
  const selector = document.getElementById('roleta-selector');
  const wheel = document.getElementById('roleta-wheel');
  if (!selector || !wheel) return;
  const animals = APP_CONFIG.animals;
  const totalSlots = 26;
  const sliceDeg = 360 / totalSlots;

  let selHtml = '';
  for (let rep = 0; rep < 5; rep++) {
    animals.forEach((a, i) => {
      selHtml += `<div class="roleta-sel-item" data-idx="${i}" data-rep="${rep}"><img src="${a.img}" alt="${a.name}"></div>`;
    });
  }
  selector.innerHTML = selHtml;
  const wrap = document.querySelector('.roleta-selector-wrap');
  if (wrap) {
    initSelectorScroll(wrap, selector, animals);
  }

  const halfSlice = sliceDeg / 2;
  let gradientStops = [];
  for (let i = 0; i < totalSlots; i++) {
    const isGolden = i === totalSlots - 1;
    const bg = isGolden ? '#ffd700' : (i % 2 === 0 ? '#2d2757' : '#3a3170');
    const a1 = sliceDeg * i;
    const a2 = sliceDeg * (i + 1);
    gradientStops.push(`${bg} ${a1}deg, ${bg} ${a2}deg`);
  }
  wheel.style.background = `conic-gradient(from -${halfSlice}deg, ${gradientStops.join(', ')})`;

  let wheelHtml = '';
  for (let i = 0; i < totalSlots; i++) {
    const angle = sliceDeg * i;
    const isGolden = i === totalSlots - 1;
    if (!isGolden && i < animals.length) {
      wheelHtml += `<div class="roleta-animal" style="transform:rotate(${angle}deg) translateY(-390px)"><img src="${animals[i].img}" alt="${animals[i].name}"></div>`;
    } else if (isGolden) {
      wheelHtml += `<div class="roleta-animal roleta-golden" style="transform:rotate(${angle}deg) translateY(-390px)"><span>100x</span></div>`;
    }
    const dotAngle = angle + halfSlice;
    wheelHtml += `<div class="roleta-dot" style="transform:rotate(${dotAngle}deg) translateY(-430px)"></div>`;
  }
  wheel.innerHTML = wheelHtml;
  wheel.classList.add('idle-spin');
}

let selectorAutoScroll = null;
let selectorLocked = false;

function initSelectorScroll(wrap, selector, animals) {
  const items = selector.querySelectorAll('.roleta-sel-item');
  const n = animals.length;
  const setWidth = items[n].offsetLeft - items[0].offsetLeft;
  const midStart = items[n * 2].offsetLeft;
  wrap.scrollLeft = midStart;

  function loopCheck() {
    const sl = wrap.scrollLeft;
    const loopStart = items[n].offsetLeft;
    const loopEnd = items[n * 4].offsetLeft;
    if (sl <= loopStart) {
      wrap.style.scrollBehavior = 'auto';
      wrap.scrollLeft = sl + setWidth;
      wrap.style.scrollBehavior = '';
    } else if (sl >= loopEnd) {
      wrap.style.scrollBehavior = 'auto';
      wrap.scrollLeft = sl - setWidth;
      wrap.style.scrollBehavior = '';
    }
  }

  function startAutoScroll() {
    if (selectorAutoScroll) return;
    selectorLocked = false;
    items.forEach(el => el.classList.remove('selected'));
    selectorAutoScroll = setInterval(() => {
      wrap.scrollLeft += 1;
      loopCheck();
    }, 18);
  }

  function stopAutoScroll() {
    if (selectorAutoScroll) {
      clearInterval(selectorAutoScroll);
      selectorAutoScroll = null;
    }
  }

  wrap.addEventListener('pointerdown', () => {
    stopAutoScroll();
  }, { passive: true });
  wrap.addEventListener('pointerup', () => {
    if (!selectorLocked) {
      setTimeout(() => { if (!selectorLocked) startAutoScroll(); }, 2000);
    }
  }, { passive: true });
  wrap.addEventListener('touchstart', () => {
    stopAutoScroll();
  }, { passive: true });
  wrap.addEventListener('touchend', () => {
    if (!selectorLocked) {
      setTimeout(() => { if (!selectorLocked) startAutoScroll(); }, 2000);
    }
  }, { passive: true });

  wrap.addEventListener('scroll', () => loopCheck());

  selector.addEventListener('click', (e) => {
    const item = e.target.closest('.roleta-sel-item');
    if (!item) return;
    const idx = parseInt(item.dataset.idx);
    stopAutoScroll();
    selectorLocked = true;
    selectedAnimalIdx = idx;
    items.forEach(el => el.classList.toggle('selected', parseInt(el.dataset.idx) === idx));
    const selItem = items[n * 2 + idx];
    if (selItem) {
      wrap.style.scrollBehavior = 'auto';
      wrap.scrollLeft = selItem.offsetLeft + selItem.offsetWidth / 2 - wrap.clientWidth / 2;
      wrap.style.scrollBehavior = '';
    }
  });

  startAutoScroll();
}

function selectAnimal(idx) {
  selectedAnimalIdx = idx;
  if (selectorAutoScroll) {
    clearInterval(selectorAutoScroll);
    selectorAutoScroll = null;
  }
  selectorLocked = true;
  const items = document.querySelectorAll('.roleta-sel-item');
  items.forEach(el => el.classList.toggle('selected', parseInt(el.dataset.idx) === idx));
  const wrap = document.querySelector('.roleta-selector-wrap');
  if (wrap) {
    const animals = APP_CONFIG.animals;
    const selItem = items[animals.length * 2 + idx];
    if (selItem) {
      wrap.style.scrollBehavior = 'auto';
      wrap.scrollLeft = selItem.offsetLeft + selItem.offsetWidth / 2 - wrap.clientWidth / 2;
      wrap.style.scrollBehavior = '';
    }
  }
}

// ============ NOTIFICATIONS ============

function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (!list) return;

  const now = new Date();
  const isFederalDay = [0, 3].includes(now.getDay());

  const notifs = [];

  if (isFederalDay) {
    notifs.push({
      icon: '🎯',
      title: 'A Federal está chegando! Vai deixar passar?',
      body: 'Aproveite os 20% de bônus. Entre no app e confira! 🎯',
      cta: 'Apostar agora →',
      action: "closeDrawer();openBetWizard('federal')",
      time: 'hoje',
      unread: true,
    });
  }

  notifs.push(
    { icon: '🔮', title: 'Palpite do dia para seu signo!', body: 'Hoje os astros favorecem apostas no Grupo. Confira nosso palpite especial baseado no seu signo.', cta: 'Ver palpite →', action: "openView('jogos')", time: 'hoje', unread: true },
    { icon: '🏆', title: 'Resultado: Você ganhou R$ 90,00!', body: 'Sua aposta no Tigre 🐅 (Grupo, PTN 18:20) foi premiada! O valor já está no seu saldo.', time: 'ontem', unread: false, type: 'win' },
    { icon: '😔', title: 'Resultado: Não foi dessa vez', body: 'Sua aposta na Milhar 3218 (PT 14:20) não foi premiada. Tente novamente — boa sorte!', time: 'ontem', unread: false, type: 'lose' },
    { icon: '💰', title: 'Bônus de boas-vindas creditado!', body: 'Seu bônus de R$ 10,00 foi adicionado ao saldo. Use para apostar e multiplicar seus ganhos!', time: '2 dias atrás', unread: false },
    { icon: '🎲', title: 'Nova modalidade: Milhar Invertida', body: 'Agora você pode apostar na Milhar Invertida com cotação de 333,33x! A ordem dos números não importa.', time: '3 dias atrás', unread: false },
  );

  list.innerHTML = notifs.map(n => `
    <div class="notif-card${n.unread ? ' unread' : ''}${n.type === 'win' ? ' notif-win' : ''}${n.type === 'lose' ? ' notif-lose' : ''}">
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-body">${n.body}</div>
        ${n.cta ? `<a class="notif-cta" onclick="${n.action}">${n.cta}</a>` : ''}
        <div class="notif-time">${n.time}</div>
      </div>
      ${n.unread ? '<div class="notif-dot"></div>' : ''}
    </div>
  `).join('');
}

function markAllNotifsRead() {
  document.querySelectorAll('.notif-card.unread').forEach(c => c.classList.remove('unread'));
  document.querySelectorAll('.notif-dot').forEach(d => d.remove());
  toast('Todas as notificações lidas', 'success');
}

// ============ CONFIGURAÇÕES ============

function loadConfigSummary() {
  const nome = state.user?.name || '-';
  const sub = document.getElementById('config-nome-sub');
  if (sub) sub.textContent = nome;
}

function loadConfigPessoal() {
  const nome = document.getElementById('cfg-nome');
  const cpf = document.getElementById('cfg-cpf');
  if (nome) nome.value = state.user?.name || '';
  if (cpf) cpf.value = state.user?.cpf || '';
}

function saveConfigPessoal() {
  const nome = document.getElementById('cfg-nome').value.trim();
  if (!nome) { toast('Informe o nome', 'error'); return; }
  if (state.user) state.user.name = nome;
  saveState();
  toast('Dados atualizados!', 'success');
}

function saveConfigAcesso() {
  const senha = document.getElementById('cfg-senha').value;
  const confirm = document.getElementById('cfg-senha-confirm').value;
  if (senha && senha.length < 6) { toast('Senha mínima: 6 caracteres', 'error'); return; }
  if (senha && senha !== confirm) { toast('As senhas não coincidem', 'error'); return; }
  toast('Dados atualizados!', 'success');
  document.getElementById('cfg-senha').value = '';
  document.getElementById('cfg-senha-confirm').value = '';
}

function saveConfigEndereco() {
  toast('Endereço atualizado!', 'success');
}

// ============ DRAWER BALANCE ============

function updateDrawerBalance() {
  const el = document.getElementById('drawer-balance');
  if (el) el.textContent = `R$ ${formatMoney(state.balance)}`;
}

let roletaSpinning = false;
function getWheelAngle(el) {
  const st = window.getComputedStyle(el);
  const tr = st.transform;
  if (!tr || tr === 'none') return 0;
  const vals = tr.match(/matrix\((.+)\)/);
  if (!vals) return 0;
  const parts = vals[1].split(',').map(Number);
  return Math.atan2(parts[1], parts[0]) * (180 / Math.PI);
}

function girarRoleta() {
  if (roletaSpinning) return;
  roletaSpinning = true;
  const wheel = document.getElementById('roleta-wheel');
  const totalSlots = 26;
  const sliceDeg = 360 / totalSlots;
  const winnerIdx = Math.floor(Math.random() * totalSlots);
  const isGolden = winnerIdx === totalSlots - 1;
  const animals = APP_CONFIG.animals;
  const targetAngle = -(sliceDeg * winnerIdx);

  const currentAngle = getWheelAngle(wheel);
  wheel.classList.remove('idle-spin');
  wheel.style.transition = 'none';
  wheel.style.transform = `rotate(${currentAngle}deg)`;

  const spins = 5 + Math.floor(Math.random() * 3);
  const finalRotation = currentAngle + spins * 360 + (targetAngle - currentAngle % 360);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wheel.style.transition = 'transform 5s cubic-bezier(0.15, 0.6, 0.15, 1)';
      wheel.style.transform = `rotate(${finalRotation}deg)`;
    });
  });

  const btn = document.getElementById('btn-girar-roleta');
  btn.disabled = true;
  setTimeout(() => {
    const overlay = document.getElementById('roleta-overlay');
    const content = document.getElementById('roleta-overlay-content');
    overlay.className = 'roleta-overlay';
    const won = !isGolden && winnerIdx === selectedAnimalIdx;
    const isGold = isGolden;
    if (won || isGold) {
      const mult = isGold ? 100 : 18;
      const betValue = 5;
      const prize = betValue * mult;
      overlay.classList.add('win', 'show');
      content.innerHTML = `<div class="overlay-value">R$ ${prize.toFixed(2).replace('.', ',')}</div><div class="overlay-sub">${mult}x R$ ${betValue.toFixed(2).replace('.', ',')}</div>`;
    } else {
      overlay.classList.add('lose', 'show');
      content.innerHTML = `<div class="overlay-line1">Não foi dessa vez,</div><div class="overlay-line2">tente novamente.</div>`;
    }
    btn.disabled = false;
    wheel.style.transition = 'none';
    const normAngle = finalRotation % 360;
    wheel.style.transform = `rotate(${normAngle}deg)`;
    setTimeout(() => {
      overlay.classList.remove('show');
      roletaSpinning = false;
      wheel.classList.add('idle-spin');
      wheel.style.transition = '';
      wheel.style.transform = '';
    }, 3000);
  }, 5200);
}

// ============ ROLETA WHEEL GAME (18x) ============

let wheelSelectedAnimal = 0;
let wheelSpinning = false;
let wheelTickerInterval = null;
let wheelAutoScroll = null;
let wheelSelectorLocked = false;

function startWinnerTickerWheel() {
  if (wheelTickerInterval) return;
  updateWinnerTickerWheel();
  wheelTickerInterval = setInterval(updateWinnerTickerWheel, 8000);
}

function updateWinnerTickerWheel() {
  const el = document.getElementById('winner-ticker-wheel');
  if (!el) return;
  const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
  const initial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const animals = APP_CONFIG.animals;
  const animal = animals[Math.floor(Math.random() * animals.length)].name;
  const values = [18,36,54,90,180,360,500,900,1000];
  const value = values[Math.floor(Math.random() * values.length)];
  const formatted = value.toFixed(2).replace('.', ',');
  el.innerHTML = `${name} ${initial}. ganhou <strong style="color:var(--green)">R$ ${formatted}</strong> no ${animal}`;
}

function initWheelGame() {
  const selector = document.getElementById('wheel-selector');
  const wheel = document.getElementById('roleta-wheel-game');
  if (!selector || !wheel) return;
  const animals = APP_CONFIG.animals;
  const totalSlots = 26;
  const sliceDeg = 360 / totalSlots;

  let selHtml = '';
  for (let rep = 0; rep < 5; rep++) {
    animals.forEach((a, i) => {
      selHtml += `<div class="roleta-sel-item wheel-sel" data-idx="${i}" data-rep="${rep}"><img src="${a.img}" alt="${a.name}"></div>`;
    });
  }
  selector.innerHTML = selHtml;
  const wrap = document.getElementById('wheel-selector-wrap');
  if (wrap) initWheelSelectorScroll(wrap, selector, animals);

  const halfSlice = sliceDeg / 2;
  let gradientStops = [];
  for (let i = 0; i < totalSlots; i++) {
    const isGolden = i === totalSlots - 1;
    const bg = isGolden ? '#ffd700' : (i % 2 === 0 ? '#2d2757' : '#3a3170');
    gradientStops.push(`${bg} ${sliceDeg * i}deg, ${bg} ${sliceDeg * (i + 1)}deg`);
  }
  wheel.style.background = `conic-gradient(from -${halfSlice}deg, ${gradientStops.join(', ')})`;

  let wheelHtml = '';
  for (let i = 0; i < totalSlots; i++) {
    const angle = sliceDeg * i;
    const isGolden = i === totalSlots - 1;
    if (!isGolden && i < animals.length) {
      wheelHtml += `<div class="roleta-animal" style="transform:rotate(${angle}deg) translateY(-390px)"><img src="${animals[i].img}" alt="${animals[i].name}"></div>`;
    } else if (isGolden) {
      wheelHtml += `<div class="roleta-animal roleta-golden" style="transform:rotate(${angle}deg) translateY(-390px)"><span>50x</span></div>`;
    }
    wheelHtml += `<div class="roleta-dot" style="transform:rotate(${angle + halfSlice}deg) translateY(-430px)"></div>`;
  }
  wheel.innerHTML = wheelHtml;
  wheel.classList.add('idle-spin');

  updateLiveCount();
  updateWheelPreview();
}

function initWheelSelectorScroll(wrap, selector, animals) {
  const items = selector.querySelectorAll('.wheel-sel');
  const n = animals.length;
  const setWidth = items[n].offsetLeft - items[0].offsetLeft;
  wrap.scrollLeft = items[n * 2].offsetLeft;

  function loopCheck() {
    const sl = wrap.scrollLeft;
    if (sl <= items[n].offsetLeft) {
      wrap.style.scrollBehavior = 'auto';
      wrap.scrollLeft = sl + setWidth;
      wrap.style.scrollBehavior = '';
    } else if (sl >= items[n * 4].offsetLeft) {
      wrap.style.scrollBehavior = 'auto';
      wrap.scrollLeft = sl - setWidth;
      wrap.style.scrollBehavior = '';
    }
  }

  function startAuto() {
    if (wheelAutoScroll) return;
    wheelSelectorLocked = false;
    items.forEach(el => el.classList.remove('selected'));
    wheelAutoScroll = setInterval(() => { wrap.scrollLeft += 1; loopCheck(); }, 18);
  }

  function stopAuto() {
    if (wheelAutoScroll) { clearInterval(wheelAutoScroll); wheelAutoScroll = null; }
  }

  wrap.addEventListener('pointerdown', stopAuto, { passive: true });
  wrap.addEventListener('pointerup', () => { if (!wheelSelectorLocked) setTimeout(() => { if (!wheelSelectorLocked) startAuto(); }, 2000); }, { passive: true });
  wrap.addEventListener('touchstart', stopAuto, { passive: true });
  wrap.addEventListener('touchend', () => { if (!wheelSelectorLocked) setTimeout(() => { if (!wheelSelectorLocked) startAuto(); }, 2000); }, { passive: true });
  wrap.addEventListener('scroll', loopCheck);

  selector.addEventListener('click', (e) => {
    const item = e.target.closest('.wheel-sel');
    if (!item) return;
    const idx = parseInt(item.dataset.idx);
    stopAuto();
    wheelSelectorLocked = true;
    wheelSelectedAnimal = idx;
    items.forEach(el => el.classList.toggle('selected', parseInt(el.dataset.idx) === idx));
    const selItem = items[n * 2 + idx];
    if (selItem) {
      wrap.style.scrollBehavior = 'auto';
      wrap.scrollLeft = selItem.offsetLeft + selItem.offsetWidth / 2 - wrap.clientWidth / 2;
      wrap.style.scrollBehavior = '';
    }
  });

  startAuto();
}

function setWheelBet(v) {
  const el = document.getElementById('wheel-bet-amount');
  if (el) el.value = v.toFixed(2);
  document.querySelectorAll('.wheel-chip').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  updateWheelPreview();
}

function updateWheelPreview() {
  const amount = parseFloat(document.getElementById('wheel-bet-amount')?.value) || 1;
  const preview = document.getElementById('wheel-preview-value');
  if (preview) preview.textContent = `R$ ${(amount * 18).toFixed(2).replace('.', ',')}`;
}

function girarRoletaWheel() {
  if (wheelSpinning) return;
  if (!wheelSelectorLocked) {
    showToast('Escolha um bicho primeiro!', 'error');
    return;
  }
  wheelSpinning = true;
  const wheel = document.getElementById('roleta-wheel-game');
  const totalSlots = 26;
  const sliceDeg = 360 / totalSlots;
  const winnerIdx = Math.floor(Math.random() * totalSlots);
  const isGolden = winnerIdx === totalSlots - 1;
  const animals = APP_CONFIG.animals;
  const targetAngle = -(sliceDeg * winnerIdx);

  const currentAngle = getWheelAngle(wheel);
  wheel.classList.remove('idle-spin');
  wheel.style.transition = 'none';
  wheel.style.transform = `rotate(${currentAngle}deg)`;

  const spins = 5 + Math.floor(Math.random() * 3);
  const finalRotation = currentAngle + spins * 360 + (targetAngle - currentAngle % 360);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wheel.style.transition = 'transform 5s cubic-bezier(0.15, 0.6, 0.15, 1)';
      wheel.style.transform = `rotate(${finalRotation}deg)`;
    });
  });

  const btn = document.getElementById('btn-girar-wheel');
  btn.disabled = true;

  setTimeout(() => {
    const amount = parseFloat(document.getElementById('wheel-bet-amount').value) || 1;
    const won = !isGolden && winnerIdx === wheelSelectedAnimal;
    const isGold = isGolden;
    if (won) {
      const prize = amount * 18;
      showToast(`Você ganhou R$ ${prize.toFixed(2).replace('.', ',')}! (18x)`, 'success');
    } else if (isGold) {
      const prize = amount * 50;
      showToast(`DOURADO! Você ganhou R$ ${prize.toFixed(2).replace('.', ',')}! (50x)`, 'success');
    } else {
      showToast('Não foi dessa vez, tente novamente!', 'error');
    }
    btn.disabled = false;
    wheel.style.transition = 'none';
    wheel.style.transform = `rotate(${finalRotation % 360}deg)`;
    setTimeout(() => {
      wheelSpinning = false;
      wheel.classList.add('idle-spin');
      wheel.style.transition = '';
      wheel.style.transform = '';
    }, 2000);
  }, 5200);
}

document.addEventListener('input', (e) => {
  if (e.target.id === 'wheel-bet-amount') updateWheelPreview();
});
