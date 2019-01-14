import { visit } from '@ember/test-helpers';
import { reject, resolve } from 'rsvp';
import Route from '@ember/routing/route';
import sinon from 'sinon';
import Ember from 'ember';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import injectPromiseChain from 'ember-route-promise-chain';

module('Acceptance | route-promise-chain | chains', function(hooks) {
  setupApplicationTest(hooks);

  hooks.beforeEach(function() {
      this.sandbox = sinon.sandbox.create();
      this.appInstance = this.application.__container__.owner;
      this.service = this.appInstance.lookup('service:promise-chain');

      this.appInstance.register('route:A', Route.extend());
      this.appInstance.register('route:B', Route.extend());
      this.appInstance.register('route:C', Route.extend());
      this.appInstance.register('route:A.A', Route.extend());

      injectPromiseChain(this.appInstance);

      return visit('/');
  });

  hooks.afterEach(function() {
      Ember.onerror = null;
  });

  test('it executes chain on "onEnter" hook', async function(assert) {
      const routeA = this.appInstance.lookup('route:A');
      const chain = sinon.spy();

      routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

      await visit('/A');

      assert.ok(chain.calledOnce, 'chain is called');
  });

  test('it executes chain on "onExit" hook', async function(assert) {
      const routeA = this.appInstance.lookup('route:A');
      const chain = sinon.spy();

      await visit('/A');

      routeA.onExit = this.sandbox.stub().returns(resolve([chain]));

      await visit('/B');

      assert.ok(chain.calledOnce, 'chain is called');
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
      const chain1 = sinon.spy();
      const chain2 = sinon.spy();

      routeA.onEnter = this.sandbox.stub().returns(resolve([chain1, chain2]));

      await visit('/A');

      assert.ok(chain1.calledBefore(chain2), 'chain is called before');
  });

  test('it stop execution when a chain breaks', async function(assert) {
      const routeA = this.appInstance.lookup('route:A');
      const chain1 = () => reject();
      const chain2 = sinon.spy();

      routeA.onEnter = this.sandbox.stub().returns(resolve([chain1, chain2]));

      await visit('/A');

      assert.ok(chain2.notCalled, 'chain is not called');
  });

  test('it does not stop execution when a nested chain breaks', async function(assert) {
      const routeA = this.appInstance.lookup('route:A');
      const routeAA = this.appInstance.lookup('route:A.A');
      const chain1 = () => reject();
      const chain2 = sinon.spy();

      routeA.onEnter = this.sandbox.stub().returns(resolve([chain1]));
      routeAA.onEnter = this.sandbox.stub().returns(resolve([chain2]));

      await visit('/A/A');

      assert.ok(chain2.calledOnce, 'chain is called');
  });

  test('it calls default onerror when a chain breaks', async function(assert) {
      const routeA = this.appInstance.lookup('route:A');
      const error = new Error('foo');
      const chain = () => reject(error);

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
      const chain1 = () => router.transitionTo('B');
      const chain2 = sinon.spy();

      routeA.onEnter = this.sandbox.stub().returns(resolve([chain1, chain2]));

      await visit('/A');

      assert.ok(chain2.notCalled, 'chain is not called');
  });

  test('it stops nested chains when new transition occurs', async function(assert) {
      const router = this.appInstance.lookup('router:main');
      const routeA = this.appInstance.lookup('route:A');
      const routeAA = this.appInstance.lookup('route:A.A');
      const chain1 = () => router.transitionTo('B');
      const chain2 = sinon.spy();

      routeA.onEnter = this.sandbox.stub().returns(resolve([chain1]));
      routeAA.onEnter = this.sandbox.stub().returns(resolve([chain2]));

      await visit('/A/A');

      assert.ok(chain2.notCalled, 'chain is not called');
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
      const chain = async () => assert.ok(true, 'chain is called');

      routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

      await visit('/A');
  });

  test('it supports async chains with conditions', async function(assert) {
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

  test('it chains "onExit" hooks when a trasition occurs before chain resolution', async function(assert) {
      const router = this.appInstance.lookup('router:main');
      const routeA = this.appInstance.lookup('route:A');
      const routeB = this.appInstance.lookup('route:B');
      const routeC = this.appInstance.lookup('route:C');
      const chain1 = sinon.spy();
      const chain2 = sinon.spy();
      const chain3 = sinon.spy();

      await visit('/A');

      routeB.beforeModel = () => router.transitionTo('C');
      routeA.onExit = this.sandbox.stub().returns(resolve([chain1]));
      routeB.onEnter = this.sandbox.stub().returns(resolve([chain2]));
      routeC.onEnter = this.sandbox.stub().returns(resolve([chain3]));

      await visit('/B');

      assert.ok(chain1.calledOnce, 'chain is called');
      assert.ok(chain2.notCalled, 'chain is not called');
      assert.ok(chain3.calledOnce, 'chain is called');
  });

  test('it does not executes hooks on transition abort', async function(assert) {
      const router = this.appInstance.lookup('router:main');
      const routerMicrolib = router._routerMicrolib || router.router;
      const routeA = this.appInstance.lookup('route:A');
      const routeB = this.appInstance.lookup('route:B');
      const chain1 = sinon.spy();
      const chain2 = sinon.spy();

      await visit('/A');

      routeB.beforeModel = () => routerMicrolib.activeTransition.abort();
      routeA.onExit = this.sandbox.stub().returns(resolve([chain1]));
      routeB.onEnter = this.sandbox.stub().returns(resolve([chain2]));

      await visit('/B');

      assert.ok(chain1.notCalled, 'chain is not called');
      assert.ok(chain2.notCalled, 'chain is not called');
  });

  test('it does not execute chain on transition to same route', async function(assert) {
      const routeA = this.appInstance.lookup('route:A');
      const chain = sinon.spy();

      routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

      await visit('/A?foo=foo');
      await visit('/A?foo=bar');

      assert.ok(chain.calledOnce, 'chain is called only once');
  });
});
