import React, { useEffect, useState } from "react";
import "./left-bar.css";

interface LeftBarProps {
  onSelect: (fileName: string) => void;
}

const LeftBar: React.FC<LeftBarProps> = ({ onSelect }) => {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/files")
      .then((r) => r.json())
      .then(setFiles)
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="left-bar">Loading…</div>;
  if (error) return <div className="left-bar error">{error}</div>;

  return (
    <div className="left-bar">
      <ul>
        {files.map((f) => (
          <li key={f} onClick={() => onSelect(f)}>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeftBar;
