import {it,expect,vi,afterEach} from 'vitest';
import {selectedDeck,deckCardUrl,DECKS} from '../src/ui/deckSettings';
afterEach(()=>vi.unstubAllGlobals());
it('retains original default and rejects invalid stored deck',()=>{for(const s of [null,'unknown','../../x']){vi.stubGlobal('localStorage',{getItem:()=>s});expect(selectedDeck()).toBe('original');}});
it('all four design IDs resolve the same card IDs without changing rules',()=>{for(const d of DECKS){vi.stubGlobal('localStorage',{getItem:()=>d.id});expect(selectedDeck()).toBe(d.id);for(let id=0;id<48;id++)expect(deckCardUrl(id)).toContain(`card-${String(id).padStart(2,'0')}.webp`);}});
it('blocked storage falls back safely',()=>{vi.stubGlobal('localStorage',{getItem:()=>{throw Error('blocked')}});expect(selectedDeck()).toBe('original');});
