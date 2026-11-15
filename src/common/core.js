/* Offline prototype: operations are committed only after storage readback. */
const KEY='quick-todo-native-v1';
const MAX=100;
function validate(s,items){
  if(!s||s.version!==1||typeof s.instance!=='string'||!Array.isArray(s.events)||s.events.length>MAX)throw Error('CORRUPT');
  const known=items.map(x=>x.id);
  s.events.forEach((e,i)=>{if(e.seq!==i+1||e.id!==s.instance+':'+e.seq||known.indexOf(e.item)<0||typeof e.active!=='boolean'||!Number.isFinite(e.time)||!Number.isFinite(e.offset))throw Error('CORRUPT');});
  return s;
}
function deadline(p){return new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('TIMEOUT')),5000);p.then(x=>{clearTimeout(t);resolve(x);},e=>{clearTimeout(t);reject(e);});});}
function create(storage,items){
  let state=null,blocked=true,busy=false;
  return {
    async load(){try{const raw=await deadline(storage.get(KEY));state=raw?validate(JSON.parse(raw),items):{version:1,instance:'qt-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10),events:[]};blocked=false;return this.view();}catch(e){blocked=true;throw e;}},
    view(){return state?JSON.parse(JSON.stringify(state)):null;},
    active(){const out={};if(state)state.events.forEach(e=>{out[e.item]=e.active;});return out;},
    writable(){return !!state&&!blocked&&!busy&&state.events.length<MAX;},
    async toggle(item){
      if(!this.writable())throw Error('READ_ONLY');
      if(!items.some(x=>x.id===item))throw Error('UNKNOWN_ITEM');
      busy=true;
      const next=this.view(),seq=next.events.length+1;
      next.events.push({id:next.instance+':'+seq,seq,item,active:!this.active()[item],time:Date.now(),offset:-new Date().getTimezoneOffset()});
      const raw=JSON.stringify(next);
      try{
        if(raw.length>24000)throw Error('FULL');
        await deadline(storage.set(KEY,raw));
        if(await deadline(storage.get(KEY))!==raw)throw Error('READBACK');
        state=next;return this.view();
      }catch(e){blocked=true;throw e;}finally{busy=false;}
    }
  };
}
function camera(items){
  let x=0,y=0;
  const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
  const limits={minX:Math.min.apply(null,items.map(p=>p.x)),maxX:Math.max.apply(null,items.map(p=>p.x)),minY:Math.min.apply(null,items.map(p=>p.y)),maxY:Math.max.apply(null,items.map(p=>p.y))};
  return {
    view(){return {x,y};},
    move(a,b){x=clamp(a,-limits.maxX,-limits.minX);y=clamp(b,-limits.maxY,-limits.minY);return this.view();},
    snap(){let nearest=items[0],distance=Infinity;items.forEach(p=>{const d=Math.hypot(p.x+x,p.y+y);if(d<distance){nearest=p;distance=d;}});x=-nearest.x;y=-nearest.y;return nearest;}
  };
}
module.exports={create,camera,validate,KEY,MAX};
