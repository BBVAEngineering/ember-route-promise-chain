import { isArray } from '@ember/array';
import Ember from 'ember';
import { get } from '@ember/object';

const RUNNING = Symbol('running');
const IDLE = Symbol('idle');
let onExitHandlers;
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

function willTransition(transition) {
	// const routerMicrolib = this._routerMicrolib || this.router;

	// onExitHandlers = routerMicrolib.state.handlerInfos;

	onExitHandlers = transition.router.state.routeInfos;

	state = IDLE;
}

async function didTransition(transition) {
	if (get(transition, 'from.name') === get(transition, 'to.name')) {
		return;
	}

	// const routerMicrolib = this._routerMicrolib || this.router;
	const onExitHooks = onExitHandlers
		.filter((info) => !transition.routeInfos.includes(info))
		.map((info) => [info._route, 'onExit'])
		.reverse();
	const onEnterHooks = transition.routeInfos
		.filter((info) => !onExitHandlers.includes(info))
		.map((info) => [info._route, 'onEnter']);
	const hooks = [...onExitHooks, ...onEnterHooks]
		.filter(([context, method]) => context && context[method]);

	state = RUNNING;

	await runHooks(hooks);
}

function hasNewRouterEvents() {

}

const HAS_NEW_ROUTER_EVENTS = hasNewRouterEvents();

/**
 * Intercept router hooks "willTransition" and "didTransition" to generate functionality.
 *
 * @method injectPromiseChain
 * @param {Ember.Application} appInstance
 */
export default function injectPromiseChain(appInstance) {
	const router = appInstance.lookup('service:router');

	router.on('routeWillChange', willTransition);
	router.on('routeDidChange', didTransition);
}

