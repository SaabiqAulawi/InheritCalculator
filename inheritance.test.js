import test from "node:test";
import assert from "node:assert/strict";
import { calculateEstate } from "./inheritance.js";

test("wife and son use 1/8 and residual 7/8 for son-daughter group", () => {
  const result = calculateEstate({ estate: 8000000, wife: 1, son: 1, daughter: 1 });
  const wife = result.shares.find(item => item.key === "wife");
  const children = result.shares.find(item => item.key === "childrenResidue");
  assert.equal(wife.amount, 1000000);
  assert.equal(children.units, 3);
  assert.equal(wife.fractionText, "1/8");
});

test("mother, father and daughter distribute full estate with father taking fardh and residue", () => {
  const result = calculateEstate({ estate: 6000000, mother: 1, father: 1, daughter: 1 });
  assert.equal(result.shares.find(item => item.key === "mother").amount, 1000000);
  assert.equal(result.shares.find(item => item.key === "daughter").amount, 3000000);
  assert.equal(result.shares.find(item => item.key === "father").amount, 2000000);
  assert.equal(result.remaining, 0);
});

test("father receives only fixed 1/6 when a son inherits", () => {
  const result = calculateEstate({ estate: 6000000, mother: 1, father: 1, son: 1 });
  assert.equal(result.shares.find(item => item.key === "mother").amount, 1000000);
  assert.equal(result.shares.find(item => item.key === "father").amount, 1000000);
  assert.equal(result.shares.find(item => item.key === "childrenResidue").amount, 4000000);
});

test("father receives 1/6 fardh plus residue when only daughter inherits", () => {
  const result = calculateEstate({ estate: 12000000, father: 1, daughter: 1 });
  const daughter = result.shares.find(item => item.key === "daughter");
  const father = result.shares.find(item => item.key === "father");
  assert.equal(daughter.amount, 6000000);
  assert.equal(father.amount, 6000000);
  assert.equal(result.remaining, 0);
});

test("single full sister receives full estate after radd when sole heir", () => {
  const result = calculateEstate({ estate: 1000000, fullSister: 1 });
  assert.equal(result.shares.find(item => item.key === "fullSister").amount, 1000000);
});

test("single full sister receives exactly 1/2 when husband is present", () => {
  const result = calculateEstate({ estate: 10000000, husband: 1, fullSister: 1 });
  assert.equal(result.shares.find(item => item.key === "husband").amount, 5000000);
  assert.equal(result.shares.find(item => item.key === "fullSister").amount, 5000000);
});

test("children residue includes individual nominal amounts with 2:1 ratio", () => {
  const result = calculateEstate({ estate: 7000000, son: 1, daughter: 1 });
  const children = result.shares.find(item => item.key === "childrenResidue");
  assert.deepEqual(
    children.breakdown.map(item => item.amount),
    [4666667, 2333333]
  );
});

test("wife count is shown as a per-person nominal share", () => {
  const result = calculateEstate({ estate: 8000000, wife: 2, son: 1 });
  const wife = result.shares.find(item => item.key === "wife");
  assert.equal(wife.amount, 1000000);
  assert.equal(wife.breakdown[0].amount, 500000);
});

test("mother receives 1/3 when only 1 sibling is present", () => {
  const result = calculateEstate({ estate: 6000000, mother: 1, fullBrother: 1 });
  assert.equal(result.shares.find(item => item.key === "mother").amount, 2000000);
  assert.equal(result.shares.find(item => item.key === "siblingsResidue").amount, 4000000);
});

test("mother receives 1/6 when 2 or more siblings are present", () => {
  const result = calculateEstate({ estate: 6000000, mother: 1, fullBrother: 1, fullSister: 1 });
  assert.equal(result.shares.find(item => item.key === "mother").amount, 1000000);
  assert.equal(result.shares.find(item => item.key === "siblingsResidue").amount, 5000000);
});

test("grandmother is blocked when mother is present", () => {
  const result = calculateEstate({ estate: 6000000, mother: 1, grandmother: 1, son: 1 });
  assert.equal(result.shares.some(item => item.key === "grandmother"), false);
});

test("maternal sibling is blocked when daughter is present", () => {
  const result = calculateEstate({ estate: 6000000, daughter: 1, maternalSibling: 1 });
  assert.equal(result.shares.some(item => item.key === "maternalSibling"), false);
});

test("aul is applied when total fixed shares exceed estate", () => {
  const result = calculateEstate({ estate: 7000000, husband: 1, fullSister: 2 });
  assert.equal(result.isAul, true);
  assert.equal(result.shares.find(item => item.key === "husband").amount, 3000000);
  assert.equal(result.shares.find(item => item.key === "fullSister").amount, 4000000);
});
