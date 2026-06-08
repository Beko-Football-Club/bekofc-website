import { describe, it, expect } from 'vitest';
import { aggregateStats, type MatchInput } from './stats';

const baseMatch: Omit<MatchInput, 'status' | 'player_stats'> = {
  date: new Date('2026-09-15'),
  opponent: 'FC Yaounde',
  home_or_away: 'home',
  location: 'Douala',
};

describe('aggregateStats', () => {
  it('returns empty stats for no matches', () => {
    const result = aggregateStats([]);
    expect(result.byPlayer.size).toBe(0);
    expect(result.byTeam.matches_played).toBe(0);
    expect(result.byTeam.goals_for).toBe(0);
    expect(result.byTeam.goals_against).toBe(0);
  });

  it('ignores upcoming matches', () => {
    const result = aggregateStats([
      {
        ...baseMatch,
        status: 'upcoming',
        player_stats: [{ player_id: 'p1', started: true, minutes_played: 90, goals: 1, assists: 0, yellow_cards: 0, red_cards: 0 }],
      },
    ]);
    expect(result.byPlayer.size).toBe(0);
    expect(result.byTeam.matches_played).toBe(0);
  });

  it('counts a single completed match', () => {
    const result = aggregateStats([
      {
        ...baseMatch,
        status: 'completed',
        beko_score: 2,
        opponent_score: 1,
        player_stats: [
          { player_id: 'p1', started: true, minutes_played: 90, goals: 2, assists: 0, yellow_cards: 1, red_cards: 0 },
          { player_id: 'p2', started: true, minutes_played: 80, goals: 0, assists: 1, yellow_cards: 0, red_cards: 0 },
          { player_id: 'p3', started: false, minutes_played: 0, goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 },
        ],
      },
    ]);
    expect(result.byPlayer.size).toBe(2); // p3 didn't play
    expect(result.byPlayer.get('p1')?.goals).toBe(2);
    expect(result.byPlayer.get('p1')?.matches_played).toBe(1);
    expect(result.byPlayer.get('p1')?.yellow_cards).toBe(1);
    expect(result.byPlayer.get('p2')?.assists).toBe(1);
    expect(result.byPlayer.get('p2')?.minutes_played).toBe(80);
    expect(result.byTeam.matches_played).toBe(1);
    expect(result.byTeam.goals_for).toBe(2);
    expect(result.byTeam.goals_against).toBe(1);
    expect(result.byTeam.wins).toBe(1);
    expect(result.byTeam.draws).toBe(0);
    expect(result.byTeam.losses).toBe(0);
  });

  it('sums across multiple completed matches', () => {
    const result = aggregateStats([
      {
        ...baseMatch,
        status: 'completed',
        beko_score: 2,
        opponent_score: 1,
        player_stats: [
          { player_id: 'p1', started: true, minutes_played: 90, goals: 2, assists: 0, yellow_cards: 0, red_cards: 0 },
        ],
      },
      {
        ...baseMatch,
        status: 'completed',
        beko_score: 0,
        opponent_score: 0,
        player_stats: [
          { player_id: 'p1', started: true, minutes_played: 90, goals: 0, assists: 1, yellow_cards: 0, red_cards: 0 },
        ],
      },
    ]);
    expect(result.byPlayer.get('p1')?.goals).toBe(2);
    expect(result.byPlayer.get('p1')?.assists).toBe(1);
    expect(result.byPlayer.get('p1')?.matches_played).toBe(2);
    expect(result.byTeam.matches_played).toBe(2);
    expect(result.byTeam.wins).toBe(1);
    expect(result.byTeam.draws).toBe(1);
    expect(result.byTeam.losses).toBe(0);
  });

  it('counts a loss', () => {
    const result = aggregateStats([
      {
        ...baseMatch,
        status: 'completed',
        beko_score: 0,
        opponent_score: 3,
        player_stats: [],
      },
    ]);
    expect(result.byTeam.wins).toBe(0);
    expect(result.byTeam.losses).toBe(1);
  });

  it('treats missing player_stats as no players played', () => {
    const result = aggregateStats([
      {
        ...baseMatch,
        status: 'completed',
        beko_score: 1,
        opponent_score: 0,
      },
    ]);
    expect(result.byPlayer.size).toBe(0);
    expect(result.byTeam.matches_played).toBe(1);
    expect(result.byTeam.goals_for).toBe(1);
  });
});
