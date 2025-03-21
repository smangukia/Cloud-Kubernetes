const express = require("express");
const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const axios = require("axios");

const app = express();
app.use(express.json());

const BASE_URL = process.env.CONTAINER2_BASE_URL || "http://container-2:5001";
const CONTAINER_2_URL = `${BASE_URL}/calculate`; 

app.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

app.post("/store-file", (req, res) => {
  const { file, data } = req.body;

  if (!file) {
    return res.status(400).json({
      file: null,
      error: "Invalid JSON input.",
    });
  }

  if (!fs.existsSync("/samarth_PV_dir")) {
    try {
      fs.mkdirSync("/samarth_PV_dir", { recursive: true });
    } catch (err) {
      console.error(`Error creating data directory: ${err.message}`);
    }
  }

  const filePath = path.join("/samarth_PV_dir", file);

  try {
    fs.writeFileSync(filePath, data);
    console.log(`File successfully written to ${filePath}`);
    return res.json({
      file: file,
      message: "Success.",
    });
  } catch (err) {
    console.error(`Error writing file: ${err.message}`);
    return res.status(500).json({
      file: file,
      error: "Error while storing the file to the storage.",
    });
  }
});

app.post("/calculate", async (req, res) => {
  const { file, product } = req.body;

  if (!file || !product) {
    return res.status(400).json({
      file: file || null,
      error: "Invalid JSON input.",
    });
  }
  const filePath = path.join("/samarth_PV_dir", file);
  console.log(`Checking file at: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      file,
      error: "File not found.",
    });
  }

  try {
    const readStream = fs.createReadStream(filePath);
    let isCSVValid = true;

    readStream
      .pipe(
        csvParser({
          trim: true,
          skipLines: 0,
        })
      )
      .on("headers", (headers) => {
        const trimmedHeaders = headers.map((h) => h.trim());
        if (
          !trimmedHeaders.includes("product") ||
          !trimmedHeaders.includes("amount")
        ) {
          isCSVValid = false;
          readStream.destroy();
          return res.status(400).json({
            file,
            error: "Input file not in CSV format.",
          });
        }
      })
      .on("error", () => {
        isCSVValid = false;
        readStream.destroy();
        return res.status(400).json({
          file,
          error: "Input file not in CSV format.",
        });
      });

    if (!isCSVValid) {
      return;
    }

    console.log("Forwarding request to Container 2:", { file, product });
    const response = await axios.post(CONTAINER_2_URL, { file, product });

    return res.status(response.status).json(response.data);
  } catch (err) {
    console.error("Error communicating with Container 2:", err.message);
    return res.status(500).json({
      error: "Error communicating with Container 2.",
      details: err.message,
    });
  }
});


const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Container 1 is running on port ${PORT}`);
});