#!/usr/bin/env python3
"""Generate designed chunk world. All biome/place/road layout comes from world_design.json."""
import argparse, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; BASE=ROOT/'assets/world'; DESIGN=ROOT/'tools/world_design.json'
def line(x0,y0,x1,y1):
    n=max(abs(x1-x0),abs(y1-y0),1)
    return [(round(x0+(x1-x0)*i/n),round(y0+(y1-y0)*i/n)) for i in range(n+1)]
def main():
    p=argparse.ArgumentParser(); p.add_argument('--width',type=int); p.add_argument('--height',type=int); p.add_argument('--chunk',type=int); a=p.parse_args()
    design=json.loads(DESIGN.read_text()); src=json.loads((BASE/'village.json').read_text())
    W=a.width or design['world']['width']; H=a.height or design['world']['height']; C=a.chunk or design['world']['chunkSize']
    if min(W,H,C)<1: p.error('dimensions must be positive')
    ow,oh=src['w'],src['h']; grid=[]
    for y in range(H):
        old=(src['grid'][y] if y<oh else '.'*ow)[:W].ljust(W,'.')
        grid.append(list(old))
    # Paths are data-driven; preserve all original village coordinates and buildings.
    for road in design.get('roads',[]):
        for x,y in line(*road):
            if 0<=x<W and 0<=y<H and grid[y][x] not in 'SRGQF': grid[y][x]=','
    idx={k:v for k,v in src.items() if k not in ('layers','anim','grid')}
    idx.update(v=3,w=W,h=H,tile=16,chunkSize=C,chunkPixel=C*16,chunks=[],source='village.json',biomeRegions=design['biomes'],places=design.get('places',[]),tags=design.get('tags',{}),design='tools/world_design.json')
    idx['grid']=[''.join(r) for r in grid]
    out=BASE/'chunks'; out.mkdir(exist_ok=True)
    for old in out.glob('c*_*.json'): old.unlink()
    for cy in range((H+C-1)//C):
      for cx in range((W+C-1)//C):
        x0,y0=cx*C,cy*C; cw,ch=min(C,W-x0),min(C,H-y0); layers={}
        for L in ('ground','shadow','decor','over','collision'):
          ar=src.get('layers',{}).get(L,[]); layers[L]=[ar[(y0+y)*ow+x0+x] if y0+y<oh and x0+x<ow and (y0+y)*ow+x0+x<len(ar) else 0 for y in range(ch) for x in range(cw)]
        # Tile tags travel with chunk data; water is a future fishing interaction point.
        tags=[]
        for y in range(ch):
          for x in range(cw):
            gx,gy=x0+x,y0+y; c=idx['grid'][gy][gx]
            if c=='~': tags.append({'i':y*cw+x,'tag':'fishing_spot'})
            for b in design['biomes']:
              if b['x']<=gx<b['x']+b['w'] and b['y']<=gy<b['y']+b['h'] and b['id']=='meadow':
                tags.append({'i':y*cw+x,'tag':'animal_pen_area'}); break
        biome=next((b['id'] for b in design['biomes'] if b['x']<=x0<b['x']+b['w'] and b['y']<=y0<b['y']+b['h']),'meadow')
        name=f'c{cx}_{cy}.json'; (out/name).write_text(json.dumps({'v':2,'x':x0,'y':y0,'w':cw,'h':ch,'layers':layers,'objects':[o for o in src.get('objects',[]) if x0<=o.get('x',-1)<x0+cw and y0<=o.get('y',-1)<y0+ch],'biome':biome,'tags':tags},separators=(',',':')))
        idx['chunks'].append({'x':cx,'y':cy,'file':'chunks/'+name,'biome':biome})
    (BASE/'index.json').write_text(json.dumps(idx,separators=(',',':')))
    print(f'Built {len(idx["chunks"])} chunks for {W}x{H}; {len(design["biomes"])} biomes, {len(design.get("places",[]))} places')
if __name__=='__main__': main()
