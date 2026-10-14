#!/usr/bin/env python3
"""Serve an isolated copy of Elsewhere's public assets."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int, default=8244)
args = parser.parse_args()
source = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='elsewhere-preview-') as directory:
    target = Path(directory) / 'elsewhere'
    for name in ('index.html', 'elsewhere.css', 'elsewhere.js', 'base.css', 'favicon.svg',
                 'cities.js', 'atmosphere.js', 'world-route.js', 'warp-clock.js', 'live-camera.js', 'camera-frame.html', 'camera-frame.js', 'README.md', 'assets/clock-body.png'):
        (target / name).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / name, target / name)
    wordmark = Path(directory) / 'assets/images/kyrylo-silin-logo.svg'
    wordmark.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source.parent / 'assets/images/kyrylo-silin-logo.svg', wordmark)
    legacy = Path(directory) / 'same24/index.html'
    legacy.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source.parent / 'same24/index.html', legacy)
    handler = partial(SimpleHTTPRequestHandler, directory=directory)
    with ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
        print(f'Elsewhere: http://127.0.0.1:{args.port}/elsewhere/ (Ctrl-C to stop)', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
