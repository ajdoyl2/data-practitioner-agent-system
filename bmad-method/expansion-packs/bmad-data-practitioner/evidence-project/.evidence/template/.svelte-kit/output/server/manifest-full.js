export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["apple-touch-icon.png","custom-styles.css","data/manifest.json","favicon.ico","icon-192.png","icon-512.png","icon.svg","manifest.webmanifest"]),
	mimeTypes: {".png":"image/png",".css":"text/css",".json":"application/json",".ico":"image/vnd.microsoft.icon",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"},
	_: {
		client: null,
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js')),
			__memo(() => import('./nodes/7.js')),
			__memo(() => import('./nodes/8.js')),
			__memo(() => import('./nodes/9.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/analysis",
				pattern: /^\/analysis\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/api/customFormattingSettings.json",
				pattern: /^\/api\/customFormattingSettings\.json\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/customFormattingSettings.json/_server.js'))
			},
			{
				id: "/api/manifest.json",
				pattern: /^\/api\/manifest\.json\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/manifest.json/_server.js'))
			},
			{
				id: "/api/prerendered_queries/[query_hash].arrow",
				pattern: /^\/api\/prerendered_queries\/([^/]+?)\.arrow\/?$/,
				params: [{"name":"query_hash","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/prerendered_queries/_query_hash_.arrow/_server.js'))
			},
			{
				id: "/api/settings.json",
				pattern: /^\/api\/settings\.json\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/settings.json/_server.js'))
			},
			{
				id: "/api/[route_hash]/[additional_hash]/all-queries.json",
				pattern: /^\/api\/([^/]+?)\/([^/]+?)\/all-queries\.json\/?$/,
				params: [{"name":"route_hash","optional":false,"rest":false,"chained":false},{"name":"additional_hash","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/_route_hash_/_additional_hash_/all-queries.json/_server.js'))
			},
			{
				id: "/explore/console",
				pattern: /^\/explore\/console\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/explore/schema",
				pattern: /^\/explore\/schema\/?$/,
				params: [],
				page: { layouts: [0,2,], errors: [1,,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/reports",
				pattern: /^\/reports\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/settings",
				pattern: /^\/settings\/?$/,
				params: [],
				page: { layouts: [0,3,], errors: [1,,], leaf: 9 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();
