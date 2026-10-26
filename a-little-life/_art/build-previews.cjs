/* Static share/gallery artwork, composed from the animation's own renderer.
   Run with @napi-rs/canvas on Node's module path. Pass a directory containing
   Georgia.ttf and Georgia Italic.ttf as the first argument if needed. */
const fs=require('node:fs'),path=require('node:path');
const {createCanvas,Path2D,GlobalFonts}=require('@napi-rs/canvas');
global.Path2D=Path2D;
const fontDir=process.argv[2]||'/System/Library/Fonts/Supplemental';
for(const name of ['Georgia.ttf','Georgia Italic.ttf']){
  const file=path.join(fontDir,name);
  if(!fs.existsSync(file))throw new Error(`Missing ${file}; pass the Georgia font directory as the first argument.`);
  GlobalFonts.registerFromPath(file,'Georgia');
}
const app=require('../drawing.js');app.setCanvasFactory(createCanvas);
const root=path.resolve(__dirname,'..'),site=path.resolve(root,'..');
const wordmark=new Path2D(fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<path fill="currentColor" d="([^"]+)"/)[1]);
function cover(height){
  const canvas=createCanvas(1200,height),c=canvas.getContext('2d');
  app.paintPaper(c,1200,height,76);
  const scene=createCanvas(800,height);app.draw(scene.getContext('2d'),800,height,76);
  c.drawImage(scene,430,0);
  c.fillStyle='#454841';c.font='italic 84px Georgia';c.fillText('a little life',72,height*.40);
  c.fillStyle='#74766b';c.font='26px Georgia';
  c.fillText('The people who hold us.',77,height*.40+59);
  c.fillText('The care we pass on.',77,height*.40+96);
  c.font='16px Georgia';c.fillText('by',77,height-77);
  c.save();c.translate(103,height-93);c.scale(141/2867,141/2867);c.fillStyle='#454841';c.fill(wordmark);c.restore();
  return canvas;
}
fs.mkdirSync(path.join(root,'assets'),{recursive:true});
fs.writeFileSync(path.join(root,'assets/og.jpg'),cover(630).toBuffer('image/jpeg',90));
const thumbnail=createCanvas(720,405);
thumbnail.getContext('2d').drawImage(cover(675),0,0,720,405);
fs.writeFileSync(path.join(site,'assets/images/projects/a-little-life.webp'),thumbnail.toBuffer('image/webp',90));
console.log('Created 1200×630 social image and 720×405 gallery thumbnail.');
