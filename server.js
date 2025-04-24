const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

let cachedData = null;
let lastFetch = 0;
const CACHE_TIME_MS = 55 * 1000;

// Fetch function for a specific page
async function fetchPage(page) {
  const url = `https://api.coingecko.com/api/v3/coins/markets` +
              `?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error fetching page ${page}: ${res.status}`);
  return await res.json();
}

// Fetch all data (2 pages = 500 coins)
async function fetchAllCoinData() {
  const [page1, page2] = await Promise.all([
    fetchPage(1),
    fetchPage(2)
  ]);
  return [...page1, ...page2];
}

app.get('/api/coin-data', async (req, res) => {
  try {
    const now = Date.now();
    if (!cachedData || (now - lastFetch > CACHE_TIME_MS)) {
      console.log('Fetching fresh data from CoinGecko...');
      cachedData = await fetchAllCoinData();
      lastFetch = now;
    } else {
      console.log('Serving cached data...');
    }
    res.json(cachedData);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('🚀 CoinGecko Proxy is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
