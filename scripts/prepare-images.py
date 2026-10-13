"""Generate smaller JPEG candidates; never modify the approved originals.

Optional maintenance command: python3 scripts/prepare-images.py
Requires Pillow. Generated files are committed, so normal builds need no image tools.
"""
from pathlib import Path
from PIL import Image
import hashlib
import json

root = Path(__file__).resolve().parent.parent
photos = root / 'public/photos'
output = photos / 'responsive'
output.mkdir(exist_ok=True)
report = {}
for source in sorted(photos.glob('*.jpg')):
    image = Image.open(source)
    width, height = image.size
    candidates = []
    for target_width in [160, 320, 480, 640, 768]:
        if target_width >= width:
            continue
        target_height = round(height * target_width / width)
        resized = image.resize((target_width, target_height), Image.Resampling.LANCZOS)
        target = output / f'{source.stem}-{target_width}.jpg'
        resized.save(target, quality=94, optimize=True, progressive=True,
                     icc_profile=image.info.get('icc_profile'))
        if target.stat().st_size >= source.stat().st_size:
            target.unlink()
            continue
        candidates.append({'path': './photos/responsive/' + target.name,
                           'width': target_width, 'height': target_height,
                           'bytes': target.stat().st_size,
                           'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    report[source.name] = {'width': width, 'height': height,
                          'original_bytes': source.stat().st_size,
                          'candidates': candidates}
(root / 'references/image-variants.json').write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'original_bytes': sum(v['original_bytes'] for v in report.values()),
                  'variants': sum(len(v['candidates']) for v in report.values()),
                  '480px_bytes': sum(next(c['bytes'] for c in v['candidates']
                                           if c['width'] == 480) for v in report.values())}))
