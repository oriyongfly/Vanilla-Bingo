import React from "react";
import GameCard from "./GameCard";

const games = [
  { name: "BINGO", game: "BINGO" },
  { name: "KENO", game: "KENO" },
  { name: "AVIATOR", game: "AVIATOR" },
  { name: "PLINKO", game: "PLINKO" },
  { name: "BALLOON", game: "BALLOON" },
  { name: "HI-LO", game: "HI-LO" },
  { name: "BINGO 75", game: "GAME 7" },
  { name: "ROULETTE", game: "ROULETTE" },
];

export default function GameGrid() {
  return (
    <div className="grid grid-cols-2 gap-[10px]">
      {games.map((game) => (
        <GameCard
          key={game.name}
          name={game.name}
          game={game.game}
        />
      ))}
    </div>
  );
}
