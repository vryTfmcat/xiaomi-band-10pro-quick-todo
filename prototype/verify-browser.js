(() => {
 const root=document.getElementById('band-quick-todo');
 const button=id=>root.querySelector('[data-item="'+id+'"]');
 const assert=(ok,message)=>{if(!ok)throw Error(message);};
 const key='codex-band-quick-todo-prototype-v1';
 try {
  if(location.hash!=='#restore'){
   assert(root.querySelector('.qt-count').textContent==='0','initial count');
   button('codex').click();button('bag').click();button('codex').click();
   const saved=JSON.parse(localStorage.getItem(key));
   assert(saved.events.length===3,'append history');
   assert(saved.events[0].active&&!saved.events[2].active,'cancel retains original');
   assert(new Set(saved.events.map(e=>e.id)).size===3,'unique IDs');
   assert(root.querySelector('.qt-count').textContent==='1','active count');
   location.hash='restore';location.reload();return;
  }
  assert(root.querySelector('.qt-count').textContent==='1','reload count');
  assert(button('bag').getAttribute('aria-pressed')==='true','reload bag');
  assert(button('codex').getAttribute('aria-pressed')==='false','reload cancellation');
  const grid=root.querySelector('.qt-grid'),viewport=root.querySelector('.qt-viewport');
  assert(root.querySelectorAll('[data-item]').length===32,'32 honeycomb items');
  assert(parseFloat(button('codex').dataset.diameter)>parseFloat(button('keys').dataset.diameter),'importance sizes differ');
  assert(getComputedStyle(button('codex').querySelector('.qt-orb')).filter==='grayscale(1)','inactive monochrome');
  assert(getComputedStyle(button('bag').querySelector('.qt-orb')).filter==='none','active color');
  const circles=[...root.querySelectorAll('[data-item]')];
  for(let i=0;i<circles.length;i++)for(let j=i+1;j<circles.length;j++){
   const a=circles[i].dataset,b=circles[j].dataset;
   assert(Math.hypot(+a.x-b.x,+a.y-b.y)>=(+a.diameter + +b.diameter)/2+6.9,'circles do not overlap');
  }
  const count=JSON.parse(localStorage.getItem(key)).events.length;
  const initial=grid.style.transform;
  viewport.dispatchEvent(new WheelEvent('wheel',{deltaY:70,bubbles:true,cancelable:true}));
  assert(grid.style.transform!==initial,'wheel pans grid');
  const beforeDrag=grid.style.transform;
  button('bag').dispatchEvent(new PointerEvent('pointerdown',{pointerId:9,isPrimary:true,button:0,clientX:120,clientY:170,bubbles:true}));
  viewport.dispatchEvent(new PointerEvent('pointermove',{pointerId:9,isPrimary:true,clientX:100,clientY:120,bubbles:true,cancelable:true}));
  viewport.dispatchEvent(new PointerEvent('pointerup',{pointerId:9,isPrimary:true,clientX:100,clientY:120,bubbles:true}));
  button('bag').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));
  assert(grid.style.transform!==beforeDrag,'drag pans grid');
  const centered=button(grid.dataset.centered),matrix=new DOMMatrixReadOnly(grid.style.transform);
  assert(Math.abs(+centered.dataset.x+matrix.m41-viewport.clientWidth/2)<.01,'release snaps x to center');
  assert(Math.abs(+centered.dataset.y+matrix.m42-viewport.clientHeight/2)<.01,'release snaps y to center');
  assert(JSON.parse(localStorage.getItem(key)).events.length===count,'drag does not toggle or log');
  button('bag').dispatchEvent(new PointerEvent('pointerdown',{pointerId:10,isPrimary:true,button:0,clientX:100,clientY:120,bubbles:true}));
  viewport.dispatchEvent(new PointerEvent('pointerup',{pointerId:10,isPrimary:true,clientX:100,clientY:120,bubbles:true}));
  button('bag').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));
  assert(JSON.parse(localStorage.getItem(key)).events.length===count+1,'tap works after drag');
  button('bag').click();
  const edge=grid.style.transform;
  viewport.dispatchEvent(new WheelEvent('wheel',{deltaY:10000,deltaX:10000,bubbles:true,cancelable:true}));
  const bound=grid.style.transform;
  viewport.dispatchEvent(new WheelEvent('wheel',{deltaY:10000,deltaX:10000,bubbles:true,cancelable:true}));
  assert(grid.style.transform===bound,'pan clamps at boundaries');
  for(const b of circles){b.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));const m=new DOMMatrixReadOnly(grid.style.transform);assert(Math.abs(+b.dataset.x+m.m41-viewport.clientWidth/2)<.01&&Math.abs(+b.dataset.y+m.m42-viewport.clientHeight/2)<.01,'every circle can center');}
  assert(JSON.parse(localStorage.getItem(key)).events.length===count+2,'centering does not activate');
  const savedCount=JSON.parse(localStorage.getItem(key)).events.length;
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(){throw Error('simulated quota');};
  button('codex').click();
  assert(button('codex').getAttribute('aria-pressed')==='false','failed save not committed');
  assert(JSON.parse(localStorage.getItem(key)).events.length===savedCount,'failed save preserves history');
  Storage.prototype.setItem=original;
  for(let i=savedCount;i<40;i++)button('codex').click();
  assert(JSON.parse(localStorage.getItem(key)).events.length===40,'40 operations preserved');
  const before=localStorage.getItem(key);button('bag').click();
  assert(localStorage.getItem(key)===before,'capacity refuses without loss');
  assert(button('bag').getAttribute('aria-pressed')==='true','capacity keeps state');
  assert(document.documentElement.scrollWidth<=window.innerWidth,'no horizontal overflow');
  root.style.width='300px';
  const narrow=root.getBoundingClientRect(),watch=root.querySelector('.qt-watch').getBoundingClientRect();
  assert(watch.left>=narrow.left-.1&&watch.right<=narrow.right+.1,'watch fits 300px narrow container');
  document.body.dataset.test='PASS';document.title='PASS';
  const result=document.createElement('pre');result.textContent='PASS: importance sizes, non-overlapping circles, inactive grayscale / active color, center snap on release, all items centerable, pan bounds, drag suppression, tap, history, reload, failure, capacity, narrow layout';document.body.prepend(result);
 }catch(e){document.body.dataset.test='FAIL';document.title='FAIL';const result=document.createElement('pre');result.textContent='FAIL: '+e.message;document.body.prepend(result);}
})();
