import { calculateEstate } from "./inheritance.js";

function formatRp(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value).replace("Rp", "Rp ");
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function parseEstate(input) {
  return Number(String(input.value).replace(/[^\d]/g, "")) || 0;
}

function setupGenderToggle() {
  const maleRadio = document.querySelector('input[value="male"]');
  const femaleRadio = document.querySelector('input[value="female"]');
  const maleLabel = document.querySelector("#label-male");
  const femaleLabel = document.querySelector("#label-female");
  const husbandRow = document.querySelector("#row-husband");
  const wifeRow = document.querySelector("#row-wife");
  const husbandInput = document.querySelector("#husband");
  const wifeInput = document.querySelector("#wife");

  const sync = () => {
    const isMale = maleRadio.checked;
    maleLabel.classList.toggle("active", isMale);
    femaleLabel.classList.toggle("active", !isMale);
    husbandRow.classList.toggle("disabled", isMale);
    wifeRow.classList.toggle("disabled", !isMale);

    if (isMale) {
      husbandInput.value = "0";
    } else {
      wifeInput.value = "0";
    }
  };

  maleRadio.addEventListener("change", sync);
  femaleRadio.addEventListener("change", sync);
  sync();
}

function setupSteppers() {
  document.querySelectorAll(".stepper-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const step = Number(btn.dataset.step) || 0;
      const input = document.querySelector(`#${targetId}`);
      if (!input || input.closest(".heir-row").classList.contains("disabled")) return;

      const current = Number(input.value) || 0;
      const max = Number(input.max) || 99;
      const next = Math.max(0, Math.min(max, current + step));
      input.value = String(next);
    });
  });
}

function setupEstateInput(estateInput, estateDisplay) {
  estateInput.addEventListener("input", () => {
    const val = parseEstate(estateInput);
    estateInput.value = val ? formatNumber(val) : "";
    estateDisplay.textContent = formatRp(val);
  });
}

function createEmptyState(title, text) {
  const root = document.createElement("div");
  root.className = "empty-state";

  const strong = document.createElement("strong");
  strong.textContent = title;

  const desc = document.createElement("div");
  desc.className = "empty-state-text";
  desc.textContent = text;

  root.appendChild(strong);
  root.appendChild(desc);
  return root;
}

function createResultItem(row) {
  const item = document.createElement("div");
  item.className = "result-item";

  const main = document.createElement("div");
  main.className = "result-main";

  const left = document.createElement("div");
  const title = document.createElement("div");
  title.className = "result-title";
  title.textContent = row.count && row.count > 1 ? `${row.label} (${row.count} orang)` : row.label;

  const basis = document.createElement("div");
  basis.className = "result-basis";
  basis.textContent = row.basis;

  left.appendChild(title);
  left.appendChild(basis);

  const right = document.createElement("div");
  right.className = "result-value";

  const amount = document.createElement("div");
  amount.className = "result-amount";
  amount.textContent = formatRp(row.amount);

  const fraction = document.createElement("span");
  fraction.className = "result-fraction";
  fraction.textContent = row.fractionText;

  right.appendChild(amount);
  right.appendChild(fraction);

  main.appendChild(left);
  main.appendChild(right);
  item.appendChild(main);

  if (row.breakdown && row.breakdown.length) {
    const breakdownList = document.createElement("div");
    breakdownList.className = "breakdown-list";
    row.breakdown.forEach(p => {
      const bRow = document.createElement("div");
      bRow.className = "breakdown-row";

      const label = document.createElement("span");
      label.textContent = p.label;

      const perPerson = document.createElement("strong");
      perPerson.textContent = `${formatRp(p.amount)} / orang`;

      bRow.appendChild(label);
      bRow.appendChild(perPerson);
      breakdownList.appendChild(bRow);
    });
    item.appendChild(breakdownList);
  }

  const ratioBar = document.createElement("div");
  ratioBar.className = "ratio-bar";
  const ratioFill = document.createElement("span");
  ratioFill.className = "ratio-fill";
  ratioFill.style.width = `${Math.min(row.percentage, 100)}%`;
  ratioBar.appendChild(ratioFill);
  item.appendChild(ratioBar);

  return item;
}

function renderResults(result) {
  const container = document.querySelector("#results-container");
  const statusEl = document.querySelector("#results-status");

  container.replaceChildren();

  if (!result.estate) {
    statusEl.textContent = "Data belum lengkap";
    container.appendChild(createEmptyState("Masukkan nominal harta", "Nilai harta warisan harus lebih besar dari Rp 0."));
    return;
  }

  if (!result.shares.length) {
    statusEl.textContent = "Tidak ada ahli waris";
    container.appendChild(createEmptyState("Pilih ahli waris", "Setidaknya satu orang ahli waris harus dimasukkan."));
    return;
  }

  statusEl.textContent = result.isAul ? "Metode 'Aul diterapkan" : "Perhitungan tuntas";

  const list = document.createElement("div");
  list.className = "result-list";
  result.shares.forEach(share => list.appendChild(createResultItem(share)));
  container.appendChild(list);

  if (result.isAul) {
    const notice = document.createElement("div");
    notice.className = "notice-box";
    notice.textContent = "Penyesuaian 'Aul: Jumlah fardh melebihi total harta, sehingga bagian tiap ahli waris disesuaikan secara proporsional.";
    container.appendChild(notice);
  } else if (result.remaining > 0) {
    const notice = document.createElement("div");
    notice.className = "notice-box";
    notice.textContent = `Sisa harta: Masih terdapat ${formatRp(result.remaining)} yang belum teralokasi kepada ashabah atau baitul mal.`;
    container.appendChild(notice);
  }
}

function executeCalculation(estateInput) {
  const raw = {};
  document.querySelectorAll("[data-heir]").forEach(input => {
    raw[input.dataset.heir] = input.value;
  });
  raw.estate = parseEstate(estateInput);

  const result = calculateEstate(raw);
  renderResults(result);
}

function init() {
  const estateInput = document.querySelector("#estate");
  const estateDisplay = document.querySelector("#estate-display");

  setupGenderToggle();
  setupSteppers();
  setupEstateInput(estateInput, estateDisplay);

  document.querySelector("#calculate").addEventListener("click", () => {
    executeCalculation(estateInput);
  });
}

init();
