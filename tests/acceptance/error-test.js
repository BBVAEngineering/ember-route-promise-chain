import { visit } from '@ember/test-helpers';
import { resolve } from 'rsvp';
import Route from '@ember/routing/route';
import sinon from 'sinon';
import Ember from 'ember';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import injectPromiseChain from 'ember-route-promise-chain';

module('Acceptance | route-promise-chain | error', (hooks) => {
	setupApplicationTest(hooks);

	hooks.beforeEach(function() {
		this.sandbox = sinon.createSandbox();
		this.service = this.owner.lookup('service:promise-chain');

		this.owner.register('route:application', Route.extend({
			actions: {
				error() {
					return false;
				}
			}
		}));

		this.owner.register('route:a', Route.extend({
			model() {
				throw new Error('model error');
			}
		}));

		injectPromiseChain(this.owner);
	});

	hooks.afterEach(() => {
		Ember.onerror = null;
	});

	test('it does not execute chain "onEnter" hook', async function(assert) {
		const routeA = this.owner.lookup('route:a');
		const chain = sinon.spy();

		routeA.onEnter = this.sandbox.stub().returns(resolve([chain]));

		await visit('/a');

		assert.ok(chain.notCalled, 'chain not is called');
	});
});

