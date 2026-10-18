"""Regenerate runtime WebP artwork from preserved masters (requires cwebp)."""
from pathlib import Path
import json
import subprocess

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / '_notes/asset-optimization.json').read_text())
for asset in manifest:
    source = root / '_art/source-assets' / asset['file']
    output = root / 'assets' / Path(asset['file']).with_suffix('.webp')
    options = ['cwebp', '-quiet', '-mt', '-m', '6']
    options += ['-lossless', '-exact'] if asset['lossless'] else ['-q', '88', '-alpha_q', '100', '-sharp_yuv']
    if asset['size']:
        options += ['-resize', *map(str, asset['size'])]
    subprocess.run([*options, str(source), '-o', str(output)], check=True)
