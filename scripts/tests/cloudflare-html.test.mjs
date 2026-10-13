import assert from "node:assert/strict";
import test from "node:test";
import { CLOUDFLARE_JSD_TEMPLATE, verifyCloudflareHTML } from "../lib/verify-cloudflare-html.mjs";

const source = Buffer.from('<!doctype html><html><head></head><body><h1>Игра</h1><script>window.app=true;</script></body></html>');
const time = Buffer.from("1791850000.000000").toString("base64");
const script = CLOUDFLARE_JSD_TEMPLATE.replace("__RAY__", "a49a95dbe854e56c").replace("__TIME__", time);
const inject = extra => Buffer.from(source.toString().replace("</body>", `${extra}</body>`));

test("Exact source HTML keeps an unmodified raw delivery hash", () => {
  const evidence = verifyCloudflareHTML(source, source, "/game/");
  assert.equal(evidence.transformation, "none");
  assert.equal(evidence.sourceSHA256, evidence.deliveredSHA256);
});
test("Only the exact Cloudflare JSD template is accounted for and both hashes remain visible", () => {
  const evidence = verifyCloudflareHTML(inject(script), source, "/game/");
  assert.equal(evidence.transformation, "cloudflare-jsd-exact-template");
  assert.equal(evidence.injectedBytes, Buffer.byteLength(script));
  assert.notEqual(evidence.sourceSHA256, evidence.deliveredSHA256);
  assert.equal(evidence.sourceBytes, source.length);
});
test("Observed production bootstrap has exactly the captured 938 bytes", () => {
  const observed = CLOUDFLARE_JSD_TEMPLATE.replace("__RAY__", "a49aaa497e1d4531")
    .replace("__TIME__", "MTc5MTg1NTkyOQ==");
  assert.equal(Buffer.byteLength(observed), 938);
  assert.equal(verifyCloudflareHTML(inject(observed), source, "/game/").injectedBytes, 938);
});
test("The Unity export with an implicit closing body preserves every original byte", () => {
  const implicit = Buffer.from(source.toString().replace("</body>", ""));
  const delivered = Buffer.from(implicit.toString().replace("</html>", `${script}</html>`));
  const evidence = verifyCloudflareHTML(delivered, implicit, "/game/index.html");
  assert.equal(evidence.injectionBefore, "</html>");
  assert.equal(evidence.sourceBytes, implicit.length);
  assert.equal(evidence.transformation, "cloudflare-jsd-exact-template");
});
test("A document with both body tags omitted can receive only an exact terminal CDN bootstrap", () => {
  const implicit = Buffer.from(source.toString().replace("<body>", "").replace("</body>", "") + "\n");
  const evidence = verifyCloudflareHTML(Buffer.concat([implicit, Buffer.from(script)]), implicit, "/game/");
  assert.equal(evidence.injectionBefore, "document-end");
  assert.throws(() => verifyCloudflareHTML(Buffer.concat([implicit, Buffer.from(script + "<script>alert(1)</script>")]), implicit, "/game/"));
});
for (const [name, html] of [
  ["duplicate JSD injection", inject(script + script)],
  ["JSD in unexpected document position", Buffer.from(source.toString().replace("</head>", `${script}</head>`))],
  ["unknown script", inject('<script src="https://untrusted.test/x.js"></script>')],
  ["extra script alongside valid JSD", inject(script + "<script>alert(1)</script>")],
  ["changed JSD source", inject(script.replace("'/cdn-cgi/challenge-platform/scripts/jsd/main.js'", "'https://untrusted.test/x.js'"))],
  ["additional JSD code", inject(script.replace("function c(){", "function c(){alert(1);"))],
  ["malformed request ray", inject(script.replace("a49a95dbe854e56c", "not-a-ray"))],
  ["non-timestamp JSD parameter", inject(script.replace(time, Buffer.from("arbitrary data").toString("base64")))],
  ["changed original app HTML", Buffer.from(inject(script).toString().replace("Игра", "Подмена"))],
  ["changed original app script", Buffer.from(inject(script).toString().replace("app=true", "app=false"))],
  ["truncated JSD wrapper", inject(script.slice(0, -12))],
]) test(`Reject ${name}`, () => assert.throws(() => verifyCloudflareHTML(html, source, "/game/"), /Unexpected HTML transformation/));
