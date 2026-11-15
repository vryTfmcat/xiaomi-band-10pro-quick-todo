const SCALE=1.3,ORIGIN=500,WIDTH=336,HEIGHT=360;
function image(id,active){return '/common/tiles/'+id+(active?'-on':'-off')+'.png';}
function center(item){return {x:Math.round(ORIGIN+item.x*SCALE),y:Math.round(ORIGIN+item.y*SCALE)};}
function circles(items){return items.map(item=>{const p=center(item),d=Math.round(item.size*SCALE);return {id:item.id,src:image(item.id,false),style:'left:'+Math.round(p.x-d/2)+'px;top:'+Math.round(p.y-d/2)+'px;width:'+d+'px;height:'+d+'px;'};});}
function nearest(items,left,top){let item=items[0],distance=Infinity;items.forEach(p=>{const c=center(p),d=Math.hypot(c.x-left-WIDTH/2,c.y-top-HEIGHT/2);if(d<distance){distance=d;item=p;}});const c=center(item);return {item,left:c.x-WIDTH/2,top:c.y-HEIGHT/2};}
module.exports={circles,nearest,image,center};
