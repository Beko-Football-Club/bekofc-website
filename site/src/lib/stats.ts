export type PlayerMatchStat = {
  player_id: string;
  started: boolean;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
};

export type MatchInput = {
  date: Date;
  opponent: string;
  home_or_away: 'home' | 'away';
  location: string;
  status: 'upcoming' | 'completed';
  beko_score?: number;
  opponent_score?: number;
  player_stats?: PlayerMatchStat[];
};

export type PlayerStats = {
  player_id: string;
  matches_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  minutes_played: number;
};

export type TeamStats = {
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
};

export function aggregateStats(matches: MatchInput[]): {
  byPlayer: Map<string, PlayerStats>;
  byTeam: TeamStats;
} {
  const byPlayer = new Map<string, PlayerStats>();
  const byTeam: TeamStats = {
    matches_played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
  };

  for (const m of matches) {
    if (m.status !== 'completed') continue;

    byTeam.matches_played += 1;
    byTeam.goals_for += m.beko_score ?? 0;
    byTeam.goals_against += m.opponent_score ?? 0;
    if ((m.beko_score ?? 0) > (m.opponent_score ?? 0)) byTeam.wins += 1;
    else if ((m.beko_score ?? 0) === (m.opponent_score ?? 0)) byTeam.draws += 1;
    else byTeam.losses += 1;

    for (const ps of m.player_stats ?? []) {
      const played = ps.started || ps.minutes_played > 0;
      if (!played) continue;

      const existing = byPlayer.get(ps.player_id) ?? {
        player_id: ps.player_id,
        matches_played: 0,
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        minutes_played: 0,
      };

      existing.matches_played += 1;
      existing.goals += ps.goals;
      existing.assists += ps.assists;
      existing.yellow_cards += ps.yellow_cards;
      existing.red_cards += ps.red_cards;
      existing.minutes_played += ps.minutes_played;

      byPlayer.set(ps.player_id, existing);
    }
  }

  return { byPlayer, byTeam };
}
