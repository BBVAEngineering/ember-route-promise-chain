import { isArray } from '@ember/array';
import Ember from 'ember';

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

function willTransition() {
	const routerMicrolib = this._routerMicrolib || this.router;

	onExitHandlers = routerMicrolib.state.handlerInfos;

	state = IDLE;
}

async function didTransition() {
	const routerMicrolib = this._routerMicrolib || this.router;
	const onExitHooks = onExitHandlers
		.filter((info) => !routerMicrolib.state.handlerInfos.includes(info))
		.map((info) => [info.handler, 'onExit'])
		.reverse();
	const onEnterHooks = routerMicrolib.state.handlerInfos
		.filter((info) => !onExitHandlers.includes(info))
		.map((info) => [info.handler, 'onEnter']);
	const hooks = [...onExitHooks, ...onEnterHooks]
		.filter(([context, method]) => context && context[method]);

	state = RUNNING;

	await runHooks(hooks);

	onExitHandlers = routerMicrolib.state.handlerInfos;
}

/**
 * Intercept router hooks "willTransition" and "didTransition" to generate functionality.
 *
 * @method injectPromiseChain
 * @param {Ember.Application} appInstance
 */
export default function injectPromiseChain(appInstance) {
	const router = appInstance.lookup('router:main');

	router.on('willTransition', willTransition);
	router.on('didTransition', didTransition);
}

