"""Synthetic unit fixtures only; none of these rows are survey observations."""
import io
import csv
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile
from prepare import category_for, normalize_activities, age_band, build_collection, read_table, DownloadLinks, parse_lexicon, add_download_provenance

LABELS = {'010101': 'Sleeping', '050101': 'Work, main job', '180501': 'Travel related to working', '110101': 'Eating and drinking'}


def source_rows(durations=(120, 960, 360), codes=('010101', '050101', '010101'), tail=0):
    rows, elapsed = [], 0
    def clock(minute):
        return f'{minute % 1440 // 60:02}:{minute % 60:02}:00'
    for index, (duration, code) in enumerate(zip(durations, codes), 1):
        raw = duration + (tail if index == len(durations) else 0)
        start = 240 + elapsed
        elapsed += duration
        rows.append({'TUCASEID': '20250101000001', 'TUACTIVITY_N': str(index),
                     'TUSTARTTIM': clock(start), 'TUSTOPTIME': clock(start + raw),
                     'TUACTDUR24': str(duration), 'TUACTDUR': str(raw),
                     'TUCUMDUR24': str(elapsed), 'TRCODE': code,
                     'TUTIER1CODE': str(int(code[:2])), 'TUTIER2CODE': str(int(code[2:4])), 'TUTIER3CODE': str(int(code[4:]))})
    return rows


class PreparationTests(unittest.TestCase):
    def test_all_category_groups_and_sleep_exclusion(self):
        expected = {'010101': 'sleep', '010199': 'sleep', '010102': 'personal',
                    '010201': 'personal', '020201': 'care', '030101': 'care', '040101': 'care',
                    '050101': 'work', '060301': 'work', '070101': 'other', '080101': 'other',
                    '090101': 'other', '100101': 'other', '110101': 'personal', '120101': 'leisure',
                    '130101': 'leisure', '140101': 'other', '150101': 'other', '160101': 'leisure',
                    '170101': 'other', '180501': 'travel', '500101': 'other'}
        for code, category in expected.items():
            with self.subTest(code=code):
                self.assertEqual(category_for(code), category)
        with self.assertRaises(ValueError):
            category_for('990101')

    def test_full_day_and_midnight_crossing(self):
        result = normalize_activities(source_rows(), LABELS)
        self.assertEqual(result, [[0, 120, '010101'], [120, 960, '050101'], [1080, 360, '010101']])
        self.assertEqual(sum(a[1] for a in result), 1440)

    def test_final_untruncated_stop_can_pass_0400(self):
        self.assertEqual(normalize_activities(source_rows(tail=180), LABELS)[-1], [1080, 360, '010101'])

    def test_all_day_activity(self):
        self.assertEqual(normalize_activities(source_rows((1440,), ('010101',)), LABELS), [[0, 1440, '010101']])

    def test_midnight_2400_equals_0000(self):
        rows = source_rows((1200, 240), ('050101', '010101'))
        rows[0]['TUSTOPTIME'] = '24:00:00'
        rows[1]['TUSTARTTIM'] = '24:00:00'
        self.assertEqual(normalize_activities(rows, LABELS)[1][0], 1200)

    def test_gaps_overlaps_missing_codes_and_wrong_totals_fail(self):
        for field, value in [('TUSTARTTIM', '06:01:00'), ('TUSTARTTIM', '05:59:00'),
                             ('TUSTOPTIME', '22:01:00'), ('TUACTDUR24', '959'),
                             ('TUCUMDUR24', '999'), ('TUACTIVITY_N', '1'),
                             ('TRCODE', '059999'), ('TUTIER1CODE', '6')]:
            with self.subTest(field=field, value=value):
                rows = source_rows()
                rows[1][field] = value
                with self.assertRaises(ValueError):
                    normalize_activities(rows, LABELS)
        with self.assertRaises(ValueError):
            normalize_activities(source_rows((1439,), ('010101',)), LABELS)

    def test_age_topcodes_and_missing(self):
        self.assertEqual(age_band(15), '15–24')
        self.assertEqual(age_band(25), '25–34')
        self.assertEqual(age_band(80), '65+')
        self.assertEqual(age_band(85), '65+')
        self.assertEqual(age_band(-1), 'unknown')
        with self.assertRaises(ValueError):
            age_band(14)

    def test_join_uses_person_identifier_and_excludes_nonhousehold_children(self):
        case = '20250101000001'
        respondent = {'TUCASEID': case, 'TULINENO': '1', 'TELFS': '5', 'TRCHILDNUM': '0', 'TUDIARYDAY': '1', 'TUDIARYDATE': '20250105'}
        roster = [{'TUCASEID': case, 'TULINENO': '2', 'TEAGE': '6', 'TERRP': '40'},
                  {'TUCASEID': case, 'TULINENO': '1', 'TEAGE': '80', 'TERRP': '18'}]
        data = build_collection([respondent], roster, source_rows(), LABELS)
        diary = data['diaries'][0]
        self.assertEqual(diary['age'], '65+')
        self.assertEqual(diary['ageValue'], 80)
        self.assertFalse(diary['children'])
        self.assertEqual(diary['employment'], 'Not in labor force')
        with self.assertRaises(ValueError):
            build_collection([respondent, respondent], roster, source_rows(), LABELS)
        with self.assertRaises(ValueError):
            build_collection([respondent], roster + [roster[0]], source_rows(), LABELS)
        with self.assertRaises(ValueError):
            build_collection([respondent], roster, [], LABELS)

    def test_csv_in_archive(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / 'atusact-2025.zip'
            buffer = io.StringIO()
            rows = source_rows()
            writer = csv.DictWriter(buffer, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)
            with zipfile.ZipFile(path, 'w') as archive:
                archive.writestr('atusact_2025.dat', buffer.getvalue())
            read, provenance = read_table(Path(temporary), 'act')
            self.assertEqual(read, rows)
            self.assertEqual(len(provenance['sha256']), 64)

    def test_download_links_are_discovered_not_guessed(self):
        parser = DownloadLinks()
        parser.feed('<a href="/tus/special.requests/atusact-2025.zip">Activity</a><a href="https://download.bls.gov/a/atusresp-2025.zip">Respondent</a>')
        self.assertEqual(parser.links['act'], 'https://www.bls.gov/tus/special.requests/atusact-2025.zip')
        with self.assertRaises(ValueError):
            parser.feed('<a href="https://example.com/atusrost-2025.zip">Roster</a>')

    def test_lexicon_hierarchy_and_wrapped_labels(self):
        # Artificial PDF-layout text, not a copy of the real coding lexicon.
        lines = ['Major Categories    2nd-tier           3rd-tier', '01 Personal Care']
        for second in range(1, 5):
            # Real PDF headings drift independently of the numeric code columns.
            lines.append('Major Categories    2nd-tier                                      3rd-tier')
            lines.append(' ' * 20 + f'{second:02} Example group')
            for third in range(1, 100):
                label = 'Sleeping' if second == third == 1 else 'Synthetic code description'
                lines.append(' ' * 38 + f'{third:02} {label}')
        lines += ['05 Work', ' ' * 20 + '01 Working', ' ' * 38 + '01 Work, main job',
                  ' ' * 41 + '(wrapped description)']
        labels = parse_lexicon('\n'.join(lines))
        self.assertEqual(labels['010101'], 'Sleeping')
        self.assertEqual(labels['050101'], 'Work, main job (wrapped description)')
        self.assertEqual(len(labels), 397)

    def test_archive_provenance_requires_matching_source_bytes(self):
        files = [{'file': 'atusact-2025.zip', 'sha256': 'a' * 64}]
        archive_url = 'https://web.archive.org/web/20260819213652id_/https://www.bls.gov/tus/datafiles/atusact-2025.zip'
        manifest = {'files': [{'file': 'atusact-2025.zip', 'sha256': 'a' * 64,
                               'archiveUrl': archive_url, 'archiveTimestamp': '20260819213652'}]}
        add_download_provenance(files, manifest)
        self.assertEqual(files[0]['archiveUrl'], archive_url)
        files[0]['sha256'] = 'b' * 64
        with self.assertRaises(ValueError):
            add_download_provenance(files, manifest)

    def test_cli_is_reproducible_and_keeps_existing_asset_on_error(self):
        # Exercise the real-file reader with synthetic, temporary source files.
        # No output from this test is copied into the site.
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            case = '20250101000001'
            tables = {
                'resp': [{'TUCASEID': case, 'TULINENO': '1', 'TELFS': '1',
                          'TRCHILDNUM': '0', 'TUDIARYDAY': '2'}],
                'rost': [{'TUCASEID': case, 'TULINENO': '1', 'TEAGE': '42', 'TERRP': '18'}],
                'act': source_rows(tail=180),
            }
            def save_tables():
                for kind, rows in tables.items():
                    with (directory / f'atus{kind}-2025.dat').open('w') as stream:
                        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
                        writer.writeheader()
                        writer.writerows(rows)
            save_tables()
            labels_path = directory / 'synthetic-labels.json'
            labels_path.write_text(json.dumps(LABELS))
            output = directory / 'test-output.json'
            command = [sys.executable, str(Path(__file__).with_name('prepare.py')),
                       '--source-dir', temporary, '--labels', str(labels_path),
                       '--output', str(output), '--limit', '0']
            first = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            saved = output.read_bytes()
            parsed = json.loads(saved)
            self.assertEqual(len(parsed['provenance']['files']), 4)
            self.assertEqual(parsed['validation']['minutesPerDiary'], 1440)
            second = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(second.returncode, 0, second.stderr)
            self.assertEqual(output.read_bytes(), saved)
            tables['act'][0]['TUACTDUR24'] = '119'
            save_tables()
            rejected = subprocess.run(command, capture_output=True, text=True)
            self.assertNotEqual(rejected.returncode, 0)
            self.assertIn('Existing output was not replaced', rejected.stderr)
            self.assertEqual(output.read_bytes(), saved)


if __name__ == '__main__':
    unittest.main()
