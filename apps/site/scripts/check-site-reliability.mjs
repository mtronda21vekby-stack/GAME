/** Run with: node apps/site/scripts/check-site-reliability.mjs
 * Uses the existing TypeScript dev dependency; no network, services or secrets.
 * This focused suite is not a substitute for the full React/WebGL release gate.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = fileURLToPath(new URL('../src/', import.meta.url));
const loaded = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  assert.ok(file.startsWith(root), 'Only project source modules may be loaded');
  if (loaded.has(file)) return loaded.get(file);
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    fileName: file, reportDiagnostics: true,
  });
  assert.equal((compiled.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  const module = { exports: {} };
  loaded.set(file, module.exports);
  const localRequire = (specifier) => {
    assert.ok(specifier.startsWith('.'), `Unexpected external import: ${specifier}`);
    return load(path.relative(root, path.resolve(path.dirname(file), specifier + '.ts')));
  };
  new Function('require', 'module', 'exports', compiled.outputText)(localRequire, module, module.exports);
  return module.exports;
}
const { parseMusicVolume } = load('lib/musicPreferences.ts');
const { isPlainLinkActivation } = load('lib/linkActivation.ts');
const { routeLocation, resolveSiteLink } = load('lib/siteNavigation.ts');
const { isSitePath } = load('routes/routeMetadata.ts');
const base = 'https://blackcrown.work/store?category=all';
const plain = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };

for (const raw of [null, '', ' ', 'NaN', 'Infinity', '-0.1', '1.1', 'corrupt']) {
  test(`music: missing/invalid preference ${JSON.stringify(raw)} has audible default`, () => {
    assert.equal(parseMusicVolume(raw), 0.42);
  });
}
for (const [raw, expected] of [['0', 0], ['0.42', 0.42], ['1', 1]]) {
  test(`music: explicit valid volume ${raw} is preserved`, () => assert.equal(parseMusicVolume(raw), expected));
}
test('routing: a different order query changes the page key', () => {
  assert.notEqual(routeLocation(new URL('https://blackcrown.work/checkout/success?order=a')).key,
    routeLocation(new URL('https://blackcrown.work/checkout/success?order=b')).key);
});
test('routing: spatial hashes do not recreate the page/runtime', () => {
  assert.equal(routeLocation(new URL('https://blackcrown.work/#crown')).key,
    routeLocation(new URL('https://blackcrown.work/#identity')).key);
});
test('routing: trailing slash is normalized without dropping query', () => {
  assert.deepEqual(routeLocation(new URL('https://blackcrown.work/store/?category=skins')),
    {path: '/store', key: '/store?category=skins'});
});
test('routing: known page links are handled and preserve queries', () => {
  assert.equal(resolveSiteLink('/account?tab=inventory', base, isSitePath)?.pathname, '/account');
  assert.equal(resolveSiteLink('/account?tab=inventory', base, isSitePath)?.search, '?tab=inventory');
});
test('routing: a query plus fragment is not mistaken for a same-page anchor', () => {
  assert.ok(resolveSiteLink('/store?category=skins#items', base, isSitePath));
});
for (const href of ['#items', '/store?category=all#items', '/games/', '/games/quiet-valley/', '/game/', '/lobby/',
  '/api/health', '/manifest.webmanifest', '/art/hero-crown.avif', '/unknown', 'https://example.com/store',
  'mailto:help@example.com', 'tel:123', 'javascript:alert(1)', 'data:text/html,hello', 'https://[invalid']) {
  test(`routing: browser/external owner retains ${href}`, () => assert.equal(resolveSiteLink(href, base, isSitePath), null));
}
for (const options of [{target: '_blank'}, {target: 'another-window'}, {download: true}, {external: true}, {spatial: true}]) {
  test(`routing: preserves link opt-out ${JSON.stringify(options)}`, () => {
    assert.equal(resolveSiteLink('/account', base, isSitePath, options), null);
  });
}
test('routing: explicit self target remains SPA-compatible', () => {
  assert.ok(resolveSiteLink('/account', base, isSitePath, {target: '_self'}));
});
test('routing: plain primary activation is accepted', () => assert.equal(isPlainLinkActivation(plain), true));
for (const flag of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey', 'defaultPrevented']) {
  test(`routing: preserves ${flag} for native browser behavior`, () => {
    assert.equal(isPlainLinkActivation({...plain, [flag]: true}), false);
  });
}
for (const button of [1, 2]) {
  test(`routing: preserves mouse button ${button}`, () => assert.equal(isPlainLinkActivation({...plain, button}), false));
}
test('syntax: changed TSX components transpile without syntax errors', () => {
  for (const relative of ['routes/Router.tsx', 'components/SiteMusic.tsx',
    'experience-shell/dom/ExperienceMenu.tsx', 'experience-shell/dom/ExperienceChrome.tsx',
    'experience-shell/core/SpatialRouter.ts']) {
    const out = ts.transpileModule(readFileSync(path.join(root, relative), 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
      fileName: relative, reportDiagnostics: true,
    });
    assert.deepEqual((out.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error), [], relative);
  }
});
