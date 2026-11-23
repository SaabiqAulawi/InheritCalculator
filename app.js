import { calculateEstate } from "./inheritance.js";

const ids = [
  ["husband","Suami","Pasangan pewaris","male"],
  ["wife","Istri","Pasangan pewaris","female"],
  ["father","Ayah","Orang tua kandung","male"],
  ["mother","Ibu","Orang tua kandung","female"],
  ["grandfather","Kakek","Ayah dari ayah","male"],
  ["grandmother","Nenek","Ibu dari ayah/ibu","female"],
  ["son","Anak laki-laki","Keturunan pewaris","male"],
  ["daughter","Anak perempuan","Keturunan pewaris","female"],
  ["grandson","Cucu laki-laki","Anak dari anak laki-laki","male"],
  ["granddaughter","Cucu perempuan","Anak dari anak laki-laki","female"],
  ["fullBrother","Saudara laki-laki","Saudara kandung","male"],
  ["fullSister","Saudara perempuan","Saudara kandung","female"],
  ["paternalBrother","Saudara laki-laki","Saudara seayah","male"],
  ["paternalSister","Saudara perempuan","Saudara seayah","female"],
  ["maternalSibling","Saudara/i seibu","Saudara seibu","female"]
];

const personIcon = gender => gender === "male"
  ? `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="9" r="5" stroke="currentColor" stroke-width="2"/><path d="M7.5 26c.7-6 3.5-9 8.5-9s7.8 3 8.5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 13.5h8" stroke="currentColor" stroke-width="2"/></svg>`
  : `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="9" r="5" stroke="currentColor" stroke-width="2"/><path d="M7.5 26c.7-6 3.5-9 8.5-9s7.8 3 8.5 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M11 18l5 4 5-4M16 22v4" stroke="currentColor" stroke-width="1.7"/></svg>`;

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">☾</span><span>Kalkulator Warisan</span></div>
      <div class="secure"><span>✓</span> Perhitungan bersifat edukatif</div>
    </header>
    <div class="layout">
      <section class="card form-card" aria-label="Data warisan">
        <fieldset class="section">
          <legend class="section-title"><span class="step">1</span> Nilai harta warisan</legend>
          <label class="estate-input">
            <span>Rp</span>
            <input id="estate" type="text" inputmode="numeric" value="100000000" aria-label="Nilai harta warisan" />
          </label>
        </fieldset>
        <fieldset class="section">
          <legend class="section-title"><span class="step">2</span> Isi jumlah ahli waris</legend>
          <div class="heir-grid" id="heirs">
            ${ids.map(([id, name, sub, gender]) => `
              <label class="heir-row" for="${id}">
                <span class="avatar ${gender}">${personIcon(gender)}</span>
                <span class="heir-info"><span class="heir-name">${name}</span><span class="heir-sub">${sub}</span></span>
                <input class="count-input" id="${id}" data-heir="${id}" type="number" min="0" max="99" value="0" aria-label="Jumlah ${name}" />
              </label>`).join("")}
          </div>
        </fieldset>
        <button class="calculate" id="calculate" type="button">Hitung Pembagian Warisan</button>
      </section>
      <aside class="card estate-card" aria-live="polite">
        <div class="estate-head"><h2>Hasil Pembagian</h2><span id="status">Belum dihitung</span></div>
        <div class="total-estate"><small>Total harta warisan</small><strong id="estateDisplay">Rp 100.000.000</strong></div>
        <div id="result"><div class="empty"><div class="empty-icon">⚖</div><strong>Siap menghitung</strong><br/>Lengkapi data ahli waris</div></div>
      </aside>
    </div>
  </main>`;

const estateInput = document.querySelector("#estate");
const estateDisplay = document.querySelector("#estateDisplay");

function parseEstate() {
  return Number(String(estateInput.value).replace(/[^\d]/g,"")) || 0;
}
function formatRp(value) {
  return new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(value).replace("Rp","Rp ");
}
estateInput.addEventListener("input", () => {
  const value = parseEstate();
  estateInput.value = value ? new Intl.NumberFormat("id-ID").format(value).replace(/\./g,".") : "";
  estateDisplay.textContent = formatRp(value);
});

document.querySelector("#calculate").addEventListener("click", () => {
  const raw = {};
  document.querySelectorAll("[data-heir]").forEach(input => raw[input.dataset.heir] = input.value);
  raw.estate = parseEstate();
  const result = calculateEstate(raw);
  document.querySelector("#status").textContent = result.shares.length ? "Hasil estimasi" : "Tidak ada ahli waris";
  estateDisplay.textContent = formatRp(result.estate);

  if (!result.estate) {
    document.querySelector("#result").innerHTML = `<div class="empty"><div class="empty-icon">Rp</div><strong>Masukkan nilai harta</strong></div>`;
    return;
  }
  if (!result.shares.length) {
    document.querySelector("#result").innerHTML = `<div class="empty"><div class="empty-icon">!</div><strong>Belum ada ahli waris yang dipilih</strong></div>`;
    return;
  }

  document.querySelector("#result").innerHTML = `
    <div class="result-list">
      ${result.shares.map(row => `
        <div class="result-row">
          <div>
            <div class="result-name">${row.label}${row.count ? ` <span style="color:#7b877f">×${row.count}</span>` : ""}</div>
            <div class="result-basis">${row.basis}</div>
            ${row.breakdown && row.breakdown.length ? `
              <div style="margin-top:7px; display:flex; flex-direction:column; gap:3px;">
                ${row.breakdown.map(person => `
                  <div style="font-size:11px; color:#2f7052;">
                    <strong>${person.label}:</strong> ${formatRp(person.amount)} / orang
                  </div>`).join("")}
              </div>` : ""}
            <div class="bar"><i style="width:${Math.min(row.percentage,100)}%"></i></div>
          </div>
          <div class="result-value"><strong>${formatRp(row.amount)}</strong><span>${row.fractionText}</span></div>
        </div>`).join("")}
    </div>
    ${result.isAul ? `<div class="notice"><strong>Metode ‘aul’ diterapkan.</strong> Bagian dikurangi proporsional karena jumlah bagian pasti melebihi harta.</div>` :
      `<div class="notice"><strong>Catatan:</strong> Pemeriksaan ulang oleh ahli faraidh disarankan untuk kasus khusus, seperti pembunuhan, perbudakan, pernikahan, dan perbedaan mazhab.</div>`}`;
});
