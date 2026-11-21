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

  const mainHeader = document.getElementById("main-header");
  const subHeader = document.getElementById("sub-header");
  const titleEl = document.getElementById("sub-header-title");

  const titles = {
    home: "",
    carteira: "Minha Carteira",
    jogos: "Tipo de Jogo",
    "apostar-bicho": "Apostar — Bicho",
    roletinha: "Roleta dos Bichos",
    recarga: "Recarga PIX",
    saque: "Novo Saque",
    apostas: "Minhas Apostas",
    resultados: "Consultar Resultados",
    relatorios: "Relatórios",
    cotacoes: "Cotações",
    "bichos-lista": "Bichos",
    bingo: "Bingo",
    raspadinha: "Raspadinha",
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
      jogos: "#B8860B",
      "apostar-bicho": "#B8860B",
      "bichos-lista": "#B8860B",
      roletinha: "#2B5DA6",
      bingo: "#4A2078",
      raspadinha: "#C0392B",
      cotacoes: "#B8860B",
    };
    subHeader.style.background = headerColors[view] || "var(--blue)";
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
  const current = parseFloat(el.value) || 0;
  el.value = (current + amount).toFixed(2);
}

function confirmDeposit() {
  const raw = document.getElementById("deposit-amount").value;
  const amount = parseFloat(raw.replace(",", "."));
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

function adjustRoletinha(delta) {
  const el = document.getElementById("roletinha-amount");
  let val = parseFloat(el.value) || 1;
  val = Math.max(0.5, val + delta);
  el.value = val.toFixed(2);
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

function renderResults() {
  const list = document.getElementById("results-list");
  if (!list) return;

  const today = new Date();
  const days = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
  let html = "";

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const dayName = i === 0 ? "HOJE" : days[d.getDay()];

    html += `
      <div class="results-day-item" onclick="toast('Resultados de ${dateStr}','info')">
        <div>
          <div class="results-day-date">${dateStr}</div>
          <div class="results-day-weekday">${dayName}</div>
        </div>
        <div class="results-day-chevron">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    `;
  }

  list.innerHTML = html;
}

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
  if (!track) return;
  const animals = APP_CONFIG.animals;
  let html = '';
  const items = [...animals, ...animals];
  items.forEach(a => {
    html += `<div class="landing-bicho-item"><img src="${a.img}" alt="${a.name}"></div>`;
  });
  track.innerHTML = html;

  initRoletaWheel();
}

function initRoletaWheel() {
  const wheel = document.getElementById('landing-roleta-wheel');
  if (!wheel) return;
  const animals = APP_CONFIG.animals;
  const slice = 360 / animals.length;
  let html = '';
  animals.forEach((a, i) => {
    const rot = slice * i;
    const dist = 100;
    const rad = (rot - 90) * Math.PI / 180;
    const x = 140 + dist * Math.cos(rad);
    const y = 140 + dist * Math.sin(rad);
    html += `<img src="${a.img}" alt="${a.name}" style="position:absolute;width:2.5rem;height:2.5rem;object-fit:contain;left:${x}px;top:${y}px;transform:translate(-50%,-50%) rotate(${rot}deg);">`;
  });
  wheel.innerHTML = html;
}

let roletaSpinning = false;
function girarRoleta() {
  if (roletaSpinning) return;
  roletaSpinning = true;
  const wheel = document.getElementById('landing-roleta-wheel');
  const result = document.getElementById('roleta-result');
  const animals = APP_CONFIG.animals;
  const winner = animals[Math.floor(Math.random() * animals.length)];
  const slice = 360 / animals.length;
  const idx = animals.indexOf(winner);
  const targetAngle = 360 - (slice * idx) - slice / 2;
  const spins = 5 + Math.floor(Math.random() * 3);
  const finalRotation = spins * 360 + targetAngle;
  wheel.style.transform = `rotate(${finalRotation}deg)`;
  result.textContent = '';
  setTimeout(() => {
    result.textContent = `🎉 ${winner.name}!`;
    roletaSpinning = false;
    wheel.style.transition = 'none';
    wheel.style.transform = `rotate(${targetAngle}deg)`;
    setTimeout(() => { wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'; }, 50);
  }, 4200);
}
