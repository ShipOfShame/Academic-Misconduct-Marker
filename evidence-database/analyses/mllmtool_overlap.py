"""Compare the released JSON splits without loading research code or models.

Usage: python3 mllmtool_overlap.py /path/to/T+X-T_data > result.json
Array indices in the output are zero-based. IDs alone are not unique.
"""
import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path

COMMIT = '8b74aad63ac511f6cbd7a74fb12aceee33975cf8'
TRAIN_FILES = ('text_t2t.json', 'audio_tx2t.json', 'image_tx2t.json', 'video_tx2t.json')
TEST_FILE = 'combined_data.json'


def input_key(row, strip=False):
    query = row['conversations'][0]['value']
    if strip:
        query = query.strip()
    return (row['input_modality'], query, *(
        row.get(m + '_path', row.get(m + '_name', ''))
        for m in ('image', 'audio', 'video')
    ))


def analyze(directory):
    records, sources = {}, []
    for filename in (*TRAIN_FILES, TEST_FILE):
        raw = (directory / filename).read_bytes()
        records[filename] = json.loads(raw)
        sources.append(dict(file=filename, sha256=hashlib.sha256(raw).hexdigest(),
                            rows=len(records[filename]), url=(
            'https://github.com/Chenyu-Wang567/MLLM-Tool/blob/' + COMMIT
            + '/data/IT_data_ins/T%2BX-T_data/' + filename)))
    training = defaultdict(list)
    normalized_training = set()
    for filename in TRAIN_FILES:
        for index, row in enumerate(records[filename]):
            assert len(row['conversations']) == 2
            assert isinstance(row['conversations'][1]['value'], str)
            training[input_key(row)].append(dict(
                file=filename, index=index, id=row['id'],
                answer=row['conversations'][1]['value']))
            normalized_training.add(input_key(row, strip=True))
    matches = []
    test = records[TEST_FILE]
    for index, row in enumerate(test):
        assert len(row['conversations']) == 2
        assert isinstance(row['conversations'][1]['value'], list)
        key = input_key(row)
        if key not in training:
            continue
        train_rows = training[key]
        answers = {r['answer'] for r in train_rows}
        targets = set(row['conversations'][1]['value'])
        matches.append(dict(
            test_index=index, test_id=row['id'], modality=key[0],
            input_sha256=hashlib.sha256(json.dumps(key, ensure_ascii=False).encode()).hexdigest(),
            test_targets=sorted(targets), shared_answers=sorted(targets & answers),
            all_targets_seen=targets <= answers, training_rows=train_rows))
    by_modality = {}
    for modality in ('text', 'audio', 'image', 'video'):
        subset = [m for m in matches if m['modality'] == modality]
        by_modality[modality] = dict(
            test_rows=sum(r['input_modality'] == modality for r in test),
            exact_overlap=len(subset),
            with_shared_answer=sum(bool(r['shared_answers']) for r in subset),
            all_targets_seen=sum(r['all_targets_seen'] for r in subset))
    return dict(
        commit=COMMIT, method='Exact decoded query string, modality and all media path fields; no whitespace normalization',
        sources=sources, training_rows=sum(len(records[f]) for f in TRAIN_FILES),
        test_rows=len(test), exact_overlap=len(matches),
        distinct_overlapping_inputs=len({m['input_sha256'] for m in matches}),
        with_shared_answer=sum(bool(m['shared_answers']) for m in matches),
        all_targets_seen=sum(m['all_targets_seen'] for m in matches),
        whitespace_trimmed_overlap=sum(input_key(r, True) in normalized_training for r in test),
        by_modality=by_modality, matches=matches)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source_directory', type=Path)
    args = parser.parse_args()
    print(json.dumps(analyze(args.source_directory), ensure_ascii=False, indent=2))
