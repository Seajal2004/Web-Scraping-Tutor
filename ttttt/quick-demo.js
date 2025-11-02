import { CONFIG } from "./src/config.js";
import { scrapeProject } from "./src/scraper.js";
import { transformProject } from "./src/transform.js";
import { logger } from "./src/utils.js";

// Quick demo - just 2 pages of HADOOP
const DEMO_CONFIG = {
  ...CONFIG,
  PROJECTS: ["HADOOP"],
  MAX_RESULTS: 50,
  RETRY_DELAY: 500
};

(async () => {
  logger.info("🚀 Quick Demo: Scraping 100 HADOOP issues...");
  
  // Scrape just 2 pages (100 issues)
  await scrapeProject("HADOOP");
  
  // Transform immediately
  transformProject("HADOOP");
  
  logger.info("✅ Demo complete! Check data/final/HADOOP.jsonl");
})();