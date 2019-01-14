import { visit } from '@ember/test-helpers';
import Route from '@ember/routing/route';
import sinon from 'sinon';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import injectPromiseChain from 'ember-route-promise-chain';

module('Acceptance | route-promise-chain | flow', (hooks) => {
	setupApplicationTest(hooks);

	hooks.beforeEach(function() {
		this.sandbox = sinon.createSandbox();
		this.service = this.owner.lookup('service:promise-chain');

		this.owner.register('route:a', Route.extend());
		this.owner.register('route:b', Route.extend());
		this.owner.register('route:a.a', Route.extend());
		this.owner.register('route:a.b', Route.extend());
		this.owner.register('route:b.a', Route.extend());
		this.owner.register('route:a.a.a', Route.extend());

		injectPromiseChain(this.owner);

		return visit('/');
	});

	test('it runs "onEnter" hook upon entering a route', async function(assert) {
		const routeA = this.owner.lookup('route:a');

		routeA.onEnter = this.sandbox.spy();

		await visit('/a');

		assert.ok(routeA.onEnter.calledOnce, 'hook is called');
	});

	test('it runs "onExit" hook upon exiting a route', async function(assert) {
		const routeA = this.owner.lookup('route:a');

		await visit('/a');

		routeA.onExit = this.sandbox.spy();

		await visit('/b');

		assert.ok(routeA.onExit.calledOnce, 'hook is called');
	});

	test('it runs "onEnter" hook on every nested routes', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const routeAA = this.owner.lookup('route:a.a');

		routeA.onEnter = this.sandbox.spy();
		routeAA.onEnter = this.sandbox.spy();

		await visit('/a/a');

		assert.ok(routeA.onEnter.calledOnce, 'hook is called');
		assert.ok(routeAA.onEnter.calledOnce, 'hook is called');
	});

	test('it runs "onExit" hook from nested routes', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const routeAA = this.owner.lookup('route:a.a');

		await visit('/a/a');

		routeA.onExit = this.sandbox.spy();
		routeAA.onExit = this.sandbox.spy();

		await visit('/b');

		assert.ok(routeA.onExit.calledOnce, 'hook is called');
		assert.ok(routeAA.onExit.calledOnce, 'hook is called');
	});

	test('it runs "onEnter" hook only on changed routes', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const routeAB = this.owner.lookup('route:a.b');

		await visit('/a/a');

		routeA.onEnter = this.sandbox.spy();
		routeAB.onEnter = this.sandbox.spy();

		await visit('/a/b');

		assert.ok(routeA.onEnter.notCalled, 'hook is not called');
		assert.ok(routeAB.onEnter.calledOnce, 'hook is called');
	});

	test('it runs "onExit" hook only on changed routes', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const routeAA = this.owner.lookup('route:a.a');

		await visit('/a/a');

		routeA.onExit = this.sandbox.spy();
		routeAA.onExit = this.sandbox.spy();

		await visit('/a/b');

		assert.ok(routeA.onExit.notCalled, 'hook is not called');
		assert.ok(routeAA.onExit.calledOnce, 'hook is called');
	});

	test('it does not call unnecesary hooks', async function(assert) {
		const routeB = this.owner.lookup('route:b');
		const routeAAA = this.owner.lookup('route:a.a.a');

		routeB.onEnter = this.sandbox.spy();
		routeAAA.onEnter = this.sandbox.spy();

		await visit('/a/a');

		assert.ok(routeB.onEnter.notCalled, 'hook is not called');
		assert.ok(routeAAA.onEnter.notCalled, 'hook is not called');
	});

	test('it runs "onExit" hooks before "onEnter" hooks', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const routeB = this.owner.lookup('route:b');

		await visit('/a');

		routeA.onExit = this.sandbox.spy();
		routeB.onEnter = this.sandbox.spy();

		await visit('/b');

		assert.ok(routeA.onExit.calledBefore(routeB.onEnter), 'hook is called before');
	});

	test('it runs "onEnter" child hooks after parent hooks', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const routeAA = this.owner.lookup('route:a.a');

		routeA.onEnter = this.sandbox.spy();
		routeAA.onEnter = this.sandbox.spy();

		await visit('/a/a');

		assert.ok(routeA.onEnter.calledBefore(routeAA.onEnter), 'hook is called before');
	});

	test('it runs "onExit" parent hooks after child hooks', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const routeAA = this.owner.lookup('route:a.a');

		await visit('/a/a');

		routeA.onExit = this.sandbox.spy();
		routeAA.onExit = this.sandbox.spy();

		await visit('/b');

		assert.ok(routeA.onExit.calledAfter(routeAA.onExit), 'hook is called before');
	});
});

