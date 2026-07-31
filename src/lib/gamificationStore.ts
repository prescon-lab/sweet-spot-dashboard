import { syncToCloud } from "./cloudSync";

export interface GameRule {
  id: string;
  description: string;
  points: number;
}

export interface Game {
  id: string;
  name: string;
  rules: GameRule[];
  active: boolean;
  createdAt: string;
}

export interface UserScoreRecord {
  id: string;
  profileId: string;
  gameId: string;
  ruleId: string;
  quantity: number;
  updatedAt: string;
}

export interface GamificationState {
  games: Game[];
  scores: UserScoreRecord[];
}

const STORE_KEY = "vertentes_gamification";

const getDefaultState = (): GamificationState => ({
  games: [],
  scores: [],
});

export const gamificationStore = {
  getState(): GamificationState {
    if (typeof window !== "undefined") {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) {
          return JSON.parse(data);
        }
      } catch (e) {
        console.error("Failed to load gamification store", e);
      }
    }
    return getDefaultState();
  },

  _saveState(state: GamificationState) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
        syncToCloud(STORE_KEY, state);
        window.dispatchEvent(new Event("gamificationUpdated"));
      } catch (e) {
        console.error("Failed to save gamification store", e);
      }
    }
  },

  // GAMES
  addGame(name: string): Game {
    const state = this.getState();
    const newGame: Game = {
      id: crypto.randomUUID(),
      name,
      rules: [],
      active: true,
      createdAt: new Date().toISOString(),
    };
    state.games.push(newGame);
    this._saveState(state);
    return newGame;
  },

  toggleGameActive(gameId: string) {
    const state = this.getState();
    const game = state.games.find((g) => g.id === gameId);
    if (game) {
      game.active = !game.active;
      this._saveState(state);
    }
  },

  deleteGame(gameId: string) {
    const state = this.getState();
    state.games = state.games.filter((g) => g.id !== gameId);
    state.scores = state.scores.filter((s) => s.gameId !== gameId);
    this._saveState(state);
  },

  // RULES
  addRule(gameId: string, description: string, points: number) {
    const state = this.getState();
    const game = state.games.find((g) => g.id === gameId);
    if (game) {
      game.rules.push({
        id: crypto.randomUUID(),
        description,
        points,
      });
      this._saveState(state);
    }
  },

  deleteRule(gameId: string, ruleId: string) {
    const state = this.getState();
    const game = state.games.find((g) => g.id === gameId);
    if (game) {
      game.rules = game.rules.filter((r) => r.id !== ruleId);
      state.scores = state.scores.filter(
        (s) => !(s.gameId === gameId && s.ruleId === ruleId)
      );
      this._saveState(state);
    }
  },

  // SCORES
  setScore(profileId: string, gameId: string, ruleId: string, quantity: number) {
    const state = this.getState();
    
    const existingIndex = state.scores.findIndex(
      (s) => s.profileId === profileId && s.gameId === gameId && s.ruleId === ruleId
    );

    if (existingIndex >= 0) {
      if (quantity <= 0) {
        state.scores.splice(existingIndex, 1);
      } else {
        state.scores[existingIndex].quantity = quantity;
        state.scores[existingIndex].updatedAt = new Date().toISOString();
      }
    } else if (quantity > 0) {
      state.scores.push({
        id: crypto.randomUUID(),
        profileId,
        gameId,
        ruleId,
        quantity,
        updatedAt: new Date().toISOString(),
      });
    }

    this._saveState(state);
  },

  getScoresForProfileAndGame(profileId: string, gameId: string): UserScoreRecord[] {
    const state = this.getState();
    return state.scores.filter((s) => s.profileId === profileId && s.gameId === gameId);
  },

  calculateTotalScore(profileId: string, gameId: string): number {
    const state = this.getState();
    const game = state.games.find((g) => g.id === gameId);
    if (!game) return 0;

    const userScores = this.getScoresForProfileAndGame(profileId, gameId);
    
    return userScores.reduce((total, scoreRec) => {
      const rule = game.rules.find((r) => r.id === scoreRec.ruleId);
      if (rule) {
        return total + rule.points * scoreRec.quantity;
      }
      return total;
    }, 0);
  },

  getRanking(gameId: string): { profileId: string; totalScore: number }[] {
    const state = this.getState();
    const game = state.games.find((g) => g.id === gameId);
    if (!game) return [];

    const profileIds = Array.from(
      new Set(state.scores.filter((s) => s.gameId === gameId).map((s) => s.profileId))
    );

    const ranking = profileIds.map((profileId) => ({
      profileId,
      totalScore: this.calculateTotalScore(profileId, gameId),
    }));

    return ranking.sort((a, b) => b.totalScore - a.totalScore);
  },
};
