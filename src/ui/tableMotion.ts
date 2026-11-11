import { Card } from '../engine/cards';
import { GameEvent } from '../engine/game';
import { cardEl, cardUrl } from './cards';

type MotionEvent = Extract<GameEvent, {type:'played'|'flipped'|'placed'|'captured'|'stealPi'}>;
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
type Point={x:number;y:number};

// The engine settles synchronously. Keep the previous board visible until each
// public event has been shown, then GameScreen renders the authoritative state.
export class TableMotion {
  constructor(private board:HTMLElement,private layer:HTMLElement){}
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
    const r=floor.getBoundingClientRect();cell.style.cssText=`position:absolute;left:${point.x-r.x-28}px;top:${point.y-r.y-42}px;z-index:3`;
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
    const node=document.createElement('div');node.className='motion-contact';
    node.style.left=`${Math.max(76,Math.min(innerWidth-76,point.x))}px`;
    node.style.top=`${Math.max(80,Math.min(innerHeight-80,point.y))}px`;
    for(let i=0;i<8;i++){const line=document.createElement('i');line.style.setProperty('--angle',`${i*45}deg`);node.appendChild(line);}
    this.layer.appendChild(node);return node;
  }
  async show(e:MotionEvent){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    this.layer.dataset.phase=e.type;
    const garbage:HTMLElement[]=[];
    try{
      if(e.type==='played'||e.type==='flipped'){
        const target=this.spot(e.card);
        const source=e.type==='played'?this.board.querySelector(e.player===0?`#hand [data-card-id="${e.card.id}"]`:'.opp-hand .card-back'):this.board.querySelector('.deck-pile');
        garbage.push(this.ghost(e.card,this.center(source),target,e.type==='played'?'play':'flip'));
        if(e.type==='played'&&source instanceof HTMLElement)source.style.visibility='hidden';
        await wait(e.type==='played'?190:280);this.place(e.card,target);
      }else if(e.type==='placed'){
        if(!this.find(e.card))this.place(e.card,this.spot(e.card));
      }else{
        const cards=e.type==='captured'?e.cards:[e.card];
        const target=this.capturePoint(e.type==='captured'?e.player:e.to);
        const sources=cards.map((card,i)=>{
          if(e.type==='stealPi')return null;
          return this.find(card)??(e.via==='bomb'?(e.player===0?this.board.querySelector<HTMLElement>(`#hand [data-card-id="${card.id}"]`):this.board.querySelectorAll<HTMLElement>('.opp-hand .card-back')[i]):null);
        });
        const origins=cards.map((card,i)=>e.type==='stealPi'?this.capturePoint(e.from):this.center(sources[i]??this.board.querySelector('#floor')));
        const point=this.center(cards.map(card=>this.find(card)).find(Boolean)??this.board.querySelector('#floor'));
        const impact=document.createElement('div');impact.className='motion-impact';impact.style.left=`${Math.max(80,Math.min(innerWidth-80,point.x))}px`;impact.style.top=`${Math.max(80,Math.min(innerHeight-80,point.y))}px`;impact.textContent=e.type==='stealPi'?'피 가져감':`${cards[0].month}월 · ${cards.length}장 획득`;this.layer.appendChild(impact);garbage.push(impact);
        sources.forEach(el=>el?.classList.add('motion-match'));
        if(e.type==='captured')garbage.push(this.contact(point));
        await wait(110);
        cards.forEach((card,i)=>{garbage.push(this.ghost(card,origins[i],target,'capture',i*3));const el=sources[i];if(el){const cell=el.closest('.floor-cell');if(cell){el.remove();if(!cell.children.length)cell.remove();}else el.style.visibility='hidden';}});
        await wait(300);
      }
    }finally{garbage.forEach(node=>node.remove());delete this.layer.dataset.phase;}
  }
}
