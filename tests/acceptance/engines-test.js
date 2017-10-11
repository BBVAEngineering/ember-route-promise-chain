import sinon from 'sinon';
import Ember from 'ember';
import { test } from 'ember-qunit';
import moduleForAcceptance from '../helpers/module-for-acceptance';
import injectPromiseChain from 'ember-route-promise-chain';

const { Route } = Ember;
const { RSVP: { resolve } } = Ember;

moduleForAcceptance('Acceptance | route-promise-chain | engines', {
	async beforeEach() {
		this.sandbox = sinon.sandbox.create();
		this.appInstance = this.application.__container__.owner;
		this.service = this.appInstance.lookup('service:promise-chain');

		injectPromiseChain(this.appInstance);

		await visit('/');

		this.router = this.appInstance.lookup('router:main');
		this.engineInfo = this.router._engineInfoByRoute.E;
		this.engineInstance = await this.router._loadEngineInstance(this.engineInfo);

		this.engineInstance.register('route:application', Route.extend());
		this.engineInstance.register('route:A', Route.extend());
	}
});

test('it executes chain on "onEnter" hook on engine', async function(assert) {
	const routeEA = this.engineInstance.lookup('route:A');
	const chain1 = sinon.spy();

	routeEA.onEnter = this.sandbox.stub().returns(resolve([chain1]));

	await visit('/E/A');

	assert.ok(chain1.calledOnce, 'chain is called');
});

test('it executes chain on "onExit" hook on engine', async function(assert) {
	const routeEA = this.engineInstance.lookup('route:A');
	const chain1 = sinon.spy();

	await visit('/E/A');

	routeEA.onExit = this.sandbox.stub().returns(resolve([chain1]));

	await visit('/A');

	assert.ok(chain1.calledOnce, 'chain is called');
});

test('it executes chains on engine application route', async function(assert) {
	const routeE = this.engineInstance.lookup('route:application');
	const chain1 = sinon.spy();
	const chain2 = sinon.spy();

	routeE.onEnter = this.sandbox.stub().returns(resolve([chain1]));
	routeE.onExit = this.sandbox.stub().returns(resolve([chain2]));

	await visit('/E/A');

	assert.ok(chain1.calledOnce, 'chain is called');

	await visit('/A');

	assert.ok(chain2.calledOnce, 'chain is called');
});
