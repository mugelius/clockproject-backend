const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || 3000; // Use Render's environment port if available

// Enable CORS for all origins
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Parse URL-encoded data (for IPN handling)
app.use(bodyParser.urlencoded({ extended: true }));

// Define path to the data file (purchased seconds)
const dataFilePath = path.join(__dirname, 'purchasedseconds.json');

// Root route to test the server is running
app.get("/", (req, res) => {
  res.send("Welcome to the Seconds for Sale API!");
});

// Route to fetch purchased seconds
app.get("/purchasedSeconds", (req, res) => {
  // Check if the file exists
  if (!fs.existsSync(dataFilePath)) {
    // If it doesn't exist, create the file with an empty object
    fs.writeFileSync(dataFilePath, JSON.stringify({}));
  }

  // Now read the file
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return res.status(500).send("Error reading the file.");
    }

    try {
      // Parse the JSON data or return an empty object if the file is empty
      const parsedData = JSON.parse(data || "{}");
      res.json(parsedData);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return res.status(500).send("Error parsing JSON data.");
    }
  });
});

// Route to handle the purchase of a second
app.post("/purchaseSecond", (req, res) => {
  const { time, message } = req.body;

  if (!time || !message) {
    return res.status(400).send("Time and message are required.");
  }

  // Check if the file exists
  if (!fs.existsSync(dataFilePath)) {
    // If it doesn't exist, create the file with an empty object
    fs.writeFileSync(dataFilePath, JSON.stringify({}));
  }

  // Read the current purchased seconds data
  fs.readFile(dataFilePath, (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return res.status(500).send("Error reading the file.");
    }

    let purchasedSeconds = {};

    try {
      purchasedSeconds = JSON.parse(data || "{}");
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return res.status(500).send("Error parsing JSON data.");
    }

    if (purchasedSeconds[time]) {
      return res.status(400).send("This second is already purchased!");
    }

    // Add the new purchase
    purchasedSeconds[time] = message;

    fs.writeFile(dataFilePath, JSON.stringify(purchasedSeconds, null, 2), (err) => {
      if (err) {
        console.error("Error saving the purchase:", err);
        return res.status(500).send("Error saving the purchase.");
      }

      res.send(`You successfully purchased ${time} with message: "${message}"`);
    });
  });
});

// IPN listener endpoint to receive PayPal IPN notifications
app.post("/ipn", async (req, res) => {
  const ipnMessage = req.body;

  // Step 1: Verify the IPN message with PayPal
  try {
    const verificationResponse = await axios.post('https://ipnpb.sandbox.paypal.com/cgi-bin/webscr', null, {
      params: {
        cmd: '_notify-validate',
        ...ipnMessage, // Include the entire IPN message for validation
      },
    });

    if (verificationResponse.data === 'VERIFIED') {
      // Step 2: Process the IPN data
      if (ipnMessage.payment_status === 'Completed') {
        // The payment is completed, process the data
        const payerEmail = ipnMessage.payer_email;
        const amount = ipnMessage.mc_gross;

        // Step 3: Update the purchased seconds or your database
        updatePurchasedSeconds(payerEmail, amount);

        // Respond to PayPal with "OK" to acknowledge receipt
        res.send('OK');
      } else {
        res.send('Payment not completed.');
      }
    } else {
      res.send('IPN Verification Failed');
    }
  } catch (error) {
    console.error('Error processing IPN:', error);
    res.send('Error processing IPN');
  }
});

// Function to update purchased seconds (basic example)
const updatePurchasedSeconds = (payerEmail, amount) => {
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the purchased seconds file:', err);
      return;
    }

    let purchasedSeconds = {};

    try {
      purchasedSeconds = JSON.parse(data || '{}');
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return;
    }

    // Update or add the payer's seconds purchase data
    purchasedSeconds[payerEmail] = (purchasedSeconds[payerEmail] || 0) + amount;

    // Write the updated data back to the file
    fs.writeFile(dataFilePath, JSON.stringify(purchasedSeconds, null, 2), (err) => {
      if (err) {
        console.error('Error updating the purchased seconds file:', err);
      } else {
        console.log('Successfully updated purchased seconds for', payerEmail);
      }
    });
  });
};

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});