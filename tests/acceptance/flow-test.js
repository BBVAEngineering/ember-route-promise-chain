import { visit } from '@ember/test-helpers';
import Route from '@ember/routing/route';
import sinon from 'sinon';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import injectPromiseChain from 'ember-route-promise-chain';

module('Acceptance | route-promise-chain | flow', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
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
  });

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

  test('it runs "onExit" parent hooks after child hooks', async function(assert) {
      const routeA = this.appInstance.lookup('route:A');
      const routeAA = this.appInstance.lookup('route:A.A');

      await visit('/A/A');

      routeA.onExit = this.sandbox.spy();
      routeAA.onExit = this.sandbox.spy();

      await visit('/B');

      assert.ok(routeA.onExit.calledAfter(routeAA.onExit), 'hook is called before');
  });
});

