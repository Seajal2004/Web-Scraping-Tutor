// src/utils.js
import fs from "fs";
import pino from "pino";

export const logger = pino({ transport: { target: 'pino-pretty' } });

// Wait helper (for rate limits or retries)
export const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Save progress
export const saveProgress = (project, page) => {
  const file = "./progress.json";
  let data = {};
  if (fs.existsSync(file)) data = JSON.parse(fs.readFileSync(file, "utf8"));
  data[project] = { lastPage: page };
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Load progress
export const loadProgress = (project) => {
  const file = "./progress.json";
  if (!fs.existsSync(file)) return 0;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return data[project]?.lastPage || 0;
};
