export class Fraction {
  constructor(n, d = 1) {
    if (d === 0) throw new Error("Pembagi tidak boleh nol");
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }

  add(b) {
    return new Fraction(this.n * b.d + b.n * this.d, this.d * b.d);
  }

  sub(b) {
    return new Fraction(this.n * b.d - b.n * this.d, this.d * b.d);
  }

  mul(b) {
    return new Fraction(this.n * b.n, this.d * b.d);
  }

  div(b) {
    return new Fraction(this.n * b.d, this.d * b.n);
  }

  compare(b) {
    return this.n * b.d - b.n * this.d;
  }

  percent() {
    return (this.n * 100) / this.d;
  }

  toString() {
    return this.n === 0 ? "0" : `${this.n}/${this.d}`;
  }
}

export const ONE = new Fraction(1);
export const ZERO = new Fraction(0);

export function sumFractions(values) {
  return values.reduce((sum, value) => sum.add(value), ZERO);
}

function normalizeHeirs(raw) {
  return {
    husband: Math.max(0, Math.min(1, +raw.husband || 0)),
    wife: Math.max(0, Math.min(4, +raw.wife || 0)),
    father: Math.max(0, Math.min(1, +raw.father || 0)),
    mother: Math.max(0, Math.min(1, +raw.mother || 0)),
    grandfather: Math.max(0, Math.min(1, +raw.grandfather || 0)),
    grandmother: Math.max(0, Math.min(2, +raw.grandmother || 0)),
    son: Math.max(0, +raw.son || 0),
    daughter: Math.max(0, +raw.daughter || 0),
    grandson: Math.max(0, +raw.grandson || 0),
    granddaughter: Math.max(0, +raw.granddaughter || 0),
    fullBrother: Math.max(0, +raw.fullBrother || 0),
    fullSister: Math.max(0, +raw.fullSister || 0),
    paternalBrother: Math.max(0, +raw.paternalBrother || 0),
    paternalSister: Math.max(0, +raw.paternalSister || 0),
    maternalSibling: Math.max(0, +raw.maternalSibling || 0)
  };
}

function assignSpouseAndParents(heir, hasDescendant, hasMaleDescendant, shares) {
  if (heir.husband) {
    const fraction = hasDescendant ? new Fraction(1, 4) : new Fraction(1, 2);
    const basis = hasDescendant ? "¼ karena ada keturunan" : "½ karena tidak ada keturunan";
    shares.set("husband", { key: "husband", label: "Suami", fraction, basis, count: 1 });
  }

  if (heir.wife) {
    const fraction = hasDescendant ? new Fraction(1, 8) : new Fraction(1, 4);
    const basis = hasDescendant ? "⅛ karena ada keturunan" : "¼ karena tidak ada keturunan";
    shares.set("wife", { key: "wife", label: "Istri", fraction, basis, count: heir.wife });
  }

  if (heir.mother) {
    const totalSiblings = heir.fullBrother + heir.fullSister + heir.paternalBrother + heir.paternalSister + heir.maternalSibling;
    const fraction = hasDescendant || totalSiblings >= 2 ? new Fraction(1, 6) : new Fraction(1, 3);
    const basis = hasDescendant || totalSiblings >= 2 ? "⅙ karena ada keturunan atau 2+ saudara" : "⅓ karena tidak ada keturunan & saudara < 2";
    shares.set("mother", { key: "mother", label: "Ibu", fraction, basis, count: 1 });
  }

  if (heir.father && hasMaleDescendant) {
    shares.set("father", { key: "father", label: "Ayah", fraction: new Fraction(1, 6), basis: "⅙ fardh (ada keturunan laki-laki)", count: 1 });
  } else if (!heir.father && heir.grandfather && hasMaleDescendant) {
    shares.set("grandfather", { key: "grandfather", label: "Kakek", fraction: new Fraction(1, 6), basis: "⅙ fardh (ada keturunan laki-laki)", count: 1 });
  }

  if (heir.grandmother && !heir.mother) {
    shares.set("grandmother", { key: "grandmother", label: "Nenek", fraction: new Fraction(1, 6), basis: "⅙ bagian pasti nenek", count: heir.grandmother });
  }
}

function assignFemaleDescendants(heir, shares) {
  if (heir.son === 0 && heir.daughter > 0) {
    const fraction = heir.daughter === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
    const basis = heir.daughter === 1 ? "½ anak perempuan tunggal" : "⅔ bagian 2 atau lebih anak perempuan";
    shares.set("daughter", { key: "daughter", label: "Anak perempuan", fraction, basis, count: heir.daughter });
  }

  if (heir.son === 0 && heir.grandson === 0 && heir.granddaughter > 0) {
    if (heir.daughter === 0) {
      const fraction = heir.granddaughter === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
      const basis = heir.granddaughter === 1 ? "½ cucu perempuan tunggal" : "⅔ bagian 2+ cucu perempuan";
      shares.set("granddaughter", { key: "granddaughter", label: "Cucu perempuan", fraction, basis, count: heir.granddaughter });
    } else if (heir.daughter === 1) {
      shares.set("granddaughter", { key: "granddaughter", label: "Cucu perempuan", fraction: new Fraction(1, 6), basis: "⅙ penyempurna bagian dua pertiga", count: heir.granddaughter });
    }
  }
}

function assignCollateralFardh(heir, hasDescendant, shares) {
  const isBlocked = hasDescendant || heir.father > 0 || heir.grandfather > 0;
  if (!isBlocked && heir.maternalSibling > 0) {
    const count = heir.maternalSibling;
    const fraction = count === 1 ? new Fraction(1, 6) : new Fraction(1, 3);
    const basis = count === 1 ? "⅙ saudara seibu tunggal" : "⅓ dibagi rata saudara seibu";
    shares.set("maternalSibling", { key: "maternalSibling", label: "Saudara/i seibu", fraction, basis, count });
  }

  const siblingsBlocked = hasDescendant || heir.father > 0 || heir.grandfather > 0;
  if (siblingsBlocked) return;

  if (heir.fullBrother === 0 && heir.fullSister > 0) {
    const fraction = heir.fullSister === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
    const basis = heir.fullSister === 1 ? "½ saudara perempuan kandung tunggal" : "⅔ bagian 2+ saudara perempuan kandung";
    shares.set("fullSister", { key: "fullSister", label: "Saudara perempuan kandung", fraction, basis, count: heir.fullSister });
  } else if (heir.fullBrother === 0 && heir.fullSister === 0 && heir.paternalBrother === 0 && heir.paternalSister > 0) {
    const fraction = heir.paternalSister === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
    const basis = heir.paternalSister === 1 ? "½ saudara perempuan seayah tunggal" : "⅔ bagian 2+ saudara perempuan seayah";
    shares.set("paternalSister", { key: "paternalSister", label: "Saudara perempuan seayah", fraction, basis, count: heir.paternalSister });
  }
}

function assignFixedShares(heir, shares) {
  const hasMaleDescendant = heir.son > 0 || heir.grandson > 0;
  const hasFemaleDescendant = heir.daughter > 0 || heir.granddaughter > 0;
  const hasDescendant = hasMaleDescendant || hasFemaleDescendant;

  assignSpouseAndParents(heir, hasDescendant, hasMaleDescendant, shares);
  assignFemaleDescendants(heir, shares);
  assignCollateralFardh(heir, hasDescendant, shares);
}

function getFixedRemaining(shares) {
  const total = sumFractions([...shares.values()].map(item => item.fraction));
  const diff = ONE.sub(total);
  return diff.compare(ZERO) > 0 ? diff : ZERO;
}

function assignAscendantResidue(heir, shares) {
  const remaining = getFixedRemaining(shares);
  if (remaining.compare(ZERO) <= 0) return true;

  if (heir.father) {
    const existing = shares.get("father");
    if (existing) {
      existing.fraction = existing.fraction.add(remaining);
      existing.basis = "⅙ fardh + sisa ashabah";
    } else {
      shares.set("father", { key: "father", label: "Ayah", fraction: remaining, basis: "Sisa sebagai ashabah", count: 1 });
    }
    return true;
  }

  if (heir.grandfather) {
    const existing = shares.get("grandfather");
    if (existing) {
      existing.fraction = existing.fraction.add(remaining);
      existing.basis = "⅙ fardh + sisa ashabah";
    } else {
      shares.set("grandfather", { key: "grandfather", label: "Kakek", fraction: remaining, basis: "Sisa sebagai ashabah", count: 1 });
    }
    return true;
  }

  return false;
}

function assignResidueShares(heir, shares) {
  if (heir.son > 0) {
    shares.delete("daughter");
    const fraction = getFixedRemaining(shares);
    shares.set("childrenResidue", {
      key: "childrenResidue",
      label: heir.daughter > 0 ? "Anak laki-laki & perempuan" : "Anak laki-laki",
      fraction,
      basis: heir.daughter > 0 ? "Sisa ashabah dibagi rasio 2:1" : "Sisa sebagai ashabah",
      count: heir.son + heir.daughter,
      units: heir.son * 2 + heir.daughter,
      maleCount: heir.son,
      femaleCount: heir.daughter
    });
    return;
  }

  if (heir.grandson > 0) {
    shares.delete("granddaughter");
    const fraction = getFixedRemaining(shares);
    shares.set("grandchildrenResidue", {
      key: "grandchildrenResidue",
      label: heir.granddaughter > 0 ? "Cucu laki-laki & perempuan" : "Cucu laki-laki",
      fraction,
      basis: heir.granddaughter > 0 ? "Sisa ashabah dibagi rasio 2:1" : "Sisa sebagai ashabah",
      count: heir.grandson + heir.granddaughter,
      units: heir.grandson * 2 + heir.granddaughter,
      maleCount: heir.grandson,
      femaleCount: heir.granddaughter
    });
    return;
  }

  if (assignAscendantResidue(heir, shares)) return;

  const hasFemaleDescendant = heir.daughter > 0 || heir.granddaughter > 0;
  assignCollateralResidue(heir, hasFemaleDescendant, shares);
}

function assignCollateralResidue(heir, hasFemaleDescendant, shares) {
  const fraction = getFixedRemaining(shares);
  if (fraction.compare(ZERO) <= 0) return;

  if (heir.fullBrother > 0) {
    shares.delete("fullSister");
    shares.set("siblingsResidue", {
      key: "siblingsResidue",
      label: heir.fullSister > 0 ? "Saudara/i kandung" : "Saudara laki-laki kandung",
      fraction,
      basis: heir.fullSister > 0 ? "Sisa ashabah dibagi rasio 2:1" : "Sisa sebagai ashabah",
      count: heir.fullBrother + heir.fullSister,
      units: heir.fullBrother * 2 + heir.fullSister,
      maleCount: heir.fullBrother,
      femaleCount: heir.fullSister
    });
  } else if (hasFemaleDescendant && heir.fullSister > 0) {
    shares.set("fullSisterResidue", {
      key: "fullSisterResidue",
      label: "Saudara perempuan kandung",
      fraction,
      basis: "Sisa sebagai ashabah ma'al ghair bersama anak/cucu perempuan",
      count: heir.fullSister,
      units: heir.fullSister,
      femaleCount: heir.fullSister
    });
  } else if (heir.paternalBrother > 0) {
    shares.delete("paternalSister");
    shares.set("paternalResidue", {
      key: "paternalResidue",
      label: heir.paternalSister > 0 ? "Saudara/i seayah" : "Saudara laki-laki seayah",
      fraction,
      basis: heir.paternalSister > 0 ? "Sisa ashabah dibagi rasio 2:1" : "Sisa sebagai ashabah",
      count: heir.paternalBrother + heir.paternalSister,
      units: heir.paternalBrother * 2 + heir.paternalSister,
      maleCount: heir.paternalBrother,
      femaleCount: heir.paternalSister
    });
  }
}

function applyAulOrRadd(shares, estate) {
  let total = sumFractions([...shares.values()].map(item => item.fraction));
  const isAul = total.compare(ONE) > 0;

  if (isAul) {
    return {
      isAul: true,
      shares: [...shares.values()].map(item => formatResult(item, item.fraction.div(total), estate))
    };
  }

  const hasAshabah = [...shares.values()].some(item =>
    item.key.includes("Residue") || item.basis.includes("ashabah")
  );
  const raddEligible = hasAshabah ? [] : [...shares.values()].filter(item =>
    item.key !== "husband" && item.key !== "wife"
  );

  const surplus = ONE.sub(total);
  if (surplus.compare(ZERO) > 0 && raddEligible.length > 0) {
    const raddTotal = sumFractions(raddEligible.map(item => item.fraction));
    shares.forEach(item => {
      if (raddEligible.includes(item)) {
        item.fraction = item.fraction.add(item.fraction.div(raddTotal).mul(surplus));
        item.basis += " + radd";
      }
    });
  }

  return {
    isAul: false,
    shares: [...shares.values()].map(item => formatResult(item, item.fraction, estate))
  };
}

function formatResult(item, fraction, estate) {
  const amount = Math.round((estate * fraction.n) / fraction.d);
  const breakdown = [];

  if (item.maleCount || item.femaleCount) {
    const maleCount = item.maleCount || 0;
    const femaleCount = item.femaleCount || 0;
    const units = item.units || 1;
    const unitAmount = amount / units;

    if (maleCount > 0) {
      breakdown.push({
        label: `Laki-laki ×${maleCount}`,
        amount: Math.round(unitAmount * 2),
        perPerson: true
      });
    }
    if (femaleCount > 0) {
      breakdown.push({
        label: `Perempuan ×${femaleCount}`,
        amount: Math.round(unitAmount),
        perPerson: true
      });
    }
  } else if (item.count && item.count > 1) {
    breakdown.push({
      label: `Per orang ×${item.count}`,
      amount: Math.round(amount / item.count),
      perPerson: true
    });
  }

  return {
    key: item.key,
    label: item.label,
    fraction,
    fractionText: fractionToText(fraction),
    percentage: fraction.percent(),
    amount,
    basis: item.basis,
    count: item.count,
    units: item.units,
    breakdown
  };
}

function fractionToText(fraction) {
  if (fraction.n === 1 && fraction.d === 2) return "1/2";
  if (fraction.n === 1 && fraction.d === 3) return "1/3";
  if (fraction.n === 1 && fraction.d === 4) return "1/4";
  if (fraction.n === 1 && fraction.d === 6) return "1/6";
  if (fraction.n === 1 && fraction.d === 8) return "1/8";
  if (fraction.n === 2 && fraction.d === 3) return "2/3";
  const percent = fraction.percent();
  return percent >= 10 ? `${percent.toFixed(1).replace(".0", "")}%` : percent.toFixed(2).replace(/0$/, "");
}

export function calculateEstate(raw) {
  const estate = Math.max(0, Number(raw.estate) || 0);
  const heir = normalizeHeirs(raw);
  const shares = new Map();

  assignFixedShares(heir, shares);
  assignResidueShares(heir, shares);

  const { isAul, shares: results } = applyAulOrRadd(shares, estate);
  const distributed = results.reduce((sum, item) => sum + item.amount, 0);

  return {
    estate,
    shares: results,
    total: estate > 0 ? estate : 0,
    isAul,
    remaining: Math.max(0, estate - distributed)
  };
}
