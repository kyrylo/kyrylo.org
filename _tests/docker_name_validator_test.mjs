import test from "node:test";
import assert from "node:assert/strict";

import { validateDockerContainerName } from "../docker-name-generator/assets/javascripts/modules/container_name_validator.js";

test("accepts Docker-valid container names", () => {
  for (const value of ["my-container", "admiring_curie", "api.v2", "A1"]) {
    const result = validateDockerContainerName(value);

    assert.equal(result.status, "valid", value);
    assert.equal(result.dockerValid, true, value);
    assert.deepEqual(result.errors, [], value);
  }
});

test("treats empty input as neutral", () => {
  assert.deepEqual(validateDockerContainerName(""), {
    status: "empty",
    dockerValid: false,
    dnsLabelFriendly: false,
    errors: [],
    warnings: [],
  });
});

test("reports concrete Docker validation failures", () => {
  const cases = [
    ["_leading", "first character"],
    ["two words", "Whitespace"],
    ["api@v2", "Only letters"],
  ];

  for (const [value, expectedMessage] of cases) {
    const result = validateDockerContainerName(value);

    assert.equal(result.status, "invalid", value);
    assert.equal(result.dockerValid, false, value);
    assert.ok(result.errors.some((error) => error.includes(expectedMessage)), value);
  }
});

test("never silently trims input", () => {
  const result = validateDockerContainerName(" my-container ");

  assert.equal(result.status, "invalid");
  assert.ok(result.errors.some((error) => error.includes("first character")));
  assert.ok(result.errors.some((error) => error.includes("Whitespace")));
});

test("separately reports lowercase RFC 1123-style DNS label warnings", () => {
  const cases = [
    ["A1", "lowercase"],
    ["admiring_curie", "underscores"],
    ["api.v2", "periods"],
    ["api-", "start or end"],
    [`a${"b".repeat(63)}`, "63 characters"],
  ];

  for (const [value, expectedWarning] of cases) {
    const result = validateDockerContainerName(value);

    assert.equal(result.dockerValid, true, value);
    assert.equal(result.dnsLabelFriendly, false, value);
    assert.ok(
      result.warnings.some((warning) => warning.includes(expectedWarning)),
      value,
    );
  }

  const friendly = validateDockerContainerName("my-container");
  assert.equal(friendly.dnsLabelFriendly, true);
  assert.deepEqual(friendly.warnings, []);
});
