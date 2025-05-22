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
  (req, res) => {
    if (!req.files?.tsFiles?.length || !req.files?.cssFile) {
      return res.status(400).send("Need at least one .tsx and one .css file");
    }
    if (!req.body.folderName) {
      return res.status(400).send("Folder name is required.");
    }
    res.send(`Uploaded to folder ${req.body.folderName}`);
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

// 2) keep only index.tsx, *.css and *.ts when reading back
app.get("/files/:folderName", async (req, res) => {
  const dir = path.join(__dirname, "uploads", req.params.folderName);
  try {
    const all = await fs.promises.readdir(dir);
    const filtered = all.filter(
      (f) =>
        f === "index.tsx" ||
        path.extname(f).toLowerCase() === ".css" ||
        path.extname(f).toLowerCase() === ".ts"
    );

    const compiled = await Promise.all(
      filtered.map(async (file) => {
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
          return {
            file,
            // originalContent: src,
            js: out.outputFiles[0].text,
          };
        } else if (ext === ".css") {
          return {
            file,
            cssContent: src,
          };
        } else if (ext === ".ts") {
          return {
            file,
            tsContent: src, // new for your settings.ts
          };
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
