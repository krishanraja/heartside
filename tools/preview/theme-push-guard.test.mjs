// The workflows that guard the store, read as text (there is no YAML parser in tools/preview).
// The guarded theme push checks the product addresses before it writes anything and reads the
// store back after, and keeps the theme id and the store's address out of this public
// repository's logs, summary and artifact names (NOW.md never_publish). The hourly storefront
// guard runs the same check, opens one issue at most, and never spams. The offline workflow runs
// the rendered pages and the gift chat with their layout checks.
//
//   node --test tools/preview/theme-push-guard.test.mjs
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (f) => fs.readFileSync(new URL(`../../.github/workflows/${f}`, import.meta.url), 'utf8');
// one step's text: from its "- name:" line to the next step at the same indent
function step(yml, name) {
  const lines = yml.split('\n');
  const i = lines.findIndex((l) => l.trim() === `- name: ${name}`);
  if (i < 0) return null;
  const indent = lines[i].indexOf('-');
  let j = i + 1;
  while (j < lines.length && !(lines[j].indexOf('- ') === indent && /^\s*- /.test(lines[j]))) j++;
  return {at: i, text: lines.slice(i, j).join('\n')};
}

test('theme push: the product addresses are checked after the live-theme refusal and before the backup and push', () => {
  const yml = read('shopify-theme-push.yml');
  const refuse = step(yml, 'Refuse the live theme'), check = step(yml, 'Check the product addresses before pushing'), backup = step(yml, "Back up the theme's templates and section groups"), push = step(yml, 'Push Heartside files into the copy');
  assert.ok(refuse && check && backup && push, 'all four steps exist');
  assert.ok(refuse.at < check.at && check.at < backup.at && backup.at < push.at, 'in that order');
  assert.match(check.text, /node tools\/preview\/handle-check\.mjs/);
  assert.doesNotMatch(check.text, /--theme/, 'before the push it reads the store as shoppers see it');
  // exit 1 stops with an error before anything is written; exit 2 only warns
  assert.match(check.text, /"\$code" = "2"[\s\S]*::warning::/);
  assert.match(check.text, /"\$code" != "0"[\s\S]*::error::A product address is broken \(see above\)\. Nothing was pushed\.[\s\S]*exit 1/);
  assert.match(check.text, /set \+e[\s\S]*code=\$\?/, 'the exit code is read, not left to stop the shell');
});

test('theme push: the store is read back after the push, with the pushed theme', () => {
  const yml = read('shopify-theme-push.yml');
  const push = step(yml, 'Push Heartside files into the copy'), back = step(yml, 'Read the store back'), summary = step(yml, 'Summary');
  assert.ok(back, 'the readback step exists');
  assert.ok(push.at < back.at && back.at < summary.at);
  assert.match(back.text, /node tools\/preview\/handle-check\.mjs --theme "\$THEME_ID"/);
  assert.match(back.text, /if: \$\{\{ success\(\) && !inputs\.pull_only \}\}/);
  assert.match(back.text, /::error::/); assert.match(back.text, /::warning::/);
});

test('theme push: no theme id or store address in its echo lines, summary or artifact name', () => {
  const yml = read('shopify-theme-push.yml');
  const echoes = yml.split('\n').filter((l) => /\becho\b/.test(l) && !/::add-mask::/.test(l));
  for (const l of echoes) {
    assert.doesNotMatch(l, /\$THEME_ID|inputs\.theme_id/, l.trim());
    assert.doesNotMatch(l, /myshopify\.com|SHOPIFY_FLAG_STORE/, l.trim());
  }
  assert.doesNotMatch(yml, /preview_theme_id=\$THEME_ID/);
  assert.doesNotMatch(yml, /echo "Target theme: \$THEME_ID/);
  assert.doesNotMatch(yml, /theme-backup-\$\{\{ inputs\.theme_id/);
  assert.match(yml, /name: theme-backup-run-\$\{\{ github\.run_number \}\}/);
  const summary = step(yml, 'Summary').text;
  assert.match(summary, /Open the copy from Shopify admin > Themes/);
  assert.doesNotMatch(summary, /https?:\/\/|\$THEME_ID/);
  // the CLI's own report prints a preview address: both values are masked from the first step on
  const inputs = step(yml, 'Check inputs');
  assert.match(inputs.text, /::add-mask::\$THEME_ID/);
  assert.match(inputs.text, /::add-mask::\$SHOPIFY_FLAG_STORE/);
});

test('storefront guard: hourly at a jittered minute, read-only contents, one issue at most', () => {
  const yml = read('storefront-guard.yml');
  assert.match(yml, /schedule:\n\s+- cron: "17 \* \* \* \*"/);
  assert.match(yml, /workflow_dispatch:/);
  assert.match(yml, /permissions:\n\s+contents: read\n\s+issues: write/);
  assert.match(yml, /node-version: "20"/);
  assert.match(yml, /node tools\/preview\/handle-check\.mjs/);
  assert.doesNotMatch(yml.split('\n  acceptance:\n')[0], /npm (ci|install)/, 'the hourly check needs no install');
  assert.match(yml, /if: github.event_name == 'workflow_dispatch' && inputs.acceptance/);
  assert.match(yml, /acceptance:[\s\S]*permissions:\n\s+contents: read/);
  assert.match(yml, /Require all three gates/);
  assert.doesNotMatch(yml, /secrets\./, 'it needs no secret');
  const tell = step(yml, 'Tell Krish').text;
  assert.match(tell, /if: steps\.check\.outputs\.code == '1'/, 'an issue only when something is broken');
  assert.ok(tell.indexOf('gh issue list') > -1 && tell.indexOf('gh issue list') < tell.indexOf('gh issue create'), 'looks for the open issue first');
  assert.match(tell, /--label storefront-guard --state open/);
  assert.match(tell, /gh issue comment/);
  assert.match(tell, /Findings key: \$key/, 'the same findings are never posted twice');
  assert.match(tell, /grep '\^FAIL' check\.txt/, 'paths only, from the check output');
  // inconclusive writes the summary only
  assert.doesNotMatch(yml, /code == '2'[\s\S]*gh issue/);
  const fail = step(yml, 'Fail the run when the check itself failed').text;
  assert.match(fail, /code != '1'/, 'a broken store is the issue, not an hourly red run');
});

test('offline tests: the rendered pages and the gift chat run, and the chat fails the job on a FAIL', () => {
  const yml = read('offline-tests.yml');
  assert.match(yml, /run: node tools\/preview\/render\.mjs && node tools\/preview\/chat\.mjs/);
  const chat = fs.readFileSync(new URL('chat.mjs', import.meta.url), 'utf8');
  assert.match(chat, /process\.exit\(failures \? 1 : 0\)/);
});
