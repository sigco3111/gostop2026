import {afterEach,expect,it,vi} from 'vitest';
afterEach(()=>vi.unstubAllGlobals());
it('keeps the current contact visible until it finishes before a board redraw',async()=>{
 vi.stubGlobal('Image',class{src='';});
 const{TableMotion}=await import('../src/ui/tableMotion');
 let done!:()=>void;const finished=new Promise<void>(resolve=>{done=resolve;});
 const remove=vi.fn(),node={getAnimations:()=>[{finished}],remove};
 const layer={querySelectorAll:()=>[node]} as unknown as HTMLElement;
 const motion=new TableMotion({} as HTMLElement,layer);
 let completed=false;const pending=motion.finishContacts().then(()=>{completed=true;});
 await Promise.resolve();expect(completed).toBe(false);expect(remove).not.toHaveBeenCalled();
 done();await pending;expect(completed).toBe(true);expect(remove).toHaveBeenCalledOnce();
});
it('does not add a timed delay when no contact remains',async()=>{
 vi.stubGlobal('Image',class{src='';});
 const{TableMotion}=await import('../src/ui/tableMotion');
 const timer=vi.spyOn(globalThis,'setTimeout');
 const motion=new TableMotion({} as HTMLElement,{querySelectorAll:()=>[]} as unknown as HTMLElement);
 await motion.finishContacts();expect(timer).not.toHaveBeenCalled();timer.mockRestore();
});
