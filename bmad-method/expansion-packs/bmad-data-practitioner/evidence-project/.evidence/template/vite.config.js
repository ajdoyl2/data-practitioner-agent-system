import { sveltekit } from "@sveltejs/kit/vite"
	import { evidenceVitePlugin } from "@evidence-dev/plugin-connector"
	import { createLogger } from 'vite';

	const logger = createLogger();
	const loggerWarn = logger.warn;

	logger.warn = (msg, options) => {
		// ignore fs/promises warning, used in +layout.js behind if (!browser) check
		if (msg.includes('Module "fs/promises" has been externalized for browser compatibility')) return;
		// ignore eval warning, used in duckdb-wasm
		if (msg.includes('Use of eval in') && msg.includes('is strongly discouraged as it poses security risks and may cause issues with minification.')) return;
		loggerWarn(msg, options);
	};

    const strictFs = (process.env.NODE_ENV === 'development') ? false : true;
    /** @type {import('vite').UserConfig} */
     const config = 
    {
        plugins: [sveltekit(), evidenceVitePlugin()],
        optimizeDeps: {
            include: ['echarts-stat', 'echarts', 
				// We need these to prevent HMR from doing a full page reload
				...(process.env.EVIDENCE_DISABLE_INCLUDE ? [] : [
					'@evidence-dev/core-components',
					'@evidence-dev/component-utilities/stores',
					'@evidence-dev/component-utilities/formatting',
					'@evidence-dev/component-utilities/globalContexts',
					'@evidence-dev/component-utilities/buildQuery',
					'@evidence-dev/component-utilities/profile'
				])
				
			],
            exclude: ['svelte-icons', 'svelte-tiny-linked-charts', '@evidence-dev/universal-sql']
        },
        ssr: {
            external: ['@evidence-dev/db-orchestrator', '@evidence-dev/telemetry', 'blueimp-md5', '@evidence-dev/plugin-connector']
        },
        server: {
            fs: {
                strict: strictFs // allow template to get dependencies outside the .evidence folder
            }
        },
		build: {
			rollupOptions: {
				external: [/^@evidence-dev\/tailwind\/fonts\//],
				onwarn(warning, warn) {
					if (warning.code === 'EVAL') return;
					warn(warning);
				}
			}
		},
		customLogger: logger
    }
    export default config