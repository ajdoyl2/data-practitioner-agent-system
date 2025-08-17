/**
 * Tests for Transformation Engine Factory
 */

const TransformationEngineFactory = require('../../tools/data-services/transformation-engine-factory');
const DbtWrapper = require('../../tools/data-services/dbt-wrapper');
const SQLmeshWrapper = require('../../tools/data-services/sqlmesh-wrapper');
const fs = require('fs').promises;
const inquirer = require('inquirer');

// Mock dependencies
jest.mock('../../tools/data-services/dbt-wrapper');
jest.mock('../../tools/data-services/sqlmesh-wrapper');
jest.mock('fs').promises;
jest.mock('inquirer');
jest.mock('../../tools/logger', () => ({
    logger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

describe('TransformationEngineFactory', () => {
    let factory;

    beforeEach(() => {
        factory = new TransformationEngineFactory({
            interactiveMode: false // Disable interactive for tests
        });

        // Reset mocks
        jest.clearAllMocks();

        // Default mock for feature flags
        fs.readFile = jest.fn().mockImplementation((path) => {
            if (path.includes('features.json')) {
                return Promise.resolve(JSON.stringify({
                    features: {
                        dbt_transformations: true,
                        sqlmesh_transformations: true
                    }
                }));
            }
            if (path.includes('transformation.json')) {
                return Promise.resolve(JSON.stringify({
                    engines: {
                        dbt: { enabled: true },
                        sqlmesh: { enabled: true }
                    },
                    defaultEngine: null
                }));
            }
            return Promise.reject(new Error('File not found'));
        });
    });

    describe('getAvailableEngines', () => {
        it('should return both engines when both are enabled', async () => {
            const engines = await factory.getAvailableEngines();
            expect(engines).toEqual(['dbt', 'sqlmesh']);
        });

        it('should return only dbt when sqlmesh is disabled', async () => {
            fs.readFile = jest.fn().mockImplementation((path) => {
                if (path.includes('features.json')) {
                    return Promise.resolve(JSON.stringify({
                        features: {
                            dbt_transformations: true,
                            sqlmesh_transformations: false
                        }
                    }));
                }
                return Promise.resolve(JSON.stringify({
                    engines: {
                        dbt: { enabled: true },
                        sqlmesh: { enabled: true }
                    }
                }));
            });

            const engines = await factory.getAvailableEngines();
            expect(engines).toEqual(['dbt']);
        });

        it('should handle missing feature flags gracefully', async () => {
            fs.readFile = jest.fn().mockRejectedValue(new Error('File not found'));

            const engines = await factory.getAvailableEngines();
            expect(engines).toEqual(['dbt']); // dbt enabled by default
        });
    });

    describe('createEngine', () => {
        it('should create dbt engine when explicitly specified', async () => {
            const engine = await factory.createEngine({ engine: 'dbt' });
            expect(DbtWrapper).toHaveBeenCalled();
            expect(engine).toBeInstanceOf(DbtWrapper);
        });

        it('should create sqlmesh engine when explicitly specified', async () => {
            const engine = await factory.createEngine({ engine: 'sqlmesh' });
            expect(SQLmeshWrapper).toHaveBeenCalled();
            expect(engine).toBeInstanceOf(SQLmeshWrapper);
        });

        it('should error when no engine is specified', async () => {
            await expect(factory.createEngine()).rejects.toThrow(
                'No transformation engine specified'
            );
        });

        it('should error when invalid engine is specified', async () => {
            await expect(factory.createEngine({ engine: 'invalid' })).rejects.toThrow(
                "Transformation engine 'invalid' is not available"
            );
        });

        it('should use API header for engine selection', async () => {
            const engine = await factory.createEngine({ apiHeader: 'SQLmesh' });
            expect(SQLmeshWrapper).toHaveBeenCalled();
            expect(engine).toBeInstanceOf(SQLmeshWrapper);
        });

        it('should error when specified engine is not enabled', async () => {
            fs.readFile = jest.fn().mockImplementation((path) => {
                if (path.includes('features.json')) {
                    return Promise.resolve(JSON.stringify({
                        features: {
                            dbt_transformations: true,
                            sqlmesh_transformations: false
                        }
                    }));
                }
                return Promise.resolve(JSON.stringify({
                    engines: {
                        dbt: { enabled: true },
                        sqlmesh: { enabled: false }
                    }
                }));
            });

            await expect(factory.createEngine({ engine: 'sqlmesh' })).rejects.toThrow(
                "Transformation engine 'sqlmesh' is not available"
            );
        });

        it('should prompt for engine in interactive mode', async () => {
            factory.interactiveMode = true;
            
            inquirer.prompt = jest.fn().mockResolvedValue({ engine: 'dbt' });

            const engine = await factory.createEngine({ interactive: true });
            
            expect(inquirer.prompt).toHaveBeenCalledWith([
                expect.objectContaining({
                    type: 'list',
                    name: 'engine',
                    message: 'Select transformation engine:'
                })
            ]);
            expect(DbtWrapper).toHaveBeenCalled();
        });
    });

    describe('getEngineFromRequest', () => {
        it('should extract engine from X-Transform-Engine header', () => {
            const req = {
                headers: {
                    'x-transform-engine': 'SQLmesh'
                }
            };
            
            const engine = TransformationEngineFactory.getEngineFromRequest(req);
            expect(engine).toBe('sqlmesh');
        });

        it('should extract engine from query parameter', () => {
            const req = {
                query: {
                    engine: 'DBT'
                }
            };
            
            const engine = TransformationEngineFactory.getEngineFromRequest(req);
            expect(engine).toBe('dbt');
        });

        it('should extract engine from request body', () => {
            const req = {
                body: {
                    engine: 'sqlmesh'
                }
            };
            
            const engine = TransformationEngineFactory.getEngineFromRequest(req);
            expect(engine).toBe('sqlmesh');
        });

        it('should return null when no engine specified', () => {
            const req = { headers: {}, query: {}, body: {} };
            
            const engine = TransformationEngineFactory.getEngineFromRequest(req);
            expect(engine).toBeNull();
        });

        it('should prioritize header over query and body', () => {
            const req = {
                headers: { 'x-transform-engine': 'sqlmesh' },
                query: { engine: 'dbt' },
                body: { engine: 'other' }
            };
            
            const engine = TransformationEngineFactory.getEngineFromRequest(req);
            expect(engine).toBe('sqlmesh');
        });
    });

    describe('requireEngineSelection middleware', () => {
        it('should pass through when engine is specified', () => {
            const req = {
                headers: { 'x-transform-engine': 'dbt' }
            };
            const res = {};
            const next = jest.fn();
            
            const middleware = TransformationEngineFactory.requireEngineSelection();
            middleware(req, res, next);
            
            expect(req.transformEngine).toBe('dbt');
            expect(next).toHaveBeenCalled();
        });

        it('should return 400 error when engine not specified', () => {
            const req = { headers: {} };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            const next = jest.fn();
            
            const middleware = TransformationEngineFactory.requireEngineSelection();
            middleware(req, res, next);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Transformation engine not specified'
                })
            );
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateEngineConfig', () => {
        it('should validate dbt installation', async () => {
            DbtWrapper.prototype.validateInstallation = jest.fn().mockResolvedValue(true);
            
            const isValid = await factory.validateEngineConfig('dbt');
            expect(isValid).toBe(true);
            expect(DbtWrapper.prototype.validateInstallation).toHaveBeenCalled();
        });

        it('should validate sqlmesh installation', async () => {
            SQLmeshWrapper.prototype.validateInstallation = jest.fn().mockResolvedValue(true);
            
            const isValid = await factory.validateEngineConfig('sqlmesh');
            expect(isValid).toBe(true);
            expect(SQLmeshWrapper.prototype.validateInstallation).toHaveBeenCalled();
        });

        it('should return false for invalid engine', async () => {
            const isValid = await factory.validateEngineConfig('invalid');
            expect(isValid).toBe(false);
        });
    });

    describe('compareEngines', () => {
        it('should return comparison data for both engines', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            const comparison = await factory.compareEngines();
            
            expect(comparison).toHaveProperty('dbt');
            expect(comparison).toHaveProperty('sqlmesh');
            expect(comparison.dbt).toHaveProperty('pros');
            expect(comparison.dbt).toHaveProperty('cons');
            expect(comparison.dbt).toHaveProperty('bestFor');
            expect(comparison.sqlmesh).toHaveProperty('pros');
            expect(comparison.sqlmesh).toHaveProperty('cons');
            expect(comparison.sqlmesh).toHaveProperty('bestFor');
            
            consoleSpy.mockRestore();
        });
    });
});