"""Render prototype symbols offline with local Windows fonts, without user images."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import re
root=Path(__file__).resolve().parents[1]
text=(root/'prototype/quick-todo.html').read_text(encoding='utf-8')
rows=re.findall(r"\['([^']+)','([^']+)','([^']+)','([^']+)','(#[0-9a-fA-F]+)'\]",text)
assert len(rows)==32
folder=root/'src/common/icons';folder.mkdir(parents=True,exist_ok=True)
emoji=ImageFont.truetype('C:/Windows/Fonts/seguiemj.ttf',46)
symbol=ImageFont.truetype('C:/Windows/Fonts/seguisym.ttf',46)
sheet=Image.new('RGB',(512,256),'#161616')
for index,(id,name,icon,glyph,color) in enumerate(rows):
    image=Image.new('RGBA',(64,64),(0,0,0,0));draw=ImageDraw.Draw(image)
    font=symbol if id in ['codex','backup','wallet','music','write','sleep'] else emoji
    box=draw.textbbox((0,0),glyph,font=font,embedded_color=False)
    draw.text(((64-(box[2]-box[0]))/2-box[0],(64-(box[3]-box[1]))/2-box[1]),glyph,font=font,fill='white',embedded_color=False)
    assert image.getbbox(),id
    # Normalize transparent padding so every pictogram uses the image's visible area.
    glyph_image = image.crop(image.getbbox())
    scale = 58 / max(glyph_image.width, glyph_image.height)
    glyph_image = glyph_image.resize(
        (max(1,round(glyph_image.width * scale)),max(1,round(glyph_image.height * scale))),
        Image.Resampling.LANCZOS
    )
    image = Image.new('RGBA',(64,64),(0,0,0,0))
    image.alpha_composite(glyph_image,((64-glyph_image.width)//2,(64-glyph_image.height)//2))
    image.save(folder/(id+'.png'))
    sheet.paste(image,((index%8)*64,(index//8)*64),image)
sheet.save(root/'cache/native-icons.png')
image=Image.new('RGBA',(96,96),'#121212');draw=ImageDraw.Draw(image)
draw.ellipse((13,13,60,60),fill='#71aaf0');draw.ellipse((54,34,85,65),fill='#9bcf96');draw.ellipse((25,65,47,87),fill='#b99be8')
image.save(root/'src/common/icon.png')
print('Rendered 32 monochrome native symbols and app icon.')
