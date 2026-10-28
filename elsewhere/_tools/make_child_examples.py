#!/usr/bin/env python3
"""Invented child-day illustrations, explicitly authorized for the preview.

Not ATUS data, research-derived routines, or observations of real children.
"""
import argparse
from pathlib import Path
from prepare import write_json

CODES = {
    'sleep': {'label': 'Sleeping', 'category': 'sleep'},
    'milk': {'label': 'Having milk', 'category': 'personal'},
    'eat': {'label': 'Eating', 'category': 'personal'},
    'wash': {'label': 'Getting washed and dressed', 'category': 'personal'},
    'bath': {'label': 'Having a bath', 'category': 'personal'},
    'play': {'label': 'Playing', 'category': 'leisure'},
    'outside': {'label': 'Playing outside', 'category': 'leisure'},
    'story': {'label': 'Listening to a story', 'category': 'leisure'},
    'family': {'label': 'Spending time with family', 'category': 'leisure'},
    'school': {'label': 'Learning at school', 'category': 'work'},
    'homework': {'label': 'Doing homework', 'category': 'work'},
    'travel': {'label': 'On the way to school', 'category': 'travel'},
    'home': {'label': 'On the way home', 'category': 'travel'},
    'help': {'label': 'Helping around the house', 'category': 'care'},
}


def example_days():
    # Clock minutes, beginning at 04:00; 24:00–28:00 is the next morning.
    schedules = {
        'Under 1': [(240,'sleep'),(360,'milk'),(390,'wash'),(420,'play'),(480,'sleep'),
                    (570,'milk'),(600,'play'),(690,'sleep'),(780,'eat'),(810,'family'),
                    (900,'sleep'),(960,'milk'),(990,'play'),(1050,'bath'),(1080,'milk'),
                    (1110,'story'),(1140,'sleep'),(1380,'milk'),(1410,'sleep'),
                    (1560,'milk'),(1590,'sleep')],
        '1–3': [(240,'sleep'),(420,'wash'),(450,'eat'),(480,'play'),(600,'outside'),
                (690,'eat'),(750,'sleep'),(870,'play'),(990,'outside'),(1050,'family'),
                (1080,'eat'),(1110,'bath'),(1140,'story'),(1170,'sleep')],
        '4–7': [(240,'sleep'),(420,'wash'),(450,'eat'),(480,'travel'),(510,'school'),
                (720,'eat'),(750,'outside'),(780,'school'),(900,'home'),(930,'play'),
                (1050,'family'),(1080,'eat'),(1140,'bath'),(1170,'story'),(1200,'sleep')],
        '8–14': [(240,'sleep'),(405,'wash'),(435,'eat'),(465,'travel'),(495,'school'),
                 (720,'eat'),(750,'school'),(930,'home'),(960,'outside'),(1020,'homework'),
                 (1080,'eat'),(1125,'help'),(1155,'family'),(1230,'wash'),(1260,'sleep')],
    }
    diaries = []
    for age, weekday in schedules.items():
        for day in (2, 1):
            events = weekday
            if day == 1 and age in ('4–7', '8–14'):
                events = [(240,'sleep'),(480,'wash'),(510,'eat'),(540,'play'),
                          (660,'outside'),(750,'eat'),(810,'family'),(930,'play'),
                          (1050,'help'),(1080,'eat'),(1140,'family'),(1200,'story'),
                          (1230,'wash'),(1260,'sleep')]
            ends = events[1:] + [(1680, '')]
            activities = [[start - 240, end - start, code]
                          for (start, code), (end, _) in zip(events, ends)]
            assert sum(a[1] for a in activities) == 1440
            diaries.append({'id': f'illustrative-{age}-{day}', 'age': age,
                            'employment': 'Not applicable', 'children': True,
                            'day': day, 'activities': activities})
    return {'schema': 1, 'kind': 'illustrative', 'year': None, 'source': None,
            'notice': 'Invented example days for children under 15. Not ATUS observations or research-derived routines.',
            'codes': CODES, 'diaries': diaries}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    write_json(args.output, example_days())
    print(f'Wrote 8 explicitly ILLUSTRATIVE child-day examples to {args.output}')
