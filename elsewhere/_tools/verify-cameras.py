#!/usr/bin/env python3
"""Audit public YouTube watch-page metadata; never downloads camera media.

Usage: python3 verify-cameras.py [video_id ...]
Without IDs, audits the source manifest. Actual embedded playback needs cameras.test.mjs.
"""
import concurrent.futures
import json
from pathlib import Path
import re
import sys
from urllib.request import Request, urlopen

manifest = Path(__file__).with_name('camera-sources.json')
output = Path('/tmp/elsewhere-stability')
output.mkdir(exist_ok=True)
ids = sys.argv[1:] or [c['video_id'] for c in json.loads(manifest.read_text())['cameras'] if c.get('video_id')]

def check(video_id):
    try:
        url = 'https://www.youtube.com/watch?v=' + video_id
        request = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urlopen(request, timeout=25) as response:
            html = response.read().decode()
        data = json.loads(re.search(r'var ytInitialPlayerResponse = (\{.*?\});', html).group(1))
        video = data.get('videoDetails', {})
        playback = data.get('playabilityStatus', {})
        broadcast = data.get('microformat', {}).get('playerMicroformatRenderer', {}).get('liveBroadcastDetails', {})
        result = {
            'video_id': video_id, 'source': url, 'title': video.get('title'),
            'operator': video.get('author'), 'channel_id': video.get('channelId'),
            'is_live_now': broadcast.get('isLiveNow', False),
            'playable_in_embed': playback.get('playableInEmbed', False),
            'started_at': broadcast.get('startTimestamp'), 'ended_at': broadcast.get('endTimestamp'),
            'status': playback.get('status'), 'description': video.get('shortDescription', ''),
        }
        (output / (video_id + '.json')).write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(video_id, 'LIVE' if result['is_live_now'] else 'ENDED', 'embed' if result['playable_in_embed'] else 'not embeddable', result['started_at'], result['title'], flush=True)
        return result
    except Exception as error:
        print(video_id, str(error), flush=True)
        return {'video_id': video_id, 'error': str(error)}

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(check, dict.fromkeys(ids)))
(output / 'latest.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
