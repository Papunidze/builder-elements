import React, { useEffect, useRef, useState } from "react";
import { oa_settings } from "./settings";
import "./leaderboard.css";
import Button from "./button";

interface Leader {
  name: string;
  score: number;
}

const Leaderboard: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inlineStyle, setInlineStyle] = useState<React.CSSProperties>({});
  const leaders: Leader[] = [
    { name: "Giga", score: 1200 },
    { name: "Gela", score: 950 },
    { name: "Eve", score: 780 },
    { name: "Mallory", score: 630 },
  ];

  useEffect(() => {
    const key = rootRef.current?.dataset.styled;
    if (!key) return;
    const apply = (values: any) => {
      const cfg = values[key] || {};
      const flat: React.CSSProperties = {};
      // background color
      const col = cfg.color?.default;
      if (col) flat.backgroundColor = `rgb(${col})`;
      // width
      const w = cfg.width?.default;
      if (w !== undefined) flat.width = `${w}px`;
      // opacity
      const op = cfg.opacity?.default ?? cfg.opacit?.default;
      if (op !== undefined) flat.opacity = op;
      setInlineStyle(flat);
    };
    oa_settings.setOnChange(apply);
    // initial apply using getValues
    if (typeof oa_settings.getValues === "function") {
      apply(oa_settings.getValues());
    }
    return () => oa_settings.setOnChange(() => {});
  }, []);
  return (
    <div
      ref={rootRef}
      className="bobs_mb0gvgim_g0eoz-leaderboard"
      data-styled="background"
      style={inlineStyle}
    >
      <Button />
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
  );
};

export default Leaderboard;
