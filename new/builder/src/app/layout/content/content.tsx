import React, { useEffect, useRef, useState } from "react";
import ErrorBoundary from "../../components/ErrorBoundary";
import "./content.css";

interface ContentProps {
  fileNames: string[];
  onActivate?: (fileName: string) => void;
  activeItem?: string;
  styleConfig?: any;
}

interface LoadedItem {
  fileName: string;
  Comp: React.ComponentType<any> | null;
  loading: boolean;
  error: string;
  jsCode?: string;
  cssCode?: string;
}

const transformStyleSettings = (settings: any): React.CSSProperties => {
  if (!settings || typeof settings !== "object") return {};
  const topKeys = Object.keys(settings);
  if (topKeys.length === 1 && typeof settings[topKeys[0]] === "object") {
    settings = settings[topKeys[0]];
  }
  const getVal = (v: any) =>
    v && typeof v === "object" && "default" in v ? v.default : v;
  const flatStyles: React.CSSProperties = {};

  const color = getVal(settings.color);
  if (color) flatStyles.backgroundColor = `rgb(${color})`;

  const width = getVal(settings.width);
  if (width !== undefined) flatStyles.width = `${width}px`;

  const opacity = getVal(settings.opacity) ?? getVal(settings.opacit);
  if (opacity !== undefined) flatStyles.opacity = opacity;

  if (settings.borders) {
    const b = settings.borders;
    const size = getVal(b.size);
    if (size !== undefined) flatStyles.borderWidth = `${size}px`;
    const bcolor = getVal(b.color);
    if (bcolor) flatStyles.borderColor = `rgb(${bcolor})`;
    const radius = getVal(b.radius);
    if (radius !== undefined) flatStyles.borderRadius = `${radius}px`;
  }

  return flatStyles;
};

const Content: React.FC<ContentProps> = ({
  fileNames,
  onActivate,
  activeItem,
  styleConfig,
}) => {
  const [items, setItems] = useState<LoadedItem[]>([]);
  const current = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (
      current.current &&
      activeItem &&
      styleConfig &&
      styleConfig[activeItem]
    ) {
      const styles = transformStyleSettings(styleConfig[activeItem]);
      Object.assign(current.current.style, styles);
    }
  }, [activeItem, styleConfig]);

  useEffect(() => {
    const knownFileNames = new Set(items.map((item) => item.fileName));
    const filesInProp = new Set(fileNames);

    const newFilesToLoad = fileNames.filter((fn) => !knownFileNames.has(fn));

    const filesToRemove = items.filter(
      (item) => !filesInProp.has(item.fileName)
    );

    if (newFilesToLoad.length > 0) {
      const newLoadingItems: LoadedItem[] = newFilesToLoad.map((fn) => ({
        fileName: fn,
        Comp: null,
        loading: true,
        error: "",
        jsCode: undefined,
        cssCode: undefined,
      }));
      setItems((prevItems) => [...prevItems, ...newLoadingItems]);

      newFilesToLoad.forEach((fileName) => {
        fetch(`/files/${fileName}`)
          .then((r) => {
            if (!r.ok)
              throw new Error(
                `Failed to fetch ${fileName}: ${r.status} ${r.statusText}`
              );
            return r.json();
          })
          .then(
            (
              data: Array<{ file: string; js?: string; cssContent?: string }>
            ) => {
              const jsFile = data.find((f) => typeof f.js === "string");
              if (!jsFile || typeof jsFile.js !== "string") {
                throw new Error(
                  `JavaScript content not found or invalid for ${fileName}`
                );
              }

              const module = { exports: {} as any };
              const requireFunc = (name: string) => {
                if (name === "react") return React;
                throw new Error(
                  `Dynamic require of '${name}' is not supported in ${fileName}. Only 'react' can be required.`
                );
              };

              let Comp: React.ComponentType<any> | null = null;
              try {
                new Function("require", "module", "exports", jsFile.js)(
                  requireFunc,
                  module,
                  module.exports
                );
                Comp = (module.exports.default ||
                  module.exports) as React.ComponentType<any>;
                if (!Comp) {
                  throw new Error(
                    `No default export found or export is null for ${fileName}`
                  );
                }
              } catch (e: any) {
                throw new Error(
                  `Error executing JS for ${fileName}: ${e.message}`
                );
              }

              const cssFile = data.find((f) => f.cssContent);
              if (cssFile && cssFile.cssContent) {
                const existingTag = document.head.querySelector(
                  `style[data-file="${fileName}"]`
                );
                if (!existingTag) {
                  const tag = document.createElement("style");
                  tag.setAttribute("data-file", fileName);
                  tag.textContent = cssFile.cssContent;
                  document.head.appendChild(tag);
                }
              }

              const jsText = jsFile.js;
              const cssText = cssFile?.cssContent;

              setItems((prev) =>
                prev.map((it) =>
                  it.fileName === fileName
                    ? {
                        ...it,
                        Comp,
                        loading: false,
                        error: "",
                        jsCode: jsText,
                        cssCode: cssText,
                      }
                    : it
                )
              );
            }
          )
          .catch((e: any) => {
            console.error(`Failed to load component ${fileName}:`, e);
            setItems((prev) =>
              prev.map((it) =>
                it.fileName === fileName
                  ? {
                      ...it,
                      Comp: null,
                      loading: false,
                      error: e.message || "Failed to load component data",
                    }
                  : it
              )
            );
          });
      });
    }

    if (filesToRemove.length > 0) {
      const removedFileNames = new Set(filesToRemove.map((f) => f.fileName));
      setItems((prevItems) =>
        prevItems.filter((item) => !removedFileNames.has(item.fileName))
      );
      filesToRemove.forEach((itemToRemove) => {
        const styleTag = document.head.querySelector(
          `style[data-file="${itemToRemove.fileName}"]`
        );
        if (styleTag) {
          styleTag.remove();
        }
      });
    }
  }, [fileNames]);

  const downloadCombined = () => {
    const styles = Array.from(
      document.querySelectorAll('head style, head link[rel="stylesheet"]')
    )
      .map((n) => n.outerHTML)
      .join("\n");

    const cssTags = items
      .map((item) => (item.cssCode ? `<style>${item.cssCode}</style>` : ""))
      .join("\n");

    const roots = items
      .map((item) => `<div id="root-${item.fileName}"></div>`)
      .join("\n");

    const scripts = items
      .map(
        (item) => `;(function(){
  var module = { exports: {} };
  var require = name => {
    if(name==="react") return React;
    if(name==="react-dom") return ReactDOM;
    throw new Error("Cannot require "+name);
  };
  ${item.jsCode}
  ReactDOM.render(
    React.createElement(module.exports.default||module.exports),
    document.getElementById("root-${item.fileName}")
  );
})();`
      )
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  ${styles}
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  ${cssTags}
</head>
<body>
  ${roots}
  <script>
    ${scripts}
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all-components.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (items.length === 0) return <div className="content">Select a file…</div>;

  return (
    <div className="content">
      <button
        onClick={downloadCombined}
        disabled={items.length === 0}
        style={{ marginLeft: "1rem" }}
      >
        Download Single HTML
      </button>

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
            data-file={fileName}
            onClick={() => onActivate?.(fileName)}
            ref={fileName === activeItem ? current : null}
            style={{
              cursor: "pointer",
              marginBottom: "1rem",
              ...(styleConfig?.[fileName]
                ? transformStyleSettings(styleConfig[fileName])
                : {}),
            }}
          >
            <ErrorBoundary fallback={<div>Render failed for {fileName}.</div>}>
              <Comp />
            </ErrorBoundary>
          </div>
        ) : null
      )}
    </div>
  );
};

export default Content;
