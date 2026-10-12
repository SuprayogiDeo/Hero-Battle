#!/usr/bin/env python3
"""Build 32x32 world chunks from assets/world/village.json. Usage: python tools/build_world.py --width 128 --height 96"""
import argparse, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; BASE=ROOT/"assets/world"
def main():
 p=argparse.ArgumentParser(); p.add_argument("--width",type=int,default=128); p.add_argument("--height",type=int,default=96); p.add_argument("--chunk",type=int,default=32); a=p.parse_args()
 if a.width<1 or a.height<1 or a.chunk<1: p.error("dimensions must be positive")
 src=json.loads((BASE/"village.json").read_text()); ow,oh=src["w"],src["h"]; W,H,C=a.width,a.height,a.chunk
 idx={k:v for k,v in src.items() if k not in ("layers","anim")}; idx.update(v=2,w=W,h=H,chunkSize=C,chunkPixel=C*16,chunks=[],biomes=[],source="village.json"); idx["grid"]=[((src["grid"][y] if y<oh else "."*ow)[:W].ljust(W,".") if W<=ow else ((src["grid"][y] if y<oh else "."*ow)[:ow].ljust(ow,".")+"."*(W-ow))) for y in range(H)]
 out=BASE/"chunks"; out.mkdir(exist_ok=True)
 for old in out.glob("c*_*.json"): old.unlink()
 for cy in range((H+C-1)//C):
  for cx in range((W+C-1)//C):
   x0,y0=cx*C,cy*C; cw,ch=min(C,W-x0),min(C,H-y0); layers={}
   for L in ("ground","shadow","decor","over","collision"):
    ar=src.get("layers",{}).get(L,[]); layers[L]=[ar[(y0+y)*ow+x0+x] if y0+y<oh and x0+x<ow and (y0+y)*ow+x0+x<len(ar) else 0 for y in range(ch) for x in range(cw)]
   objects=[o for o in src.get("objects",[]) if x0<=o.get("x",-1)<x0+cw and y0<=o.get("y",-1)<y0+ch]; biome="village" if cx==0 and cy==0 else ("meadow" if cy<2 else "grass"); name=f"c{cx}_{cy}.json"
   (out/name).write_text(json.dumps(dict(v=1,x=x0,y=y0,w=cw,h=ch,layers=layers,objects=objects,biome=biome),separators=(",",":"))); idx["chunks"].append(dict(x=cx,y=cy,file="chunks/"+name,biome=biome)); idx["biomes"].append(biome)
 (BASE/"index.json").write_text(json.dumps(idx,separators=(",",":"))); print(f"Built {len(idx['chunks'])} chunks for {W}x{H} world")
if __name__=="__main__": main()
