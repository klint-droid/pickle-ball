import { useState, useEffect, useMemo } from 'react';
import { GameEngine } from './game/GameEngine';
import type { GameState, GameScore, ScoringMode, DifficultyLevel } from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { Scoreboard } from './components/Scoreboard';
import { MainMenu } from './components/MainMenu';
import { Controls } from './components/Controls';
import { GameOver } from './components/GameOver';
import { PauseMenu } from './components/PauseMenu';
import { LandscapeNotice } from './components/LandscapeNotice';

export default function App() {
  const engine = useMemo(() => new GameEngine(1280, 720), []);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState<GameScore>(engine.score);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [scoringMode, setScoringMode] = useState<ScoringMode>('side-out');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');

  useEffect(() => {
    engine.setListener((state, newScore) => {
      setGameState(state);
      setScore(newScore);
      if (newScore.difficulty) {
        setDifficulty(newScore.difficulty);
      }
    });
  }, [engine]);

  const handleSetScoringMode = (mode: ScoringMode) => {
    setScoringMode(mode);
    engine.setScoringMode(mode);
  };

  const handleSetDifficulty = (diff: DifficultyLevel) => {
    setDifficulty(diff);
    engine.setDifficulty(diff);
  };

  const handleStartGame = () => {
    setShowControls(false);
    engine.startMatch();
  };

  const handlePauseToggle = () => {
    engine.togglePause();
  };

  const handleResume = () => {
    engine.resumeGame();
  };

  const handleRestart = () => {
    engine.restartMatch();
  };

  const handleMainMenu = () => {
    engine.goToMenu();
  };

  return (
    <div className="game-root">
      {/* Mobile Orientation Warning */}
      <LandscapeNotice />

      {/* Main 16:9 Aspect Ratio Game Container */}
      <div className="game-container">
        {/* Interactive 2D Canvas */}
        <GameCanvas engine={engine} />

        {/* In-Game Scoreboard HUD */}
        {gameState !== 'menu' && (
          <Scoreboard
            score={score}
            gameState={gameState}
            onPauseToggle={handlePauseToggle}
            onToggleScoringMode={handleSetScoringMode}
            onSetDifficulty={handleSetDifficulty}
          />
        )}

        {/* Start / Main Menu */}
        {gameState === 'menu' && (
          <MainMenu
            scoringMode={scoringMode}
            onSetScoringMode={handleSetScoringMode}
            difficulty={difficulty}
            onSetDifficulty={handleSetDifficulty}
            onStartGame={handleStartGame}
            onOpenControls={() => setShowControls(true)}
          />
        )}

        {/* Pause Screen */}
        {gameState === 'paused' && (
          <PauseMenu
            difficulty={difficulty}
            onSetDifficulty={handleSetDifficulty}
            onResume={handleResume}
            onRestart={handleRestart}
            onMainMenu={handleMainMenu}
          />
        )}

        {/* Game Over Screen */}
        {gameState === 'gameOver' && (
          <GameOver
            score={score}
            onPlayAgain={handleRestart}
            onMainMenu={handleMainMenu}
          />
        )}

        {/* Controls Modal */}
        {showControls && (
          <Controls onClose={() => setShowControls(false)} />
        )}
      </div>
    </div>
  );
}
