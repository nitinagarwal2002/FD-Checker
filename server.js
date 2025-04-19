const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const cors = require("cors");
const app = express();

// Enable CORS for all origins
app.use(cors());

// Serve static files
app.use(express.static("public"));
app.get("/test-outbound", async (req, res) => {
  try {
    const response = await axios.get("https://www.policybazaar.com/fd-interest-rates/", {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  }
});

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scrape the FD interest rates page and extract the data
app.get("/api/scrape-fd-rates", (req, res) => {
  const selectedBank = req.query.bank; // Get the selected bank from the query parameter

  axios
    .get("https://www.policybazaar.com/fd-interest-rates/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    .then((response) => {
      const $ = cheerio.load(response.data);

      // Extract all li elements with the class 'numbers' within ol.number-listing-box
      const listItems = $("ol.number-listing-box li.numbers").not(
        ".bannerinvestmentredirect"
      ); // Exclude li elements with the 'bannerinvestmentredirect' class

      let data = [];
      listItems.each((index, element) => {
        // Find and remove the last div (with class 'bannerinvestmentredirect') in the li
        $(element).find(".bannerinvestmentredirect").remove();

        // Get the raw HTML content of each li element and store in array
        const rawData = $(element).html().trim();

        // Check if the selected bank matches the data and filter accordingly
        // Use Cheerio to extract the bank name from inside the <h3> tag or similar
        const bankName = $(element).find("h3").text().trim();

        if (bankName === selectedBank) {
          data.push(rawData);
        }
      });

      // Send the filtered array of HTML content as the response
      console.log(data)
      res.send({ data });
    })
    .catch((error) => {
      console.error("Error fetching FD interest rates:", error);
      res.status(500).json({ error: "Failed to fetch FD data" });
    });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
