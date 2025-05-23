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
    <div
      className="test_mb0iw43n_i4nvm-bobs_mb0gvgim_g0eoz-leaderboard"
      data-styled="background"
    >
      <Button />
      <h2 className="test_mb0iw43n_i4nvm-bobs_mb0gvgim_g0eoz-leaderboard-title">
        Leaderboard
      </h2>
      <ul className="test_mb0iw43n_i4nvm-bobs_mb0gvgim_g0eoz-leaderboard-list">
        {leaders.map((leader, idx) => (
          <li
            key={leader.name}
            className="test_mb0iw43n_i4nvm-bobs_mb0gvgim_g0eoz-leaderboard-item"
          >
            <span className="test_mb0iw43n_i4nvm-bobs_mb0gvgim_g0eoz-leaderboard-rank">
              #{idx + 1}
            </span>
            <span className="test_mb0iw43n_i4nvm-bobs_mb0gvgim_g0eoz-leaderboard-name">
              {leader.name}
            </span>
            <span className="test_mb0iw43n_i4nvm-bobs_mb0gvgim_g0eoz-leaderboard-score">
              {leader.score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
