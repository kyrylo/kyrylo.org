"""Embed the existing sneaker photo in the first HTML response (requires cwebp)."""
from pathlib import Path
import base64
import re
import subprocess
import tempfile

root = Path(__file__).resolve().parent.parent
crop = re.search(r'SHOE_CROP = \{x:(\d+),y:(\d+),width:(\d+),height:(\d+)\}',
                 (root / 'sprite-data.js').read_text()).groups()
with tempfile.TemporaryDirectory(prefix='puddle-menu-') as directory:
    output = Path(directory) / 'shoe.webp'
    subprocess.run(['cwebp', '-quiet', '-q', '88', '-alpha_q', '100',
                    '-crop', *crop, '-resize', '216', '504',
                    str(root / 'assets/white-sneaker.webp'), '-o', str(output)], check=True)
    pixels = output.read_bytes()
encoded = base64.b64encode(pixels).decode('ascii')
page = root / 'index.html'
source, count = re.subn(r'(<image id="menu-shoe"[^>]*href=")[^"]*(")',
                       lambda m: m[1] + 'data:image/webp;base64,' + encoded + m[2], page.read_text())
assert count == 1, 'Expected one shared opening-screen sneaker image'
page.write_text(source)
print(f'Embedded {len(pixels):,} bytes of sneaker artwork; no separate image request.')
