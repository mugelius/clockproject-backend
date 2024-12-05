// Import necessary modules
const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const port = 3000;

// Enable CORS for all origins
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Define path to the data file (purchased seconds)
const dataFilePath = "./purchasedseconds.json";

// Route to fetch purchased seconds
app.get("/purchasedSeconds", (req, res) => {
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      return res.status(500).send("Error reading the file.");
    }

    // Parse the JSON data or return an empty object if the file is empty
    const parsedData = JSON.parse(data || "{}");

    // Send the parsed data back as JSON
    res.json(parsedData);
  });
});

// Route to handle the purchase of a second
app.post("/purchaseSecond", (req, res) => {
  const { time, message } = req.body;

  // Ensure the time and message are provided
  if (!time || !message) {
    return res.status(400).send("Time and message are required.");
  }

  // Read the current purchased seconds data
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      return res.status(500).send("Error reading the file.");
    }

    const purchasedSeconds = JSON.parse(data || "{}");

    // Check if the second has already been purchased
    if (purchasedSeconds[time]) {
      return res.status(400).send("This second is already purchased!");
    }

    // Add the new purchase
    purchasedSeconds[time] = message;

    // Save the updated purchased seconds data back to the file
    fs.writeFile(dataFilePath, JSON.stringify(purchasedSeconds, null, 2), (err) => {
      if (err) {
        return res.status(500).send("Error saving the purchase.");
      }
      
      // Send success message
      res.send(`You successfully purchased ${time} with message: "${message}"`);
    });
  });
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});