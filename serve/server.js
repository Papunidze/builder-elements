const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild"); // ← add
const cors = require("cors"); // Add cors require

const app = express();
const port = 3000;

// CORS Configuration
const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions)); // Use cors middleware

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
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "video/mp2t" ||
      file.originalname.endsWith(".ts") ||
      file.originalname.endsWith(".tsx")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only .ts and .tsx files are allowed."),
        false
      );
    }
  },
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.post(
  "/upload",
  upload.fields([
    { name: "file1", maxCount: 1 },
    { name: "file2", maxCount: 1 },
  ]),
  (req, res) => {
    if (!req.files || !req.files.file1 || !req.files.file2) {
      return res.status(400).send("Both files are required.");
    }
    if (!req.body.folderName) {
      return res.status(400).send("Folder name is required.");
    }
    res.send(`Files uploaded successfully to folder: ${req.body.folderName}`);
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
  const folderName = req.params.folderName;
  const dir = path.join(__dirname, "uploads", folderName);
  console.log(`Reading files from directory: ${dir}`);

  try {
    const files = await fs.promises.readdir(dir);
    console.log(`Files found in ${folderName}:`, files);

    const compiled = await Promise.all(
      files.map(async (file) => {
        const ext = path.extname(file).toLowerCase();
        const filePath = path.join(dir, file);
        console.log(`Processing file: ${filePath}, extension: ${ext}`);

        let originalFileContent = null;
        try {
          originalFileContent = await fs.promises.readFile(filePath, "utf-8");
        } catch (readError) {
          console.error(`Error reading original file ${filePath}:`, readError);
        }

        if (ext === ".ts" || ext === ".tsx") {
          try {
            console.log(`Attempting to build: ${filePath}`);
            const result = await esbuild.build({
              entryPoints: [filePath],
              bundle: true,
              write: false,
              format: "cjs",
              sourcemap: false,
              loader: {
                ".tsx": "tsx",
                ".ts": "ts",
                ".scss": "text",
              },
              external: ["react", "react-dom", "react/jsx-runtime"],
            });
            console.log(
              `Build successful for: ${filePath}, output files:`,
              result.outputFiles.length
            );
            if (result.outputFiles && result.outputFiles.length > 0) {
              return {
                file,
                js: result.outputFiles[0].text,
                originalContent: originalFileContent,
              };
            } else {
              console.error(`esbuild returned no output files for ${filePath}`);
              return {
                file,
                js: null,
                originalContent: originalFileContent,
                error: "esbuild no output",
              };
            }
          } catch (buildError) {
            console.error(`esbuild error for ${filePath}:`, buildError);
            return {
              file,
              js: null,
              originalContent: originalFileContent,
              error: buildError.message,
            };
          }
        }

        console.log(`Skipping non-TS/TSX file transpilation: ${filePath}`);
        return { file, js: null, originalContent: originalFileContent };
      })
    );
    res.json(compiled);
  } catch (err) {
    console.error(`Error in /files/:folderName route for ${folderName}:`, err);
    if (err.code === "ENOENT") {
      return res.status(404).send("Folder not found.");
    }
    res
      .status(500)
      .send(`Unable to retrieve or compile files. Error: ${err.message}`);
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
