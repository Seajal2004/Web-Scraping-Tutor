/**
 * Data transformation module for converting raw JIRA data to JSONL format
 * @module transform
 */

import fs from "fs";
import path from "path";
import jsonlines from "jsonlines";
import { CONFIG } from "../config/config.js";
import { logger, ensureDirectory, formatFileSize } from "./utils.js";

/**
 * Transform raw JIRA data for a specific project to JSONL format
 * @param {string} projectKey - JIRA project key
 * @returns {Promise<void>}
 */
export async function transformProject(projectKey) {
  logger.info(`🔄 Transforming ${projectKey} data to JSONL format...`);
  
  try {
    ensureDirectory(CONFIG.FINAL_DATA_PATH);
    
    const rawFiles = getRawFiles(projectKey);
    
    if (rawFiles.length === 0) {
      logger.warn(`No raw data files found for project: ${projectKey}`);
      return;
    }
    
    const outputPath = path.join(CONFIG.FINAL_DATA_PATH, `${projectKey}_issues.jsonl`);
    const outputStream = fs.createWriteStream(outputPath);
    const jsonlWriter = jsonlines.stringify();
    
    jsonlWriter.pipe(outputStream);
    
    let totalIssues = 0;
    
    // Process each raw file
    for (const file of rawFiles) {
      const filePath = path.join(CONFIG.RAW_DATA_PATH, file);
      const issuesProcessed = await processRawFile(filePath, jsonlWriter);
      totalIssues += issuesProcessed;
    }
    
    jsonlWriter.end();
    
    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      outputStream.on('finish', resolve);
      outputStream.on('error', reject);
    });
    
    const fileStats = fs.statSync(outputPath);
    logger.info(
      `📄 Transformation complete: ${totalIssues} issues → ${outputPath} ` +
      `(${formatFileSize(fileStats.size)})`
    );
    
  } catch (error) {
    logger.error(`❌ Failed to transform ${projectKey}: ${error.message}`);
    throw error;
  }
}

/**
 * Get list of raw data files for a project
 * @param {string} projectKey - Project key
 * @returns {Array<string>} Array of file names
 */
function getRawFiles(projectKey) {
  try {
    if (!fs.existsSync(CONFIG.RAW_DATA_PATH)) {
      return [];
    }
    
    return fs.readdirSync(CONFIG.RAW_DATA_PATH)
      .filter(file => file.startsWith(projectKey) && file.endsWith('.json'))
      .sort(); // Ensure consistent processing order
      
  } catch (error) {
    logger.error(`Failed to read raw data directory: ${error.message}`);
    return [];
  }
}

/**
 * Process a single raw data file
 * @param {string} filePath - Path to raw data file
 * @param {Object} jsonlWriter - JSONL writer stream
 * @returns {Promise<number>} Number of issues processed
 */
async function processRawFile(filePath, jsonlWriter) {
  try {
    const rawData = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    // Handle both old format (array) and new format (object with issues array)
    const issues = Array.isArray(rawData) ? rawData : rawData.issues || [];
    
    let processedCount = 0;
    
    for (const issue of issues) {
      const transformedIssue = transformIssue(issue);
      
      if (transformedIssue) {
        jsonlWriter.write(transformedIssue);
        processedCount++;
      }
    }
    
    logger.debug(`Processed ${processedCount} issues from ${path.basename(filePath)}`);
    return processedCount;
    
  } catch (error) {
    logger.error(`Failed to process file ${filePath}: ${error.message}`);
    return 0;
  }
}

/**
 * Transform a single JIRA issue to the target format
 * @param {Object} issue - Raw JIRA issue object
 * @returns {Object|null} Transformed issue or null if invalid
 */
function transformIssue(issue) {
  try {
    if (!issue || !issue.key || !issue.fields) {
      logger.debug(`Skipping invalid issue: ${issue?.key || 'unknown'}`);
      return null;
    }
    
    const fields = issue.fields;
    
    return {
      id: issue.key,
      title: cleanText(fields.summary || ""),
      description: cleanText(fields.description || ""),
      status: fields.status?.name || "Unknown",
      reporter: fields.reporter?.displayName || "Unknown",
      assignee: fields.assignee?.displayName || null,
      created: fields.created || null,
      updated: fields.updated || null,
      comments: extractComments(fields.comment),
      derived_tasks: {
        summarization: "Summarize the issue and comments.",
        classification: "Classify the issue type and priority.",
        qna: "Generate Q&A pairs from description and comments.",
        code_analysis: "Analyze any code snippets or technical details."
      }
    };
    
  } catch (error) {
    logger.debug(`Failed to transform issue ${issue?.key}: ${error.message}`);
    return null;
  }
}

/**
 * Extract and clean comments from JIRA comment object
 * @param {Object} commentObj - JIRA comment object
 * @returns {Array<string>} Array of cleaned comment texts
 */
function extractComments(commentObj) {
  try {
    if (!commentObj || !commentObj.comments) {
      return [];
    }
    
    return commentObj.comments
      .map(comment => cleanText(comment.body || ""))
      .filter(text => text.length > 0)
      .slice(0, 10); // Limit to first 10 comments to avoid huge files
      
  } catch (error) {
    logger.debug(`Failed to extract comments: ${error.message}`);
    return [];
  }
}

/**
 * Clean and normalize text content
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return "";
  }
  
  return text
    .replace(/\r\n/g, '\n')           // Normalize line endings
    .replace(/\t/g, ' ')              // Replace tabs with spaces
    .replace(/\s+/g, ' ')             // Collapse multiple spaces
    .trim()                           // Remove leading/trailing whitespace
    .substring(0, 10000);             // Limit length to prevent huge entries
}

/**
 * Transform all configured projects
 * @returns {Promise<void>}
 */
export async function transformAllProjects() {
  logger.info("🔄 Starting data transformation for all projects...\n");
  
  for (const project of CONFIG.PROJECTS) {
    try {
      await transformProject(project);
    } catch (error) {
      logger.error(`Failed to transform ${project}: ${error.message}`);
    }
  }
  
  logger.info("✅ All transformations completed!");
}