import React from "react";
import GameCard from "./GameCard";

const games = [
  { name: "BINGO",     game: "BINGO",    path: "/bingo/stake" },
  { name: "KENO",      game: "KENO",     path: "/bingo/stake" },
  { name: "AVIATOR",   game: "AVIATOR",  path: "/bingo/stake" },
  { name: "PLINKO",    game: "PLINKO",   path: "/bingo/stake" },
  { name: "BALLOON",   game: "BALLOON",  path: "/bingo/stake" },
  { name: "HI-LO",     game: "HI-LO",   path: "/bingo/stake" },
  { name: "BINGO 75",  game: "GAME 7",   path: "/bingo/stake" },
  { name: "ROULETTE",  game: "ROULETTE", path: "/bingo/stake" },
];

export default function GameGrid() {
  return (
    <div className="grid grid-cols-2 gap-[10px]">
      {games.map((game) => (
        <GameCard
          key={game.name}
          name={game.name}
          game={game.game}
          path={game.path}
        />
      ))}
    </div>
  );
}
