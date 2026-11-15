const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../src/common/core'),{items}=require('../src/common/items');
function pageHarness(timers) {
  const fs = require('node:fs');
  const vm = require('node:vm');
  let raw = '';
  const fake = {
    get({success}) { success(raw); },
    set({value,success}) { raw = value; success(); }
  };
  let script = fs.readFileSync(require.resolve('../src/pages/index/index.ux'),'utf8').split('<script>')[1].split('</script>')[0];
  script = script.replace(/import systemStorage[^;]+;/,'const systemStorage=fake;')
    .replace(/import systemApp[^;]+;/,'const systemApp={terminate(){result.exited=true;}};')
    .replace(/import layout[^;]+;/,'const layout=realLayout;')
    .replace(/import core[^;]+;/,'const core=realCore;')
    .replace(/import catalog[^;]+;/,'const catalog={items:realItems};')
    .replace('export default','result.page=');
  const context = {fake,realCore:core,realItems:items,realLayout:require('../src/common/scroll-layout'),console,result:{},setTimeout,clearTimeout,Promise,Date,Math,Number};
  if (timers) Object.assign(context,timers);
  vm.runInNewContext(script,context);
  const page = context.result.page;
  Object.assign(page,page.private);
  const moves=[];page.$element=()=>({scrollTo(options){moves.push(options);},getScrollRect({success}){success({width:1000,height:1000});}});
  return {page,raw:() => raw,moves,context};
}
function disk(initial=''){let value=initial;return {get:async()=>value,set:async(k,v)=>{value=v;},raw:()=>value};}
test('toggle, cancel, restart keep immutable operations',async()=>{const d=disk(),a=core.create(d,items);await a.load();await a.toggle('codex');await a.toggle('codex');await a.toggle('bag');const b=core.create(d,items);await b.load();assert.equal(b.active().codex,false);assert.equal(b.active().bag,true);assert.equal(b.view().events.length,3);assert.equal(new Set(b.view().events.map(e=>e.id)).size,3);assert.equal(b.view().events[0].active,true);});
test('corrupt storage is preserved and read only',async()=>{const d=disk('{invalid'),a=core.create(d,items);await assert.rejects(a.load());await assert.rejects(a.toggle('codex'));assert.equal(d.raw(),'{invalid');});
test('unknown item refuses without writing',async()=>{const d=disk(),a=core.create(d,items);await a.load();await assert.rejects(a.toggle('unknown'));assert.equal(d.raw(),'');});
test('failed readback never commits UI state',async()=>{const d=disk(),a=core.create(d,items);await a.load();d.set=async()=>{};await assert.rejects(a.toggle('codex'));assert.equal(a.active().codex,undefined);assert.equal(a.writable(),false);});
test('write rejection blocks subsequent operations',async()=>{const d=disk(),a=core.create(d,items);await a.load();d.set=async()=>{throw Error('DISK');};await assert.rejects(a.toggle('bag'));assert.equal(a.writable(),false);assert.equal(a.view().events.length,0);});
test('concurrent writes reject second operation rather than overwrite',async()=>{const d=disk(),a=core.create(d,items);await a.load();const first=a.toggle('codex');await assert.rejects(a.toggle('bag'));await first;assert.equal(a.view().events.length,1);assert.equal(a.active().codex,true);});
test('capacity preserves all operations and blocks next',async()=>{const d=disk(),a=core.create(d,items);await a.load();for(let i=0;i<core.MAX;i++)await a.toggle('codex');const old=d.raw();await assert.rejects(a.toggle('bag'));assert.equal(d.raw(),old);assert.equal(a.view().events.length,100);});
test('view mutation cannot alter authoritative history',async()=>{const a=core.create(disk(),items);await a.load();await a.toggle('codex');a.view().events[0].active=false;assert.equal(a.active().codex,true);});
test('circles have distinct priority diameters and never overlap',()=>{assert(items.some(x=>x.size===78));assert(items.some(x=>x.size===44));for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)assert(Math.hypot(items[i].x-items[j].x,items[i].y-items[j].y)>=(items[i].size+items[j].size)/2+6.99);});
test('every item can be centered, all quadrants accessible',()=>{const c=core.camera(items);for(const item of items){c.move(-item.x,-item.y);assert.equal(c.snap().id,item.id);const p=c.view();assert(Math.abs(p.x+item.x)<1e-5);assert(Math.abs(p.y+item.y)<1e-5);}for(const x of [-9999,9999])for(const y of [-9999,9999]){c.move(x,y);assert(Number.isFinite(c.view().x));assert(items.includes(c.snap()));}});


function touch(x,y,ended=false,offsetX=0,offsetY=0) {
  const sample = {clientX:x,clientY:y,offsetX,offsetY};
  return ended ? {changedTouches:[sample]} : {touches:[sample]};
}
function position(circle) {
  return {
    x:+circle.style.match(/left:(-?\d+)px/)[1],
    y:+circle.style.match(/top:(-?\d+)px/)[1],
    diameter:+circle.style.match(/width:(\d+)px/)[1]
  };
}
const layout=require('../src/common/scroll-layout');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function clockHarness(){
  let now=1000,next=0;const jobs=new Map();
  class Clock extends Date {static now(){return now;}}
  const h=pageHarness({Date:Clock,setTimeout(fn){jobs.set(++next,fn);return next;},clearTimeout(id){jobs.delete(id);}});
  return {...h,jobs,tick(ms=220){now+=ms;const queue=[...jobs.values()];jobs.clear();queue.forEach(fn=>fn());}};
}
test('native viewport is centered at ready; all 32 IDs have fixed image nodes',async()=>{
  const {page,moves}=pageHarness();page.onInit();page.onReady();await flush();
  assert.equal(page.circles.length,32);assert.equal(new Set(page.circles.map(c=>c.id)).size,32);
  assert.equal(moves[0].left,332);assert.equal(moves[0].top,320);
  const c=position(page.circles[0]);assert(Math.abs(c.x+c.diameter/2-500)<=.5);
  const source=require('node:fs').readFileSync(require.resolve('../src/pages/index/index.ux'),'utf8');
  assert(source.includes('tid="id"'));assert(source.includes('scroll-x="true" scroll-y="true"'));
  assert(source.includes('onclick="tap($item.id)"'));page.onDestroy();
});
test('every item can snap to viewport center within the scrollable plane',()=>{
  for(const item of items){const c=layout.center(item),p=layout.nearest(items,c.x-168,c.y-180);assert.equal(p.item.id,item.id);assert(p.left>=0&&p.left<=664);assert(p.top>=0&&p.top<=640);}
});
test('120 scroll events leave all reactive objects unchanged; one idle snap',async()=>{
  const h=clockHarness(),{page}=h;page.onInit();page.onReady();await flush();
  const circles=page.circles,rows=page.rows,before=JSON.stringify(circles);
  circles.forEach(Object.freeze);Object.freeze(circles);
  page.begin(touch(100,100));
  for(let n=0;n<120;n++){page.drag(touch(110+n,120+n));page.scrolled({scrollX:332+n,scrollY:320+n});}
  assert.equal(page.circles,circles);assert.equal(page.rows,rows);assert.equal(JSON.stringify(circles),before);assert.equal(h.jobs.size,0);
  page.end(touch(230,260,true));assert.equal(h.jobs.size,1);h.tick();
  const target=layout.nearest(items,451,439);assert.equal(page.focused,target.item.name);assert.equal(h.moves.at(-1).left,target.left);
  page.tap('codex');assert.equal(h.raw(),'');page.onDestroy();assert.equal(h.jobs.size,0);
});
test('inertia delays snap and hiding cancels the pending callback',async()=>{
  const h=clockHarness(),{page}=h;page.onInit();page.onReady();await flush();
  page.scrolled({scrollX:400,scrollY:350});assert.equal(h.jobs.size,1);
  page.scrolled({scrollX:410,scrollY:355});assert.equal(h.jobs.size,1);
  page.onHide();assert.equal(h.jobs.size,0);const count=h.moves.length;h.tick();assert.equal(h.moves.length,count);page.onDestroy();
});
test('native ID click commits one item without replacing or moving nodes',async()=>{
  const {page,raw}=pageHarness();page.onInit();await flush();const circles=page.circles,styles=circles.map(c=>c.style);
  page.begin(touch(150,200));page.end(touch(150,200,true));assert.equal(raw(),'');page.tap('bag');await flush();
  assert.equal(JSON.parse(raw()).events[0].item,'bag');assert.equal(page.count,1);assert.equal(page.circles,circles);
  assert.deepEqual(circles.map(c=>c.style),styles);assert(circles.find(c=>c.id==='bag').src.endsWith('bag-on.png'));
  assert(circles.find(c=>c.id==='codex').src.endsWith('codex-off.png'));page.onDestroy();
});
test('system swipe-back is consumed, history closes, explicit exit remains',async()=>{
  const h=pageHarness(),{page}=h;page.onInit();await flush();assert.equal(page.onBackPress(),true);assert(!h.context.result.exited);
  page.tap('codex');assert.equal(h.raw(),'');
  page.toggleHistory();assert.equal(page.history,true);assert.equal(page.onBackPress(),true);assert.equal(page.history,false);
  page.exit();assert.equal(h.context.result.exited,true);page.onDestroy();
});
test('hidden events and touch cancellation cannot toggle reminders',async()=>{
  const {page,raw}=pageHarness();page.onInit();await flush();page.begin(touch(150,200));page.cancel();page.tap('codex');assert.equal(raw(),'');page.onHide();page.tap('bag');assert.equal(raw(),'');page.onDestroy();
});
