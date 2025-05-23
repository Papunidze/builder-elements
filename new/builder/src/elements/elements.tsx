import React, { useEffect, useRef } from "react";
import "./leaderboard.css";
import { oa_settings } from "./settings";

interface Leader {
  name: string;
  score: number;
}

interface LeaderboardProps {
  showSettings: boolean;
  onSelect: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  showSettings,
  onSelect,
}) => {
  const settingsHost = useRef<HTMLDivElement>(null);

  const leaders: Leader[] = [
    { name: "Giga", score: 1200 },
    { name: "Gela", score: 950 },
    { name: "Eve", score: 780 },
    { name: "Mallory", score: 630 },
  ];
  useEffect(() => {
    if (!settingsHost.current) return;
    if (showSettings) {
      const el = oa_settings.draw();
      settingsHost.current.innerHTML = "";
      settingsHost.current.appendChild(el);
      oa_settings.setOnChange(() => {});
    } else {
      settingsHost.current.innerHTML = "";
    }
  }, [showSettings]);

  return (
    <>
      <div
        className="bobs_mb0gvgim_g0eoz-leaderboard"
        data-styled="background"
        onClick={onSelect}
        style={{ cursor: "pointer" }}
      >
        <h2 className="bobs_mb0gvgim_g0eoz-leaderboard-title">Leaderboard</h2>
        <ul className="bobs_mb0gvgim_g0eoz-leaderboard-list">
          {leaders.map((leader, idx) => (
            <li
              key={leader.name}
              className="bobs_mb0gvgim_g0eoz-leaderboard-item"
            >
              <span className="bobs_mb0gvgim_g0eoz-leaderboard-rank">
                #{idx + 1}
              </span>
              <span className="bobs_mb0gvgim_g0eoz-leaderboard-name">
                {leader.name}
              </span>
              <span className="bobs_mb0gvgim_g0eoz-leaderboard-score">
                {leader.score}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div ref={settingsHost} />
    </>
  );
};

export default Leaderboard;
