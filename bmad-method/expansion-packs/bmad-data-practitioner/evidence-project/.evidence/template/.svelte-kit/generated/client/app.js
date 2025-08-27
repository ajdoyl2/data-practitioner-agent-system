import * as client_hooks from '../../../src/hooks.client.js';

export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9')
];

export const server_loads = [0,3];

export const dictionary = {
		"/": [4],
		"/analysis": [5],
		"/explore/console": [6,[2]],
		"/explore/schema": [7,[2]],
		"/reports": [8],
		"/settings": [~9,[3]]
	};

export const hooks = {
	handleError: client_hooks.handleError || (({ error }) => { console.error(error) }),
};

export { default as root } from '../root.svelte';