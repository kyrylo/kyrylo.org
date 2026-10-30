import assert from "node:assert/strict";
import test from "node:test";
import { createShareUrl, readShareState } from "../fuck-this-page/assets/javascripts/share-url.js";

test("share links stay in the doodle and round-trip URLs and reasons without double decoding", () => {
  const site = "https://example.com/a+b?q=100%25&next=/two#part";
  const because = "C++ / 100% noise & déjà vu 🫠";
  for (const origin of ["https://kyrylo.org", "http://127.0.0.1:4000"]) {
    const link = new URL(createShareUrl(site, because, "Website", origin));
    assert.equal(link.origin, origin);
    assert.equal(link.pathname, "/fuck-this-page/");
    const state = readShareState(link.search);
    assert.equal(state.site, site);
    assert.equal(state.url.href, site);
    assert.equal(state.because, because);
    assert.equal(state.category, "Website");
  }
});

test("plain domains and omitted optional fields have usable defaults", () => {
  const state = readShareState("?url=example.com&c=Unknown");
  assert.equal(state.url.href, "https://example.com/");
  assert.equal(state.because, "it made my eyeballs bleed");
  assert.equal(state.category, "Page");
  assert.equal(readShareState(""), null);
  assert.equal(readShareState("?url="), null);
});

test("malformed or executable URLs never become target links", () => {
  for (const site of ["javascript:alert(1)", "data:text/html,test", "file:///etc/passwd", "https://", "not a host"]) {
    assert.equal(createShareUrl(site, "test", "Page", "https://kyrylo.org"), null);
    assert.equal(readShareState(`?url=${encodeURIComponent(site)}`), null);
  }
});
