import puppeteer from 'puppeteer-core';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const url=process.env.GAME_URL??'http://localhost:4173/gostop2026/',out=process.env.QA_OUT??'/tmp/contact-timing';mkdirSync(out,{recursive:true});
const server=url.startsWith('http://localhost')?spawn('node',['node_modules/vite/bin/vite.js','preview','--port','4173'],{stdio:'ignore'}):null;
let b;const report={url,productionTimers:true,errors:[],effects:[]};
try{
 await new Promise(r=>setTimeout(r,700));b=await puppeteer.launch({executablePath:process.env.CHROME_PATH??'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const effect of process.env.EFFECT?[process.env.EFFECT]:['a','b','c']){
  const p=await b.newPage();await p.setViewport({width:390,height:844});p.on('pageerror',e=>report.errors.push(e.message));
  await p.evaluateOnNewDocument(({effect,seed})=>{let n=seed;Math.random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};localStorage.setItem('gostop2026-impact',effect);},{effect,seed:process.env.BOMB==='1'?49:23});
  await p.goto(url,{waitUntil:'networkidle0'});await p.click('#m-free');await p.click('.stage-card');await p.waitForSelector('#hand [role=button]');await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  await p.evaluate(()=>{
   window.__trace=[];const t=performance.now(),record=(kind,data={})=>window.__trace.push({kind,ms:performance.now()-t,...data});
   const watch=new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes){if(!(n instanceof HTMLElement))continue;
    if(n.matches('.motion-play,.motion-flip')){record('depart',{id:n.dataset.cardId,mode:n.className});Promise.all(n.getAnimations().map(a=>a.finished.catch(()=>{}))).then(()=>record('land',{id:n.dataset.cardId,mode:n.className}));}
    if(n.matches('.motion-contact')){const a=n.getAnimations()[0],f=a?.effect.getKeyframes()[0];record('hit',{effect:n.dataset.effect,x:parseFloat(n.style.left),y:parseFloat(n.style.top),targets:[...document.querySelectorAll('.motion-match')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};}),first:f?.backgroundPosition,phase:document.querySelector('.fx-layer').dataset.phase});}
    if(n.matches('.motion-capture'))record('capture',{id:n.dataset.cardId});
   }});watch.observe(document.querySelector('.fx-layer'),{childList:true});
  });
  const session=await p.createCDPSession(),frames=[];session.on('Page.screencastFrame',event=>{frames.push({data:event.data,ts:event.metadata.timestamp});session.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});});await session.send('Page.startScreencast',{format:'jpeg',quality:80,everyNthFrame:1});
  const id=process.env.BOMB==='1'?'bomb':await p.evaluate(()=>{const g=window.__game;return g.players[0].hand.find(c=>g.floor.filter(f=>f.month===c.month).length===1).id;});await p.click(id==='bomb'?'#actionbar .danger':`#hand [data-card-id="${id}"]`);
  await p.waitForFunction(()=>!document.querySelector('#game-screen').inert&&window.__game.turn===0&&!document.querySelector('.motion-card,.motion-contact'),{timeout:15000});await new Promise(r=>setTimeout(r,150));await session.send('Page.stopScreencast');mkdirSync(`${out}/${effect}`,{recursive:true});frames.forEach((f,i)=>writeFileSync(`${out}/${effect}/${i}.jpg`,Buffer.from(f.data,'base64')));writeFileSync(`${out}/${effect}/frames.txt`,frames.map((f,i)=>`file '${i}.jpg'\nduration ${Math.max(.016,(frames[i+1]?.ts??f.ts+.1)-f.ts)}`).join('\n'));await session.detach();
  const trace=await p.evaluate(()=>window.__trace),hit=trace.find(e=>e.kind==='hit'),land=trace.find(e=>e.kind==='land'),capture=trace.find(e=>e.kind==='capture');
  if(!hit||!land)throw Error(`missing landing/hit ${effect}`);const lag=hit.ms-land.ms;
  if(process.env.ALLOW_OLD!=='1'&&(lag< -5||lag>35||(id!=='bomb'&&hit.ms>=trace.find(e=>e.kind==='depart'&&e.mode.includes('flip')).ms+10)))throw Error(`late impact ${effect} ${lag}`);
  if(process.env.ALLOW_OLD!=='1'){const hits=trace.filter(e=>e.kind==='hit');if(id!=='bomb'&&hits.length!==2)throw Error('duplicate/absent contacts');for(const h of hits)if(h.phase==='captured'&&id!=='bomb')throw Error('delayed recapture effect');if(effect==='a'&&hit.first==='0% 0%'||effect==='b'&&hit.first==='0% 0%')throw Error('transparent startup');}
  const state=await p.evaluate(()=>{const g=window.__game,all=[...g.deck,...g.floor,...g.players.flatMap(p=>[...p.hand,...p.captured])];return {count:all.length,unique:new Set(all.map(c=>c.id)).size,ghosts:document.querySelectorAll('.motion-card,.motion-contact').length};});if(state.count!==48||state.unique!==48||state.ghosts)throw Error('card/cleanup invariant');
  report.effects.push({effect,id,landingToImpactMs:lag,impactBeforeCaptureMs:capture?.ms-hit.ms,trace,state});console.log(effect,JSON.stringify(report.effects.at(-1)));await p.close();
 }
 if(report.errors.length)throw Error(report.errors.join(';'));
}finally{writeFileSync(`${out}/report-${process.env.EFFECT??'all'}.json`,JSON.stringify(report,null,2));await b?.close();server?.kill();}
