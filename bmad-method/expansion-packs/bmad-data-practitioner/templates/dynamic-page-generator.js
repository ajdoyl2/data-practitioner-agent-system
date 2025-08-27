/**
 * Dynamic Page Generator for BMad Data Practitioner Publication Templates
 * 
 * Generates multiple Evidence.dev pages from single template files with 
 * parameterized content and intelligent page structure adaptation.
 */

class DynamicPageGenerator {
    constructor(templateDir = '/templates', outputDir = '/evidence-project/pages') {
        this.templateDir = templateDir;
        this.outputDir = outputDir;
        this.templateCache = new Map();
        this.variableRegistry = new Map();
    }

    /**
     * Generate multiple pages from a single template with different parameter sets
     * 
     * @param {string} templateName - Name of the template file
     * @param {Array<Object>} pageConfigs - Array of page configuration objects
     * @param {Object} globalConfig - Global configuration applied to all pages
     * @returns {Array<Object>} Generated page metadata
     */
    async generatePages(templateName, pageConfigs, globalConfig = {}) {
        try {
            const template = await this.loadTemplate(templateName);
            const generatedPages = [];

            for (const config of pageConfigs) {
                const mergedConfig = { ...globalConfig, ...config };
                const pageContent = await this.processTemplate(template, mergedConfig);
                const pageMetadata = await this.generatePage(pageContent, mergedConfig);
                generatedPages.push(pageMetadata);
            }

            return generatedPages;
        } catch (error) {
            throw new Error(`Dynamic page generation failed: ${error.message}`);
        }
    }

    /**
     * Load template with caching and preprocessing
     */
    async loadTemplate(templateName) {
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName);
        }

        const templatePath = `${this.templateDir}/${templateName}`;
        const fs = require('fs').promises;
        const templateContent = await fs.readFile(templatePath, 'utf8');
        
        const processedTemplate = this.preprocessTemplate(templateContent);
        this.templateCache.set(templateName, processedTemplate);
        
        return processedTemplate;
    }

    /**
     * Preprocess template to extract metadata and identify dynamic sections
     */
    preprocessTemplate(templateContent) {
        const lines = templateContent.split('\n');
        const metadata = this.extractFrontmatter(lines);
        const sections = this.identifyDynamicSections(lines);
        const variables = this.extractTemplateVariables(templateContent);

        return {
            content: templateContent,
            metadata,
            sections,
            variables,
            processed: true
        };
    }

    /**
     * Extract frontmatter metadata from template
     */
    extractFrontmatter(lines) {
        const metadata = {};
        let inFrontmatter = false;
        let frontmatterEnd = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line === '---') {
                if (!inFrontmatter) {
                    inFrontmatter = true;
                    continue;
                } else {
                    frontmatterEnd = i;
                    break;
                }
            }

            if (inFrontmatter && line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
                metadata[key.trim()] = value;
            }
        }

        metadata.frontmatterEnd = frontmatterEnd;
        return metadata;
    }

    /**
     * Identify dynamic sections for conditional generation
     */
    identifyDynamicSections(lines) {
        const sections = [];
        let currentSection = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Detect section headers
            if (line.match(/^#{1,6}\s/)) {
                if (currentSection) {
                    currentSection.endLine = i - 1;
                    sections.push(currentSection);
                }

                currentSection = {
                    title: line.replace(/^#{1,6}\s/, ''),
                    level: (line.match(/^#{1,6}/) || [''])[0].length,
                    startLine: i,
                    type: this.detectSectionType(line),
                    required: this.isSectionRequired(line),
                    conditional: this.extractSectionConditions(line)
                };
            }
        }

        if (currentSection) {
            currentSection.endLine = lines.length - 1;
            sections.push(currentSection);
        }

        return sections;
    }

    /**
     * Detect section type based on content patterns
     */
    detectSectionType(headerLine) {
        const title = headerLine.toLowerCase();
        
        if (title.includes('executive') || title.includes('summary')) {
            return 'executive_summary';
        } else if (title.includes('methodology') || title.includes('method')) {
            return 'methodology';
        } else if (title.includes('findings') || title.includes('results')) {
            return 'findings';
        } else if (title.includes('statistical') || title.includes('analysis')) {
            return 'statistical_analysis';
        } else if (title.includes('recommendations') || title.includes('implications')) {
            return 'recommendations';
        } else if (title.includes('appendix') || title.includes('technical')) {
            return 'appendix';
        }
        
        return 'content';
    }

    /**
     * Determine if section is required based on template type
     */
    isSectionRequired(headerLine) {
        const requiredSections = [
            'executive summary',
            'key findings',
            'methodology'
        ];
        
        const title = headerLine.toLowerCase();
        return requiredSections.some(required => title.includes(required));
    }

    /**
     * Extract conditional logic for section inclusion
     */
    extractSectionConditions(headerLine) {
        const conditions = [];
        
        // Look for conditional comments
        const commentMatch = headerLine.match(/<!--\s*if:\s*(.+?)\s*-->/);
        if (commentMatch) {
            conditions.push({
                type: 'conditional',
                expression: commentMatch[1]
            });
        }

        return conditions;
    }

    /**
     * Extract template variables with type inference
     */
    extractTemplateVariables(content) {
        const variables = new Map();
        const variablePattern = /\{\{([^}]+)\}\}/g;
        let match;

        while ((match = variablePattern.exec(content)) !== null) {
            const variableName = match[1].trim();
            const variableType = this.inferVariableType(variableName, content);
            
            variables.set(variableName, {
                name: variableName,
                type: variableType,
                required: this.isVariableRequired(variableName, content),
                defaultValue: this.getDefaultValue(variableName, variableType),
                description: this.generateVariableDescription(variableName)
            });
        }

        return variables;
    }

    /**
     * Infer variable type based on name and context
     */
    inferVariableType(variableName, content) {
        const name = variableName.toLowerCase();
        
        if (name.includes('date') || name.includes('timestamp')) {
            return 'date';
        } else if (name.includes('percentage') || name.includes('score') || name.includes('value')) {
            return 'number';
        } else if (name.includes('title') || name.includes('name') || name.includes('description')) {
            return 'string';
        } else if (name.includes('enabled') || name.includes('required') || name.includes('active')) {
            return 'boolean';
        } else if (name.includes('list') || name.includes('sources') || name.includes('items')) {
            return 'array';
        }
        
        return 'string';
    }

    /**
     * Process template with configuration parameters
     */
    async processTemplate(template, config) {
        let processedContent = template.content;
        
        // Process variables
        for (const [varName, varInfo] of template.variables) {
            const value = this.resolveVariableValue(varName, config, varInfo);
            const placeholder = `{{${varName}}}`;
            processedContent = processedContent.replace(
                new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                value
            );
        }

        // Process conditional sections
        processedContent = this.processConditionalSections(
            processedContent, 
            template.sections, 
            config
        );

        // Process SQL queries
        processedContent = this.processSQLQueries(processedContent, config);

        return processedContent;
    }

    /**
     * Resolve variable value from configuration with fallbacks
     */
    resolveVariableValue(varName, config, varInfo) {
        // Direct configuration value
        if (config.hasOwnProperty(varName)) {
            return this.formatValue(config[varName], varInfo.type);
        }

        // Auto-generated values
        if (varName === 'generation_date') {
            return new Date().toISOString().split('T')[0];
        } else if (varName === 'generation_timestamp') {
            return new Date().toISOString();
        } else if (varName === 'version') {
            return config.version || '1.0';
        }

        // Default values
        if (varInfo.defaultValue !== undefined) {
            return varInfo.defaultValue;
        }

        // Placeholder for missing required values
        if (varInfo.required) {
            return `[REQUIRED: ${varName}]`;
        }

        return '';
    }

    /**
     * Format value based on inferred type
     */
    formatValue(value, type) {
        switch (type) {
            case 'date':
                return new Date(value).toISOString().split('T')[0];
            case 'number':
                return Number(value).toLocaleString();
            case 'boolean':
                return Boolean(value).toString();
            case 'array':
                return Array.isArray(value) ? value.join(', ') : String(value);
            default:
                return String(value);
        }
    }

    /**
     * Process conditional sections based on configuration
     */
    processConditionalSections(content, sections, config) {
        let processedContent = content;

        for (const section of sections) {
            if (section.conditional.length > 0) {
                const shouldInclude = this.evaluateConditions(section.conditional, config);
                
                if (!shouldInclude) {
                    // Remove section from content
                    const lines = processedContent.split('\n');
                    const sectionContent = lines.slice(section.startLine, section.endLine + 1);
                    processedContent = processedContent.replace(
                        sectionContent.join('\n'),
                        ''
                    );
                }
            }
        }

        return processedContent;
    }

    /**
     * Evaluate conditional expressions
     */
    evaluateConditions(conditions, config) {
        for (const condition of conditions) {
            if (condition.type === 'conditional') {
                // Simple expression evaluation
                // In production, use a safe expression evaluator
                try {
                    const expression = condition.expression.replace(
                        /(\w+)/g,
                        (match) => config.hasOwnProperty(match) ? JSON.stringify(config[match]) : 'null'
                    );
                    return eval(expression); // WARNING: Use safe evaluator in production
                } catch (error) {
                    console.warn(`Condition evaluation failed: ${condition.expression}`);
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Process SQL queries with parameter substitution
     */
    processSQLQueries(content, config) {
        const sqlPattern = /```sql\s+(\w+)\s*\n([\s\S]*?)\n```/g;
        let processedContent = content;
        let match;

        while ((match = sqlPattern.exec(content)) !== null) {
            const queryName = match[1];
            const queryContent = match[2];
            
            // Substitute parameters in SQL
            const processedQuery = this.substituteSQLParameters(queryContent, config);
            
            // Replace in content
            processedContent = processedContent.replace(match[0], 
                `\`\`\`sql ${queryName}\n${processedQuery}\n\`\`\``
            );
        }

        return processedContent;
    }

    /**
     * Substitute parameters in SQL queries
     */
    substituteSQLParameters(sqlQuery, config) {
        let processedSQL = sqlQuery;
        
        // Replace {{parameter}} patterns in SQL
        const paramPattern = /\{\{([^}]+)\}\}/g;
        processedSQL = processedSQL.replace(paramPattern, (match, paramName) => {
            const value = config[paramName];
            
            if (value === undefined) {
                return match; // Keep placeholder if no value
            }
            
            // Handle different SQL parameter types
            if (typeof value === 'string') {
                return `'${value}'`;
            } else if (Array.isArray(value)) {
                return value.map(v => `'${v}'`).join(', ');
            }
            
            return String(value);
        });

        return processedSQL;
    }

    /**
     * Generate Evidence.dev page file
     */
    async generatePage(content, config) {
        const fs = require('fs').promises;
        const path = require('path');
        
        // Determine output filename
        const fileName = config.page_name || 
                        config.title?.toLowerCase().replace(/\s+/g, '-') || 
                        'generated-page';
        
        const outputPath = path.join(this.outputDir, `${fileName}.md`);
        
        // Ensure output directory exists
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        
        // Write page content
        await fs.writeFile(outputPath, content, 'utf8');
        
        return {
            fileName: `${fileName}.md`,
            path: outputPath,
            title: config.title,
            generated: new Date().toISOString(),
            config: config
        };
    }

    /**
     * Helper methods for variable analysis
     */
    isVariableRequired(varName, content) {
        // Variables in titles or critical sections are usually required
        const criticalContexts = [
            /^#{1,3}\s.*\{\{${varName}\}\}/m,  // In headers
            /title.*\{\{${varName}\}\}/i,      // In title
            /^>\s.*\{\{${varName}\}\}/m        // In blockquotes
        ];
        
        return criticalContexts.some(pattern => 
            new RegExp(pattern.source.replace('${varName}', varName)).test(content)
        );
    }

    getDefaultValue(varName, type) {
        const defaults = {
            'confidence_threshold': 0.8,
            'analysis_engine': 'BMad-Analytics-Engine',
            'template_version': '1.0',
            'organization_name': 'BMad Data Practitioner Agent System'
        };
        
        return defaults[varName];
    }

    generateVariableDescription(varName) {
        const descriptions = {
            'analysis_title': 'Title of the analysis or report',
            'generation_date': 'Date when the document was generated',
            'confidence_threshold': 'Minimum confidence score for including insights',
            'data_sources': 'List of data sources used in the analysis',
            'primary_finding_title': 'Title of the most significant finding',
            'methodology_description': 'Description of analytical methodology used'
        };
        
        return descriptions[varName] || `Configuration parameter: ${varName}`;
    }
}

module.exports = DynamicPageGenerator;

/**
 * Example Usage:
 * 
 * const generator = new DynamicPageGenerator();
 * 
 * const pageConfigs = [
 *   {
 *     page_name: 'executive-summary',
 *     title: 'Q3 Performance Analysis',
 *     analysis_title: 'Q3 Performance Analysis',
 *     confidence_threshold: 0.85,
 *     target_audience: 'executives'
 *   },
 *   {
 *     page_name: 'detailed-analysis', 
 *     title: 'Detailed Q3 Analysis',
 *     analysis_title: 'Q3 Detailed Statistical Analysis',
 *     confidence_threshold: 0.75,
 *     target_audience: 'analysts'
 *   }
 * ];
 * 
 * const globalConfig = {
 *   organization_name: 'Acme Corporation',
 *   analysis_engine: 'BMad-Analytics-Engine v2.0',
 *   data_sources: 'CRM, ERP, Analytics Warehouse'
 * };
 * 
 * generator.generatePages('insight-document.md', pageConfigs, globalConfig)
 *   .then(pages => {
 *     console.log('Generated pages:', pages);
 *   })
 *   .catch(error => {
 *     console.error('Generation failed:', error);
 *   });
 */