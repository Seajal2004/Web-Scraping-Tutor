// src/scraper.js
import axios from "axios";
import axiosRetry from "axios-retry";
import fs from "fs";
import { CONFIG } from "./config.js";
import { delay, logger, saveProgress, loadProgress } from "./utils.js";

axiosRetry(axios, { retries: CONFIG.RETRY_COUNT, retryDelay: axiosRetry.exponentialDelay });

export async function scrapeProject(projectKey) {
  logger.info(`\n🚀 Starting scrape for project: ${projectKey}`);
  
  // Ensure directories exist
  const rawDir = './data/raw';
  const finalDir = './data/final';
  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
    logger.info(`Created directory: ${rawDir}`);
  }
  if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir, { recursive: true });
    logger.info(`Created directory: ${finalDir}`);
  }
  
  const startFrom = loadProgress(projectKey);
  let startAt = startFrom * CONFIG.MAX_RESULTS;
  let total = 1; // temporary

  while (startAt < total) {
    try {
      const response = await axios.get(
        `${CONFIG.API_BASE_URL}/search`,
        {
          params: {
            jql: `project=${projectKey}`,
            startAt,
            maxResults: CONFIG.MAX_RESULTS,
          },
        }
      );

      const { issues, total: totalCount } = response.data;
      total = totalCount;

      const fileName = `./data/raw/${projectKey}_page_${startAt / CONFIG.MAX_RESULTS}.json`;
      
      try {
        // Double-check directory exists before writing
        if (!fs.existsSync('./data/raw')) {
          fs.mkdirSync('./data/raw', { recursive: true });
        }
        fs.writeFileSync(fileName, JSON.stringify(issues, null, 2));
        logger.info(`✅ Saved ${issues.length} issues → ${fileName}`);
      } catch (fileError) {
        logger.error(`❌ Failed to write file ${fileName}: ${fileError.message}`);
        logger.error(`❌ Current working directory: ${process.cwd()}`);
        throw fileError;
      }

      // Save progress
      saveProgress(projectKey, startAt / CONFIG.MAX_RESULTS);

      startAt += CONFIG.MAX_RESULTS;
      await delay(CONFIG.RETRY_DELAY); // prevent hitting rate limits
    } catch (error) {
      logger.error(`❌ HTTP Request failed for ${projectKey} at page ${startAt / CONFIG.MAX_RESULTS}:`);
      logger.error(`   Error: ${error.message}`);
      logger.error(`   Code: ${error.code}`);
      logger.error(`   Status: ${error.response?.status}`);
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        logger.error(`🌐 Network connectivity issue. Cannot reach Apache JIRA API.`);
        break;
      }
      
      await delay(CONFIG.RETRY_DELAY * 2);
    }
  }

  logger.info(`🏁 Finished scraping project: ${projectKey}\n`);
}

