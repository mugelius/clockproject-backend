// Import necessary modules
const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000; // Use Render's environment port if available

// Enable CORS for all origins
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Define path to the data file (purchased seconds)
const dataFilePath = "./purchasedseconds.json";

// Root route to test the server is running
app.get("/", (req, res) => {
  res.send("Welcome to the Seconds for Sale API!");
});

// Route to fetch purchased seconds
app.get("/purchasedSeconds", (req, res) => {
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      return res.status(500).send("Error reading the file.");
    }

    // Parse the JSON data or return an empty object if the file is empty
    const parsedData = JSON.parse(data || "{}");
    res.json(parsedData);
  });
});

// Route to handle the purchase of a second
app.post("/purchaseSecond", (req, res) => {
  const { time, message } = req.body;

  if (!time || !message) {
    return res.status(400).send("Time and message are required.");
  }

  // Read the current purchased seconds data
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      return res.status(500).send("Error reading the file.");
    }

    const purchasedSeconds = JSON.parse(data || "{}");

    if (purchasedSeconds[time]) {
      return res.status(400).send("This second is already purchased!");
    }

    // Add the new purchase
    purchasedSeconds[time] = message;

    fs.writeFile(dataFilePath, JSON.stringify(purchasedSeconds, null, 2), (err) => {
      if (err) {
        return res.status(500).send("Error saving the purchase.");
      }
      res.send(`You successfully purchased ${time} with message: "${message}"`);
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});