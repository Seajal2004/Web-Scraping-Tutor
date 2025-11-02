/**
 * Main entry point for Apache JIRA scraper
 * @author Your Name
 * @version 1.0.0
 */

import { scrapeAllProjects } from "./src/scraper.js";
import { transformAllProjects } from "./src/transform.js";
import { logger } from "./src/utils.js";
import { CONFIG } from "./config/config.js";

/**
 * Main execution function
 */
async function main() {
  try {
    logger.info("🚀 Apache JIRA Scraper Starting...");
    logger.info(`📋 Projects: ${CONFIG.PROJECTS.join(", ")}`);
    logger.info(`⚙️  Max results per page: ${CONFIG.MAX_RESULTS}`);
    logger.info(`🔄 Retry count: ${CONFIG.RETRY_COUNT}\n`);
    
    const startTime = Date.now();
    
    // Step 1: Scrape data from JIRA API
    await scrapeAllProjects();
    
    // Step 2: Transform raw data to JSONL format
    await transformAllProjects();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
    
    logger.info(`\n🎉 Process completed successfully in ${duration} minutes!`);
    
  } catch (error) {
    logger.error(`💥 Fatal error: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

/**
 * Handle process termination gracefully
 */
process.on('SIGINT', () => {
  logger.info('\n👋 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('\n👋 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the application
main();