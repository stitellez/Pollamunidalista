export interface User {
  id: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Match {
  id: string;
  phase: 'group' | 'round_of_32' | 'round_of_16' | 'quarterfinal' | 'semifinal' | 'third_place' | 'final';
  group: string | null;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  homeScore: number | null;
  awayScore: number | null;
  venue: string;
  label?: string;
  locked: boolean;
}

export interface Prediction {
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  submittedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  totalPoints: number;
  predictedCount: number;
  breakdown: { matchId: string; points: number; homeScore: number; awayScore: number }[];
}

export interface StandingRow {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface ScoringConfig {
  exactScore: number;
  correctOutcome: number;
  stacking: 'exclusive' | 'additive';
  bonusRules: { type: string; points: number }[];
}

export interface Config {
  scoring: ScoringConfig;
}

export interface ResultPrediction {
  userId: string;
  name: string;
  homeScore: number | null;
  awayScore: number | null;
  points: number;
}

export interface MatchResult {
  matchId: string;
  phase: Match['phase'];
  group: string | null;
  label: string | null;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  homeScore: number;
  awayScore: number;
  predictions: ResultPrediction[];
}
