import { visit } from '@ember/test-helpers';
import { reject, resolve } from 'rsvp';
import Route from '@ember/routing/route';
import sinon from 'sinon';
import Ember from 'ember';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import injectPromiseChain from 'ember-route-promise-chain';

module('Acceptance | route-promise-chain | chains', (hooks) => {
	setupApplicationTest(hooks);

	hooks.beforeEach(function() {
		this.sandbox = sinon.createSandbox();
		this.service = this.owner.lookup('service:promise-chain');

		this.owner.register('route:a', Route.extend());
		this.owner.register('route:b', Route.extend());
		this.owner.register('route:c', Route.extend());
		this.owner.register('route:a.a', Route.extend());

		injectPromiseChain(this.owner);

		return visit('/');
	});

	hooks.afterEach(() => {
		Ember.onerror = null;
	});

	test('it executes chain on "onEnter" hook', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const chain = sinon.spy();

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

		await visit('/a');

		assert.ok(chain.calledOnce, 'chain is called');
	});

	test('it executes chain on "onExit" hook', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const chain = sinon.spy();

		await visit('/a');

		routeA.onExit = this.sandbox.stub().returns(resolve([chain]));

		await visit('/b');

		assert.ok(chain.calledOnce, 'chain is called');
	});

	test('it executes chain when condition is truthy', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const chain = {
			condition: () => true,
			promise: sinon.spy()
		};

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

		await visit('/a');

		assert.ok(chain.promise.calledOnce, 'chain is called');
	});

	test('it executes chain when condition is falsy', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const chain = {
			condition: () => false,
			promise: sinon.spy()
		};

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

		await visit('/a');

		assert.ok(chain.promise.notCalled, 'chain is not called');
	});

	test('it executes all chains in order', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const chain1 = sinon.spy();
		const chain2 = sinon.spy();

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain1, chain2]));

		await visit('/a');

		assert.ok(chain1.calledBefore(chain2), 'chain is called before');
	});

	test('it stop execution when a chain breaks', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const chain1 = () => reject();
		const chain2 = sinon.spy();

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain1, chain2]));

		await visit('/a');

		assert.ok(chain2.notCalled, 'chain is not called');
	});

	test('it does not stop execution when a nested chain breaks', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const routeAA = this.owner.lookup('route:a.a');
		const chain1 = () => reject();
		const chain2 = sinon.spy();

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain1]));
		routeAA.onEnter = this.sandbox.stub().returns(resolve([chain2]));

		await visit('/a/a');

		assert.ok(chain2.calledOnce, 'chain is called');
	});

	test('it calls default onerror when a chain breaks', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const error = new Error('foo');
		const chain = () => reject(error);

		Ember.onerror = this.sandbox.stub();
		routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

		await visit('/a');

		assert.ok(Ember.onerror.calledWith(error), 'onerror is called');
	});

	test('it calls default onerror when a hook breaks', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const error = new Error('foo');

		Ember.onerror = this.sandbox.stub();
		routeA.onEnter = this.sandbox.stub().throws(error);

		await visit('/a');

		assert.ok(Ember.onerror.calledWith(error), 'onerror is called');
	});

	test('it stops chains when new transition occurs', async function(assert) {
		const router = this.owner.lookup('router:main');
		const routeA = this.owner.lookup('route:a');
		const chain1 = () => router.transitionTo('b');
		const chain2 = sinon.spy();

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain1, chain2]));

		await visit('/a');

		assert.ok(chain2.notCalled, 'chain is not called');
	});

	test('it stops nested chains when new transition occurs', async function(assert) {
		const router = this.owner.lookup('router:main');
		const routeA = this.owner.lookup('route:a');
		const routeAA = this.owner.lookup('route:a.a');
		const chain1 = () => router.transitionTo('b');
		const chain2 = sinon.spy();

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain1]));
		routeAA.onEnter = this.sandbox.stub().returns(resolve([chain2]));

		await visit('/a/a');

		assert.ok(chain2.notCalled, 'chain is not called');
	});

	test('it supports async hooks', async function(assert) {
		assert.expect(1);

		const routeA = this.owner.lookup('route:a');

		routeA.onEnter = async() => assert.ok(true, 'hook is called');

		await visit('/a');
	});

	test('it supports async chains', async function(assert) {
		assert.expect(1);

		const routeA = this.owner.lookup('route:a');
		const chain = async() => assert.ok(true, 'chain is called');

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

		await visit('/a');
	});

	test('it supports async chains with conditions', async function(assert) {
		assert.expect(1);

		const routeA = this.owner.lookup('route:a');
		const chain = {
			condition: async() => true,
			promise: async() => assert.ok(true, 'chain is called')
		};

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

		await visit('/a');
	});

	test('it throws an error when hook does not return an array', async function(assert) {
		const routeA = this.owner.lookup('route:a');

		Ember.onerror = this.sandbox.stub();
		routeA.onEnter = resolve({ foo: 'bar' });

		await visit('/a');

		assert.ok(Ember.onerror.calledWithMatch(Error), 'onerror is called');
	});

	test('it chains "onExit" hooks when a transition occurs before chain resolution', async function(assert) {
		const router = this.owner.lookup('router:main');
		const routeA = this.owner.lookup('route:a');
		const routeB = this.owner.lookup('route:b');
		const routeC = this.owner.lookup('route:c');
		const chain1 = sinon.spy();
		const chain2 = sinon.spy();
		const chain3 = sinon.spy();

		await visit('/a');

		routeB.beforeModel = () => router.transitionTo('c');
		routeA.onExit = this.sandbox.stub().returns(resolve([chain1]));
		routeB.onEnter = this.sandbox.stub().returns(resolve([chain2]));
		routeC.onEnter = this.sandbox.stub().returns(resolve([chain3]));

		await visit('/b');

		assert.ok(chain1.calledOnce, 'chain is called');
		assert.ok(chain2.notCalled, 'chain is not called');
		assert.ok(chain3.calledOnce, 'chain is called');
	});

	test('it does not executes hooks on transition abort', async function(assert) {
		const router = this.owner.lookup('router:main');
		const routerMicrolib = router._routerMicrolib || router.router;
		const routeA = this.owner.lookup('route:a');
		const routeB = this.owner.lookup('route:b');
		const chain1 = sinon.spy();
		const chain2 = sinon.spy();

		await visit('/a');

		routeB.beforeModel = () => routerMicrolib.activeTransition.abort();
		routeA.onExit = this.sandbox.stub().returns(resolve([chain1]));
		routeB.onEnter = this.sandbox.stub().returns(resolve([chain2]));

		try {
			await visit('/b');
		} catch(e) {
			// foo
		}

		assert.ok(chain1.notCalled, 'chain is not called');
		assert.ok(chain2.notCalled, 'chain is not called');
	});

	test('it does not execute chain on transition to same route', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const chain = sinon.spy();

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

		await visit('/a?foo=foo');
		await visit('/a?foo=bar');

		assert.ok(chain.calledOnce, 'chain is called only once');
	});
});
