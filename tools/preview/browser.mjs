// One Chromium for the store gates (live-gate.mjs and preview-acceptance.mjs), so both launch it
// the same way.
//
// Cloudflare sits in front of heartside.io and turns away a browser that announces itself as
// automated. The gates meet it with --disable-blink-features=AutomationControlled and a real
// browser user agent per view. When a challenge page still comes back, the gates report that page
// as inconclusive (exit 2): never a pass, and never the same as a broken page.
//
// The certificate list is a different thing. Inside a Claude sandbox, HTTPS goes through a proxy
// that re-signs every certificate with its own CA. Node trusts that CA through NODE_EXTRA_CA_CERTS;
// Chromium does not, so the gates tell Chromium to accept chains from exactly those CAs. The pins
// are read at launch from the bundle Node trusts (NODE_EXTRA_CA_CERTS, or /root/.ccr/ca-bundle.crt
// when present): every CA in it that Node does not ship with. A rotated proxy CA therefore cannot
// leave a stale pin behind (one of the four pins written here by hand on 27 Oct matched no
// certificate at all). Where there is no such bundle, a GitHub runner or a laptop, no flag is passed.
import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs';
import tls from 'node:tls';

// Krish's phone on 28 Oct: Edge on Android, 360 CSS px wide, with about 640 px left under
// Edge's own bars
export const EDGE = { width: 360, height: 640, mobile: true, ua: 'Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 EdgA/130.0.0.0' };
// the title of Cloudflare's challenge page
export const CHALLENGE = /verify you are human|just a moment/i;

const SANDBOX_BUNDLE = '/root/.ccr/ca-bundle.crt';
// the CA bundle Node was told to trust, if any
export function bundlePath(env = process.env) {
  for (const f of [env.NODE_EXTRA_CA_CERTS, SANDBOX_BUNDLE]) {
    try { if (f && fs.statSync(f).isFile()) return f; } catch { /* not there */ }
  }
  return '';
}
export const pemCerts = (text) => String(text).match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [];
// base64 SHA-256 of the certificate's public key, the form Chromium's SPKI list takes
export function spkiPin(pem) {
  const x = new crypto.X509Certificate(pem);
  return crypto.createHash('sha256').update(x.publicKey.export({ type: 'spki', format: 'der' })).digest('base64');
}
let rootPins;
// the CAs in the bundle that Node does not ship with: the proxy's, and any newer public root
export function interceptionPins(file = bundlePath()) {
  if (!file) return [];
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return []; }
  rootPins ||= new Set(tls.rootCertificates.flatMap((p) => { try { return [spkiPin(p)]; } catch { return []; } }));
  const pins = [];
  for (const pem of pemCerts(text)) {
    try {
      if (!new crypto.X509Certificate(pem).ca) continue;
      const pin = spkiPin(pem);
      if (!rootPins.has(pin) && !pins.includes(pin)) pins.push(pin);
    } catch { /* a block that is not a certificate */ }
  }
  return pins;
}
export function launchArgs(pins = interceptionPins()) {
  const args = ['--disable-blink-features=AutomationControlled', '--disable-background-networking'];
  if (pins.length) args.push('--ignore-certificate-errors-spki-list=' + pins.join(','));
  return args;
}
// the sandbox keeps its own Chromium build; elsewhere Playwright's own
export function launch() {
  return chromium.launch({
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
    args: launchArgs(),
  });
}
