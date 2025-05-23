import React, { use, useState } from "react";
import LeftBar from "./layout/left-bar/left-bar";
import Content from "./layout/content/content";
import RightBar from "./layout/right-bar/right-bar";
import "./App.css";

const App: React.FC = () => {
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("");
  const [activeStyleConfig, setActiveStyleConfig] = useState<
    Record<string, any>
  >({});

  const handleSelect = (folder: string) => {
    setSelectedFolders((f) => [...f, folder]);
    setActiveFolder(folder);
  };

  const handleActivate = (folder: string) => {
    setActiveFolder(folder);
  };

  const handleStyleChange = (config: any) => {
    if (!activeFolder) return;
    setActiveStyleConfig((prev) => ({
      ...prev,
      [activeFolder]: config,
    }));
  };

  return (
    <div className="app-container">
      <LeftBar onSelect={handleSelect} />
      <div className="elements">
        <Content
          fileNames={selectedFolders}
          onActivate={handleActivate}
          activeItem={activeFolder}
          styleConfig={activeStyleConfig}
        />
      </div>
      <RightBar
        folderName={activeFolder}
        onStyleChange={handleStyleChange}
        initialSettings={activeStyleConfig[activeFolder]}
      />
    </div>
  );
};

export default App;
