"""Precompose each circle into one small native image."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
root=Path(__file__).resolve().parents[1]
items=json.loads((root/'src/common/items.js').read_text(encoding='utf-8').removeprefix('module.exports=').rstrip(';\n'))['items']
folder=root/'src/common/tiles';folder.mkdir(exist_ok=True)
sheet=Image.new('RGB',(672,480),'#090c0b')
for index,item in enumerate(items):
    size=round(item['size']*1.3)
    for active in [False,True]:
        scale=3;n=size*scale
        tile=Image.new('RGBA',(n,n));draw=ImageDraw.Draw(tile)
        draw.ellipse((scale,scale,n-scale-1,n-scale-1),fill=item['color'] if active else '#343434',outline='#ffffff' if active else '#666666',width=2*scale)
        large=item['size']>=56
        symbol=Image.open(root/'src/common/icons'/f"{item['id']}.png").convert('RGBA')
        icon_size=round(n*(.55 if large else .68));symbol=symbol.resize((icon_size,icon_size),Image.Resampling.LANCZOS)
        tile.alpha_composite(symbol,((n-icon_size)//2,round(n*(.12 if large else .16))))
        if large:
            font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',13*scale)
            box=draw.textbbox((0,0),item['name'],font=font)
            draw.text(((n-box[2])/2,round(n*.70)-box[1]),item['name'],fill='white',font=font)
        if active:draw.ellipse((n-13*scale,6*scale,n-7*scale,12*scale),fill='white')
        tile=tile.resize((size,size),Image.Resampling.LANCZOS)
        tile.save(folder/f"{item['id']}-{'on' if active else 'off'}.png",optimize=True)
        if index<16:
            x=(index%4)*168;y=(index//4)*120
            sheet.paste(tile,(x+(0 if not active else 70),y),tile)
sheet.save(root/'cache/native-tiles-0.2.0.png')
print('Prepared 64 circle images; 32 native image nodes at runtime.')
