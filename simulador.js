const WHATSAPP_NUMBER = "5493405548936";

const SIM_PLANS = {
  weekly2: { type: "semanal", min: 10000, label: "2 cuotas semanales", installments: 2, interest: 25, amountInput: "weeklyAmount", resultId: "weeklyResult" },
  weekly4: { type: "semanal", min: 10000, label: "4 cuotas semanales", installments: 4, interest: 40, amountInput: "weeklyAmount", resultId: "weeklyResult" },
  weekly8: { type: "semanal", min: 10000, label: "8 cuotas semanales", installments: 8, interest: 60, amountInput: "weeklyAmount", resultId: "weeklyResult" },
  monthly3: { type: "mensual", min: 100000, label: "3 cuotas mensuales", installments: 3, interest: 40, amountInput: "monthlyAmount", resultId: "monthlyResult" },
  monthly6: { type: "mensual", min: 100000, label: "6 cuotas mensuales", installments: 6, interest: 70, amountInput: "monthlyAmount", resultId: "monthlyResult" },
  monthly12: { type: "mensual", min: 100000, label: "12 cuotas mensuales", installments: 12, interest: 130, amountInput: "monthlyAmount", resultId: "monthlyResult" },
  monthly16: { type: "mensual", min: 100000, label: "16 cuotas mensuales", installments: 16, interest: 200, amountInput: "monthlyAmount", resultId: "monthlyResult" }
};

let selectedPlanId = "weekly2";

function byId(id) { return document.getElementById(id); }
function toNumber(value) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
function roundMoney(value) { return Math.round(Number(value || 0)); }
function money(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(roundMoney(value));
}
function getPlanAmount(plan) {
  const input = byId(plan.amountInput);
  return Math.max(toNumber(input.value), plan.min);
}
function calculatePlan(planId) {
  const plan = SIM_PLANS[planId];
  const amount = getPlanAmount(plan);
  const total = roundMoney(amount * (1 + plan.interest / 100));
  const installment = roundMoney(total / plan.installments);
  return { ...plan, amount, total, installment, planId };
}
function renderResult(planId) {
  const sim = calculatePlan(planId);
  const result = byId(sim.resultId);
  result.innerHTML = `
    <div class="result-grid">
      <div><small>Monto solicitado</small><strong>${money(sim.amount)}</strong></div>
      <div><small>Interés</small><strong>${sim.interest}%</strong></div>
      <div><small>Total a devolver</small><strong>${money(sim.total)}</strong></div>
      <div><small>Cuota fija</small><strong>${money(sim.installment)}</strong></div>
    </div>
    <div class="result-note">${sim.installments} cuotas ${sim.type === "semanal" ? "semanales" : "mensuales"} fijas de <b>${money(sim.installment)}</b>.</div>
  `;
}
function renderAllResults() {
  renderResult(byId("weeklyPlan").value);
  renderResult(byId("monthlyPlan").value);
  renderSelectedSummary();
}
function renderSelectedSummary() {
  const sim = calculatePlan(selectedPlanId);
  byId("selectedSummary").innerHTML = `
    <span>Plan seleccionado</span>
    <strong>${sim.label} · ${sim.interest}% interés</strong>
    <small>Solicitás ${money(sim.amount)} y devolvés ${money(sim.total)} en ${sim.installments} cuotas fijas de ${money(sim.installment)}.</small>
  `;
}
function activatePanel(panelId) {
  document.querySelectorAll(".accordion-panel").forEach(panel => panel.classList.remove("open"));
  document.querySelectorAll(".accordion-btn").forEach(button => button.classList.remove("active"));

  const panel = byId(panelId);
  const button = document.querySelector(`[data-accordion="${panelId}"]`);
  if (!panel || !button) return;

  panel.classList.add("open");
  button.classList.add("active");
  selectedPlanId = panelId === "monthlyPanel" ? byId("monthlyPlan").value : byId("weeklyPlan").value;
  renderSelectedSummary();
}
function enforceMinimum(inputId, min) {
  const input = byId(inputId);
  if (toNumber(input.value) < min) input.value = min;
}
function getCheckedWorkStatus() {
  return [...document.querySelectorAll('input[name="workStatus"]:checked')].map(input => input.value);
}
function textValue(id, fallback = "No informado") {
  const value = String(byId(id)?.value || "").trim();
  return value || fallback;
}
function buildWhatsappMessage() {
  const sim = calculatePlan(selectedPlanId);
  const workStatus = getCheckedWorkStatus();

  return `Nueva solicitud de crédito - Préstamos Flash\n\n` +
    `Datos del solicitante:\n` +
    `Nombre y apellido: ${textValue("fullName")}\n` +
    `DNI/CUIL: ${textValue("dniCuil")}\n` +
    `Dirección: ${textValue("address")}\n` +
    `Código postal: ${textValue("postalCode")}\n` +
    `Garante: ${textValue("guarantor")}\n` +
    `Ingreso mensual aprox.: ${money(toNumber(byId("monthlyIncome").value))}\n` +
    `Situación laboral: ${workStatus.length ? workStatus.join(", ") : "No informado"}\n\n` +
    `Simulación elegida:\n` +
    `Tipo: Crédito ${sim.type}\n` +
    `Monto solicitado: ${money(sim.amount)}\n` +
    `Plan: ${sim.label}\n` +
    `Interés: ${sim.interest}%\n` +
    `Total a devolver: ${money(sim.total)}\n` +
    `Cuota fija: ${money(sim.installment)}`;
}
function validateBeforeSend() {
  const requiredIds = ["fullName", "dniCuil", "address", "postalCode", "monthlyIncome"];
  for (const id of requiredIds) {
    const input = byId(id);
    if (!String(input.value || "").trim()) {
      input.focus();
      input.reportValidity();
      return false;
    }
  }
  if (!getCheckedWorkStatus().length) {
    alert("Seleccioná al menos una situación laboral.");
    return false;
  }
  return true;
}
function openWhatsapp(message) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
function buildMoneyRain() {
  const rain = byId("moneyRain");
  if (!rain) return;
  const totalDrops = 72;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < totalDrops; i += 1) {
    const drop = document.createElement("span");
    drop.className = "money-drop";
    drop.textContent = "$";
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDuration = `${18 + Math.random() * 24}s`;
    drop.style.animationDelay = `${Math.random() * -36}s`;
    drop.style.fontSize = `${11 + Math.random() * 12}px`;
    drop.style.opacity = `${0.07 + Math.random() * 0.13}`;
    fragment.appendChild(drop);
  }
  rain.appendChild(fragment);
}
function initSimulator() {
  buildMoneyRain();

  document.querySelectorAll(".accordion-btn").forEach(button => {
    button.addEventListener("click", () => activatePanel(button.dataset.accordion));
  });

  byId("weeklyPlan").addEventListener("change", event => {
    selectedPlanId = event.target.value;
    renderAllResults();
  });
  byId("monthlyPlan").addEventListener("change", event => {
    selectedPlanId = event.target.value;
    renderAllResults();
  });

  byId("weeklyAmount").addEventListener("input", renderAllResults);
  byId("monthlyAmount").addEventListener("input", renderAllResults);
  byId("weeklyAmount").addEventListener("blur", () => { enforceMinimum("weeklyAmount", 10000); renderAllResults(); });
  byId("monthlyAmount").addEventListener("blur", () => { enforceMinimum("monthlyAmount", 100000); renderAllResults(); });

  byId("creditForm").addEventListener("submit", event => {
    event.preventDefault();
    enforceMinimum("weeklyAmount", 10000);
    enforceMinimum("monthlyAmount", 100000);
    renderAllResults();
    if (!validateBeforeSend()) return;
    openWhatsapp(buildWhatsappMessage());
  });

  renderAllResults();
}

document.addEventListener("DOMContentLoaded", initSimulator);
