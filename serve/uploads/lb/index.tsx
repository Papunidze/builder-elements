import React from "react";
import "./leaderboard.css";
import Button from "./button";

interface Leader {
  name: string;
  score: number;
}

const Leaderboard: React.FC = () => {
  const leaders: Leader[] = [
    { name: "Giga", score: 1200 },
    { name: "Gela", score: 950 },
    { name: "Eve", score: 780 },
    { name: "Mallory", score: 630 },
  ];

  return (
    <div className="leaderboard2">
      <Button />
      <h2 className="leaderboard-title2">Leaderboard</h2>
      <ul className="leaderboard-list2">
        {leaders.map((leader, idx) => (
          <li key={leader.name} className="leaderboard-item2">
            <span className="leaderboard-rank2">#{idx + 1}</span>
            <span className="leaderboard-name2">{leader.name}</span>
            <span className="leaderboard-score2">{leader.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
