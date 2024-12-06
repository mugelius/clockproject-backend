const express = require("express"); // Import Express
const fs = require("fs"); // Import File System module
const cors = require("cors"); // Import CORS middleware

const app = express(); // Initialize Express application
const port = process.env.PORT || 3000; // Set the port (Render assigns a port dynamically)

app.use(cors()); // Enable CORS
app.use(express.json()); // Middleware to parse JSON bodies

// Path to the JSON file
const dataFilePath = "./purchasedseconds.json";

// Route to fetch purchased seconds
app.get("/purchasedSeconds", (req, res) => {
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      console.error("Error reading the purchased seconds file:", err);
      return res.status(500).send("Error reading the file.");
    }

    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      console.error("Error parsing purchased seconds file:", error);
      return res.status(500).send("Malformed data in purchasedseconds.json.");
    }

    if (!parsedData) {
      parsedData = {};
    }

    res.json(parsedData);
  });
});

// Route to handle the purchase of a second
app.post("/purchaseSecond", (req, res) => {
  const { time, message } = req.body;

  if (!time || !message) {
    return res.status(400).send("Time and message are required.");
  }

  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      console.error("Error reading the purchased seconds file:", err);
      return res.status(500).send("Error reading the file.");
    }

    let purchasedSeconds = {};
    try {
      purchasedSeconds = JSON.parse(data);
    } catch (error) {
      console.error("Error parsing purchased seconds file:", error);
      return res.status(500).send("Malformed data in purchasedseconds.json.");
    }

    if (purchasedSeconds[time]) {
      return res.status(400).send("This second is already purchased!");
    }

    purchasedSeconds[time] = message;

    fs.writeFile(dataFilePath, JSON.stringify(purchasedSeconds, null, 2), (err) => {
      if (err) {
        console.error("Error writing to purchased seconds file:", err);
        return res.status(500).send("Error saving the purchase.");
      }
      res.send(`You successfully purchased ${time} with message: "${message}"`);
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});