// Visual-only touch magnifier and phone layout. Real gestures are covered by
// controller tests and by dragging the shoes in the ordinary desktop fixture.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),out=new URL('../../_site/puddle-walker/',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
let controller=read('game.js').replace('let game = createGame(),',"let game = createGame('leather',321),");
controller=controller.replace('const $ =',"const qaStorage=new Map(),localStorage={getItem:k=>qaStorage.get(k),setItem:(k,v)=>qaStorage.set(k,v)};\nconst $ =");
controller+=`
const qaButton=document.createElement('button');qaButton.textContent='Preview touch aim';qaButton.style.cssText='position:fixed;top:180px;left:16px;z-index:20;padding:10px;background:#f4f0e4;color:#26382c';document.body.append(qaButton);
$('start').addEventListener('click',()=>{qaButton.hidden=true;});
qaButton.onclick=()=>{qaButton.hidden=true;reset(true);start();inputMode='pointer';planStep(game,{x:440,y:425});game.precisionAim=true;needsPaint=true;hud();};
`;
writeFileSync(new URL('_qa-input.html',out),read('index.html').replace(/src="\.\/game\.js\?[^\"]+"/,'src="./_qa-input.js?v=40"'));
writeFileSync(new URL('_qa-input.js',out),controller);
writeFileSync(new URL('_qa-input-mobile.html',out),`<!doctype html><html><head><meta charset="utf-8"><title>Touch aiming · 390 px</title><style>html,body{margin:0;background:#15221a}iframe{display:block;width:390px;height:844px;border:0;margin:auto}</style></head><body><iframe src="./_qa-input.html" title="390 px game preview"></iframe></body></html>`);
