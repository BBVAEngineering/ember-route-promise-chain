import sinon from 'sinon';
import Ember from 'ember';
import { test } from 'ember-qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import injectPromiseChain from 'ember-route-promise-chain';

const { Route } = Ember;
const { RSVP: { resolve, reject } } = Ember;

moduleForAcceptance('Acceptance | chains', {
	beforeEach() {
		this.sandbox = sinon.sandbox.create();
		this.appInstance = this.application.__container__.owner;
		this.service = this.appInstance.lookup('service:promise-chain');

		this.appInstance.register('route:A', Route.extend());
		this.appInstance.register('route:B', Route.extend());
		this.appInstance.register('route:A.A', Route.extend());
		this.appInstance.register('route:A.B', Route.extend());
		this.appInstance.register('route:B.A', Route.extend());
		this.appInstance.register('route:A.A.A', Route.extend());

		injectPromiseChain(this.appInstance);

		return visit('/');
	}
});

// Flow.

test('it runs "onEnter" hook upon entering a route', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');

	routeA.onEnter = this.sandbox.spy();

	await visit('/A');

	assert.ok(routeA.onEnter.calledOnce, 'hook is called');
});

test('it runs "onExit" hook upon exiting a route', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');

	await visit('/A');

	routeA.onExit = this.sandbox.spy();

	await visit('/B');

	assert.ok(routeA.onExit.calledOnce, 'hook is called');
});

test('it runs "onEnter" hook on every nested routes', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const routeAA = this.appInstance.lookup('route:A.A');

	routeA.onEnter = this.sandbox.spy();
	routeAA.onEnter = this.sandbox.spy();

	await visit('/A/A');

	assert.ok(routeA.onEnter.calledOnce, 'hook is called');
	assert.ok(routeAA.onEnter.calledOnce, 'hook is called');
});

test('it runs "onExit" hook from nested routes', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const routeAA = this.appInstance.lookup('route:A.A');

	await visit('/A/A');

	routeA.onExit = this.sandbox.spy();
	routeAA.onExit = this.sandbox.spy();

	await visit('/B');

	assert.ok(routeA.onExit.calledOnce, 'hook is called');
	assert.ok(routeAA.onExit.calledOnce, 'hook is called');
});

test('it runs "onEnter" hook only on changed routes', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const routeAB = this.appInstance.lookup('route:A.B');

	await visit('/A/A');

	routeA.onEnter = this.sandbox.spy();
	routeAB.onEnter = this.sandbox.spy();

	await visit('/A/B');

	assert.ok(routeA.onEnter.notCalled, 'hook is not called');
	assert.ok(routeAB.onEnter.calledOnce, 'hook is called');
});

test('it runs "onExit" hook only on changed routes', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const routeAA = this.appInstance.lookup('route:A.A');

	await visit('/A/A');

	routeA.onExit = this.sandbox.spy();
	routeAA.onExit = this.sandbox.spy();

	await visit('/A/B');

	assert.ok(routeA.onExit.notCalled, 'hook is not called');
	assert.ok(routeAA.onExit.calledOnce, 'hook is called');
});

test('it does not call unnecesary hooks', async function(assert) {
	const routeB = this.appInstance.lookup('route:B');
	const routeAAA = this.appInstance.lookup('route:A.A.A');

	routeB.onEnter = this.sandbox.spy();
	routeAAA.onEnter = this.sandbox.spy();

	await visit('/A/A');

	assert.ok(routeB.onEnter.notCalled, 'hook is not called');
	assert.ok(routeAAA.onEnter.notCalled, 'hook is not called');
});

test('it runs "onExit" hooks before "onEnter" hooks', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const routeB = this.appInstance.lookup('route:B');

	await visit('/A');

	routeA.onExit = this.sandbox.spy();
	routeB.onEnter = this.sandbox.spy();

	await visit('/B');

	assert.ok(routeA.onExit.calledBefore(routeB.onEnter), 'hook is called before');
});

test('it runs "onEnter" child hooks after parent hooks', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const routeAA = this.appInstance.lookup('route:A.A');

	routeA.onEnter = this.sandbox.spy();
	routeAA.onEnter = this.sandbox.spy();

	await visit('/A/A');

	assert.ok(routeA.onEnter.calledBefore(routeAA.onEnter), 'hook is called before');
});

test('it runs "onExit" child hooks after parent hooks', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const routeAA = this.appInstance.lookup('route:A.A');

	await visit('/A/A');

	routeA.onExit = this.sandbox.spy();
	routeAA.onExit = this.sandbox.spy();

	await visit('/B');

	assert.ok(routeA.onExit.calledBefore(routeAA.onExit), 'hook is called before');
});

// Chains.

test('it executes chain on "onEnter" hook', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const chain = { promise: sinon.spy() };

	routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

	await visit('/A');

	assert.ok(chain.promise.calledOnce, 'chain is called');
});

test('it executes chain on "onExit" hook', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const chain = { promise: sinon.spy() };

	await visit('/A');

	routeA.onExit = this.sandbox.stub().returns(resolve([chain]));

	await visit('/B');

	assert.ok(chain.promise.calledOnce, 'chain is called');
});

test('it executes chain when condition is truthy', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const chain = {
		condition: () => true,
		promise: sinon.spy()
	};

	routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

	await visit('/A');

	assert.ok(chain.promise.calledOnce, 'chain is called');
});

test('it executes chain when condition is falsy', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const chain = {
		condition: () => false,
		promise: sinon.spy()
	};

	routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

	await visit('/A');

	assert.ok(chain.promise.notCalled, 'chain is not called');
});

test('it executes all chains in order', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const chain1 = { promise: sinon.spy() };
	const chain2 = { promise: sinon.spy() };

	routeA.onEnter = this.sandbox.stub().returns(resolve([chain1, chain2]));

	await visit('/A');

	assert.ok(chain1.promise.calledBefore(chain2.promise), 'chain is called before');
});

test('it stop execution when a chain breaks', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const chain1 = { promise: () => reject() };
	const chain2 = { promise: sinon.spy() };

	routeA.onEnter = this.sandbox.stub().returns(resolve([chain1, chain2]));

	await visit('/A');

	assert.ok(chain2.promise.notCalled, 'chain is not called');
});

test('it does not stop execution when a nested chain breaks', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const routeAA = this.appInstance.lookup('route:A.A');
	const chain1 = { promise: () => reject() };
	const chain2 = { promise: sinon.spy() };

	routeA.onEnter = this.sandbox.stub().returns(resolve([chain1]));
	routeAA.onEnter = this.sandbox.stub().returns(resolve([chain2]));

	await visit('/A/A');

	assert.ok(chain2.promise.calledOnce, 'chain is called');
});

test('it calls default onerror when a chain breaks', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const error = new Error('foo');
	const chain = { promise: () => reject(error) };

	Ember.onerror = this.sandbox.stub();
	routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

	await visit('/A');

	assert.ok(Ember.onerror.calledWith(error), 'onerror is called');
});

test('it calls default onerror when a hook breaks', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');
	const error = new Error('foo');

	Ember.onerror = this.sandbox.stub();
	routeA.onEnter = this.sandbox.stub().throws(error);

	await visit('/A');

	assert.ok(Ember.onerror.calledWith(error), 'onerror is called');
});

test('it stops chains when new transition occurs', async function(assert) {
	const router = this.appInstance.lookup('router:main');
	const routeA = this.appInstance.lookup('route:A');
	const chain1 = { promise: () => router.transitionTo('B') };
	const chain2 = { promise: sinon.spy() };

	routeA.onEnter = this.sandbox.stub().returns(resolve([chain1, chain2]));

	await visit('/A');

	assert.ok(chain2.promise.notCalled, 'chain is not called');
});

test('it stops nested chains when new transition occurs', async function(assert) {
	const router = this.appInstance.lookup('router:main');
	const routeA = this.appInstance.lookup('route:A');
	const routeAA = this.appInstance.lookup('route:A.A');
	const chain1 = { promise: () => router.transitionTo('B') };
	const chain2 = { promise: sinon.spy() };

	routeA.onEnter = this.sandbox.stub().returns(resolve([chain1]));
	routeAA.onEnter = this.sandbox.stub().returns(resolve([chain2]));

	await visit('/A/A');

	assert.ok(chain2.promise.notCalled, 'chain is not called');
});

test('it supports async hooks', async function(assert) {
	assert.expect(1);

	const routeA = this.appInstance.lookup('route:A');

	routeA.onEnter = async () => assert.ok(true, 'hook is called');

	await visit('/A');
});

test('it supports async chains', async function(assert) {
	assert.expect(1);

	const routeA = this.appInstance.lookup('route:A');
	const chain = {
		condition: async () => true,
		promise: async () => assert.ok(true, 'chain is called')
	};

	routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

	await visit('/A');
});

test('it throws an error when hook does not return an array', async function(assert) {
	const routeA = this.appInstance.lookup('route:A');

	Ember.onerror = this.sandbox.stub();
	routeA.onEnter = resolve({ foo: 'bar' });

	await visit('/A');

	assert.ok(Ember.onerror.calledWithMatch(Error), 'onerror is called');
});
