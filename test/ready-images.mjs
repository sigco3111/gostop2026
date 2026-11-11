/** Do not approve a screenshot with a card that has not decoded or failed to load. */
export async function readyImages(page){
 const failed=await page.evaluate(async()=>{
  await document.fonts.ready;
  const images=[...document.images];
  images.forEach(img=>{img.loading='eager';});
  return (await Promise.all(images.map(async img=>{try{await img.decode();return img.naturalWidth>0?null:img.currentSrc||img.src;}catch{return img.currentSrc||img.src;}}))).filter(Boolean);
 });
 if(failed.length)throw Error('Image validation failed: '+failed.join(', '));
}
