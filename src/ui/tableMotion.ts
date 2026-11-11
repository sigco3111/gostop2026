import { Card } from '../engine/cards';
import { GameEvent } from '../engine/game';
import { cardEl, cardUrl } from './cards';
import { EFFECTS,effectDefinition,effectUrl } from './effectSettings';

type MotionEvent = Extract<GameEvent, {type:'played'|'flipped'|'placed'|'captured'|'stealPi'}>;
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
type Point={x:number;y:number};

// The engine settles synchronously. Keep the previous board visible until each
// public event has been shown, then GameScreen renders the authoritative state.
const atlases=new Map(EFFECTS.map(e=>{const image=new Image();image.src=effectUrl(e.file);return [e.id,image] as const;}));
export class TableMotion {
  private contacted=new Set<number>();
  constructor(private board:HTMLElement,private layer:HTMLElement){}
  private async landed(node:HTMLElement,duration:number){
    const animations=node.getAnimations();
    if(animations.length)await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
    else await wait(duration);
  }
  private hitAtLanding(card:Card,target:Point){
    const matches=[...this.board.querySelectorAll<HTMLElement>('.floor-cell [data-card-id]')].filter(el=>Number(el.dataset.cardId)!==card.id&&Math.floor(Number(el.dataset.cardId)/4)===card.month-1);
    if(!matches.length)return;
    const match=this.center(matches.reduce((a,b)=>Math.abs(this.center(a).x-target.x)<Math.abs(this.center(b).x-target.x)?a:b));
    this.contact({x:(target.x+match.x)/2,y:(target.y+match.y)/2});
    matches.forEach(el=>el.classList.add('motion-match'));
    this.contacted.add(card.id);
  }
  private center(el:Element|null):Point {const r=(el??this.board).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};}
  private capturePoint(player:number){
    const el=this.board.querySelector(player===0?'.my-captured':'.opp-captured');const r=el?.getBoundingClientRect();
    if(r&&r.width&&r.height)return this.center(el);
    const floor=this.board.querySelector('#floor')!.getBoundingClientRect();
    return {x:floor.right-32,y:player===0?floor.bottom-16:floor.top+16};
  }
  private find(card:Card){return this.board.querySelector<HTMLElement>(`.floor-cell [data-card-id="${card.id}"]`);}
  private spot(card:Card){
    const floor=this.board.querySelector('#floor');const r=(floor??this.board).getBoundingClientRect();
    const same=[...this.board.querySelectorAll<HTMLElement>('.floor-cell [data-card-id]')].find(el=>Math.floor(Number(el.dataset.cardId)/4)===card.month-1);
    const point=this.center(same??floor);
    return {x:Math.max(r.left+29,Math.min(r.right-29,point.x+(same?23:0))),y:Math.max(r.top+43,Math.min(r.bottom-43,point.y))};
  }
  private place(card:Card,point:Point){
    if(this.find(card))return;
    const cell=document.createElement('div');cell.className='floor-cell motion-landed';
    const floor=this.board.querySelector<HTMLElement>('#floor');if(!floor)return;
    const r=floor.getBoundingClientRect();cell.style.cssText=`position:absolute;display:block;width:56px;height:84px;min-height:0;left:${point.x-r.x-28}px;top:${point.y-r.y-42}px;z-index:3`;
    const face=cardEl(card);face.style.width='56px';face.style.height='84px';cell.appendChild(face);floor.appendChild(cell);
  }
  private ghost(card:Card,from:Point,to:Point,kind:string,offset=0){
    const node=document.createElement('div');node.className=`motion-card motion-${kind}`;node.dataset.cardId=String(card.id);
    node.style.left=`${from.x-28}px`;node.style.top=`${from.y-42}px`;
    node.style.setProperty('--dx',`${to.x-from.x+offset}px`);node.style.setProperty('--dy',`${to.y-from.y}px`);
    const front=document.createElement('img');front.src=cardUrl(card.id);front.alt='';front.className='motion-face';node.appendChild(front);
    if(kind==='flip'){const back=document.createElement('div');back.className='card-back motion-back';node.appendChild(back);}
    this.layer.appendChild(node);return node;
  }
  private contact(point:Point){
    const effect=effectDefinition(),atlas=atlases.get(effect.id)!;
    if(!atlas.complete||!atlas.naturalWidth)return null;
    const node=document.createElement('div');node.className='motion-contact';
    const size=Math.min(160,2*Math.min(point.x,innerWidth-point.x,point.y,innerHeight-point.y));
    node.style.left=`${point.x}px`;node.style.top=`${point.y}px`;
    node.style.width=`${size}px`;node.style.height=`${size}px`;
    node.dataset.effect=effect.id;
    node.style.backgroundImage=`url(${atlas.src})`;node.style.backgroundSize=`${effect.columns*100}% ${effect.rows*100}%`;
    this.layer.appendChild(node);
    const count=effect.frames-effect.firstFrame;
    const frames=Array.from({length:count},(_,index)=>{const i=index+effect.firstFrame;return {backgroundPosition:`${i%effect.columns*100/(effect.columns-1)}% ${Math.floor(i/effect.columns)*100/(effect.rows-1)}%`,offset:index/count,easing:'steps(1,end)'};});
    frames.push({...frames[count-1],offset:1});
    const animation=node.animate(frames,{duration:400,easing:'linear',fill:'forwards'});
    animation.finished.catch(()=>{}).finally(()=>node.remove());
    return node;
  }
  async show(e:MotionEvent){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    this.layer.dataset.phase=e.type;
    const garbage:HTMLElement[]=[];
    try{
      if(e.type==='played'||e.type==='flipped'){
        const target=this.spot(e.card);
        const source=e.type==='played'?this.board.querySelector(e.player===0?`#hand [data-card-id="${e.card.id}"]`:'.opp-hand .card-back'):this.board.querySelector('.deck-pile');
        const moving=this.ghost(e.card,this.center(source),target,e.type==='played'?'play':'flip');garbage.push(moving);
        if(e.type==='played'&&source instanceof HTMLElement)source.style.visibility='hidden';
        await this.landed(moving,e.type==='played'?190:280);this.hitAtLanding(e.card,target);this.place(e.card,target);
      }else if(e.type==='placed'){
        if(!this.find(e.card))this.place(e.card,this.spot(e.card));
      }else{
        const cards=e.type==='captured'?e.cards:[e.card];
        if(e.type==='captured'&&e.via==='bomb'){
          const landing=this.spot(cards[0]);
          const flights=cards.slice(0,3).map((card,i)=>{
            const source=e.player===0?this.board.querySelector<HTMLElement>(`#hand [data-card-id="${card.id}"]`):this.board.querySelectorAll<HTMLElement>('.opp-hand .card-back')[i];
            const moving=this.ghost(card,this.center(source),landing,'play',i*3);
            if(source)source.style.visibility='hidden';
            return moving;
          });
          garbage.push(...flights);await Promise.all(flights.map(node=>this.landed(node,190)));
          this.hitAtLanding(cards[0],landing);
          cards.slice(0,3).forEach((card,i)=>this.place(card,{x:landing.x+i*3,y:landing.y}));
          flights.forEach(node=>node.remove());
        }
        const target=this.capturePoint(e.type==='captured'?e.player:e.to);
        const sources=cards.map((card,i)=>{
          if(e.type==='stealPi')return null;
          return this.find(card)??(e.via==='bomb'?(e.player===0?this.board.querySelector<HTMLElement>(`#hand [data-card-id="${card.id}"]`):this.board.querySelectorAll<HTMLElement>('.opp-hand .card-back')[i]):null);
        });
        const origins=cards.map((card,i)=>e.type==='stealPi'?this.capturePoint(e.from):this.center(sources[i]??this.board.querySelector('#floor')));
        const point=this.center(cards.map(card=>this.find(card)).find(Boolean)??this.board.querySelector('#floor'));
        const impact=document.createElement('div');impact.className='motion-impact';impact.style.left=`${Math.max(80,Math.min(innerWidth-80,point.x))}px`;impact.style.top=`${Math.max(80,Math.min(innerHeight-80,point.y))}px`;impact.textContent=e.type==='stealPi'?'피 가져감':`${cards[0].month}월 · ${cards.length}장 획득`;this.layer.appendChild(impact);garbage.push(impact);
        sources.forEach(el=>el?.classList.add('motion-match'));
        if(e.type==='captured'){
          // Ordinary hits already fired at real landing, before later flip/capture events.
          // Non-moving fallback captures still need their own contact.
          if(!cards.some(card=>this.contacted.has(card.id)))this.contact(point);
          cards.forEach(card=>this.contacted.delete(card.id));
        }
        await wait(110);
        cards.forEach((card,i)=>{garbage.push(this.ghost(card,origins[i],target,'capture',i*3));const el=sources[i];if(el){const cell=el.closest('.floor-cell');if(cell){el.remove();if(!cell.children.length)cell.remove();}else el.style.visibility='hidden';}});
        await wait(300);
      }
    }finally{garbage.forEach(node=>node.remove());delete this.layer.dataset.phase;}
  }
}
