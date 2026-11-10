import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
const shots = '/tmp/shots2';
mkdirSync(shots, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1280, height: 800 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));
await page.goto('http://localhost:4173/gostop2026/', { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${shots}/01-title.png` });
await page.click('#m-scenario');
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: `${shots}/02-scenario.png` });
await page.click('.stage-card');
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: `${shots}/03-dialogue.png` });
for (let i = 0; i < 4; i++) {
  await page.click('#dialogue-screen').catch(() => {});
  await new Promise(r => setTimeout(r, 500));
  if (await page.$('#game-screen')) break;
}
await new Promise(r => setTimeout(r, 800));

let settled = false, turns = 0;
while (!settled && turns++ < 80) {
  await new Promise(r => setTimeout(r, 1100));
  if (await page.$('.settle-overlay')) { settled = true; break; }
  if (await page.$('.gostop-overlay')) {
    await page.screenshot({ path: `${shots}/04-gostop.png` });
    await page.click('.btn.stop').catch(() => {});
    continue;
  }
  const target = await page.$('.floor-cell.target .hcard');
  if (target) { await target.click(); continue; }
  const hand = await page.$('#hand .hcard');
  if (hand) await hand.click();
}
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: `${shots}/05-settle.png` });
console.log('SETTLED:', settled, 'turns:', turns);
if (settled) {
  await page.click('#settle-ok');
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: `${shots}/06-after.png` });
  // 시나리오 맵으로 돌아가기
  for (let i = 0; i < 3; i++) {
    await page.click('#dialogue-screen').catch(() => {});
    await new Promise(r => setTimeout(r, 500));
    if (await page.$('#scenario-screen')) break;
  }
  await page.screenshot({ path: `${shots}/07-map.png` });
}
await browser.close();
