import { visit } from '@ember/test-helpers';
import { resolve } from 'rsvp';
import Route from '@ember/routing/route';
import sinon from 'sinon';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import injectPromiseChain from 'ember-route-promise-chain';

module('Acceptance | route-promise-chain | engines', (hooks) => {
	setupApplicationTest(hooks);

	hooks.beforeEach(async function() {
		this.sandbox = sinon.createSandbox();
		this.service = this.owner.lookup('service:promise-chain');

		injectPromiseChain(this.owner);

		await visit('/');

		this.router = this.owner.lookup('router:main');
		this.engineInfo = this.router._engineInfoByRoute.e;
		this.engineInstance = await this.router._loadEngineInstance(this.engineInfo);

		this.engineInstance.register('route:application', Route.extend());
		this.engineInstance.register('route:a', Route.extend());
	});

	test('it executes chain on "onEnter" hook on engine', async function(assert) {
		const routeEA = this.engineInstance.lookup('route:a');
		const chain1 = sinon.spy();

		routeEA.onEnter = this.sandbox.stub().returns(resolve([chain1]));

		await visit('/e/a');

		assert.ok(chain1.calledOnce, 'chain is called');
	});

	test('it executes chain on "onExit" hook on engine', async function(assert) {
		const routeEA = this.engineInstance.lookup('route:a');
		const chain1 = sinon.spy();

		await visit('/e/a');

		routeEA.onExit = this.sandbox.stub().returns(resolve([chain1]));

		await visit('/a');

		assert.ok(chain1.calledOnce, 'chain is called');
	});

	test('it executes chains on engine application route', async function(assert) {
		const routeE = this.engineInstance.lookup('route:application');
		const chain1 = sinon.spy();
		const chain2 = sinon.spy();

		routeE.onEnter = this.sandbox.stub().returns(resolve([chain1]));
		routeE.onExit = this.sandbox.stub().returns(resolve([chain2]));

		await visit('/e/a');

		assert.ok(chain1.calledOnce, 'chain is called');

		await visit('/a');

		assert.ok(chain2.calledOnce, 'chain is called');
	});
});
