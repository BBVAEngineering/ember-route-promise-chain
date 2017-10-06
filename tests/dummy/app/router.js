import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
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
});

export default Router;
