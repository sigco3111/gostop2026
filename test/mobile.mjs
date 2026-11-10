import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
mkdirSync('/tmp/mshots', { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true } });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));
await page.goto('http://localhost:4173/gostop2026/', { waitUntil: 'networkidle0' });
await page.screenshot({ path: '/tmp/mshots/m1-title.png' });
await page.tap('#m-scenario'); await new Promise(r => setTimeout(r, 500));
// 스크롤 끝까지 내려 11,12 확인
await page.evaluate(() => document.querySelector('#scenario-screen').scrollTo(0, 99999));
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: '/tmp/mshots/m2-map-bottom.png' });
await page.evaluate(() => document.querySelector('#scenario-screen').scrollTo(0, 0));
await new Promise(r => setTimeout(r, 300));
await page.tap('.stage-card'); await new Promise(r => setTimeout(r, 400));
for (let i = 0; i < 4; i++) { await page.tap('#dialogue-screen').catch(() => {}); await new Promise(r => setTimeout(r, 400)); if (await page.$('#game-screen')) break; }
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: '/tmp/mshots/m3-board.png' });
// 3턴 진행 후 보드
for (let t = 0; t < 8; t++) {
  await new Promise(r => setTimeout(r, 1200));
  if (await page.$('.gostop-overlay')) { await page.tap('.btn.stop').catch(()=>{}); continue; }
  if (await page.$('.floor-cell.target .hcard')) { await page.tap('.floor-cell.target .hcard').catch(()=>{}); continue; }
  const h = await page.$('#hand .hcard'); if (h) await h.tap().catch(()=>{});
}
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: '/tmp/mshots/m4-board-mid.png' });
await browser.close();
