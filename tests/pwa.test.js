#!/usr/bin/env node
/**
 * PWA test: the installable and offline pieces (manifest, icons, service worker,
 * head tags, registration and the theme-colour update).
 *
 * Static checks only, no browser. The manifest and worker are read as text, the
 * icons' pixel sizes come from the PNG header, and game.js is checked as source
 * text (it needs a DOM to run).
 *
 * Run with `node tests/pwa.test.js`.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) =>
  fs.readFileSync(path.join(root, file), 'utf8').split('\r\n').join('\n');
const exists = (file) => fs.existsSync(path.join(root, file));

const html = read(path.join('V01', 'index.html'));
const game = read(path.join('V01', 'game.js'));
const sw = read(path.join('V01', 'sw.js'));
const manifestText = read(path.join('V01', 'manifest.webmanifest'));

let failures = 0;
function check(name, condition) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures++;
    console.log(`  FAIL ${name}`);
  }
}

// PNG width and height are stored at bytes 16-23 of the IHDR chunk
function pngSize(file) {
  const buf = fs.readFileSync(path.join(root, file));
  const isPng = buf.slice(1, 4).toString('ascii') === 'PNG';
  return isPng ? { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) } : null;
}

function iconIsSize(file, width, height) {
  if (!exists(file)) return false;
  const size = pngSize(file);
  return size !== null && size.w === width && size.h === height;
}

// ---- manifest ----
console.log('manifest.webmanifest');
let manifest = null;
try {
  manifest = JSON.parse(manifestText);
} catch (error) {
  manifest = null;
}
check('manifest parses as JSON', manifest !== null);
const m = manifest || {};
for (const key of [
  'name',
  'short_name',
  'id',
  'start_url',
  'scope',
  'display',
  'theme_color',
  'background_color',
]) {
  check(`has ${key}`, typeof m[key] === 'string' && m[key].length > 0);
}
check('id is "./"', m.id === './');
check('start_url is "./"', m.start_url === './');
check('scope is "./"', m.scope === './');
check('display is standalone', m.display === 'standalone');
check('theme_color is #f5f5f5', m.theme_color === '#f5f5f5');
check('background_color is #f5f5f5', m.background_color === '#f5f5f5');
const icons = Array.isArray(m.icons) ? m.icons : [];
check('exactly one maskable icon', icons.filter((icon) => icon.purpose === 'maskable').length === 1);
check('a 192 icon with purpose any', icons.some((i) => i.sizes === '192x192' && i.purpose === 'any'));
check('a 512 icon with purpose any', icons.some((i) => i.sizes === '512x512' && i.purpose === 'any'));

// ---- icon files exist and have the declared pixel size ----
console.log('icons');
for (const icon of icons) {
  const [w, h] = icon.sizes.split('x').map(Number);
  check(`${icon.src} exists and is ${w}x${h}`, iconIsSize(path.join('V01', icon.src), w, h));
}
check(
  'apple-touch-icon.png exists and is 180x180',
  iconIsSize(path.join('V01', 'icons', 'apple-touch-icon.png'), 180, 180)
);

// ---- service worker ----
console.log('sw.js');
const cacheMatch = sw.match(/const CACHE_NAME = '([^']+)';/);
const gameVersionMatch = game.match(/const GAME_VERSION = '([^']+)';/);
check('CACHE_NAME is declared', cacheMatch !== null);
check('GAME_VERSION is declared in game.js', gameVersionMatch !== null);
check(
  "CACHE_NAME equals 'sumwords-v' + GAME_VERSION",
  cacheMatch !== null && gameVersionMatch !== null &&
    cacheMatch[1] === `sumwords-v${gameVersionMatch[1]}`
);
check('has an install handler', /addEventListener\('install'/.test(sw));
check('has an activate handler', /addEventListener\('activate'/.test(sw));
check('has a fetch handler', /addEventListener\('fetch'/.test(sw));
check('install pre-caches and skips waiting', /cache\.addAll[\s\S]*skipWaiting\(\)/.test(sw));
check(
  'activate deletes old sumwords caches and claims clients',
  /startsWith\('sumwords-'\)[\s\S]*clients\.claim\(\)/.test(sw)
);
check(
  'fetch is network first with a cache fallback',
  /fetch\(request\)[\s\S]*cache\.match\(request, \{ ignoreSearch: true \}\)/.test(sw)
);
check('only OK responses are cached', /response\.ok/.test(sw));
check(
  'fetch skips only-if-cached cross-mode requests (DevTools ERR_CACHE_MISS)',
  /request\.cache === 'only-if-cached' && request\.mode !== 'same-origin'/.test(sw)
);
check('no external URLs in the worker', !/https?:\/\//.test(sw));

// Every pre-cache entry must exist on disk; './' is the folder, served by index.html
const precacheBlock = sw.match(/PRECACHE_PATHS = \[([\s\S]*?)\];/);
const precachePaths = precacheBlock
  ? [...precacheBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1])
  : [];
check('pre-cache list is found', precachePaths.length > 0);
check('pre-cache list has no absolute paths', precachePaths.every((p) => !p.startsWith('/')));
for (const entry of precachePaths) {
  if (entry === './') continue;
  check(`pre-cache ${entry} exists`, exists(path.join('V01', entry)));
}

// ---- index.html wiring ----
console.log('index.html');
check(
  'links manifest.webmanifest',
  /<link rel="manifest" href="manifest\.webmanifest"/.test(html)
);
check(
  'links apple-touch-icon',
  /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png"/.test(html)
);
const themeMetas = html.match(/<meta name="theme-color"/g) || [];
check('exactly one theme-color meta', themeMetas.length === 1);
check(
  'theme-color meta defaults to #f5f5f5',
  /<meta name="theme-color" content="#f5f5f5"/.test(html)
);
check('no absolute paths in head links', !/(href|src)="\//.test(html));

// ---- game.js ----
console.log('game.js');
check(
  'registration is guarded by the serviceWorker feature check',
  /if \(!\('serviceWorker' in navigator\)\) return;/.test(game)
);
check(
  'registration is guarded to http and https only',
  /location\.protocol !== 'http:' && location\.protocol !== 'https:'\) return;/.test(game)
);
check('registration waits for the load event', /window\.addEventListener\('load'/.test(game));
check(
  "registers the relative worker path 'sw.js' with a swallowed failure",
  /navigator\.serviceWorker\.register\('sw\.js'\)\.catch\(\(\) => \{\}\)/.test(game)
);
check('registerServiceWorker() is called', /^registerServiceWorker\(\);$/m.test(game));
check(
  'applyTheme sets theme-color to #121212 for dark and #f5f5f5 for light',
  /setAttribute\('content', theme === 'dark' \? '#121212' : '#f5f5f5'\)/.test(game)
);
check(
  'applyTheme looks up the theme-color meta',
  /querySelector\('meta\[name="theme-color"\]'\)/.test(game)
);
check(
  'sumwords_landing_theme key is unchanged',
  /localStorage\.setItem\('sumwords_landing_theme', theme\)/.test(game)
);

console.log('');
if (failures === 0) {
  console.log('All PWA checks passed.');
} else {
  console.log(`${failures} PWA check(s) failed.`);
  process.exitCode = 1;
}
