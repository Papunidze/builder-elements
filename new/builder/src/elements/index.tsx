import React, { useState } from "react";
import "./leaderboard.css";
import Leaderboard from "./elements";
import Second from "./secondElements";

const Main: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="elements">
      <Leaderboard
        showSettings={selected === "leaderboard"}
        onSelect={() => setSelected("leaderboard")}
      />
      <Second
        showSettings={selected === "second"}
        onSelect={() => setSelected("second")}
      />
    </div>
  );
};

export default Main;
