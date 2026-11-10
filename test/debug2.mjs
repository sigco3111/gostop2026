import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 800 } });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGE ERR:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CERR:', m.text()); });
await page.goto('http://localhost:4173/gostop2026/', { waitUntil: 'networkidle0' });
const scr = async () => page.evaluate(() => document.querySelector('.screen')?.id + '|' + (window.__game ? 'G' : '-') + '|' + (window.__game ? JSON.stringify({ t: window.__game.turn, ov: window.__game.over, dk: window.__game.deck.length, h0: window.__game.players[0].hand.length, h1: window.__game.players[1].hand.length, ag: window.__game.awaitingGoStop }) : ''));
console.log('start:', await scr());
await page.click('#m-scenario'); await new Promise(r => setTimeout(r, 400));
console.log('after scenario:', await scr());
await page.click('.stage-card'); await new Promise(r => setTimeout(r, 400));
console.log('after stage:', await scr());
for (let i = 0; i < 5; i++) { await page.click('#dialogue-screen').catch(() => {}); await new Promise(r => setTimeout(r, 500)); console.log('dlg', i, await scr()); if (await page.$('#game-screen')) break; }
for (let t = 0; t < 60; t++) {
  await new Promise(r => setTimeout(r, 1000));
  const s = await scr();
  console.log(t, s);
  if (s.includes('ov":true')) break;
  if (await page.$('.settle-overlay')) { console.log('SETTLED'); break; }
  if (await page.$('.gostop-overlay')) { await page.click('.btn.stop').catch(() => {}); continue; }
  if (await page.$('.floor-cell.target .hcard')) { await page.click('.floor-cell.target .hcard').catch(()=>{}); continue; }
  if (s.includes('|G|') && s.includes('"t":0') && s.includes('"ag":false')) { const h = await page.$('#hand .hcard'); if (h) await h.click().catch(()=>{}); }
}
await page.screenshot({ path: '/tmp/shots2/dbg-final.png' });
await browser.close();
