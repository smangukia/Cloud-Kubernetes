const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const app = express();
app.use(express.json());

app.post("/calculate", (req, res) => {
  const { file, product } = req.body;

  if (!file || !product) {
    return res.status(400).json({
      file: file || null,
      error: "Invalid JSON input.",
    });
  }
  const filePath = path.join("/mnt/data", file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      file,
      error: "File not found.",
    });
  }

  let totalSum = 0;
  let isCSVValid = true;

  try {
    const fileStream = fs.createReadStream(filePath);
    fileStream
      .pipe(
        csv({
          trim: true,
          skipLines: 0,
        })
      )
      .on("data", (row) => {
        if (row.product && row.product.trim() === product.trim()) {
          let amountValue = row.amount;
          
          if (amountValue === undefined) {
            amountValue = row[' amount'];
          }
          
          if (amountValue === undefined) {
            amountValue = row['amount '];
          }
          
          if (amountValue === undefined) {
            amountValue = row[' amount '];
          }

          if (amountValue !== undefined) {
            const amount = parseInt(amountValue.trim(), 10);
            if (!isNaN(amount)) {
              totalSum += amount;
            }
          }
        }
      })
      .on("end", () => {
        if (isCSVValid) {
          res.status(200).json({
            file,
            sum: totalSum,
          });
        }
      })
      .on("error", (err) => {
        isCSVValid = false;
        console.error("Error reading file:", err.message);
        res.status(400).json({
          file,
          error: "Input file not in CSV format.",
        });
      });
  } catch (err) {
    console.error("Unexpected error:", err.message);
    res.status(500).json({
      file,
      error: `An unexpected error occurred: ${err.message}`,
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Container 2 is running on port ${PORT}`);
});