/* eslint-env node */
'use strict';

const EngineAddon = require('ember-engines/lib/engine-addon'); // eslint-disable-line node/no-extraneous-require

module.exports = EngineAddon.extend({
	name: 'engine',

	lazyLoading: false,

	isDevelopingAddon() {
		return true;
	},

	hintingEnabled() {
		return false;
	}
});
