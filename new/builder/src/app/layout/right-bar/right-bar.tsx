import React, { useEffect, useRef, useState } from "react";
import "./right-bar.css";
import {
  SettingGroup,
  ColorSetting,
  WidthSetting,
  BorderSettingSet,
  OpacitySetting,
} from "builder-settings-types";

interface RightBarProps {
  folderName: string;
  onStyleChange?: (styles: any) => void;
  initialSettings?: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SettingsObjectType = Record<string, any>;

// cache setting objects per folder
const settingsCache: Record<string, any> = {};

const RightBar: React.FC<RightBarProps> = ({
  folderName,
  onStyleChange,
  initialSettings,
}) => {
  const [error, setError] = useState("");
  const settingsHost = useRef<HTMLDivElement>(null);
  const [loadedSettings, setLoadedSettings] =
    useState<SettingsObjectType | null>(null);

  useEffect(() => {
    if (!folderName) {
      setLoadedSettings(null);
      setError("");
      if (settingsHost.current) settingsHost.current.innerHTML = "";
      return;
    }
    // if previously loaded, reuse
    if (settingsCache[folderName]) {
      setLoadedSettings(settingsCache[folderName]);
      return;
    }
    setError("");
    setLoadedSettings(null);
    if (settingsHost.current) settingsHost.current.innerHTML = "";

    fetch(`/files/${folderName}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(
        (
          data: Array<{
            file: string;
            tsContent?: string;
            originalContent?: string;
            settingsObjectName?: string;
          }>
        ) => {
          const settingsFile = data.find((f) => f.file === "settings.ts");
          const jsContent = settingsFile?.tsContent;

          if (!jsContent) {
            throw new Error("No compiled tsContent for settings.ts available");
          }

          const module = { exports: {} as Record<string, any> };
          const requireFunc = (name: string) => {
            if (name === "builder-settings-types") {
              return {
                SettingGroup,
                ColorSetting,
                WidthSetting,
                BorderSettingSet,
                OpacitySetting,
              };
            }
            throw new Error(`Cannot find module '${name}'`);
          };

          new Function("require", "module", "exports", jsContent)(
            requireFunc,
            module,
            module.exports
          );
          const objectname = settingsFile?.settingsObjectName;
          const settingsObject = module.exports[objectname || "oa_settings"];
          if (!settingsObject) {
            throw new Error(
              "'oa_settings' not found in the compiled settings.ts"
            );
          }
          // cache and set
          settingsCache[folderName] = settingsObject;
          setLoadedSettings(settingsObject);
        }
      )
      .catch((e: any) => {
        console.error("Error loading or processing settings:", e);
        setError(e.message);
        setLoadedSettings(null);
      });
  }, [folderName]);

  useEffect(() => {
    if (!loadedSettings || !settingsHost.current) return;
    // apply any saved values
    if (initialSettings && typeof loadedSettings.setValue === "function") {
      loadedSettings.setValue(initialSettings);
    }
    // draw the controls
    const el = loadedSettings.draw();
    settingsHost.current.innerHTML = "";
    settingsHost.current.appendChild(el);
    // subscribe to changes
    loadedSettings.setOnChange((value: any) => {
      if (onStyleChange) onStyleChange(value);
    });
  }, [loadedSettings, initialSettings, onStyleChange]);

  return (
    <div className="right-bar">
      <div ref={settingsHost} />
      {!folderName && !loadedSettings && !error && (
        <p>Select an element to see its settings…</p>
      )}
      {error && <p className="error">Error: {error}</p>}
    </div>
  );
};

export default RightBar;
