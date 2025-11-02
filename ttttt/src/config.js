// src/config.js
export const CONFIG = {
  API_BASE_URL: "https://issues.apache.org/jira/rest/api/2",
  PROJECTS: ["SPARK", "HADOOP", "KAFKA"],   // you can change this
  MAX_RESULTS: 50,                           // pagination limit
  RETRY_COUNT: 5,                            // retry for failed requests
  RETRY_DELAY: 2000,                         // in ms
  OUTPUT_PATH: "./data",
};
