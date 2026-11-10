import puppeteer from 'puppeteer-core';

const shots = process.argv[2] || '/tmp/shots';
import { mkdirSync } from 'fs';
mkdirSync(shots, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1280,800', '--force-device-scale-factor=1'],
  defaultViewport: { width: 1280, height: 800 },
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text()); });
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));

await page.goto('http://localhost:4173/gostop2026/', { waitUntil: 'networkidle0' });
await page.screenshot({ path: `${shots}/01-title.png` });

// 시나리오
await page.click('#m-scenario');
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: `${shots}/02-scenario.png` });

// 스테이지 1
await page.click('.stage-card');
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: `${shots}/03-dialogue.png` });
await page.click('#dialogue-screen');
await new Promise(r => setTimeout(r, 300));
await page.click('#dialogue-screen').catch(() => {});
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: `${shots}/04-match-start.png` });

// 몇 턴 플레이: 내 차례가 오면 첫 카드 클릭
for (let turn = 0; turn < 14; turn++) {
  await new Promise(r => setTimeout(r, 1600));
  // 고/스톱 오버레이?
  const gs = await page.$('.gostop-overlay');
  if (gs) {
    await page.screenshot({ path: `${shots}/05-gostop.png` });
    await page.click('.btn.stop').catch(() => {});
    await new Promise(r => setTimeout(r, 1500));
    break;
  }
  // 바닥 선택 필요?
  const target = await page.$('.floor-cell.target .hcard');
  if (target) { await target.click(); continue; }
  // 내 손패 클릭 가능?
  const hand = await page.$('#hand .hcard');
  if (hand) {
    const turnMine = await page.evaluate(() => !!document.querySelector('#hand .hcard'));
    if (turnMine) { await hand.click(); }
  }
  const settle = await page.$('.settle-overlay');
  if (settle) break;
}
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: `${shots}/06-mid-game.png` });

// 게임 끝까지: 남은 턴 자동 진행
for (let turn = 0; turn < 30; turn++) {
  const settle = await page.$('.settle-overlay');
  if (settle) break;
  const gs = await page.$('.gostop-overlay');
  if (gs) { await page.click('.btn.go').catch(() => {}); await new Promise(r => setTimeout(r, 1200)); continue; }
  const target = await page.$('.floor-cell.target .hcard');
  if (target) { await target.click(); await new Promise(r => setTimeout(r, 1200)); continue; }
  const hand = await page.$('#hand .hcard');
  if (hand) { await hand.click(); }
  await new Promise(r => setTimeout(r, 1500));
}
await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: `${shots}/07-end.png` });
const hasSettle = await page.$('.settle-overlay');
console.log('SETTLE VISIBLE:', !!hasSettle);
await browser.close();
