/**
 * JIRA API scraper module
 * @module scraper
 */

import axios from "axios";
import axiosRetry from "axios-retry";
import fs from "fs";
import path from "path";
import { CONFIG } from "../config/config.js";
import { delay, logger, saveProgress, loadProgress, ensureDirectory } from "./utils.js";

// Configure axios retry with exponential backoff
axiosRetry(axios, {
  retries: CONFIG.RETRY_COUNT,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.response?.status >= 500;
  }
});

/**
 * Scrape issues for a specific project
 * @param {string} projectKey - JIRA project key (e.g., 'SPARK')
 * @returns {Promise<void>}
 */
export async function scrapeProject(projectKey) {
  logger.info(`🚀 Starting scrape for project: ${projectKey}`);
  
  // Ensure output directories exist
  ensureDirectory(CONFIG.RAW_DATA_PATH);
  ensureDirectory(CONFIG.FINAL_DATA_PATH);
  
  const startFrom = loadProgress(projectKey);
  let startAt = startFrom * CONFIG.MAX_RESULTS;
  let total = 1; // Will be updated from first API response
  let totalIssuesProcessed = 0;

  try {
    while (startAt < total) {
      const response = await fetchIssuesPage(projectKey, startAt);
      
      if (!response) {
        logger.error(`Failed to fetch page ${startAt / CONFIG.MAX_RESULTS} for ${projectKey}`);
        break;
      }

      const { issues, total: totalCount } = response;
      total = totalCount;

      // Save raw data
      const fileName = path.join(
        CONFIG.RAW_DATA_PATH,
        `${projectKey}_page_${startAt / CONFIG.MAX_RESULTS}.json`
      );
      
      await saveRawData(fileName, issues);
      
      totalIssuesProcessed += issues.length;
      
      // Save progress
      saveProgress(projectKey, startAt / CONFIG.MAX_RESULTS);

      // Log progress
      const progress = ((startAt + CONFIG.MAX_RESULTS) / total * 100).toFixed(1);
      logger.info(
        `✅ Page ${startAt / CONFIG.MAX_RESULTS + 1}: ${issues.length} issues ` +
        `(${totalIssuesProcessed}/${total} - ${progress}%)`
      );

      startAt += CONFIG.MAX_RESULTS;
      
      // Rate limiting
      if (startAt < total) {
        await delay(CONFIG.RETRY_DELAY);
      }
    }

    logger.info(`🏁 Completed ${projectKey}: ${totalIssuesProcessed} issues processed`);
    
  } catch (error) {
    logger.error(`❌ Fatal error scraping ${projectKey}: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch a single page of issues from JIRA API
 * @param {string} projectKey - Project key
 * @param {number} startAt - Starting index
 * @returns {Promise<Object|null>} API response data or null on failure
 */
async function fetchIssuesPage(projectKey, startAt) {
  try {
    const response = await axios.get(`${CONFIG.API_BASE_URL}/search`, {
      params: {
        jql: `project=${projectKey}`,
        startAt,
        maxResults: CONFIG.MAX_RESULTS,
        fields: [
          "key",
          "summary", 
          "description",
          "status",
          "reporter",
          "assignee",
          "created",
          "updated",
          "comment"
        ].join(",")
      },
      timeout: 30000 // 30 second timeout
    });

    return response.data;
    
  } catch (error) {
    await handleApiError(error, projectKey, startAt);
    return null;
  }
}

/**
 * Save raw issue data to file
 * @param {string} fileName - Output file path
 * @param {Array} issues - Array of issue objects
 */
async function saveRawData(fileName, issues) {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      count: issues.length,
      issues: issues
    };
    
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
    
  } catch (error) {
    logger.error(`❌ Failed to save file ${fileName}: ${error.message}`);
    throw error;
  }
}

/**
 * Handle API errors with appropriate logging and delays
 * @param {Error} error - The error object
 * @param {string} projectKey - Project key
 * @param {number} startAt - Current page start index
 */
async function handleApiError(error, projectKey, startAt) {
  const page = startAt / CONFIG.MAX_RESULTS;
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    logger.error(`🌐 Network connectivity issue for ${projectKey} page ${page}`);
    logger.error(`   Cannot reach Apache JIRA API at ${CONFIG.API_BASE_URL}`);
  } else if (error.response?.status === 429) {
    logger.warn(`⏳ Rate limit hit for ${projectKey} page ${page}, waiting...`);
    await delay(CONFIG.RETRY_DELAY * 3);
  } else if (error.response?.status >= 500) {
    logger.error(`🔥 Server error ${error.response.status} for ${projectKey} page ${page}`);
    await delay(CONFIG.RETRY_DELAY * 2);
  } else {
    logger.error(`❌ API error for ${projectKey} page ${page}:`);
    logger.error(`   Status: ${error.response?.status || 'Unknown'}`);
    logger.error(`   Message: ${error.message}`);
  }
}

/**
 * Scrape all configured projects
 * @returns {Promise<void>}
 */
export async function scrapeAllProjects() {
  logger.info("🚀 Starting Apache JIRA Data Scraper...\n");
  
  for (const project of CONFIG.PROJECTS) {
    try {
      await scrapeProject(project);
    } catch (error) {
      logger.error(`Failed to complete scraping for ${project}: ${error.message}`);
    }
  }
  
  logger.info("✅ All projects processing completed!");
}