import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 800 } });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));
await page.goto('http://localhost:4173/gostop2026/', { waitUntil: 'networkidle0' });
await page.click('#m-scenario'); await new Promise(r => setTimeout(r, 400));
await page.click('.stage-card'); await new Promise(r => setTimeout(r, 400));
for (let i = 0; i < 4; i++) { await page.click('#dialogue-screen').catch(() => {}); await new Promise(r => setTimeout(r, 400)); if (await page.$('#game-screen')) break; }
let last = '';
for (let t = 0; t < 100; t++) {
  await new Promise(r => setTimeout(r, 900));
  const st = await page.evaluate(() => {
    const g = window.__game;
    if (!g) return 'nogame';
    return JSON.stringify({ turn: g.turn, over: g.over, deck: g.deck.length, h0: g.players[0].hand.length, h1: g.players[1].hand.length, ag: g.awaitingGoStop, ac: !!g.awaitingChoice, s0: g.scoreOf(0).total, s1: g.scoreOf(1).total, gso: !!document.querySelector('.gostop-overlay'), settle: !!document.querySelector('.settle-overlay') });
  });
  if (st !== last) { console.log(t, st); last = st; }
  if (st === 'nogame') continue;
  const o = JSON.parse(st);
  if (o.settle || o.over) { console.log('END'); break; }
  if (o.gso) { await page.click('.btn.stop').catch(() => {}); continue; }
  if (o.ac) { const tgt = await page.$('.floor-cell.target .hcard'); if (tgt) { await tgt.click(); continue; } }
  if (o.turn === 0 && !o.ag) { const h = await page.$('#hand .hcard'); if (h) await h.click(); }
}
await browser.close();
