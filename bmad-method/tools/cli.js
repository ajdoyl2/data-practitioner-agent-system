#!/usr/bin/env node

const { Command } = require('commander');
const WebBuilder = require('./builders/web-builder');
const V3ToV4Upgrader = require('./upgraders/v3-to-v4-upgrader');
const IdeSetup = require('./installer/lib/ide-setup');
const path = require('path');
const { 
  isFeatureEnabled, 
  enableFeature, 
  disableFeature, 
  getAllFeatureStatuses 
} = require('./lib/feature-flag-manager');

const program = new Command();

program
  .name('bmad-build')
  .description('BMad-Method build tool for creating web bundles')
  .version('4.0.0');

program
  .command('build')
  .description('Build web bundles for agents and teams')
  .option('-a, --agents-only', 'Build only agent bundles')
  .option('-t, --teams-only', 'Build only team bundles')
  .option('-e, --expansions-only', 'Build only expansion pack bundles')
  .option('--no-expansions', 'Skip building expansion packs')
  .option('--no-clean', 'Skip cleaning output directories')
  .action(async (options) => {
    const builder = new WebBuilder({
      rootDir: process.cwd()
    });

    try {
      if (options.clean) {
        console.log('Cleaning output directories...');
        await builder.cleanOutputDirs();
      }

      if (options.expansionsOnly) {
        console.log('Building expansion pack bundles...');
        await builder.buildAllExpansionPacks({ clean: false });
      } else {
        if (!options.teamsOnly) {
          console.log('Building agent bundles...');
          await builder.buildAgents();
        }

        if (!options.agentsOnly) {
          console.log('Building team bundles...');
          await builder.buildTeams();
        }

        if (!options.noExpansions) {
          console.log('Building expansion pack bundles...');
          await builder.buildAllExpansionPacks({ clean: false });
        }
      }

      console.log('Build completed successfully!');
    } catch (error) {
      console.error('Build failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('build:expansions')
  .description('Build web bundles for all expansion packs')
  .option('--expansion <name>', 'Build specific expansion pack only')
  .option('--no-clean', 'Skip cleaning output directories')
  .action(async (options) => {
    const builder = new WebBuilder({
      rootDir: process.cwd()
    });

    try {
      if (options.expansion) {
        console.log(`Building expansion pack: ${options.expansion}`);
        await builder.buildExpansionPack(options.expansion, { clean: options.clean });
      } else {
        console.log('Building all expansion packs...');
        await builder.buildAllExpansionPacks({ clean: options.clean });
      }

      console.log('Expansion pack build completed successfully!');
    } catch (error) {
      console.error('Expansion pack build failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('list:agents')
  .description('List all available agents')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    const agents = await builder.resolver.listAgents();
    console.log('Available agents:');
    agents.forEach(agent => console.log(`  - ${agent}`));
    process.exit(0);
  });

program
  .command('list:expansions')
  .description('List all available expansion packs')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    const expansions = await builder.listExpansionPacks();
    console.log('Available expansion packs:');
    expansions.forEach(expansion => console.log(`  - ${expansion}`));
    process.exit(0);
  });

program
  .command('validate')
  .description('Validate agent and team configurations')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    try {
      // Validate by attempting to build all agents and teams
      const agents = await builder.resolver.listAgents();
      const teams = await builder.resolver.listTeams();
      
      console.log('Validating agents...');
      for (const agent of agents) {
        await builder.resolver.resolveAgentDependencies(agent);
        console.log(`  ✓ ${agent}`);
      }
      
      console.log('\nValidating teams...');
      for (const team of teams) {
        await builder.resolver.resolveTeamDependencies(team);
        console.log(`  ✓ ${team}`);
      }
      
      console.log('\nAll configurations are valid!');
    } catch (error) {
      console.error('Validation failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('upgrade')
  .description('Upgrade a BMad-Method V3 project to V4')
  .option('-p, --project <path>', 'Path to V3 project (defaults to current directory)')
  .option('--dry-run', 'Show what would be changed without making changes')
  .option('--no-backup', 'Skip creating backup (not recommended)')
  .action(async (options) => {
    const upgrader = new V3ToV4Upgrader();
    await upgrader.upgrade({
      projectPath: options.project,
      dryRun: options.dryRun,
      backup: options.backup
    });
  });

program
  .command('start-data-service')
  .description('Start the data ingestion service')
  .option('-p, --port <port>', 'Port to run service on', '3001')
  .action(async (options) => {
    if (!isFeatureEnabled('pyairbyte_integration')) {
      console.error('✗ PyAirbyte integration feature is disabled. Enable it first with: bmad enable-feature pyairbyte_integration');
      process.exit(1);
    }

    const DataIngestionService = require('./data-services/data-ingestion-service');
    const service = new DataIngestionService({ port: parseInt(options.port) });
    
    try {
      await service.start();
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down data service...');
        await service.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        await service.stop();
        process.exit(0);
      });
      
    } catch (error) {
      console.error('✗ Failed to start data service:', error.message);
      process.exit(1);
    }
  });

program
  .command('setup-python')
  .description('Setup Python environment for PyAirbyte')
  .option('--reinstall', 'Reinstall even if already exists')
  .action(async (options) => {
    const PythonSubprocessManager = require('./lib/python-subprocess');
    const python = new PythonSubprocessManager();
    
    try {
      console.log('🐍 Setting up Python environment...');
      
      // Check if virtual environment already exists
      const venvPath = path.join(process.cwd(), '.venv');
      const venvExists = require('fs-extra').existsSync(venvPath);
      
      if (venvExists && !options.reinstall) {
        console.log('✓ Virtual environment already exists');
      } else {
        console.log('📦 Creating virtual environment...');
        await python.createVirtualEnvironment(venvPath);
        console.log('✓ Virtual environment created');
      }
      
      // Install packages
      console.log('📥 Installing PyAirbyte and dependencies...');
      const requirementsPath = path.join(process.cwd(), 'requirements.txt');
      
      if (require('fs-extra').existsSync(requirementsPath)) {
        await python.installPackages(['-r', requirementsPath], { timeout: 300000 }); // 5 minutes
        console.log('✓ Python packages installed');
      } else {
        console.log('⚠️  requirements.txt not found, installing basic packages...');
        await python.installPackages(['airbyte==0.20.0', 'pandas', 'numpy'], { timeout: 300000 });
      }
      
      // Test PyAirbyte availability
      console.log('🔍 Testing PyAirbyte installation...');
      const availability = await python.checkAvailability();
      
      if (availability.available && availability.packages?.pyairbyte) {
        console.log('✅ PyAirbyte setup complete and ready!');
        console.log(`Python: ${availability.python_version}`);
        console.log(`Executable: ${availability.executable}`);
      } else {
        console.log('⚠️  Setup complete but PyAirbyte may not be fully available');
        console.log('Try running: pip install pyairbyte pandas numpy');
      }
      
    } catch (error) {
      console.error('✗ Python setup failed:', error.message);
      console.log('\n💡 Try installing manually:');
      console.log('  python3 -m venv .venv');
      console.log('  source .venv/bin/activate  # On macOS/Linux');
      console.log('  .venv\\Scripts\\activate.bat  # On Windows');
      console.log('  pip install -r requirements.txt');
      process.exit(1);
    }
  });

program
  .command('data-connectors')
  .description('List available data connectors')
  .action(async () => {
    if (!isFeatureEnabled('pyairbyte_integration')) {
      console.error('✗ PyAirbyte integration feature is disabled');
      process.exit(1);
    }

    const PyAirbyteWrapper = require('./data-services/pyairbyte-wrapper');
    const pyairbyte = new PyAirbyteWrapper();
    
    try {
      console.log('🔍 Checking PyAirbyte availability...');
      const availability = await pyairbyte.checkAvailability();
      
      if (!availability.available) {
        console.error('✗ PyAirbyte not available:', availability.reason || availability.error);
        console.log('💡 Try running: bmad setup-python');
        process.exit(1);
      }
      
      console.log('📊 Available data connectors:');
      console.log('─'.repeat(60));
      
      const connectors = await pyairbyte.listConnectors();
      
      if (connectors.success) {
        Object.entries(connectors.connectors).forEach(([key, connector]) => {
          console.log(`✓ ${key}: ${connector.name}`);
          console.log(`  ${connector.description}`);
          if (connector.formats) {
            console.log(`  Formats: ${connector.formats.join(', ')}`);
          }
          console.log('');
        });
      } else {
        console.error('✗ Failed to list connectors:', connectors.error);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('✗ Error listing connectors:', error.message);
      process.exit(1);
    }
  });

program
  .command('enable-feature <feature>')
  .description('Enable a data practitioner feature')
  .option('-f, --force', 'Force enable even with missing dependencies')
  .action(async (feature, options) => {
    try {
      const enabled = enableFeature(feature, options.force);
      if (enabled) {
        console.log(`✓ Feature '${feature}' has been enabled`);
        
        // Show dependent features
        const statuses = getAllFeatureStatuses();
        const deps = statuses[feature]?.dependencies || [];
        if (deps.length > 0) {
          console.log(`  Dependencies: ${deps.join(', ')}`);
        }
      }
    } catch (error) {
      console.error(`✗ Failed to enable feature: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('disable-feature <feature>')
  .description('Disable a data practitioner feature')
  .option('--no-cascade', 'Do not disable dependent features')
  .action(async (feature, options) => {
    try {
      const disabled = disableFeature(feature, options.cascade);
      console.log(`✓ Disabled features: ${disabled.join(', ')}`);
    } catch (error) {
      console.error(`✗ Failed to disable feature: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('list-features')
  .description('List all data practitioner features and their status')
  .action(async () => {
    const statuses = getAllFeatureStatuses();
    
    console.log('Data Practitioner Features:');
    console.log('─'.repeat(60));
    
    Object.entries(statuses).forEach(([name, status]) => {
      const indicator = status.enabled ? '✓' : '✗';
      const state = status.enabled ? 'enabled' : 'disabled';
      console.log(`${indicator} ${name} (${state})`);
      console.log(`  ${status.description}`);
      
      if (status.dependencies.length > 0) {
        console.log(`  Dependencies: ${status.dependencies.join(', ')}`);
      }
      console.log('');
    });
  });

program.parse();