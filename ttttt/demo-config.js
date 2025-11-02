// Demo configuration for quick results
export const CONFIG = {
  API_BASE_URL: "https://issues.apache.org/jira/rest/api/2",
  PROJECTS: ["SPARK"],           // Just one project
  MAX_RESULTS: 10,               // Small batches
  RETRY_COUNT: 3,                // Fewer retries
  RETRY_DELAY: 500,              // Faster processing
  OUTPUT_PATH: "./data",
};