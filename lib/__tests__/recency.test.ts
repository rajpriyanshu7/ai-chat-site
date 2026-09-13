import { describe, expect, it } from 'vitest';
import { groupByRecency, type Conversation } from '../history';

// Fixed local noon so day boundaries never depend on the wall clock.
const NOW = new Date(2026, 8, 13, 12, 0, 0).getTime();
const DAY = 24 * 60 * 60 * 1000;
const midnightToday = new Date(2026, 8, 13).getTime();
const midnightYesterday = new Date(2026, 8, 12).getTime();

function conv(id: string, updatedAt: number): Conversation {
  return { id, title: id, model: 'm', updatedAt, messages: [] };
}

describe('groupByRecency', () => {
  it('returns [] for empty input', () => {
    expect(groupByRecency([], NOW)).toEqual([]);
  });

  it('places 23:59 in Yesterday and 00:00 in Today', () => {
    const late = conv('late', midnightToday - 60 * 1000);
    const edge = conv('edge', midnightToday);
    const labels = Object.fromEntries(
      groupByRecency([late, edge], NOW).map(g => [g.label, g.items.map(c => c.id)]),
    );
    expect(labels['Today']).toEqual(['edge']);
    expect(labels['Yesterday']).toEqual(['late']);
  });

  it('places exactly-yesterday-midnight in Yesterday (newer day wins)', () => {
    const groups = groupByRecency([conv('y', midnightYesterday)], NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('Yesterday');
  });

  it('buckets older ranges and omits empty sections', () => {
    const groups = groupByRecency(
      [
        conv('t', NOW),
        conv('week', midnightToday - 3 * DAY),
        conv('old', midnightToday - 30 * DAY),
      ],
      NOW,
    );
    expect(groups.map(g => g.label)).toEqual(['Today', 'Previous 7 days', 'Older']);
  });

  it('sorts within a section newest-first', () => {
    const groups = groupByRecency(
      [conv('a', NOW - 3000), conv('b', NOW - 1000), conv('c', NOW - 2000)],
      NOW,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map(c => c.id)).toEqual(['b', 'c', 'a']);
  });
});
