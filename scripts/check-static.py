from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
import json
root=Path(__file__).resolve().parent.parent/'docs'
class Page(HTMLParser):
 def __init__(self):
  super().__init__();self.ids=[];self.links=[];self.assets=[];self.images=[];self.h1=0;self.stack=[];self.errors=[]
 def handle_starttag(self,tag,attributes):
  a=dict(attributes)
  if tag=='h1':self.h1+=1
  if 'id' in a:self.ids.append(a['id'])
  if tag=='a':self.links.append(a.get('href',''))
  if tag in ('script','img'):self.assets.append(a.get('src',''))
  if tag=='link' and a.get('rel') in ('stylesheet','icon'):self.assets.append(a.get('href',''))
  if tag=='img':self.images.append(a)
  if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):self.stack.append(tag)
 def handle_endtag(self,tag):
  if not self.stack or self.stack[-1]!=tag:self.errors.append('Unbalanced closing tag: '+tag)
  else:self.stack.pop()
 def handle_startendtag(self,tag,attributes):
  self.handle_starttag(tag,attributes)
  if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):
   self.handle_endtag(tag)
for file in root.glob('*.html'):
 p=Page();p.feed(file.read_text())
 assert p.h1==1,(file,'expected one H1')
 assert len(p.ids)==len(set(p.ids)),(file,'duplicate IDs')
 assert not p.errors and not p.stack,(file,p.errors,p.stack)
 for href in p.links:
  if href.startswith('#'):assert href[1:] in p.ids,(file,href)
  elif href.startswith('./'):assert (root/urlsplit(href).path).exists(),(file,href)
 for asset in p.assets:
  assert asset and (root/unquote(urlsplit(asset).path)).is_file(),(file,asset)
 for image in p.images:
  assert image.get('alt') and image.get('width') and image.get('height'),(file,image)
 print(file.name+': valid structure, anchors and local assets')
print('Static verification passed.')
