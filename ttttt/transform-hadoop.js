import { transformProject } from "./src/transform.js";
import { logger } from "./src/utils.js";

// Transform existing HADOOP raw files
logger.info("🔄 Transforming existing HADOOP data...");
transformProject("HADOOP");
logger.info("✅ HADOOP transformation complete!");