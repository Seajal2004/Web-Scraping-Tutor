# Apache JIRA Scraper Backend

Backend service for scraping Apache JIRA issues and transforming them into structured JSONL datasets for LLM training.

## 🚀 Quick Start

```bash
cd backend
npm install
npm start
```

## 🏗️ Structure

```
backend/
├── config/
│   └── config.js      # Configuration settings
├── src/
│   ├── scraper.js     # JIRA API scraping logic
│   ├── transform.js   # Data transformation to JSONL
│   └── utils.js       # Utility functions
├── data/              # Auto-created during execution
│   ├── raw/           # Raw JSON responses
│   └── final/         # Transformed JSONL files
├── index.js           # Main entry point
└── package.json       # Dependencies & scripts
```

## ⚙️ Configuration

Edit `config/config.js`:

```javascript
export const CONFIG = {
  PROJECTS: ["SPARK", "HADOOP", "KAFKA"],
  MAX_RESULTS: 50,
  RETRY_COUNT: 5,
  RETRY_DELAY: 2000
};
```

## 🎮 Usage

```bash
# Run complete pipeline
npm start

# Development mode with detailed logging
npm run dev

# Run only scraping
npm run scrape

# Run only transformation
npm run transform
```

## 📊 Output

- `data/raw/{PROJECT}_page_{N}.json` - Raw API responses
- `data/final/{PROJECT}_issues.jsonl` - Transformed datasets

## 🛠️ Troubleshooting

**Network Issues**: Check connection, wait for rate limits  
**Memory Issues**: `node --max-old-space-size=4096 index.js`  
**Debug Mode**: `npm run dev`