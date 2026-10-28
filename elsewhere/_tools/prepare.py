#!/usr/bin/env python3
"""Build Same24's local ATUS 2025 collection. Python stdlib + pdftotext.

Never invent/fix missing source intervals. Any invalid source diary aborts the
export, leaving the existing site asset untouched. See ../README.md.
"""
import argparse
import csv
import hashlib
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urljoin, urlparse
from urllib.request import urlopen, Request
import zipfile
from collections import defaultdict

SOURCE = 'https://www.bls.gov/tus/data/datafiles-2025.htm'
LEXICON = 'https://www.bls.gov/tus/lexicons/lexiconnoex2025.pdf'
OUTPUT = Path(__file__).resolve().parents[1] / 'data' / 'diaries.json'
ARCHIVE_MANIFEST = Path(__file__).with_name('atus2025-sources.json')
CATEGORIES = ('sleep', 'work', 'care', 'travel', 'personal', 'leisure', 'other')


def category_for(code):
    if not re.fullmatch(r'\d{6}', code):
        raise ValueError(f'Invalid activity code: {code}')
    tier = int(code[:2])
    if tier not in (*range(1, 19), 50):
        raise ValueError(f'Unrecognized activity tier: {code}')
    if code in ('010101', '010199'):
        return 'sleep'
    if tier in (5, 6):
        return 'work'
    if tier in (2, 3, 4):
        return 'care'
    if tier == 18:
        return 'travel'
    if tier in (1, 11):
        return 'personal'
    if tier in (12, 13, 16):
        return 'leisure'
    return 'other'


class DownloadLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = {}

    def handle_starttag(self, tag, attrs):
        href = dict(attrs).get('href', '')
        if tag == 'a':
            for kind in ('act', 'resp', 'rost'):
                if re.search(rf'atus{kind}[-_]2025\.zip$', href, re.I):
                    url = urljoin(SOURCE, href)
                    if urlparse(url).hostname not in ('www.bls.gov', 'download.bls.gov'):
                        raise ValueError('Unexpected download host in BLS index')
                    self.links[kind] = url


def download(url, path):
    request = Request(url, headers={'User-Agent': 'Same24/1.0 (public ATUS data preparation)'})
    try:
        with urlopen(request, timeout=60) as response:
            payload = response.read()
    except Exception as error:
        raise RuntimeError(f'Source download blocked or unavailable: {url}: {error}. '
                           'Try --download-archive, or download the official files manually and use --source-dir. '
                           'No survey data was generated.') from error
    path.write_bytes(payload)


def download_sources(directory):
    directory.mkdir(parents=True, exist_ok=True)
    index = directory / 'datafiles-2025.htm'
    download(SOURCE, index)
    parser = DownloadLinks()
    parser.feed(index.read_text())
    if set(parser.links) != {'act', 'resp', 'rost'}:
        raise ValueError('Could not find the three 2025 archives on the official index.')
    for kind, url in parser.links.items():
        download(url, directory / f'atus{kind}-2025.zip')
    download(LEXICON, directory / 'lexiconnoex2025.pdf')
    (directory / 'download-sources.json').write_text(json.dumps(parser.links, indent=2) + '\n')


def download_archived_sources(directory):
    """Fetch pinned Internet Archive copies of the official 2025 BLS files."""
    directory.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(ARCHIVE_MANIFEST.read_text())
    for entry in manifest['files']:
        path = directory / entry['file']
        download(entry['archiveUrl'], path)
        if hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
            raise ValueError(f'Archived source checksum mismatch: {path.name}')
    (directory / 'download-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')


def add_download_provenance(files, manifest):
    """Only attach archive metadata when the actual input bytes match it."""
    by_name = {entry['file']: entry for entry in manifest['files']}
    for entry in files:
        recorded = by_name.get(entry['file'])
        if recorded:
            if entry['sha256'] != recorded['sha256']:
                raise ValueError(f'Source checksum disagrees with download manifest: {entry["file"]}')
            for key in ('url', 'archiveUrl', 'archiveTimestamp'):
                if key in recorded:
                    entry[key] = recorded[key]


def read_table(directory, kind):
    """Read CSV-formatted .dat inside the archive; do not extract ZIP paths."""
    candidates = sorted(p for p in directory.iterdir()
                        if re.fullmatch(rf'atus{kind}[-_]2025\.(zip|dat|csv)', p.name, re.I))
    if len(candidates) != 1:
        raise ValueError(f'Expected one atus{kind}-2025 .zip, .dat or .csv in {directory}')
    path = candidates[0]
    if path.suffix.lower() == '.zip':
        with zipfile.ZipFile(path) as archive:
            names = [n for n in archive.namelist() if n.lower().endswith(('.dat', '.csv'))
                     and re.search(rf'atus{kind}', n, re.I)]
            if len(names) != 1:
                raise ValueError(f'Ambiguous data members in {path}')
            content = archive.read(names[0]).decode('utf-8-sig')
    else:
        content = path.read_text(encoding='utf-8-sig')
    rows = [{k.strip().upper(): v.strip() for k, v in row.items()}
            for row in csv.DictReader(io.StringIO(content))]
    return rows, {'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def parse_lexicon(text):
    """Read the three indented code columns from pdftotext -layout output."""
    labels, tier1, tier2 = {}, None, None
    current, label_column = None, None
    # Column headings align with descriptions, not code digits, and shift between
    # pages. Infer the three code columns from the actual numeric indentation.
    # A few third-tier codes on the final page are indented four spaces further.
    code_pattern = r'^(\s*)(\d{2})\s+(\S.*)$'
    columns = sorted({len(match.group(1)) for line in text.splitlines()
                      if (match := re.match(code_pattern, line))})[:3]
    if len(columns) != 3:
        raise ValueError('Cannot establish three coding-lexicon columns')
    for line in text.splitlines():
        if 'Major Categories' in line and '2nd-tier' in line and '3rd-tier' in line:
            continue
        match = re.match(code_pattern, line)
        if not match:
            # Preserve descriptions wrapped by the PDF layout, without adding
            # page numbers, headers, or the n.e.c. footnote to activity labels.
            if (current and line.strip() and label_column is not None
                    and len(line) - len(line.lstrip()) >= label_column
                    and not line.lstrip().startswith(('*', 'ATUS', 'Major Categories'))
                    and not line.strip().isdigit()):
                labels[current] += ' ' + line.strip()
            continue
        indent, code, label = match.groups()
        tier = min(range(3), key=lambda i: abs(len(indent) - columns[i]))
        if tier == 0:
            tier1, tier2 = code, None
            current = None
        elif tier == 1:
            tier2 = code
            current = None
        else:
            if tier1 is None or tier2 is None:
                raise ValueError('Cannot establish coding-lexicon hierarchy')
            full = tier1 + tier2 + code
            if full in labels:
                raise ValueError(f'Duplicate lexicon code {full}')
            labels[full] = label.strip()
            current, label_column = full, match.start(3)
    if labels.get('010101') != 'Sleeping' or '050101' not in labels or len(labels) < 300:
        raise ValueError('Lexicon extraction failed validation. Supply --labels with a JSON '
                         'object of six-digit codes to original 2025 BLS descriptions.')
    return labels


def clock_minutes(value):
    match = re.fullmatch(r'(\d{1,2}):(\d{2}):(\d{2})', value)
    if not match:
        raise ValueError(f'Invalid clock time {value!r}')
    hour, minute, second = map(int, match.groups())
    if hour > 24 or minute > 59 or second != 0 or (hour == 24 and minute):
        raise ValueError(f'Unsupported clock time {value!r}')
    return (hour * 60 + minute) % 1440


def normalize_activities(rows, labels):
    """Use BLS's truncated durations; validate times against both duration fields.

    TUSTOPTIME describes the untruncated last activity, so it is checked against
    TUACTDUR, not TUACTDUR24. No rounding, scaling, or fabricated gap filling.
    """
    rows = sorted(rows, key=lambda row: int(row['TUACTIVITY_N']))
    result, elapsed = [], 0
    for number, row in enumerate(rows, 1):
        if int(row['TUACTIVITY_N']) != number:
            raise ValueError('Duplicate or missing activity sequence number')
        start = clock_minutes(row['TUSTARTTIM'])
        stop = clock_minutes(row['TUSTOPTIME'])
        duration = int(row['TUACTDUR24'])
        raw_duration = int(row['TUACTDUR'])
        if not 0 < duration <= 1440 or raw_duration < duration:
            raise ValueError('Invalid duration')
        if start != (240 + elapsed) % 1440:
            raise ValueError('Activity start disagrees with 04:00 chronology (gap or overlap)')
        if stop != (start + raw_duration) % 1440:
            raise ValueError('Stop time disagrees with untruncated duration')
        if number != len(rows) and duration != raw_duration:
            raise ValueError('A nonfinal activity was truncated')
        if number == len(rows) and duration != min(raw_duration, 1440 - elapsed):
            raise ValueError('Final activity does not follow the 04:00 truncation rule')
        elapsed += duration
        if int(row['TUCUMDUR24']) != elapsed:
            raise ValueError('Cumulative duration mismatch')
        code = row['TRCODE'].zfill(6)
        if code not in labels:
            raise ValueError(f'No original lexicon description for activity {code}')
        category_for(code)
        if all(f'TUTIER{i}CODE' in row for i in (1, 2, 3)):
            if code != ''.join(row[f'TUTIER{i}CODE'].zfill(2) for i in (1, 2, 3)):
                raise ValueError('TRCODE disagrees with tier codes')
        result.append([elapsed - duration, duration, code])
    if elapsed != 1440:
        raise ValueError(f'Diary covers {elapsed} minutes, not 1440')
    return result


def age_band(age):
    if age < 0:
        return 'unknown'
    if age < 15 or age > 85:
        raise ValueError(f'Invalid respondent age {age}')
    for upper, band in [(25, '15–24'), (35, '25–34'), (45, '35–44'), (55, '45–54'), (65, '55–64')]:
        if age < upper:
            return band
    return '65+'


def build_collection(respondents, roster, activities, labels, limit=480):
    people, household, episodes = {}, defaultdict(list), defaultdict(list)
    for person in roster:
        key = (person['TUCASEID'], person['TULINENO'])
        if key in people:
            raise ValueError(f'Duplicate roster key {key}')
        people[key] = person
        household[person['TUCASEID']].append(person)
    for activity in activities:
        episodes[activity['TUCASEID']].append(activity)
    seen, diaries = set(), []
    truncated = 0
    for respondent in respondents:
        case = respondent['TUCASEID']
        if case in seen:
            raise ValueError(f'Duplicate respondent {case}')
        seen.add(case)
        person = people[(case, respondent['TULINENO'])]
        if int(person['TERRP']) not in (18, 19):
            raise ValueError(f'Respondent/roster self link mismatch for {case}')
        age_value = int(person['TEAGE'])
        age = age_band(age_value)
        child_count = int(respondent['TRCHILDNUM'])
        children = child_count > 0 if child_count >= 0 else None
        # Nonhousehold children (TERRP=40) are never counted as living here.
        members = [p for p in household[case] if int(p['TERRP']) in range(18, 31)]
        if child_count >= 0 and all(int(p['TEAGE']) >= 0 for p in members):
            if sum(int(p['TEAGE']) < 18 for p in members) != child_count:
                raise ValueError(f'Household children disagree with TRCHILDNUM for {case}')
        day = int(respondent['TUDIARYDAY'])
        if day not in range(1, 8):
            raise ValueError(f'Invalid diary weekday for {case}')
        if 'TUDIARYDATE' in respondent and not respondent['TUDIARYDATE'].startswith('2025'):
            raise ValueError(f'Diary is not from 2025: {case}')
        labor = int(respondent['TELFS'])
        employment = {1: 'Employed', 2: 'Employed', 3: 'Unemployed', 4: 'Unemployed', 5: 'Not in labor force', -1: 'Employment not reported', -2: 'Employment not reported', -3: 'Employment not reported'}[labor]
        try:
            normalized = normalize_activities(episodes[case], labels)
        except ValueError as error:
            raise ValueError(f'{case}: {error}') from error
        truncated += sum(int(r['TUACTDUR']) > int(r['TUACTDUR24']) for r in episodes[case])
        diaries.append({'id': case, 'age': age, 'ageValue': age_value if age_value >= 0 else None,
                        'employment': employment, 'children': children,
                        'day': day, 'activities': normalized})
    if set(episodes) != seen or set(household) != seen:
        raise ValueError('Activity, roster, and respondent case identifiers do not match')
    if not diaries:
        raise ValueError('No diaries in source files')
    # Stable, unweighted sample spread across age / day / children strata.
    groups = defaultdict(list)
    for diary in sorted(diaries, key=lambda d: hashlib.sha256(('same24-v1:' + d['id']).encode()).hexdigest()):
        groups[(diary['age'], diary['day'] in (1, 7), str(diary['children']))].append(diary)
    selected = []
    while any(groups.values()) and (limit == 0 or len(selected) < limit):
        for key in sorted(groups):
            if groups[key] and (limit == 0 or len(selected) < limit):
                selected.append(groups[key].pop())
    used_codes = {a[2] for diary in selected for a in diary['activities']}
    return {'schema': 1, 'kind': 'atus', 'year': 2025, 'source': SOURCE,
            'codes': {code: {'label': labels[code], 'category': category_for(code)} for code in sorted(used_codes)},
            'diaries': selected, 'validation': {'sourceDiaries': len(diaries), 'includedDiaries': len(selected),
            'minutesPerDiary': 1440, 'truncatedFinalActivities': truncated, 'excludedInvalidDiaries': 0}}


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True, help='Directory for official input files; keep outside the site')
    downloads = parser.add_mutually_exclusive_group()
    downloads.add_argument('--download', action='store_true', help='Fetch official archives and coding lexicon')
    downloads.add_argument('--download-archive', action='store_true', help='Fetch checksum-pinned Internet Archive copies of the official files')
    parser.add_argument('--labels', type=Path, help='Optional JSON mapping of original BLS code descriptions instead of PDF extraction')
    parser.add_argument('--limit', type=int, default=480, help='Number of examples; 0 includes all validated diaries')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    if args.limit < 0:
        parser.error('--limit cannot be negative')
    if args.download:
        download_sources(args.source_dir)
    elif args.download_archive:
        download_archived_sources(args.source_dir)
    files = []
    tables = {}
    for kind in ('resp', 'rost', 'act'):
        tables[kind], provenance = read_table(args.source_dir, kind)
        files.append(provenance)
    label_source = args.labels or args.source_dir / 'lexiconnoex2025.pdf'
    if args.labels:
        labels = json.loads(label_source.read_text())
    else:
        result = subprocess.run(['pdftotext', '-layout', str(label_source), '-'], check=True, text=True, capture_output=True)
        labels = parse_lexicon(result.stdout)
    files.append({'file': label_source.name, 'sha256': hashlib.sha256(label_source.read_bytes()).hexdigest()})
    manifest_path = args.source_dir / 'download-manifest.json'
    if manifest_path.exists():
        add_download_provenance(files, json.loads(manifest_path.read_text()))
    data = build_collection(tables['resp'], tables['rost'], tables['act'], labels, args.limit)
    data['provenance'] = {'sourcePage': SOURCE, 'files': files,
                          'selection': 'same24-v1 SHA-256 order, round-robin age/day/household strata; unweighted'}
    write_json(args.output, data)
    print(json.dumps(data['validation'], indent=2))
    print(f'Wrote verified ATUS collection to {args.output}')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, RuntimeError, OSError, subprocess.CalledProcessError, zipfile.BadZipFile) as error:
        sys.exit(f'ERROR: {error}\nExisting output was not replaced.')
