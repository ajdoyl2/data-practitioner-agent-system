/**
 * Knowledge Base Search and Discovery System
 * Provides intelligent search capabilities across the BMad Data Practitioner documentation
 * and knowledge base with semantic understanding and contextual recommendations.
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('yaml');

class KnowledgeBaseSearch {
    constructor(config = {}) {
        this.config = {
            searchPaths: [
                './docs',
                './templates',
                './user-guides',
                './troubleshooting',
                './architectural-decisions'
            ],
            indexPath: './data/knowledge-base-index.json',
            stopWords: new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']),
            minWordLength: 3,
            maxResults: 20,
            ...config
        };
        
        this.searchIndex = null;
        this.documentMetadata = new Map();
        this.initialized = false;
    }

    /**
     * Initialize the search system by building or loading the search index
     */
    async initialize() {
        try {
            // Try to load existing index
            await this.loadSearchIndex();
            console.log('Knowledge base search index loaded successfully');
        } catch (error) {
            console.log('Building new search index...');
            await this.buildSearchIndex();
        }
        
        this.initialized = true;
    }

    /**
     * Build a comprehensive search index from all documentation
     */
    async buildSearchIndex() {
        const documents = await this.crawlDocuments();
        this.searchIndex = {
            terms: new Map(),
            documents: new Map(),
            categories: new Map(),
            tags: new Map(),
            lastUpdated: new Date().toISOString()
        };

        console.log(`Processing ${documents.length} documents for search index...`);

        for (const doc of documents) {
            await this.indexDocument(doc);
        }

        await this.saveSearchIndex();
        console.log(`Search index built with ${this.searchIndex.documents.size} documents`);
    }

    /**
     * Crawl all configured paths to find documentation files
     */
    async crawlDocuments() {
        const documents = [];
        
        for (const searchPath of this.config.searchPaths) {
            try {
                const files = await this.findMarkdownFiles(searchPath);
                for (const file of files) {
                    const doc = await this.parseDocument(file);
                    if (doc) {
                        documents.push(doc);
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not crawl path ${searchPath}:`, error.message);
            }
        }

        return documents;
    }

    /**
     * Find all Markdown files in a directory recursively
     */
    async findMarkdownFiles(dirPath) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    const subFiles = await this.findMarkdownFiles(fullPath);
                    files.push(...subFiles);
                } else if (entry.name.endsWith('.md')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory might not exist, continue silently
        }
        
        return files;
    }

    /**
     * Parse a document file and extract metadata
     */
    async parseDocument(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const metadata = this.extractMetadata(content, filePath);
            const searchableContent = this.extractSearchableContent(content);
            
            return {
                id: this.generateDocumentId(filePath),
                path: filePath,
                metadata: metadata,
                content: searchableContent,
                lastModified: (await fs.stat(filePath)).mtime
            };
        } catch (error) {
            console.warn(`Warning: Could not parse document ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * Extract metadata from document content
     */
    extractMetadata(content, filePath) {
        const metadata = {
            title: this.extractTitle(content),
            category: this.inferCategory(filePath),
            tags: this.extractTags(content),
            difficulty: this.inferDifficulty(content),
            estimatedReadTime: this.calculateReadTime(content),
            systems: this.extractSystemReferences(content)
        };

        // Try to extract YAML frontmatter
        const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
        if (frontmatterMatch) {
            try {
                const frontmatter = yaml.parse(frontmatterMatch[1]);
                Object.assign(metadata, frontmatter);
            } catch (error) {
                // Ignore YAML parsing errors
            }
        }

        return metadata;
    }

    /**
     * Extract searchable content from document
     */
    extractSearchableContent(content) {
        // Remove YAML frontmatter
        content = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
        
        // Remove code blocks but keep their language info
        content = content.replace(/```(\w+)?\n[\s\S]*?\n```/g, (match, lang) => {
            return lang ? `code-example-${lang}` : 'code-example';
        });
        
        // Remove inline code
        content = content.replace(/`[^`]*`/g, ' ');
        
        // Remove Markdown formatting
        content = content.replace(/[*_~`#>\[\]()]/g, ' ');
        
        // Remove extra whitespace
        content = content.replace(/\s+/g, ' ').trim();
        
        return content;
    }

    /**
     * Index a document for search
     */
    async indexDocument(doc) {
        // Store document
        this.searchIndex.documents.set(doc.id, {
            id: doc.id,
            path: doc.path,
            title: doc.metadata.title,
            category: doc.metadata.category,
            tags: doc.metadata.tags || [],
            difficulty: doc.metadata.difficulty,
            estimatedReadTime: doc.metadata.estimatedReadTime,
            systems: doc.metadata.systems || [],
            lastModified: doc.lastModified
        });

        // Index terms
        const words = this.tokenizeContent(doc.content + ' ' + doc.metadata.title);
        const termFrequency = new Map();

        for (const word of words) {
            if (!this.isStopWord(word) && word.length >= this.config.minWordLength) {
                termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
                
                if (!this.searchIndex.terms.has(word)) {
                    this.searchIndex.terms.set(word, new Map());
                }
                
                this.searchIndex.terms.get(word).set(doc.id, termFrequency.get(word));
            }
        }

        // Index categories
        if (doc.metadata.category) {
            if (!this.searchIndex.categories.has(doc.metadata.category)) {
                this.searchIndex.categories.set(doc.metadata.category, []);
            }
            this.searchIndex.categories.get(doc.metadata.category).push(doc.id);
        }

        // Index tags
        if (doc.metadata.tags) {
            for (const tag of doc.metadata.tags) {
                if (!this.searchIndex.tags.has(tag)) {
                    this.searchIndex.tags.set(tag, []);
                }
                this.searchIndex.tags.get(tag).push(doc.id);
            }
        }
    }

    /**
     * Perform intelligent search across the knowledge base
     */
    async search(query, options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const searchOptions = {
            category: null,
            tags: [],
            difficulty: null,
            systems: [],
            includeContent: false,
            maxResults: this.config.maxResults,
            ...options
        };

        const results = new Map();
        const queryTerms = this.tokenizeContent(query.toLowerCase());
        
        // Score documents based on term matching
        for (const term of queryTerms) {
            if (this.searchIndex.terms.has(term)) {
                const termDocuments = this.searchIndex.terms.get(term);
                
                for (const [docId, frequency] of termDocuments) {
                    const currentScore = results.get(docId) || 0;
                    const termScore = this.calculateTermScore(term, frequency, queryTerms.length);
                    results.set(docId, currentScore + termScore);
                }
            }
        }

        // Apply filters and boost scores
        const filteredResults = this.applyFilters(results, searchOptions);
        const boostedResults = this.applyBoosts(filteredResults, queryTerms);
        
        // Sort by relevance score
        const sortedResults = [...boostedResults.entries()]
            .sort(([,scoreA], [,scoreB]) => scoreB - scoreA)
            .slice(0, searchOptions.maxResults);

        // Format results
        return this.formatSearchResults(sortedResults, searchOptions);
    }

    /**
     * Get category-based browsing structure
     */
    async getBrowsingStructure() {
        if (!this.initialized) {
            await this.initialize();
        }

        const structure = {
            categories: {},
            totalDocuments: this.searchIndex.documents.size,
            lastUpdated: this.searchIndex.lastUpdated
        };

        for (const [category, docIds] of this.searchIndex.categories) {
            structure.categories[category] = {
                count: docIds.length,
                documents: docIds.map(id => this.searchIndex.documents.get(id))
                    .filter(doc => doc)
                    .sort((a, b) => a.title.localeCompare(b.title))
            };
        }

        return structure;
    }

    /**
     * Get related documents based on tags and categories
     */
    async getRelatedDocuments(documentId, maxResults = 5) {
        if (!this.initialized) {
            await this.initialize();
        }

        const doc = this.searchIndex.documents.get(documentId);
        if (!doc) {
            return [];
        }

        const relatedScores = new Map();

        // Score by matching tags
        if (doc.tags && doc.tags.length > 0) {
            for (const tag of doc.tags) {
                if (this.searchIndex.tags.has(tag)) {
                    for (const relatedId of this.searchIndex.tags.get(tag)) {
                        if (relatedId !== documentId) {
                            relatedScores.set(relatedId, (relatedScores.get(relatedId) || 0) + 2);
                        }
                    }
                }
            }
        }

        // Score by matching category
        if (doc.category && this.searchIndex.categories.has(doc.category)) {
            for (const relatedId of this.searchIndex.categories.get(doc.category)) {
                if (relatedId !== documentId) {
                    relatedScores.set(relatedId, (relatedScores.get(relatedId) || 0) + 1);
                }
            }
        }

        // Sort and format results
        const sortedRelated = [...relatedScores.entries()]
            .sort(([,scoreA], [,scoreB]) => scoreB - scoreA)
            .slice(0, maxResults);

        return sortedRelated.map(([id]) => this.searchIndex.documents.get(id));
    }

    /**
     * Get search suggestions based on partial query
     */
    async getSuggestions(partialQuery, maxSuggestions = 5) {
        if (!this.initialized) {
            await this.initialize();
        }

        const suggestions = new Set();
        const query = partialQuery.toLowerCase().trim();

        // Find terms that start with the query
        for (const term of this.searchIndex.terms.keys()) {
            if (term.startsWith(query) && term !== query) {
                suggestions.add(term);
                if (suggestions.size >= maxSuggestions) break;
            }
        }

        // Add popular document titles that contain the query
        for (const doc of this.searchIndex.documents.values()) {
            if (doc.title.toLowerCase().includes(query)) {
                suggestions.add(doc.title);
                if (suggestions.size >= maxSuggestions) break;
            }
        }

        return [...suggestions].slice(0, maxSuggestions);
    }

    /**
     * Generate analytics about search usage and content
     */
    async generateAnalytics() {
        if (!this.initialized) {
            await this.initialize();
        }

        const analytics = {
            totalDocuments: this.searchIndex.documents.size,
            totalTerms: this.searchIndex.terms.size,
            categoryDistribution: {},
            tagDistribution: {},
            difficultyDistribution: {},
            systemCoverage: {},
            averageReadTime: 0,
            lastIndexUpdate: this.searchIndex.lastUpdated
        };

        // Category distribution
        for (const [category, docs] of this.searchIndex.categories) {
            analytics.categoryDistribution[category] = docs.length;
        }

        // Tag distribution
        for (const [tag, docs] of this.searchIndex.tags) {
            analytics.tagDistribution[tag] = docs.length;
        }

        // Document-level analytics
        let totalReadTime = 0;
        const difficulties = {};
        const systems = {};

        for (const doc of this.searchIndex.documents.values()) {
            // Difficulty distribution
            if (doc.difficulty) {
                difficulties[doc.difficulty] = (difficulties[doc.difficulty] || 0) + 1;
            }

            // System coverage
            if (doc.systems) {
                for (const system of doc.systems) {
                    systems[system] = (systems[system] || 0) + 1;
                }
            }

            // Read time
            if (doc.estimatedReadTime) {
                totalReadTime += doc.estimatedReadTime;
            }
        }

        analytics.difficultyDistribution = difficulties;
        analytics.systemCoverage = systems;
        analytics.averageReadTime = totalReadTime / this.searchIndex.documents.size;

        return analytics;
    }

    // Helper methods

    generateDocumentId(filePath) {
        return Buffer.from(filePath).toString('base64').replace(/[=+/]/g, '');
    }

    extractTitle(content) {
        const titleMatch = content.match(/^#\s+(.+)$/m);
        return titleMatch ? titleMatch[1].trim() : 'Untitled';
    }

    inferCategory(filePath) {
        const pathParts = filePath.split(path.sep);
        const categoryMappings = {
            'troubleshooting': 'Troubleshooting',
            'user-guides': 'User Guide',
            'architectural-decisions': 'Architecture',
            'templates': 'Template',
            'docs': 'Documentation'
        };

        for (const part of pathParts) {
            if (categoryMappings[part]) {
                return categoryMappings[part];
            }
        }

        return 'General';
    }

    extractTags(content) {
        const tags = [];
        
        // Look for YAML tags
        const yamlMatch = content.match(/tags:\s*\[(.*?)\]/);
        if (yamlMatch) {
            tags.push(...yamlMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')));
        }

        // Look for common system references
        const systemPatterns = [
            /duckdb/gi, /dagster/gi, /evidence/gi, /pyairbyte/gi,
            /dbt/gi, /sqlmesh/gi, /python/gi, /javascript/gi, /sql/gi
        ];

        for (const pattern of systemPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                tags.push(matches[0].toLowerCase());
            }
        }

        return [...new Set(tags)]; // Remove duplicates
    }

    inferDifficulty(content) {
        const indicators = {
            beginner: ['getting started', 'introduction', 'basic', 'simple', 'quick start'],
            intermediate: ['configure', 'setup', 'implement', 'analysis', 'workflow'],
            advanced: ['architecture', 'performance', 'optimization', 'troubleshooting', 'debugging']
        };

        const contentLower = content.toLowerCase();
        const scores = { beginner: 0, intermediate: 0, advanced: 0 };

        for (const [level, words] of Object.entries(indicators)) {
            for (const word of words) {
                if (contentLower.includes(word)) {
                    scores[level]++;
                }
            }
        }

        const maxScore = Math.max(...Object.values(scores));
        return Object.keys(scores).find(key => scores[key] === maxScore) || 'intermediate';
    }

    calculateReadTime(content) {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }

    extractSystemReferences(content) {
        const systems = [];
        const systemPatterns = {
            'DuckDB': /duckdb/gi,
            'Dagster': /dagster/gi,
            'Evidence.dev': /evidence/gi,
            'PyAirbyte': /pyairbyte/gi,
            'dbt': /\bdbt\b/gi,
            'SQLmesh': /sqlmesh/gi,
            'Python': /python/gi,
            'JavaScript': /javascript|node\.js/gi,
            'BMad Method': /bmad/gi
        };

        for (const [system, pattern] of Object.entries(systemPatterns)) {
            if (pattern.test(content)) {
                systems.push(system);
            }
        }

        return systems;
    }

    tokenizeContent(content) {
        return content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    }

    isStopWord(word) {
        return this.config.stopWords.has(word);
    }

    calculateTermScore(term, frequency, queryLength) {
        // TF-IDF-like scoring
        const tf = frequency;
        const totalDocs = this.searchIndex.documents.size;
        const docsWithTerm = this.searchIndex.terms.get(term).size;
        const idf = Math.log(totalDocs / docsWithTerm);
        
        return tf * idf / queryLength;
    }

    applyFilters(results, options) {
        if (!options.category && !options.tags.length && !options.difficulty && !options.systems.length) {
            return results;
        }

        const filtered = new Map();

        for (const [docId, score] of results) {
            const doc = this.searchIndex.documents.get(docId);
            if (!doc) continue;

            let passesFilter = true;

            if (options.category && doc.category !== options.category) {
                passesFilter = false;
            }

            if (options.tags.length && !options.tags.some(tag => doc.tags.includes(tag))) {
                passesFilter = false;
            }

            if (options.difficulty && doc.difficulty !== options.difficulty) {
                passesFilter = false;
            }

            if (options.systems.length && !options.systems.some(system => doc.systems.includes(system))) {
                passesFilter = false;
            }

            if (passesFilter) {
                filtered.set(docId, score);
            }
        }

        return filtered;
    }

    applyBoosts(results, queryTerms) {
        const boosted = new Map();

        for (const [docId, score] of results) {
            const doc = this.searchIndex.documents.get(docId);
            let boostedScore = score;

            // Boost if title contains query terms
            const titleWords = this.tokenizeContent(doc.title);
            for (const term of queryTerms) {
                if (titleWords.includes(term)) {
                    boostedScore *= 1.5;
                }
            }

            // Boost recent documents slightly
            const daysSinceModified = (Date.now() - new Date(doc.lastModified)) / (1000 * 60 * 60 * 24);
            if (daysSinceModified < 30) {
                boostedScore *= 1.1;
            }

            boosted.set(docId, boostedScore);
        }

        return boosted;
    }

    formatSearchResults(sortedResults, options) {
        return sortedResults.map(([docId, score]) => {
            const doc = this.searchIndex.documents.get(docId);
            const result = {
                id: docId,
                title: doc.title,
                path: doc.path,
                category: doc.category,
                tags: doc.tags,
                difficulty: doc.difficulty,
                estimatedReadTime: doc.estimatedReadTime,
                systems: doc.systems,
                relevanceScore: Math.round(score * 100) / 100,
                lastModified: doc.lastModified
            };

            if (options.includeContent) {
                // Load and include content snippet
                result.snippet = this.generateSnippet(doc.path, 200);
            }

            return result;
        });
    }

    async generateSnippet(filePath, maxLength = 200) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const cleanContent = this.extractSearchableContent(content);
            return cleanContent.length > maxLength 
                ? cleanContent.substring(0, maxLength) + '...'
                : cleanContent;
        } catch {
            return '';
        }
    }

    async saveSearchIndex() {
        const serializedIndex = {
            terms: Object.fromEntries(this.searchIndex.terms),
            documents: Object.fromEntries(this.searchIndex.documents),
            categories: Object.fromEntries(this.searchIndex.categories),
            tags: Object.fromEntries(this.searchIndex.tags),
            lastUpdated: this.searchIndex.lastUpdated
        };

        // Convert nested Maps to objects
        for (const [term, docMap] of Object.entries(serializedIndex.terms)) {
            if (docMap instanceof Map) {
                serializedIndex.terms[term] = Object.fromEntries(docMap);
            }
        }

        await fs.writeFile(this.config.indexPath, JSON.stringify(serializedIndex, null, 2));
    }

    async loadSearchIndex() {
        const indexData = JSON.parse(await fs.readFile(this.config.indexPath, 'utf8'));
        
        this.searchIndex = {
            terms: new Map(),
            documents: new Map(Object.entries(indexData.documents)),
            categories: new Map(Object.entries(indexData.categories)),
            tags: new Map(Object.entries(indexData.tags)),
            lastUpdated: indexData.lastUpdated
        };

        // Convert term objects back to Maps
        for (const [term, docObj] of Object.entries(indexData.terms)) {
            this.searchIndex.terms.set(term, new Map(Object.entries(docObj)));
        }
    }
}

// CLI interface for the search system
if (require.main === module) {
    const search = new KnowledgeBaseSearch();

    async function runCLI() {
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'build-index':
                console.log('Building search index...');
                await search.buildSearchIndex();
                console.log('Search index built successfully');
                break;

            case 'search':
                const query = args.slice(1).join(' ');
                if (!query) {
                    console.log('Usage: node knowledge-base-search.js search <query>');
                    return;
                }
                
                const results = await search.search(query);
                console.log(`Found ${results.length} results for "${query}":\n`);
                
                results.forEach((result, index) => {
                    console.log(`${index + 1}. ${result.title} (Score: ${result.relevanceScore})`);
                    console.log(`   Category: ${result.category} | Difficulty: ${result.difficulty}`);
                    console.log(`   Path: ${result.path}`);
                    console.log(`   Tags: ${result.tags.join(', ')}`);
                    console.log();
                });
                break;

            case 'analytics':
                const analytics = await search.generateAnalytics();
                console.log('Knowledge Base Analytics:');
                console.log(JSON.stringify(analytics, null, 2));
                break;

            case 'browse':
                const structure = await search.getBrowsingStructure();
                console.log('Knowledge Base Structure:');
                for (const [category, info] of Object.entries(structure.categories)) {
                    console.log(`\n${category} (${info.count} documents):`);
                    info.documents.forEach(doc => {
                        console.log(`  - ${doc.title}`);
                    });
                }
                break;

            default:
                console.log('Usage: node knowledge-base-search.js <command>');
                console.log('Commands:');
                console.log('  build-index     - Build or rebuild the search index');
                console.log('  search <query>  - Search for documents');
                console.log('  analytics       - Show knowledge base analytics');
                console.log('  browse          - Browse by category');
        }
    }

    runCLI().catch(console.error);
}

module.exports = KnowledgeBaseSearch;