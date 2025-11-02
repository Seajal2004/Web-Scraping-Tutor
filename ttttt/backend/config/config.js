/**
 * Configuration settings for Apache JIRA scraper
 * @module config
 */

export const CONFIG = {
  // JIRA API Configuration
  API_BASE_URL: "https://issues.apache.org/jira/rest/api/2",
  
  // Projects to scrape
  PROJECTS: ["SPARK", "HADOOP", "KAFKA"],
  
  // Pagination settings
  MAX_RESULTS: 50,
  
  // Retry configuration
  RETRY_COUNT: 5,
  RETRY_DELAY: 2000, // milliseconds
  
  // Output paths
  OUTPUT_PATH: "./data",
  RAW_DATA_PATH: "./data/raw",
  FINAL_DATA_PATH: "./data/final",
  
  // Progress tracking
  PROGRESS_FILE: "./progress.json"
};

export default CONFIG;