/**
 * Narrative Generation Coordinator
 * 
 * Coordinates narrative generation workflows for BMad agents using the 
 * automated narrative generation knowledge system and Evidence.dev integration.
 * 
 * This component orchestrates the narrative generation process without external
 * LLM API calls, instead providing structured workflows and templates for 
 * BMad agents (especially the analyst) to generate publication-quality narratives.
 */

class NarrativeCoordinator {
    constructor(options = {}) {
        this.config = {
            knowledgeBasePath: './expansion-packs/bmad-data-practitioner/narrative-generation/',
            templatesPath: './expansion-packs/bmad-data-practitioner/templates/',
            evidenceProjectPath: './expansion-packs/bmad-data-practitioner/evidence-project/',
            qualityThresholds: {
                minReadabilityScore: 4.0,
                maxRevisionCycles: 3,
                requiredApprovalGates: ['technical', 'content', 'business']
            },
            ...options
        };
        
        this.knowledgeFiles = {
            narrativeGuide: 'narrative-generation-guide.md',
            analystWorkflows: 'analyst-narrative-workflows.md',
            statisticalTemplates: 'statistical-explanation-templates.md',
            pewResearchGuide: 'pew-research-style-guide.md',
            qualityValidation: 'quality-validation-workflows.md',
            story16Integration: 'story-1-6-integration-guide.md'
        };
        
        this.workflows = this.initializeWorkflows();
    }
    
    initializeWorkflows() {
        return {
            statisticalResultsToExecutiveSummary: {
                inputRequirements: ['statistical_test_results', 'sample_sizes', 'business_context', 'target_audience'],
                processSteps: ['statistical_validation', 'executive_summary_generation', 'quality_validation'],
                outputFormat: 'executive_summary_markdown',
                estimatedTime: '30-45 minutes',
                primaryAgent: 'analyst'
            },
            
            hypothesisTestsToPublicationNarrative: {
                inputRequirements: ['hypothesis_test_outcomes', 'original_hypotheses', 'business_research_questions'],
                processSteps: ['hypothesis_outcome_classification', 'narrative_generation', 'evidence_integration'],
                outputFormat: 'publication_narrative_markdown',
                estimatedTime: '45-60 minutes', 
                primaryAgent: 'analyst',
                supportingAgents: ['scribe']
            },
            
            edaToInsightsNarrative: {
                inputRequirements: ['eda_results', 'pattern_discoveries', 'statistical_summaries', 'domain_context'],
                processSteps: ['pattern_prioritization', 'insight_generation', 'visualization_integration'],
                outputFormat: 'insights_narrative_markdown',
                estimatedTime: '60-90 minutes',
                primaryAgent: 'analyst'
            },
            
            metricsTodashboardNarrative: {
                inputRequirements: ['kpi_calculations', 'trend_analysis', 'comparative_analysis', 'performance_targets'],
                processSteps: ['metric_contextualization', 'dashboard_narrative_creation', 'interactive_element_description'],
                outputFormat: 'dashboard_narrative_markdown',
                estimatedTime: '30-45 minutes',
                primaryAgent: 'analyst'
            },
            
            evidenceDevTemplateIntegration: {
                inputRequirements: ['analytical_results', 'template_requirements', 'audience_specification', 'branding_guidelines'],
                processSteps: ['template_variable_mapping', 'template_specific_generation', 'quality_assurance'],
                outputFormat: 'evidence_dev_template_variables',
                estimatedTime: '45-75 minutes',
                primaryAgent: 'analyst',
                supportingAgents: ['scribe']
            }
        };
    }
    
    /**
     * Generate narrative workflow instructions for BMad agents
     * @param {string} workflowType - Type of narrative workflow
     * @param {Object} inputs - Input data and requirements
     * @returns {Object} Structured workflow instructions for agents
     */
    generateWorkflowInstructions(workflowType, inputs) {
        const workflow = this.workflows[workflowType];
        if (!workflow) {
            throw new Error(`Unknown workflow type: ${workflowType}`);
        }
        
        const instructions = {
            workflowMetadata: {
                type: workflowType,
                primaryAgent: workflow.primaryAgent,
                supportingAgents: workflow.supportingAgents || [],
                estimatedTime: workflow.estimatedTime,
                outputFormat: workflow.outputFormat
            },
            
            prerequisites: this.validateInputs(workflow.inputRequirements, inputs),
            
            processSteps: this.generateDetailedSteps(workflowType, workflow.processSteps, inputs),
            
            knowledgeResources: this.getRelevantKnowledgeFiles(workflowType),
            
            qualityGates: this.generateQualityGates(workflowType),
            
            templateIntegration: this.generateTemplateIntegration(workflowType, inputs),
            
            reviewWorkflow: this.generateReviewWorkflow(workflowType)
        };
        
        return instructions;
    }
    
    /**
     * Validate that required inputs are available
     */
    validateInputs(requirements, inputs) {
        const missing = requirements.filter(req => !inputs[req]);
        const available = requirements.filter(req => inputs[req]);
        
        return {
            status: missing.length === 0 ? 'complete' : 'incomplete',
            available: available,
            missing: missing,
            validationMessage: missing.length === 0 ? 
                'All required inputs available' : 
                `Missing required inputs: ${missing.join(', ')}`
        };
    }
    
    /**
     * Generate detailed step-by-step instructions
     */
    generateDetailedSteps(workflowType, steps, inputs) {
        const stepTemplates = {
            statistical_validation: {
                description: "Cross-reference all statistical claims against source data",
                checklist: [
                    "Verify all percentages, means, and differences match source data",
                    "Confirm appropriate statistical test selection",
                    "Validate calculation accuracy",
                    "Ensure uncertainty appropriately communicated"
                ],
                knowledgeReference: this.knowledgeFiles.narrativeGuide
            },
            
            executive_summary_generation: {
                description: "Create executive summary using Pew Research standards",
                promptTemplate: this.generatePromptTemplate('executive_summary', inputs),
                checklist: [
                    "Lead with most important business finding",
                    "Include confidence level and statistical backing",
                    "Provide clear business implications",
                    "Suggest specific next steps"
                ],
                knowledgeReference: this.knowledgeFiles.pewResearchGuide
            },
            
            hypothesis_outcome_classification: {
                description: "Classify hypothesis test outcomes and select appropriate narrative pattern",
                classificationCriteria: {
                    supported: "p < 0.05 with meaningful effect size",
                    rejected: "p ≥ 0.05 or negligible effect size", 
                    inconclusive: "borderline significance or conflicting measures"
                },
                knowledgeReference: this.knowledgeFiles.story16Integration
            },
            
            quality_validation: {
                description: "Apply comprehensive quality validation framework",
                validationStages: [
                    "Statistical accuracy verification",
                    "Narrative quality assessment", 
                    "Template integration validation"
                ],
                knowledgeReference: this.knowledgeFiles.qualityValidation
            }
        };
        
        return steps.map(stepKey => ({
            step: stepKey,
            ...stepTemplates[stepKey]
        }));
    }
    
    /**
     * Generate appropriate prompt templates for agent use
     */
    generatePromptTemplate(narrativeType, inputs) {
        const templates = {
            executive_summary: `
Based on the following analysis results, generate an executive summary that:
- Leads with the most important business finding
- Includes confidence level and statistical backing  
- Provides clear business implications
- Suggests specific next steps

Statistical Results: ${JSON.stringify(inputs.statistical_results || '[To be provided]')}
Business Context: ${inputs.business_context || '[To be specified]'}
Target Audience: ${inputs.target_audience || 'General business audience'}

Use professional, accessible language avoiding statistical jargon while maintaining technical accuracy.
Follow Pew Research style guidelines for structure and tone.
            `,
            
            hypothesis_narrative: `
Convert the following hypothesis test results into a professional research narrative:

Original Hypothesis: ${inputs.hypothesis_statement || '[To be provided]'}
Statistical Results: ${JSON.stringify(inputs.test_results || '[To be provided]')}
Sample Information: ${inputs.sample_info || '[To be provided]'}
Business Context: ${inputs.business_context || '[To be provided]'}

Generate a narrative that:
- Clearly states whether hypothesis was supported/rejected/inconclusive
- Explains statistical evidence in accessible terms
- Discusses practical significance and business implications
- Acknowledges limitations and suggests next steps
- Follows Pew Research publication style
            `,
            
            insights_narrative: `
Generate publication-quality insights from exploratory data analysis:

Key Patterns Discovered: ${JSON.stringify(inputs.patterns || '[To be provided]')}
Data Characteristics: ${JSON.stringify(inputs.data_characteristics || '[To be provided]')}
Business Domain: ${inputs.business_domain || '[To be specified]'}

Create a narrative that:
- Highlights 3-5 most significant findings
- Explains what makes each finding important  
- Discusses business implications and opportunities
- Suggests areas requiring deeper investigation
- Uses engaging, accessible language while maintaining statistical accuracy
            `
        };
        
        return templates[narrativeType] || 'Template not available for this narrative type';
    }
    
    /**
     * Identify relevant knowledge files for workflow
     */
    getRelevantKnowledgeFiles(workflowType) {
        const relevanceMap = {
            statisticalResultsToExecutiveSummary: [
                this.knowledgeFiles.narrativeGuide,
                this.knowledgeFiles.analystWorkflows,
                this.knowledgeFiles.pewResearchGuide
            ],
            hypothesisTestsToPublicationNarrative: [
                this.knowledgeFiles.story16Integration,
                this.knowledgeFiles.statisticalTemplates,
                this.knowledgeFiles.pewResearchGuide
            ],
            edaToInsightsNarrative: [
                this.knowledgeFiles.narrativeGuide,
                this.knowledgeFiles.statisticalTemplates,
                this.knowledgeFiles.analystWorkflows
            ],
            metricsTodasboardNarrative: [
                this.knowledgeFiles.narrativeGuide,
                this.knowledgeFiles.statisticalTemplates
            ],
            evidenceDevTemplateIntegration: [
                this.knowledgeFiles.narrativeGuide,
                this.knowledgeFiles.analystWorkflows,
                this.knowledgeFiles.qualityValidation
            ]
        };
        
        return relevanceMap[workflowType] || [this.knowledgeFiles.narrativeGuide];
    }
    
    /**
     * Generate quality gate requirements
     */
    generateQualityGates(workflowType) {
        return {
            statisticalAccuracy: {
                description: "All statistical claims verified against source data",
                checklistItems: [
                    "Statistics match source data exactly",
                    "Confidence intervals included for key findings",
                    "Statistical significance accurately represented",
                    "Effect sizes properly contextualized"
                ]
            },
            
            narrativeQuality: {
                description: "Professional publication quality achieved",
                checklistItems: [
                    "Clear, accessible language throughout",
                    "Logical flow from findings to implications", 
                    "Appropriate level of certainty in statements",
                    "Executive summary can stand alone"
                ]
            },
            
            templateIntegration: {
                description: "Evidence.dev compatibility confirmed",
                checklistItems: [
                    "All template variables properly populated",
                    "SQL queries align with narrative claims",
                    "Interactive components properly described",
                    "Mobile responsiveness considerations addressed"
                ]
            }
        };
    }
    
    /**
     * Generate template integration specifications
     */
    generateTemplateIntegration(workflowType, inputs) {
        const templateMappings = {
            executive_summary: "Generated using executive summary workflow → {{executive_summary}} variable",
            key_findings: "Primary insights with statistical backing → {{key_findings}} variable",
            methodology_description: "Clear analytical approach explanation → {{methodology_description}} variable",
            statistical_interpretation: "Technical results for business audience → {{statistical_interpretation}} variable",
            business_implications: "Actionable next steps → {{business_implications}} variable"
        };
        
        return {
            targetTemplate: inputs.template_type || 'insight-document.md',
            variableMappings: templateMappings,
            integrationChecklist: [
                "Template variables populated with appropriate content",
                "Content length appropriate for template sections",
                "SQL query references align with narrative claims",
                "Interactive element descriptions complete"
            ]
        };
    }
    
    /**
     * Generate review workflow specifications
     */
    generateReviewWorkflow(workflowType) {
        return {
            reviewStages: [
                {
                    stage: 'technical_review',
                    reviewer: 'Technical specialist (data analyst/statistician)',
                    focusAreas: [
                        'Mathematical accuracy of calculations',
                        'Appropriate statistical test interpretation',
                        'Confidence interval and p-value accuracy',
                        'Effect size calculation and interpretation'
                    ],
                    estimatedTime: '2-4 hours'
                },
                
                {
                    stage: 'content_review', 
                    reviewer: 'Content specialist (communications/writing)',
                    focusAreas: [
                        'Clarity and accessibility of language',
                        'Logical flow and narrative structure',
                        'Audience appropriateness',
                        'Professional tone and style'
                    ],
                    estimatedTime: '1-2 hours'
                },
                
                {
                    stage: 'business_review',
                    reviewer: 'Domain expert (business stakeholder)',
                    focusAreas: [
                        'Practical relevance of insights',
                        'Accuracy of business context',
                        'Actionability of recommendations',
                        'Strategic alignment with goals'
                    ],
                    estimatedTime: '1-2 hours'
                }
            ],
            
            approvalGates: this.config.qualityThresholds.requiredApprovalGates,
            
            escalationProcedures: {
                technical_disagreement: "Escalate to senior statistician",
                content_disagreement: "Escalate to communications director", 
                business_disagreement: "Escalate to stakeholder committee"
            }
        };
    }
    
    /**
     * Initialize narrative generation session for BMad agents
     */
    async initializeNarrativeSession(sessionConfig) {
        const session = {
            sessionId: this.generateSessionId(),
            workflowType: sessionConfig.workflowType,
            inputs: sessionConfig.inputs,
            primaryAgent: sessionConfig.primaryAgent || 'analyst',
            supportingAgents: sessionConfig.supportingAgents || [],
            
            instructions: this.generateWorkflowInstructions(sessionConfig.workflowType, sessionConfig.inputs),
            
            progress: {
                currentStep: 0,
                completedSteps: [],
                qualityGates: {
                    statistical_accuracy: 'pending',
                    narrative_quality: 'pending', 
                    template_integration: 'pending'
                }
            },
            
            outputs: {
                narrativeContent: null,
                templateVariables: null,
                qualityMetrics: null
            },
            
            metadata: {
                createdAt: new Date().toISOString(),
                estimatedCompletion: this.calculateEstimatedCompletion(sessionConfig.workflowType),
                knowledgeVersion: this.getKnowledgeVersion()
            }
        };
        
        return session;
    }
    
    generateSessionId() {
        return `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    calculateEstimatedCompletion(workflowType) {
        const workflow = this.workflows[workflowType];
        const baseTime = parseInt(workflow.estimatedTime.split('-')[1]);
        const completionTime = new Date();
        completionTime.setMinutes(completionTime.getMinutes() + baseTime);
        return completionTime.toISOString();
    }
    
    getKnowledgeVersion() {
        return {
            narrativeGeneration: '1.0.0',
            lastUpdated: '2025-08-27',
            components: Object.keys(this.knowledgeFiles)
        };
    }
    
    /**
     * Integration with Story 1.6 hypothesis results
     */
    processStory16Integration(hypothesisResults) {
        const integrationConfig = {
            workflowType: 'hypothesisTestsToPublicationNarrative',
            inputs: {
                hypothesis_test_outcomes: hypothesisResults.testResults,
                original_hypotheses: hypothesisResults.hypotheses,
                business_research_questions: hypothesisResults.researchQuestions,
                statistical_evidence: hypothesisResults.statisticalEvidence,
                business_context: hypothesisResults.businessContext,
                target_audience: hypothesisResults.targetAudience || 'business stakeholders'
            },
            primaryAgent: 'analyst',
            supportingAgents: ['scribe']
        };
        
        return this.initializeNarrativeSession(integrationConfig);
    }
    
    /**
     * Integration with Evidence.dev publication system
     */
    generateEvidenceDevIntegration(narrativeContent, templateType) {
        const templateVariables = {
            executive_summary: this.extractExecutiveSummary(narrativeContent),
            key_findings: this.extractKeyFindings(narrativeContent),
            methodology_description: this.extractMethodology(narrativeContent),
            statistical_interpretation: this.extractStatisticalInterpretation(narrativeContent),
            business_implications: this.extractBusinessImplications(narrativeContent),
            chart_descriptions: this.extractVisualizationDescriptions(narrativeContent)
        };
        
        return {
            templateType: templateType,
            variables: templateVariables,
            integrationStatus: 'ready',
            validationResults: this.validateTemplateIntegration(templateVariables),
            generatedAt: new Date().toISOString()
        };
    }
    
    // Template variable extraction methods
    extractExecutiveSummary(content) {
        // Extract executive summary from narrative content
        // Implementation would parse markdown structure to find summary section
        return content.executiveSummary || 'Executive summary not found';
    }
    
    extractKeyFindings(content) {
        // Extract key findings list from narrative content
        return content.keyFindings || [];
    }
    
    extractMethodology(content) {
        // Extract methodology description from narrative content
        return content.methodology || 'Methodology description not found';
    }
    
    extractStatisticalInterpretation(content) {
        // Extract statistical interpretation from narrative content
        return content.statisticalInterpretation || 'Statistical interpretation not found';
    }
    
    extractBusinessImplications(content) {
        // Extract business implications from narrative content
        return content.businessImplications || 'Business implications not found';
    }
    
    extractVisualizationDescriptions(content) {
        // Extract chart and visualization descriptions
        return content.visualizationDescriptions || [];
    }
    
    validateTemplateIntegration(templateVariables) {
        const validation = {
            completeness: Object.values(templateVariables).every(value => 
                value && value !== 'not found' && (Array.isArray(value) ? value.length > 0 : true)
            ),
            variablesPopulated: Object.keys(templateVariables).length,
            missingVariables: Object.keys(templateVariables).filter(key => 
                !templateVariables[key] || templateVariables[key].includes('not found')
            )
        };
        
        validation.status = validation.completeness ? 'valid' : 'incomplete';
        return validation;
    }
}

module.exports = { NarrativeCoordinator };