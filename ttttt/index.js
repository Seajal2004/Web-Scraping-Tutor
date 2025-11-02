// index.js
import { CONFIG } from "./src/config.js";
import { scrapeProject } from "./src/scraper.js";
import { transformProject } from "./src/transform.js";
import { logger } from "./src/utils.js";

(async () => {
  logger.info("🚀 Starting Apache JIRA Data Scraper...\n");

  for (const project of CONFIG.PROJECTS) {
    await scrapeProject(project);
    transformProject(project);
  }

  logger.info("✅ All projects processed successfully!");
})();
