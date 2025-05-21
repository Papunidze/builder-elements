import React, { useState } from "react";
import LeftBar from "./layout/left-bar/left-bar";
import Content from "./layout/content/content";
import "./App.css";

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>("");

  return (
    <div className="app-container">
      <LeftBar onSelect={setSelectedFile} />
      <Content fileName={selectedFile} />
    </div>
  );
};

export default App;
