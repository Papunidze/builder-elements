import React, { useEffect, useState } from "react";
import "./right-bar.css";

interface RightBarProps {
  folderName: string;
}

const RightBar: React.FC<RightBarProps> = ({ folderName }) => {
  const [tsText, setTsText] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!folderName) return setTsText("");
    fetch(`/files/${folderName}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((data: Array<{ file: string; tsContent?: string }>) => {
        const s = data.find((f) => f.file === "settings.ts");
        if (!s || !s.tsContent) throw new Error("No settings.ts");
        setTsText(s.tsContent);
      })
      .catch((e: any) => setError(e.message));
  }, [folderName]);

  return (
    <div className="right-bar">
      {!folderName ? (
        <p>Select an element to see its settings…</p>
      ) : error ? (
        <p className="error">Error: {error}</p>
      ) : (
        <pre>{tsText}</pre>
      )}
    </div>
  );
};

export default RightBar;
