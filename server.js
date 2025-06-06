require("dotenv").config(); // 👈 Load env variables

const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const cors = require("cors");

const app = express();
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

// Enable CORS
app.use(cors());
app.use(express.static("public"));

app.get("/test-outbound", async (req, res) => {
  try {
    const response = await axios.get("https://httpbin.org/get");
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/scrape-fd-rates", async (req, res) => {
  const selectedBank = req.query.bank;

  const targetURL = encodeURIComponent("https://www.policybazaar.com/fd-interest-rates/");
  const scraperApiUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${targetURL}`;

  try {
    const response = await axios.get(scraperApiUrl);
    const $ = cheerio.load(response.data);

    const listItems = $("ol.number-listing-box li.numbers").not(".bannerinvestmentredirect");
    let data = [];

    listItems.each((index, element) => {
      $(element).find(".bannerinvestmentredirect").remove();
      const rawData = $(element).html().trim();
      const bankName = $(element).find("h3").text().trim();

      if (bankName === selectedBank) {
        data.push(rawData);
      }
    });

    res.send({ data });
  } catch (error) {
    console.error("Error fetching FD interest rates:", error);
    res.status(500).json({ error: "Failed to fetch FD data" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
