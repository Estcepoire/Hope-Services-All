import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeMgPhone, operatorOf } from "./phone";

test("formats acceptés", () => {
  assert.equal(normalizeMgPhone("034 12 345 67"), "0341234567");
  assert.equal(normalizeMgPhone("+261 32 12 345 67"), "0321234567");
  assert.equal(normalizeMgPhone("261331234567"), "0331234567");
  assert.equal(normalizeMgPhone("038.12.345.67"), "0381234567");
});

test("formats refusés", () => {
  assert.equal(normalizeMgPhone("0201234567"), null); // fixe
  assert.equal(normalizeMgPhone("03412345"), null); // trop court
  assert.equal(normalizeMgPhone("0351234567"), null); // préfixe inexistant
});

test("opérateur selon le préfixe", () => {
  assert.equal(operatorOf("0341234567"), "MVOLA");
  assert.equal(operatorOf("0321234567"), "ORANGE_MONEY");
  assert.equal(operatorOf("0331234567"), "AIRTEL_MONEY");
});
