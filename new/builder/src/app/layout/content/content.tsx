/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import ErrorBoundary from "../../components/ErrorBoundary";
import "./content.css";

interface ContentProps {
  fileName: string;
}

const Content: React.FC<ContentProps> = ({ fileName }) => {
  const [LoadedComp, setLoadedComp] = useState<React.ComponentType<any> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fileName) {
      setLoadedComp(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    setLoadedComp(null);

    fetch(`/files/${fileName}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: Array<{ js?: string }>) => {
        const file = data.find((f) => typeof f.js === "string");
        if (!file || !file.js) throw new Error("No compiled JS found");

        const js = file.js;

        // Create a fake CommonJS environment
        const module = { exports: {} as any };
        const exports = module.exports;

        const require = (name: string) => {
          if (name === "react") return React;
          throw new Error(`Cannot require '${name}'`);
        };

        // Evaluate the code
        const fn = new Function("require", "module", "exports", js);
        fn(require, module, exports);

        const Comp = module.exports.default || module.exports;

        if (typeof Comp !== "function" && typeof Comp !== "object") {
          throw new Error("Loaded value is not a valid React component");
        }

        setLoadedComp(() => Comp);
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((e: any) => {
        console.error("Error loading component:", e);
        setError(e.message || "Could not load component");
      })
      .finally(() => setLoading(false));
  }, [fileName]);

  if (!fileName) return <div className="content">Select a file…</div>;
  if (loading) return <div className="content">Loading…</div>;
  if (error) return <div className="content error">Error: {error}</div>;

  return LoadedComp ? (
    <div className="content">
      <ErrorBoundary fallback={<div>Render failed for {fileName}.</div>}>
        <LoadedComp message="Hello from dynamic component!" />
      </ErrorBoundary>
    </div>
  ) : (
    <div className="content">Component not loaded.</div>
  );
};

export default Content;
