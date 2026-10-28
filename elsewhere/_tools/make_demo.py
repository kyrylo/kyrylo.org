#!/usr/bin/env python3
"""Explicit synthetic UI fixtures. Never ATUS observations or real people."""
import argparse
from pathlib import Path
import random
from prepare import category_for, write_json

LABELS = {
    '010101': 'Sleeping', '010102': 'Sleeplessness',
    '010201': 'Washing, dressing and grooming oneself',
    '020101': 'Interior cleaning', '020201': 'Food and drink preparation',
    '030101': 'Physical care for household children',
    '050101': 'Work, main job', '060301': 'Research/homework for class',
    '070101': 'Grocery shopping', '110101': 'Eating and drinking',
    '120101': 'Socializing and communicating with others', '120303': 'Watching television',
    '120312': 'Reading for personal interest', '130131': 'Walking for exercise',
    '180501': 'Travel related to working', '180701': 'Travel related to shopping',
    '500101': 'Unreported time',
}


def create_demo():
    rng = random.Random(2025)
    diaries = []
    for index in range(96):
        age = ['15–24', '25–34', '35–44', '45–54', '55–64', '65+'][index % 6]
        children = bool((index // 6) % 2)
        day = index % 7 + 1
        # Deliberately synthetic schedules, independent of the generated attributes.
        wake = rng.randrange(60, 270, 15)
        times = [(wake, '010101'), (30, '010201'), (30, '110101')]
        if index % 4 == 0:
            times += [(45, '180501'), (240, '050101'), (30, '110101'), (210, '050101'), (45, '180501')]
        elif index % 4 == 1:
            times += [(90, '020201'), (60, '030101'), (30, '110101'), (60, '180701'), (60, '070101'), (90, '120101')]
        elif index % 4 == 2:
            times += [(30, '180501'), (180, '060301'), (45, '110101'), (120, '060301'), (45, '130131'), (30, '180501')]
        else:
            times += [(90, '120312'), (45, '130131'), (60, '020101'), (45, '110101'), (90, '120101'), (60, '070101')]
        times += [(45, '020201'), (30, '110101'), (rng.randrange(60, 150, 15), '120303'), (15, '010201')]
        # Include both post-midnight activity and sleep crossing midnight.
        if index % 5 == 0:
            times += [(60, '010102'), (60, '120312')]
        times += [(1440 - sum(duration for duration, _ in times), '010101')]
        activities, elapsed = [], 0
        for duration, code in times:
            if duration <= 0:
                raise ValueError('Synthetic fixture duration must be positive')
            activities.append([elapsed, duration, code])
            elapsed += duration
        diaries.append({'id': f'{index + 1:03}', 'age': age,
                        'employment': ['Employed', 'Not in labor force', 'Unemployed'][index % 3],
                        'children': children, 'day': day, 'activities': activities})
    return {'schema': 1, 'kind': 'synthetic', 'year': None, 'source': None,
            'notice': 'All diaries and demographic attributes are invented UI fixtures. NOT real ATUS respondents. Official BLS downloads returned HTTP 403 during development.',
            'codes': {code: {'label': label, 'category': category_for(code)} for code, label in LABELS.items()},
            'diaries': diaries}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True, help='Explicit destination prevents accidental replacement of real survey data')
    args = parser.parse_args()
    write_json(args.output, create_demo())
    print(f'Wrote 96 SYNTHETIC demo diaries to {args.output}')
