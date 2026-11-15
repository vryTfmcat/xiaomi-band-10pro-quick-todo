from pathlib import Path
import re, json, math

root=Path(__file__).resolve().parents[1]
source=root/'prototype/quick-todo.html'
text=source.read_text(encoding='utf-8')
rows=re.findall(r"\['([^']+)','([^']+)','([^']+)','([^']+)','(#[0-9a-fA-F]+)'\]",text)
assert len(rows)==32
def color(h):
    L=.69; C=.145; a=C*math.cos(h); b=C*math.sin(h)
    ll=(L+.3963377774*a+.2158037573*b)**3
    mm=(L-.1055613458*a-.0638541728*b)**3
    ss=(L-.0894841775*a-1.291485548*b)**3
    values=[4.0767416621*ll-3.3077115913*mm+.2309699292*ss,-1.2684380046*ll+2.6097574011*mm-.3413193965*ss,-.0041960863*ll-.7034186147*mm+1.707614701*ss]
    def enc(x):
        x=max(0,min(1,x))
        return round(255*(12.92*x if x<=.0031308 else 1.055*x**(1/2.4)-.055))
    return '#'+''.join(f'{enc(x):02x}' for x in values)
items=[]; positions=[]
for n,(id,name,icon,fallback,old) in enumerate(rows):
    size=78 if n==0 else 70 if n==1 else 64 if n in (5,18) else 56 if n%3==0 else 44
    radius=size/2; chosen=None
    for distance in range(0,600,3):
        for a in range(0,360,10):
            angle=(a+n*137.508)*math.pi/180; x=math.cos(angle)*distance; y=math.sin(angle)*distance
            if all(math.hypot(x-px,y-py)>=radius+pr+7 for px,py,pr in positions):chosen=(x,y,radius);break
        if chosen:break
    assert chosen
    positions.append(chosen); c=color((250+n*137.508)*math.pi/180)
    text=text.replace("'"+old+"'","'"+c+"'",1)
    items.append(dict(id=id,name=name,icon=icon,color=c,size=size,x=round(chosen[0],5),y=round(chosen[1],5)))
source.write_text(text,encoding='utf-8')
(root/'src/common/items.js').write_text('module.exports='+json.dumps({'items':items},ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
(root/'src/manifest.json').write_text(json.dumps({'package':'com.local.codex.quicktodo','name':'圆圈待办','icon':'/common/icon.png','versionName':'0.2.0','versionCode':5,'minPlatformVersion':1100,'deviceTypeList':['watch'],'features':[{'name':'system.storage'},{'name':'system.app'}],'config':{'designWidth':336,'logLevel':'info'},'router':{'entry':'pages/index','pages':{'pages/index':{'component':'index'}}},'display':{'backgroundColor':'#090c0b'}},ensure_ascii=False,indent=2),encoding='utf-8')
(root/'src/app.ux').write_text("<script>\nexport default {\n  onCreate(){console.info('[QT 0.2.0] create');},\n  onHide(){console.info('[QT 0.2.0] hide');},\n  onError(e){console.error('[QT 0.2.0] error '+String(e&&e.message||'unknown').slice(0,160));}\n};\n</script>\n",encoding='utf-8')
(root/'src/config-watch.json').write_text('{}\n',encoding='utf-8')
(root/'package.json').write_text(json.dumps({'name':'codex-band-quick-todo','version':'0.2.0','private':True,'scripts':{'test':'node --test tests/*.test.cjs','build':'node tools/build.cjs','verify:package':'python tools/inspect_package.py'},'devDependencies':{'aiot-toolkit':'2.0.5','@aiot-toolkit/jsc':'1.0.10'}},indent=2),encoding='utf-8')
base=Path('C:/Users/86137/Documents/Codex/codex资料/项目/个人生活记录系统/worktree/codex-band-life-log')
for name in ['build.cjs','compile_vela.cjs','inspect_package.py']:
    data=(base/'tools'/name).read_text(encoding='utf-8').replace('com.local.codex.lifelog','com.local.codex.quicktodo').replace('CodexLifeLogLocalDev','CodexQuickTodoLocalDev')
    (root/'tools'/name).write_text(data,encoding='utf-8')
(root/'cache').mkdir(exist_ok=True)
(root/'cache/catalog.json').write_text(json.dumps(items,ensure_ascii=False),encoding='utf-8')
print('Prepared native config, shared layout and uniform OKLCH palette.')
