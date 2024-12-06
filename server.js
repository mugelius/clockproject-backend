// Route to fetch purchased seconds
app.get("/purchasedSeconds", (req, res) => {
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      console.error("Error reading the purchased seconds file:", err);
      return res.status(500).send("Error reading the file.");
    }

    // Handle empty or malformed data
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      console.error("Error parsing purchased seconds file:", error);
      return res.status(500).send("Malformed data in purchasedseconds.json.");
    }

    // If the file is empty, send an empty object
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

  // Read the current purchased seconds data
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

    // Add the new purchase
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