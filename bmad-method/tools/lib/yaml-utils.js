/**
 * Utility functions for YAML extraction from agent files
 */

const fs = require('fs-extra');
const yaml = require('js-yaml');
const path = require('path');

/**
 * Extract YAML content from agent markdown files
 * @param {string} agentContent - The full content of the agent file
 * @param {boolean} cleanCommands - Whether to clean command descriptions (default: false)
 * @returns {string|null} - The extracted YAML content or null if not found
 */
function extractYamlFromAgent(agentContent, cleanCommands = false) {
  // Remove carriage returns and match YAML block
  const yamlMatch = agentContent.replace(/\r/g, "").match(/```ya?ml\n([\s\S]*?)\n```/);
  if (!yamlMatch) return null;
  
  let yamlContent = yamlMatch[1].trim();
  
  // Clean up command descriptions if requested
  // Converts "- command - description" to just "- command"
  if (cleanCommands) {
    yamlContent = yamlContent.replace(/^(\s*-)(\s*"[^"]+")(\s*-\s*.*)$/gm, '$1$2');
  }
  
  return yamlContent;
}

/**
 * Load YAML configuration from file
 * @param {string} filePath - Path to YAML file
 * @returns {Promise<Object>} - Parsed YAML content
 */
async function loadYaml(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return yaml.load(content);
}

/**
 * Save object as YAML to file
 * @param {string} filePath - Path to save YAML file
 * @param {Object} data - Data to save as YAML
 * @returns {Promise<void>}
 */
async function saveYaml(filePath, data) {
  const yamlContent = yaml.dump(data);
  await fs.writeFile(filePath, yamlContent, 'utf8');
}

/**
 * Extract YAML frontmatter from markdown
 * @param {string} markdownContent - Markdown content with frontmatter
 * @returns {Object} - Object with frontmatter and content
 */
function extractFrontmatter(markdownContent) {
  const frontmatterMatch = markdownContent.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { frontmatter: null, content: markdownContent };
  }
  
  try {
    const frontmatter = yaml.load(frontmatterMatch[1]);
    const content = markdownContent.substring(frontmatterMatch[0].length).trim();
    return { frontmatter, content };
  } catch (error) {
    return { frontmatter: null, content: markdownContent };
  }
}

/**
 * Extract YAML frontmatter from markdown (alias for backward compatibility)
 * @param {string} markdownContent - Markdown content with frontmatter
 * @returns {Object} - Object with frontmatter and content
 */
function extractYamlFrontmatter(markdownContent) {
  return extractFrontmatter(markdownContent);
}

/**
 * Parse markdown sections
 * @param {string} markdownContent - Markdown content
 * @returns {Object} - Parsed sections
 */
function parseMarkdownSections(markdownContent) {
  const sections = {};
  const lines = markdownContent.split('\n');
  let currentSection = null;
  let currentContent = [];
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.substring(2).trim();
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    }
  }
  
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  return sections;
}

/**
 * Validate file path
 * @param {string} filePath - Path to validate
 * @returns {boolean} - True if valid
 */
function validatePath(filePath) {
  // Check for path traversal attempts
  const normalizedPath = path.normalize(filePath);
  const resolvedPath = path.resolve(filePath);
  
  // Ensure no parent directory access attempts
  if (normalizedPath.includes('..') || !resolvedPath.startsWith(process.cwd())) {
    return false;
  }
  
  return true;
}

module.exports = {
  extractYamlFromAgent,
  loadYaml,
  saveYaml,
  extractFrontmatter,
  extractYamlFrontmatter,
  parseMarkdownSections,
  validatePath
};