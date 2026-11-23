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

test("mother, father and daughter receive fixed shares", () => {
  const result = calculateEstate({ estate: 6000000, mother: 1, father: 1, daughter: 1 });
  assert.equal(result.shares.find(item => item.key === "mother").amount, 1000000);
  assert.equal(result.shares.find(item => item.key === "father").amount, 1000000);
  assert.equal(result.shares.find(item => item.key === "daughter").amount, 3000000);
});

test("single full sister receives half when no descendants", () => {
  const result = calculateEstate({ estate: 1000000, fullSister: 1 });
  assert.equal(result.shares.find(item => item.key === "fullSister").amount, 500000);
});

test("children residue includes individual nominal amounts with 2:1 ratio", () => {
  const result = calculateEstate({ estate: 7000000, son: 1, daughter: 1 });
  const children = result.shares.find(item => item.key === "childrenResidue");
  assert.deepEqual(
    children.breakdown.map(item => item.amount),
    [4666667, 2333333]
  );
});

test("father receives only fixed 1/6 when a daughter inherits", () => {
  const result = calculateEstate({ estate: 12000000, father: 1, daughter: 1 });
  const fatherShares = result.shares.filter(item => item.key === "father");
  assert.equal(fatherShares.length, 1);
  assert.equal(fatherShares[0].amount, 2000000);
});

test("wife count is shown as a per-person nominal share", () => {
  const result = calculateEstate({ estate: 8000000, wife: 2, son: 1 });
  const wife = result.shares.find(item => item.key === "wife");
  assert.equal(wife.amount, 1000000);
  assert.equal(wife.breakdown[0].amount, 500000);
});
