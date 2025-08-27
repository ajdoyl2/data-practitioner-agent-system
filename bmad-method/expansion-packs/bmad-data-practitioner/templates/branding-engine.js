/**
 * Branding Engine for BMad Data Practitioner Publication Templates
 * 
 * Applies branding and customization to Evidence.dev publications based on
 * organization identity, audience needs, and publication type.
 */

const yaml = require('yaml');
const fs = require('fs').promises;
const path = require('path');

class BrandingEngine {
    constructor(brandingConfigPath = './branding-customization.yaml') {
        this.configPath = brandingConfigPath;
        this.brandingConfig = null;
        this.activeTheme = null;
    }

    /**
     * Initialize branding engine with configuration
     */
    async initialize() {
        try {
            const configContent = await fs.readFile(this.configPath, 'utf8');
            this.brandingConfig = yaml.parse(configContent);
            console.log('✅ Branding engine initialized successfully');
        } catch (error) {
            throw new Error(`Failed to initialize branding engine: ${error.message}`);
        }
    }

    /**
     * Apply branding to a publication based on configuration
     * 
     * @param {Object} publicationConfig - Publication configuration
     * @param {Object} organizationBranding - Organization-specific branding
     * @returns {Object} Complete branding configuration
     */
    async applyBranding(publicationConfig, organizationBranding = {}) {
        if (!this.brandingConfig) {
            await this.initialize();
        }

        const templateType = publicationConfig.template_type || 'insight_document';
        const audience = publicationConfig.target_audience || 'analysts';
        
        // Get template-specific branding
        const templateBranding = this.getTemplateBranding(templateType);
        
        // Get audience-specific styling
        const audienceStyling = this.getAudienceStyling(audience);
        
        // Merge branding configurations
        const completeBranding = this.mergeBrandingConfigs(
            templateBranding,
            audienceStyling,
            organizationBranding
        );
        
        // Generate CSS and styling
        const generatedStyles = await this.generateStyles(completeBranding);
        
        return {
            ...completeBranding,
            generated_styles: generatedStyles,
            css_variables: this.generateCSSVariables(completeBranding),
            evidence_theme_config: this.generateEvidenceThemeConfig(completeBranding)
        };
    }

    /**
     * Get template-specific branding configuration
     */
    getTemplateBranding(templateType) {
        const templateBranding = this.brandingConfig.template_branding[templateType];
        if (!templateBranding) {
            console.warn(`No branding config found for template: ${templateType}`);
            return this.brandingConfig.template_branding.insight_document;
        }

        // Get recommended color scheme
        const colorScheme = this.brandingConfig.color_schemes[templateBranding.recommended_scheme];
        
        // Get typography settings
        const typography = this.brandingConfig.typography.font_families[templateBranding.typography];
        
        // Get layout configuration
        const layout = this.brandingConfig.layout.page_layouts[templateBranding.layout];

        return {
            template_type: templateType,
            color_scheme: colorScheme,
            typography,
            layout,
            customizations: templateBranding.customizations,
            component_styles: this.brandingConfig.component_styles
        };
    }

    /**
     * Get audience-specific styling preferences
     */
    getAudienceStyling(audience) {
        const audienceStyling = this.brandingConfig.dynamic_branding.audience_based_styling[audience];
        if (!audienceStyling) {
            console.warn(`No audience styling found for: ${audience}`);
            return this.brandingConfig.dynamic_branding.audience_based_styling.analysts;
        }

        return {
            audience,
            emphasize_sections: audienceStyling.emphasize,
            minimize_sections: audienceStyling.minimize,
            color_intensity: audienceStyling.color_intensity
        };
    }

    /**
     * Merge multiple branding configurations with priority
     */
    mergeBrandingConfigs(...configs) {
        const merged = {};
        
        for (const config of configs) {
            this.deepMerge(merged, config);
        }

        // Apply organization-specific overrides
        if (merged.organization) {
            merged.brand_identity = {
                ...this.brandingConfig.brand_identity,
                organization: merged.organization
            };
        }

        return merged;
    }

    /**
     * Deep merge utility function
     */
    deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    /**
     * Generate CSS styles based on branding configuration
     */
    async generateStyles(brandingConfig) {
        const styles = {
            variables: this.generateCSSVariables(brandingConfig),
            components: this.generateComponentStyles(brandingConfig),
            layouts: this.generateLayoutStyles(brandingConfig),
            themes: this.generateThemeStyles(brandingConfig)
        };

        return styles;
    }

    /**
     * Generate CSS custom properties (variables)
     */
    generateCSSVariables(brandingConfig) {
        const variables = {};
        
        // Color variables
        if (brandingConfig.color_scheme) {
            Object.entries(brandingConfig.color_scheme.colors).forEach(([key, value]) => {
                variables[`--bmad-color-${key.replace(/_/g, '-')}`] = value;
            });
        }

        // Typography variables
        if (brandingConfig.typography) {
            variables['--bmad-font-primary'] = brandingConfig.typography.primary;
            variables['--bmad-font-secondary'] = brandingConfig.typography.secondary;
            variables['--bmad-font-monospace'] = brandingConfig.typography.monospace;
        }

        // Spacing variables
        const spacing = this.brandingConfig.layout.spacing_scale;
        Object.entries(spacing).forEach(([key, value]) => {
            variables[`--bmad-spacing-${key}`] = value;
        });

        // Font size variables
        const fontSizes = this.brandingConfig.typography.font_sizes;
        Object.entries(fontSizes).forEach(([key, value]) => {
            variables[`--bmad-font-size-${key}`] = value;
        });

        return variables;
    }

    /**
     * Generate component-specific styles
     */
    generateComponentStyles(brandingConfig) {
        const componentStyles = {};
        
        // Data table styles
        if (brandingConfig.component_styles?.data_tables) {
            componentStyles.dataTables = {
                '.bmad-publication-table': {
                    'border-collapse': 'collapse',
                    'width': '100%',
                    'font-family': 'var(--bmad-font-primary)'
                },
                '.bmad-publication-table th': {
                    'background-color': this.resolveVariable(brandingConfig.component_styles.data_tables.header_background, brandingConfig),
                    'color': this.resolveVariable(brandingConfig.component_styles.data_tables.header_text_color, brandingConfig),
                    'padding': 'var(--bmad-spacing-md)',
                    'text-align': 'left',
                    'font-weight': '600'
                },
                '.bmad-publication-table td': {
                    'padding': 'var(--bmad-spacing-sm)',
                    'border-bottom': `1px solid ${this.resolveVariable(brandingConfig.component_styles.data_tables.border_color, brandingConfig)}`
                },
                '.bmad-publication-table tr:hover': {
                    'background-color': this.resolveVariable(brandingConfig.component_styles.data_tables.row_hover_color, brandingConfig)
                }
            };
        }

        // Chart styles
        if (brandingConfig.component_styles?.charts) {
            componentStyles.charts = {
                '.bmad-publication-chart': {
                    'background-color': this.resolveVariable(brandingConfig.component_styles.charts.background_color, brandingConfig),
                    'padding': 'var(--bmad-spacing-md)',
                    'border-radius': '4px',
                    'margin': 'var(--bmad-spacing-lg) 0'
                }
            };
        }

        // Heading styles
        if (brandingConfig.component_styles?.headings) {
            Object.entries(brandingConfig.component_styles.headings).forEach(([heading, styles]) => {
                componentStyles[`.bmad-publication-${heading}`] = {
                    'color': this.resolveVariable(styles.color, brandingConfig),
                    'font-weight': styles.font_weight,
                    'margin-bottom': this.resolveVariable(styles.margin_bottom, brandingConfig),
                    'font-family': 'var(--bmad-font-primary)'
                };
            });
        }

        return componentStyles;
    }

    /**
     * Generate layout-specific styles
     */
    generateLayoutStyles(brandingConfig) {
        const layoutStyles = {};

        if (brandingConfig.layout) {
            layoutStyles.container = {
                '.bmad-publication-container': {
                    'max-width': brandingConfig.layout.max_width,
                    'margin': `0 auto`,
                    'padding': `0 ${brandingConfig.layout.margins}`,
                    'background-color': 'var(--bmad-color-background)'
                }
            };

            layoutStyles.sections = {
                '.bmad-publication-section': {
                    'margin-bottom': brandingConfig.layout.section_spacing,
                    'padding': 'var(--bmad-spacing-lg) 0'
                }
            };
        }

        return layoutStyles;
    }

    /**
     * Generate theme-specific styles for different publication contexts
     */
    generateThemeStyles(brandingConfig) {
        const themeStyles = {};

        // Executive emphasis styles
        if (brandingConfig.emphasize_sections?.includes('executive_summary')) {
            themeStyles.executiveFocus = {
                '.bmad-executive-summary': {
                    'background': 'var(--bmad-color-surface)',
                    'border-left': '4px solid var(--bmad-color-primary)',
                    'padding': 'var(--bmad-spacing-lg)',
                    'margin': 'var(--bmad-spacing-xl) 0',
                    'font-size': '1.1em'
                }
            };
        }

        // Statistical significance highlighting
        if (brandingConfig.color_intensity === 'high') {
            themeStyles.significance = {
                '.bmad-significant-result': {
                    'background': 'rgba(var(--bmad-color-success-rgb), 0.1)',
                    'border': '1px solid var(--bmad-color-success)',
                    'padding': 'var(--bmad-spacing-sm)',
                    'border-radius': '4px'
                },
                '.bmad-high-confidence': {
                    'font-weight': '600',
                    'color': 'var(--bmad-color-primary)'
                }
            };
        }

        return themeStyles;
    }

    /**
     * Resolve template variables in style values
     */
    resolveVariable(value, brandingConfig) {
        if (typeof value !== 'string' || !value.includes('{{')) {
            return value;
        }

        let resolved = value;
        const variablePattern = /\{\{([^}]+)\}\}/g;
        let match;

        while ((match = variablePattern.exec(value)) !== null) {
            const variablePath = match[1].trim();
            const variableValue = this.getNestedProperty(brandingConfig, variablePath);
            
            if (variableValue !== undefined) {
                resolved = resolved.replace(match[0], variableValue);
            }
        }

        return resolved;
    }

    /**
     * Get nested property from object using dot notation
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Generate Evidence.dev theme configuration
     */
    generateEvidenceThemeConfig(brandingConfig) {
        const themeConfig = {
            colorPalettes: {
                default: {
                    light: [],
                    dark: []
                }
            }
        };

        // Build color palette for Evidence.dev charts
        if (brandingConfig.component_styles?.charts?.color_palette) {
            themeConfig.colorPalettes.default.light = brandingConfig.component_styles.charts.color_palette;
        } else if (brandingConfig.color_scheme?.colors) {
            const colors = brandingConfig.color_scheme.colors;
            themeConfig.colorPalettes.default.light = [
                colors.primary,
                colors.secondary,
                colors.accent,
                colors.success,
                colors.warning,
                colors.error
            ];
        }

        return themeConfig;
    }

    /**
     * Apply branding to Evidence.dev configuration
     */
    async applyToEvidenceConfig(brandingConfig, evidenceConfigPath) {
        try {
            const evidenceConfigContent = await fs.readFile(evidenceConfigPath, 'utf8');
            let evidenceConfig;

            // Parse based on file extension
            if (evidenceConfigPath.endsWith('.yaml') || evidenceConfigPath.endsWith('.yml')) {
                evidenceConfig = yaml.parse(evidenceConfigContent);
            } else if (evidenceConfigPath.endsWith('.js')) {
                // Handle JavaScript config files (simplified)
                evidenceConfig = eval(`(${evidenceConfigContent})`);
            }

            // Apply theme configuration
            evidenceConfig.theme = {
                ...evidenceConfig.theme,
                ...brandingConfig.evidence_theme_config
            };

            // Write back the updated configuration
            let updatedContent;
            if (evidenceConfigPath.endsWith('.yaml') || evidenceConfigPath.endsWith('.yml')) {
                updatedContent = yaml.stringify(evidenceConfig);
            } else if (evidenceConfigPath.endsWith('.js')) {
                updatedContent = `module.exports = ${JSON.stringify(evidenceConfig, null, 2)};`;
            }

            await fs.writeFile(evidenceConfigPath, updatedContent, 'utf8');
            console.log('✅ Evidence.dev configuration updated with branding');

        } catch (error) {
            console.warn(`Warning: Could not update Evidence.dev config: ${error.message}`);
        }
    }

    /**
     * Generate complete CSS file from branding configuration
     */
    async generateCSSFile(brandingConfig, outputPath) {
        const styles = brandingConfig.generated_styles;
        let css = '/* BMad Data Practitioner Publication Styles */\n\n';

        // CSS Variables
        css += ':root {\n';
        Object.entries(styles.variables).forEach(([property, value]) => {
            css += `  ${property}: ${value};\n`;
        });
        css += '}\n\n';

        // Component Styles
        Object.values(styles.components).forEach(componentGroup => {
            Object.entries(componentGroup).forEach(([selector, rules]) => {
                css += `${selector} {\n`;
                Object.entries(rules).forEach(([property, value]) => {
                    css += `  ${property}: ${value};\n`;
                });
                css += '}\n\n';
            });
        });

        // Layout Styles
        Object.values(styles.layouts).forEach(layoutGroup => {
            Object.entries(layoutGroup).forEach(([selector, rules]) => {
                css += `${selector} {\n`;
                Object.entries(rules).forEach(([property, value]) => {
                    css += `  ${property}: ${value};\n`;
                });
                css += '}\n\n';
            });
        });

        // Theme Styles
        Object.values(styles.themes).forEach(themeGroup => {
            Object.entries(themeGroup).forEach(([selector, rules]) => {
                css += `${selector} {\n`;
                Object.entries(rules).forEach(([property, value]) => {
                    css += `  ${property}: ${value};\n`;
                });
                css += '}\n\n';
            });
        });

        await fs.writeFile(outputPath, css, 'utf8');
        console.log(`✅ CSS file generated: ${outputPath}`);
    }

    /**
     * Create preset branding configuration
     */
    createPresetBranding(presetName, organizationOverrides = {}) {
        const preset = this.brandingConfig.customization_presets[presetName];
        if (!preset) {
            throw new Error(`Preset not found: ${presetName}`);
        }

        const brandingConfig = {
            preset_name: presetName,
            color_scheme: this.brandingConfig.color_schemes[preset.color_scheme],
            typography: this.brandingConfig.typography.font_families[preset.typography],
            layout: this.brandingConfig.layout.page_layouts[preset.layout],
            emphasis: preset.emphasis,
            organization: organizationOverrides
        };

        return brandingConfig;
    }
}

module.exports = BrandingEngine;

/**
 * Example Usage:
 * 
 * const brandingEngine = new BrandingEngine('./branding-customization.yaml');
 * 
 * // Apply branding to a publication
 * const publicationConfig = {
 *   template_type: 'insight_document',
 *   target_audience: 'executives',
 *   title: 'Q3 Performance Analysis'
 * };
 * 
 * const organizationBranding = {
 *   organization: {
 *     name: 'Acme Corporation',
 *     primary_color: '#1e40af'
 *   }
 * };
 * 
 * brandingEngine.applyBranding(publicationConfig, organizationBranding)
 *   .then(branding => {
 *     console.log('Branding applied:', branding);
 *     
 *     // Generate CSS file
 *     return brandingEngine.generateCSSFile(branding, './static/publication-styles.css');
 *   })
 *   .then(() => {
 *     console.log('Publication styling complete');
 *   })
 *   .catch(error => {
 *     console.error('Branding application failed:', error);
 *   });
 */