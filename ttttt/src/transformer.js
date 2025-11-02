// src/transformer.js
import fs from "fs";
import jsonlines from "jsonlines";
import { logger } from "./utils.js";

export function transformProject(projectKey) {
  const rawFiles = fs.readdirSync("./data/raw").filter(f => f.startsWith(projectKey));
  const output = jsonlines.stringify();
  const outputPath = `./data/final/${projectKey}.jsonl`;
  const outputStream = fs.createWriteStream(outputPath);
  output.pipe(outputStream);

  for (const file of rawFiles) {
    const issues = JSON.parse(fs.readFileSync(`./data/raw/${file}`, "utf8"));
    issues.forEach(issue => {
      const transformed = {
        id: issue.key,
        title: issue.fields.summary,
        description: issue.fields.description || "",
        status: issue.fields.status?.name,
        reporter: issue.fields.reporter?.displayName,
        assignee: issue.fields.assignee?.displayName,
        created: issue.fields.created,
        comments: issue.fields.comment?.comments?.map(c => c.body) || [],
        derived_tasks: {
          summarization: "Summarize the issue and comments.",
          classification: "Classify the issue type.",
          qna: "Generate Q&A pairs from description."
        }
      };
      output.write(transformed);
    });
  }

  output.end();
  logger.info(`📄 Transformed data saved to ${outputPath}`);
}
