import React, { useState } from "react";
import LeftBar from "./layout/left-bar/left-bar";
import Content from "./layout/content/content";
import RightBar from "./layout/right-bar/right-bar";
import "./App.css";

const App: React.FC = () => {
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("");

  const handleSelect = (folder: string) => {
    setSelectedFolders((f) => [...f, folder]);
    setActiveFolder(folder);
  };

  const handleActivate = (folder: string) => {
    setActiveFolder(folder);
  };

  return (
    <div className="app-container">
      <LeftBar onSelect={handleSelect} />
      <div className="elements">
        <Content
          fileNames={selectedFolders}
          onActivate={handleActivate}
          activeItem={activeFolder}
        />
      </div>
      <RightBar folderName={activeFolder} />
    </div>
  );
};

export default App;
