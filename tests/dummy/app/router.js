import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
	location: config.locationType,
	rootURL: config.rootURL
});

Router.map(function() {
	this.route('a', function() {
		this.route('a', function() {
			this.route('a');
		});
		this.route('b');
	});

	this.route('b', function() {
		this.route('a');
	});

	this.route('c');

	this.mount('engine', { as: 'e' });
});

export default Router;
