/**
 * Utility functions for JIRA scraper
 * @module utils
 */

import fs from "fs";
import pino from "pino";
import { CONFIG } from "../config/config.js";

/**
 * Logger instance with pretty formatting
 */
export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard"
    }
  }
});

/**
 * Delay function for rate limiting
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Save scraping progress to file
 * @param {string} project - Project key
 * @param {number} page - Last completed page
 */
export const saveProgress = (project, page) => {
  try {
    const file = CONFIG.PROGRESS_FILE;
    let data = {};
    
    if (fs.existsSync(file)) {
      data = JSON.parse(fs.readFileSync(file, "utf8"));
    }
    
    data[project] = {
      lastPage: page,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    logger.debug(`Progress saved: ${project} - page ${page}`);
  } catch (error) {
    logger.error(`Failed to save progress: ${error.message}`);
  }
};

/**
 * Load scraping progress from file
 * @param {string} project - Project key
 * @returns {number} Last completed page number
 */
export const loadProgress = (project) => {
  try {
    const file = CONFIG.PROGRESS_FILE;
    
    if (!fs.existsSync(file)) {
      return 0;
    }
    
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const lastPage = data[project]?.lastPage || 0;
    
    if (lastPage > 0) {
      logger.info(`Resuming ${project} from page ${lastPage}`);
    }
    
    return lastPage;
  } catch (error) {
    logger.error(`Failed to load progress: ${error.message}`);
    return 0;
  }
};

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 */
export const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
};