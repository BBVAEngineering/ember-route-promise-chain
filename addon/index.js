import Ember from 'ember';

const { isArray } = Ember;
const RUNNING = Symbol('running');
const IDLE = Symbol('idle');
let state = IDLE;

async function runConditional(context, conditional) {
	let ret = true;

	if (conditional.condition) {
		ret = await conditional.condition.apply(context);
	}

	if (ret) {
		await conditional.promise.apply(context);
	}
}

async function runChain([context, method]) {
	const conditionals = await context[method]();

	if (!isArray(conditionals)) {
		throw new Error(`Hook ${method} must return an array`);
	}

	for (let i = 0; i < conditionals.length && state === RUNNING; i++) {
		const conditional = conditionals[i];

		await runConditional(context, conditional);
	}
}

async function runChains(chains) {
	for (let i = 0; i < chains.length && state === RUNNING; i++) {
		const chain = chains[i];

		try {
			await runChain(chain);
		} catch (e) {
			if (e && Ember.onerror) {
				Ember.onerror(e);
			}
		}
	}

	state = IDLE;
}

function willTransition() {
	state = IDLE;
}

function didTransition() {
	const routerMicrolib = this._routerMicrolib;
	const onEnterChains = routerMicrolib.state.handlerInfos
		.filter((info) => !routerMicrolib.oldState.handlerInfos.includes(info))
		.map((info) => [info.handler, 'onEnter']);
	const onExitChains = routerMicrolib.oldState.handlerInfos
		.filter((info) => !routerMicrolib.state.handlerInfos.includes(info))
		.map((info) => [info.handler, 'onExit']);
	const chains = []
		.concat(onExitChains)
		.concat(onEnterChains)
		.filter(([context, method]) => context && context[method]);

	state = RUNNING;

	runChains(chains);
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

