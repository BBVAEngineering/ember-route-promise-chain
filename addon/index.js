import Ember from 'ember';
import { isArray } from '@ember/array';
import { get } from '@ember/object';

const RUNNING = Symbol('running');
const IDLE = Symbol('idle');
let currentHandlerInfos;
let state = IDLE;

async function runChain(context, chain) {
	let ret = true;

	if (typeof chain === 'function') {
		await chain.apply(context);
		return;
	}

	if (chain.condition) {
		ret = await chain.condition.apply(context);
	}

	if (ret) {
		await chain.promise.apply(context);
	}
}

async function runHook([context, method]) {
	const chains = await context[method]();

	if (!isArray(chains)) {
		throw new Error(`Hook ${method} must return an array`);
	}

	for (let i = 0; i < chains.length && state === RUNNING; i++) {
		const chain = chains[i];

		await runChain(context, chain);
	}
}

async function runHooks(hooks) {
	for (let i = 0; i < hooks.length && state === RUNNING; i++) {
		const hook = hooks[i];

		try {
			await runHook(hook);
		} catch (e) {
			if (e && Ember.onerror) {
				Ember.onerror(e);
			}
		}
	}

	state = IDLE;
}

// istanbul ignore next: regression for ember >= 3.6
function willTransition() {
	const router = this._routerMicrolib || this.router;

	currentHandlerInfos = router.state.handlerInfos;
}

// istanbul ignore next: regression for ember >= 3.6
async function didTransition() {
	const router = this._routerMicrolib || this.router;
	const targetHandlerInfos = router.state.handlerInfos;
	const onExitHooks = currentHandlerInfos
		.filter((info) => !targetHandlerInfos.includes(info))
		.map((info) => [info.handler, 'onExit'])
		.reverse();
	const onEnterHooks = targetHandlerInfos
		.filter((info) => !currentHandlerInfos.includes(info))
		.map((info) => [info.handler, 'onEnter']);
	const hooks = [...onExitHooks, ...onEnterHooks]
		.filter(([context, method]) => context && context[method]);

	state = RUNNING;

	await runHooks(hooks);

	// This fixes running hooks on navigation to the same route.
	currentHandlerInfos = targetHandlerInfos;
}

function routeDidChange(transition) {
	if (get(transition, 'from.name') === get(transition, 'to.name') || transition.isAborted) {
		return;
	}

	const currentRouteInfos = transition.router.oldState.routeInfos;
	const targetRouteInfos = transition.router.state.routeInfos;
	const onExitHooks = currentRouteInfos
		.filter((info) => !targetRouteInfos.includes(info))
		.map((info) => [info._route, 'onExit'])
		.reverse();
	const onEnterHooks = targetRouteInfos
		.filter((info) => !currentRouteInfos.includes(info))
		.map((info) => [info._route, 'onEnter']);
	const hooks = [...onExitHooks, ...onEnterHooks]
		.filter(([context, method]) => context && context[method]);

	state = RUNNING;

	runHooks(hooks);
}

/**
 * Intercept router hooks "willTransition" and "didTransition" to generate functionality.
 *
 * @method injectPromiseChain
 * @param {Application} appInstance
 */
export default function injectPromiseChain(appInstance) {
	let router = appInstance.lookup('service:router');

	// istanbul ignore if: compatibility with ember < 3.6
	if (!router || !router.on) {
		router = appInstance.lookup('router:main');

		router.on('willTransition', willTransition);
		router.on('didTransition', didTransition);
		return;
	}

	router.on('routeDidChange', routeDidChange);
}

