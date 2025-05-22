import React, { useEffect, useState } from "react";
import ErrorBoundary from "../../components/ErrorBoundary";
import "./content.css";

interface ContentProps {
  fileNames: string[];
  onActivate?: (fileName: string) => void;
}

interface LoadedItem {
  fileName: string;
  Comp: React.ComponentType<any> | null;
  loading: boolean;
  error: string;
}

const Content: React.FC<ContentProps> = ({ fileNames, onActivate }) => {
  const [items, setItems] = useState<LoadedItem[]>([]);

  useEffect(() => {
    const latest = fileNames[fileNames.length - 1];
    if (!latest) return;

    setItems((prev) => [
      ...prev,
      { fileName: latest, Comp: null, loading: true, error: "" },
    ]);

    fetch(`/files/${latest}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(
        (data: Array<{ file: string; js?: string; cssContent?: string }>) => {
          const jsFile = data.find((f) => typeof f.js === "string")!;
          const module = { exports: {} as any };
          const require = (name: string) =>
            name === "react"
              ? React
              : (() => {
                  throw new Error(name);
                })();
          new Function("require", "module", "exports", jsFile.js)(
            require,
            module,
            module.exports
          );
          const Comp = module.exports.default || module.exports;
          const cssFile = data.find((f) => f.cssContent);
          if (cssFile) {
            const tag = document.createElement("style");
            tag.setAttribute("data-file", cssFile.file);
            tag.textContent = cssFile.cssContent!;
            document.head.appendChild(tag);
          }
          setItems((prev) =>
            prev.map((it) =>
              it.fileName === latest ? { ...it, Comp, loading: false } : it
            )
          );
        }
      )
      .catch((e: any) =>
        setItems((prev) =>
          prev.map((it) =>
            it.fileName === latest
              ? { ...it, loading: false, error: e.message }
              : it
          )
        )
      );
  }, [fileNames]);

  if (items.length === 0) return <div className="content">Select a file…</div>;

  return (
    <div className="content">
      {items.map(({ fileName, Comp, loading, error }) =>
        loading ? (
          <div key={fileName}>Loading {fileName}…</div>
        ) : error ? (
          <div key={fileName} className="error">
            Error loading {fileName}: {error}
          </div>
        ) : Comp ? (
          <div
            key={fileName}
            onClick={() => onActivate?.(fileName)}
            style={{ cursor: "pointer", marginBottom: "1rem" }}
          >
            <ErrorBoundary fallback={<div>Render failed for {fileName}.</div>}>
              <Comp message={`Hello from ${fileName}!`} />
            </ErrorBoundary>
          </div>
        ) : null
      )}
    </div>
  );
};

export default Content;
