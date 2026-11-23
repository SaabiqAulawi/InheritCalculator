export class Fraction {
  constructor(n, d = 1) {
    if (d === 0) throw new Error("Pembagi tidak boleh nol");
    if (d < 0) { n = -n; d = -d; }
    const gcd = (a, b) => b === 0 ? Math.abs(a) : gcd(b, a % b);
    const g = gcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }
  add(b) { return new Fraction(this.n * b.d + b.n * this.d, this.d * b.d); }
  sub(b) { return new Fraction(this.n * b.d - b.n * this.d, this.d * b.d); }
  mul(b) { return new Fraction(this.n * b.n, this.d * b.d); }
  div(b) { return new Fraction(this.n * b.d, this.d * b.n); }
  compare(b) { return this.n * b.d - b.n * this.d; }
  percent() { return this.n * 100 / this.d; }
  toString() { return this.n === 0 ? "0" : `${this.n}/${this.d}`; }
}

export const ONE = new Fraction(1);
export const ZERO = new Fraction(0);

function sumFractions(values) {
  return values.reduce((sum, value) => sum.add(value), ZERO);
}

export function calculateEstate(raw) {
  const estate = Math.max(0, Number(raw.estate) || 0);
  const heir = {
    husband: +raw.husband || 0,
    wife: +raw.wife || 0,
    father: +raw.father || 0,
    mother: +raw.mother || 0,
    grandfather: +raw.grandfather || 0,
    grandmother: +raw.grandmother || 0,
    son: +raw.son || 0,
    daughter: +raw.daughter || 0,
    grandson: +raw.grandson || 0,
    granddaughter: +raw.granddaughter || 0,
    fullBrother: +raw.fullBrother || 0,
    fullSister: +raw.fullSister || 0,
    paternalBrother: +raw.paternalBrother || 0,
    paternalSister: +raw.paternalSister || 0,
    maternalSibling: +raw.maternalSibling || 0
  };

  const shares = new Map();
  const add = (key, label, fraction, basis) => {
    const previous = shares.get(key);
    if (previous) previous.fraction = previous.fraction.add(fraction);
    else shares.set(key, { key, label, fraction, basis, count: 0 });
  };
  const setCount = (key, count) => { if (shares.has(key)) shares.get(key).count = count; };

  const hasDescendant = heir.son > 0 || heir.daughter > 0 || heir.grandson > 0 || heir.granddaughter > 0;
  const hasDirectDescendant = heir.son > 0 || heir.daughter > 0;

  if (heir.husband) add("husband", "Suami", hasDescendant ? new Fraction(1, 4) : new Fraction(1, 2), "¼ dengan keturunan, ½ tanpa keturunan");
  if (heir.wife) add("wife", heir.wife > 1 ? "Istri" : "Istri", hasDescendant ? new Fraction(1, 8) : new Fraction(1, 4), "⅛ dengan keturunan, ¼ tanpa keturunan");

  if (heir.mother) {
    const siblingsTotal = heir.fullBrother + heir.fullSister + heir.paternalBrother + heir.paternalSister + heir.maternalSibling;
    const motherShare = hasDescendant || siblingsTotal > 0 ? new Fraction(1, 6) : new Fraction(1, 3);
    add("mother", "Ibu", motherShare, "⅙ jika ada keturunan atau saudara, ⅓ jika tidak");
  }

  if (heir.father) {
    const fatherShare = hasDescendant ? new Fraction(1, 6) : ZERO;
    if (fatherShare.n) add("father", "Ayah", fatherShare, "⅙ ketika ada keturunan");
  } else if (heir.grandfather) {
    const grandfatherShare = hasDescendant ? new Fraction(1, 6) : ZERO;
    if (grandfatherShare.n) add("grandfather", "Kakek", grandfatherShare, "⅙ ketika ada keturunan");
  }

  if (heir.grandmother) add("grandmother", "Nenek", new Fraction(1, 6), "⅙");

  if (heir.maternalSibling) {
    const count = heir.maternalSibling;
    add("maternalSibling", count > 1 ? "Saudara/i seibu" : "Saudara/i seibu",
      count === 1 ? new Fraction(1, 6) : new Fraction(1, 3),
      "1 orang ⅙, lebih dari 1 berbagi ⅓");
  }

  if (!hasDescendant && !heir.father && !heir.grandfather && heir.fullBrother === 0 && heir.fullSister > 0) {
    add("fullSister", heir.fullSister === 1 ? "Saudara perempuan kandung" : "Saudara perempuan kandung",
      heir.fullSister === 1 ? new Fraction(1, 2) : new Fraction(2, 3),
      heir.fullSister === 1 ? "Saudara perempuan tunggal mendapat ½" : "Saudara perempuan 2+ berbagi ⅔");
  } else if (!hasDescendant && !heir.father && !heir.grandfather && heir.fullBrother === 0 && heir.fullSister === 0 && heir.paternalSister > 0) {
    add("paternalSister", heir.paternalSister === 1 ? "Saudara perempuan seayah" : "Saudara perempuan seayah",
      heir.paternalSister === 1 ? new Fraction(1, 2) : new Fraction(2, 3),
      heir.paternalSister === 1 ? "Saudara perempuan tunggal mendapat ½" : "Saudara perempuan 2+ berbagi ⅔");
  }

  // Daughters and sons inherit directly. Otherwise, grandsons and daughters inherit similarly.
  if (heir.son > 0 || heir.daughter > 0) {
    if (heir.daughter > 0) {
      let share;
      if (heir.son === 0) {
        share = heir.daughter === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
        add("daughter", heir.daughter === 1 ? "Anak perempuan" : "Anak perempuan", share, "1 orang ½, 2+ orang berbagi ⅔");
      }
    }
  } else if (heir.grandson > 0 || heir.granddaughter > 0) {
    if (heir.granddaughter > 0 && heir.grandson === 0) {
      const share = heir.granddaughter === 1 ? new Fraction(1, 2) : new Fraction(2, 3);
      add("granddaughter", "Cucu perempuan", share, "1 orang ½, 2+ orang berbagi ⅔");
    }
  }

  const fixed = sumFractions([...shares.values()].map(item => item.fraction));
  let residual = ONE.sub(fixed);
  if (residual.compare(ZERO) < 0) residual = ZERO;

  // Residual heirs are processed in priority order.
  if (hasDirectDescendant && heir.son > 0) {
    const removeFixedDaughters = shares.has("daughter");
    if (removeFixedDaughters) shares.delete("daughter");
    shares.set("childrenResidue", {
      key: "childrenResidue", label: "Anak laki-laki dan perempuan",
      fraction: ONE.sub(sumFractions([...shares.values()].filter(v => v.key !== "childrenResidue").map(v => v.fraction))),
      basis: "Harta sisa dibagi 2:1 (laki-laki mendapat dua bagian)",
      count: heir.son + heir.daughter,
      units: heir.son * 2 + heir.daughter,
      maleCount: heir.son,
      femaleCount: heir.daughter
    });
  } else if (!hasDirectDescendant && heir.grandson > 0) {
    shares.set("grandchildrenResidue", {
      key: "grandchildrenResidue", label: "Cucu laki-laki dan perempuan",
      fraction: ONE.sub(sumFractions([...shares.values()].filter(v => v.key !== "grandchildrenResidue").map(v => v.fraction))),
      basis: "Harta sisa dibagi 2:1 (laki-laki mendapat dua bagian)",
      count: heir.grandson + heir.granddaughter,
      units: heir.grandson * 2 + heir.granddaughter,
      maleCount: heir.grandson,
      femaleCount: heir.granddaughter
    });
  } else if (!hasDescendant && heir.father) {
    shares.set("fatherResidue", {
      key: "fatherResidue", label: "Ayah",
      fraction: ONE.sub(sumFractions([...shares.values()].filter(v => v.key !== "fatherResidue").map(v => v.fraction))),
      basis: "Ayah menerima sisa sebagai ashabah",
      count: 1
    });
  } else if (!hasDescendant && !heir.father && heir.grandfather) {
    shares.set("grandfatherResidue", {
      key: "grandfatherResidue", label: "Kakek",
      fraction: ONE.sub(sumFractions([...shares.values()].filter(v => v.key !== "grandfatherResidue").map(v => v.fraction))),
      basis: "Kakek menerima sisa sebagai ashabah",
      count: 1
    });
  } else if (!hasDescendant && !heir.father && !heir.grandfather) {
    const fullBrothers = heir.fullBrother;
    const fullSisters = heir.fullSister;
    if (fullBrothers + fullSisters > 0) {
      shares.set("siblingsResidue", {
        key: "siblingsResidue", label: "Saudara/i kandung",
        fraction: ONE.sub(sumFractions([...shares.values()].filter(v => v.key !== "siblingsResidue").map(v => v.fraction))),
        basis: "Saudara kandung menerima sisa; laki-laki mendapat 2 bagian",
        count: fullBrothers + fullSisters,
        units: fullBrothers * 2 + fullSisters,
        maleCount: fullBrothers,
        femaleCount: fullSisters
      });
    } else if (heir.paternalBrother + heir.paternalSister > 0) {
      shares.set("paternalResidue", {
        key: "paternalResidue", label: "Saudara/i seayah",
        fraction: ONE.sub(sumFractions([...shares.values()].filter(v => v.key !== "paternalResidue").map(v => v.fraction))),
        basis: "Saudara seayah menerima sisa; laki-laki mendapat 2 bagian",
        count: heir.paternalBrother + heir.paternalSister,
        units: heir.paternalBrother * 2 + heir.paternalSister,
        maleCount: heir.paternalBrother,
        femaleCount: heir.paternalSister
      });
    }
  }

  setCount("husband", heir.husband);
  setCount("wife", heir.wife);
  setCount("father", heir.father);
  setCount("mother", heir.mother);
  setCount("grandfather", heir.grandfather);
  setCount("grandmother", heir.grandmother);
  setCount("maternalSibling", heir.maternalSibling);
  setCount("daughter", heir.daughter);
  setCount("granddaughter", heir.granddaughter);
  setCount("fullSister", heir.fullSister);
  setCount("paternalSister", heir.paternalSister);

  let total = sumFractions([...shares.values()].map(item => item.fraction));
  const isAul = total.compare(ONE) > 0;
  const results = [];

  if (isAul) {
    [...shares.values()].forEach(item => {
      const fraction = item.fraction.div(total);
      results.push(formatResult(item, fraction, estate));
    });
  } else {
    // Return surplus to eligible fixed heirs (radd), excluding spouses.
    const hasAshabahHeir = heir.son > 0 || heir.grandson > 0 ||
      heir.father > 0 || heir.grandfather > 0 ||
      heir.fullBrother > 0 || heir.fullSister > 0 ||
      heir.paternalBrother > 0 || heir.paternalSister > 0;
    const raddKeys = [...shares.entries()].filter(([key]) =>
      key !== "husband" && key !== "wife" && key !== "father" && key !== "grandfather"
    ).map(([, item]) => item);
    const raddEligible = hasAshabahHeir ? [] : raddKeys.filter(item => !item.key.includes("Residue"));
    let returnPool = ONE.sub(total);
    if (returnPool.compare(ZERO) > 0 && raddEligible.length > 0) {
      const raddTotal = sumFractions(raddEligible.map(item => item.fraction));
      shares.forEach((item, key) => {
        if (raddEligible.includes(item)) {
          item.fraction = item.fraction.add(item.fraction.div(raddTotal).mul(returnPool));
        }
      });
    }
    total = sumFractions([...shares.values()].map(item => item.fraction));
    shares.forEach(item => results.push(formatResult(item, item.fraction, estate)));
  }

  return {
    estate,
    shares: results,
    total: estate > 0 ? estate : 0,
    isAul,
    remaining: Math.max(0, estate - results.reduce((sum, result) => sum + result.amount, 0))
  };
}

function formatResult(item, fraction, estate) {
  const amount = Math.round(estate * fraction.n / fraction.d);
  const breakdown = [];
  if (item.maleCount || item.femaleCount) {
    const maleCount = item.maleCount || 0;
    const femaleCount = item.femaleCount || 0;
    const units = item.units || 0;
    if (units > 0) {
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
