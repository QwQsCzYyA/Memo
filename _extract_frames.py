import os, cv2, glob

vdir = "C:/Users/admin/Videos/Captures/"
cands = glob.glob(vdir + "*.mp4")
# pick the 22-00 one (newest / the referenced one)
cands.sort(key=os.path.getmtime)
video = cands[-1]
print("using:", repr(video))

outdir = "E:/note q(≧▽≦q)/_frames"
os.makedirs(outdir, exist_ok=True)
for f in os.listdir(outdir):
    try: os.remove(os.path.join(outdir, f))
    except: pass

cap = cv2.VideoCapture(video)
fps = cap.get(cv2.CAP_PROP_FPS)
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print("fps", fps, "frames", n)

saved = 0
if fps and fps > 0 and n > 0:
    dur = n / fps
    print("duration", dur)
    for i in range(18):
        t = dur * (i + 0.5) / 18
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, frame = cap.read()
        if ok:
            cv2.imwrite(os.path.join(outdir, "frame_%03d_%.1fs.png" % (saved, t)), frame)
            saved += 1
else:
    # sequential read
    idx = 0
    step = 30
    while True:
        ok, frame = cap.read()
        if not ok: break
        if idx % step == 0:
            cv2.imwrite(os.path.join(outdir, "frame_%03d.png" % saved), frame)
            saved += 1
        idx += 1
cap.release()
print("saved", saved)
