import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
	location: config.locationType,
	rootURL: config.rootURL
});

Router.map(function() {
	this.route('A', function() {
		this.route('A', function() {
			this.route('A');
		});
		this.route('B');
	});

	this.route('B', function() {
		this.route('A');
	});

	this.route('C');

	this.mount('engine', { as: 'E' });
});

export default Router;
