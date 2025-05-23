const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const cors = require("cors");

const app = express();
const port = 3000;

// CORS Configuration
const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folderName = req.body.folderName || "default-folder";
    const uploadPath = path.join(__dirname, "uploads", folderName);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

// 1) allow .ts in your filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".tsx" || ext === ".ts" || ext === ".css") {
    cb(null, true);
  } else {
    cb(new Error("Only .tsx, .ts and .css allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.post(
  "/upload",
  upload.fields([
    { name: "tsFiles", maxCount: 10 },
    { name: "cssFile", maxCount: 1 },
  ]),
  async (req, res) => {
    if (!req.files?.tsFiles?.length || !req.files?.cssFile) {
      return res.status(400).send("Need at least one .tsx and one .css file");
    }
    const folderName = req.body.folderName;
    if (!folderName) {
      return res.status(400).send("Folder name is required.");
    }

    const uniquePrefix = `${folderName}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const currentUploadPath = path.join(__dirname, "uploads", folderName);

    try {
      // Process TSX files
      if (req.files.tsFiles && req.files.tsFiles.length > 0) {
        for (const file of req.files.tsFiles) {
          const filePath = file.path;
          let content = await fs.promises.readFile(filePath, "utf-8");

          if (file.originalname.toLowerCase() === 'settings.ts') {
            // Regex to find 'export const someName = new SettingGroup('
            // Captures 'someName'
            content = content.replace(
              /(export\s+const\s+)([A-Za-z0-9_]+)(\s*=\s*new\s+SettingGroup\()/,
              `$1${uniquePrefix}_$2$3` // Prepend uniquePrefix to the settings variable name
            );
          } else {
            // Existing logic for .tsx files (className prefixing)
            content = content.replace(
              /className\s*=\s*['"]([A-Za-z0-9_-]+)['"]/g,
              (match, className) => `className="${uniquePrefix}-${className}"`
            );
          }
          await fs.promises.writeFile(filePath, content, "utf-8");
        }
      }

      // Process CSS file
      if (req.files.cssFile && req.files.cssFile.length > 0) {
        const cssFile = req.files.cssFile[0];
        const cssFilePath = cssFile.path;
        let cssContent = await fs.promises.readFile(cssFilePath, "utf-8");
        cssContent = cssContent.replace(
          /\.([A-Za-z_-][A-Za-z0-9_-]*)/g,
          (match, className) => `.${uniquePrefix}-${className}`
        );
        await fs.promises.writeFile(cssFilePath, cssContent, "utf-8");
      }

      // Save the prefix
      const prefixFilePath = path.join(currentUploadPath, "prefix.txt");
      await fs.promises.writeFile(prefixFilePath, uniquePrefix, "utf-8");
      
      res.send(`Uploaded and processed files for folder ${folderName} with prefix ${uniquePrefix}`);

    } catch (error) {
      console.error("Error processing uploaded files:", error);
      return res.status(500).send("Error processing uploaded files.");
    }
  }
);

app.get("/files", (req, res) => {
  const uploadPath = path.join(__dirname, "uploads");
  fs.readdir(uploadPath, { withFileTypes: true }, (err, items) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.json([]);
      }
      console.error("Error reading uploads directory:", err);
      return res.status(500).send("Unable to retrieve files.");
    }
    const directories = items
      .filter((item) => item.isDirectory())
      .map((item) => item.name);
    res.json(directories);
  });
});

app.get("/files/:folderName", async (req, res) => {
  const dir = path.join(__dirname, "uploads", req.params.folderName);

  // Read the stored prefix
  let storedPrefix = "";
  const prefixFilePath = path.join(dir, 'prefix.txt');
  try {
    storedPrefix = (await fs.promises.readFile(prefixFilePath, "utf-8")).trim();
  } catch (e) {
    // Log error if prefix file is not found, but proceed. Client might handle missing prefix.
    console.warn(`prefix.txt not found in ${dir}. Components might not render styles correctly if they rely on this prefix.`);
  }
  
  try {
    const all = await fs.promises.readdir(dir);
    const filtered = all.filter((f) =>
      [".css", ".ts", ".tsx"].includes(path.extname(f).toLowerCase())
    );

    // only keep index.tsx (plus any non‐tsx assets) when it exists
    let finalFiltered = filtered;
    const tsxOnly = filtered.filter(
      (f) => path.extname(f).toLowerCase() === ".tsx"
    );
    if (tsxOnly.includes("index.tsx")) {
      finalFiltered = filtered.filter(
        (f) => path.extname(f).toLowerCase() !== ".tsx" || f === "index.tsx"
      );
    }

    const compiled = await Promise.all(
      finalFiltered.map(async (file) => {
        const ext = path.extname(file).toLowerCase();
        const full = path.join(dir, file);
        const src = await fs.promises.readFile(full, "utf-8");

        if (ext === ".tsx") {
          const out = await esbuild.build({
            entryPoints: [full],
            bundle: true,
            write: false,
            format: "cjs",
            loader: { ".tsx": "tsx", ".css": "text" },
            external: ["react", "react-dom", "react/jsx-runtime"],
          });

          const js = out.outputFiles[0].text;
          return { file, js, prefix: storedPrefix };
        }

        if (ext === ".css") {
          const cssContent = src;
          return { file, cssContent, prefix: storedPrefix };
        }

        if (ext === ".ts") {
          const out = await esbuild.build({
            entryPoints: [full],
            bundle: true,
            write: false,
            format: "cjs",
            loader: { ".ts": "ts", ".css": "text" },
            external: [
              "react",
              "react-dom",
              "react/jsx-runtime",
              "builder-settings-types",
            ],
          });
          // For settings.ts, we need to provide the modified name
          let settingsObjectName = null;
          if (file.toLowerCase() === 'settings.ts') {
            // The prefix is already part of the content, we need to extract the name
            // This assumes the prefix.txt is reliable and settings.ts was processed
            const settingsContent = src; // src is already the content of the (potentially modified) settings.ts
            const match = settingsContent.match(/export\s+const\s+([A-Za-z0-9_]+_settings[A-Za-z0-9_]*)\s*=\s*new\s+SettingGroup\(/);
            if (match && match[1]) {
              settingsObjectName = match[1];
            }
          }
          return { file, tsContent: out.outputFiles[0].text, settingsObjectName, prefix: storedPrefix };
        }

        return { file };
      })
    );

    res.json(compiled);
  } catch (err) {
    return err.code === "ENOENT"
      ? res.status(404).send("Folder not found")
      : res.status(500).send(err.message);
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(500).send(`Multer error: ${err.message}`);
  } else if (err) {
    return res.status(500).send(`Error: ${err.message}`);
  }
  next();
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
