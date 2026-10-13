import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Cloudflare's existing zone-wide JavaScript Detections adds this deferred,
// same-origin bootstrap to HTML. Exact production shape captured from run
// 38333515595 on 2026-10-13; only its request ray and encoded timestamp vary.
// https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/
export const CLOUDFLARE_JSD_TEMPLATE = `<script>(function(){function c(){var b=a.contentDocument||(a.contentWindow&&a.contentWindow.document);if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'__RAY__',t:'__TIME__'};var a=document.createElement('script');a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();</script>`;
const sha256 = value => createHash("sha256").update(value).digest("hex");

export function verifyCloudflareHTML(actualBytes, sourceBytes, pathname) {
  const actual = Buffer.from(actualBytes);
  const source = Buffer.from(sourceBytes);
  const evidence = {
    path: pathname, sourceBytes: source.length, sourceSHA256: sha256(source),
    deliveredBytes: actual.length, deliveredSHA256: sha256(actual), transformation: "none",
  };
  if (actual.equals(source)) return evidence;
  const html = actual.toString("utf8");
  const scripts = [...html.matchAll(/<script>\(function\(\)\{[\s\S]*?<\/script>/g)]
    .filter(match => match[0].includes("window.__CF$cv$params"));
  let normalized = actual;
  if (scripts.length === 1) {
    const script = scripts[0][0];
    const params = script.match(/window\.__CF\$cv\$params=\{r:'([a-f0-9]{16})',t:'([A-Za-z0-9+/]{1,64}={0,2})'\}/);
    if (params) {
      const decodedTime = Buffer.from(params[2], "base64").toString("utf8");
      const canonicalTime = Buffer.from(decodedTime).toString("base64") === params[2];
      const shape = script.replace(params[0], "window.__CF$cv$params={r:'__RAY__',t:'__TIME__'}");
      const expectedPosition = html.lastIndexOf("</body>") - script.length;
      if (canonicalTime && /^\d{10,13}(?:\.\d{1,6})?$/.test(decodedTime) &&
          scripts[0].index === expectedPosition && shape === CLOUDFLARE_JSD_TEMPLATE) {
        normalized = Buffer.from(html.slice(0, scripts[0].index) + html.slice(scripts[0].index + script.length));
        evidence.transformation = "cloudflare-jsd-exact-template";
        evidence.injectedBytes = Buffer.byteLength(script);
      }
    }
  }
  if (!normalized.equals(source)) {
    // A bounded public-HTML diagnostic makes unknown transforms reviewable.
    let start = 0;
    while (start < source.length && start < actual.length && source[start] === actual[start]) start++;
    let suffix = 0;
    while (suffix < source.length - start && suffix < actual.length - start &&
      source[source.length - suffix - 1] === actual[actual.length - suffix - 1]) suffix++;
    assert.fail(`Unexpected HTML transformation: ${JSON.stringify({ ...evidence,
      addedHTML: actual.subarray(start, Math.min(actual.length - suffix, start + 1400)).toString("utf8"),
    })}`);
  }
  return evidence;
}
