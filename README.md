# ember-route-promise-chain [![Build Status](https://travis-ci.org/BBVAEngineering/ember-route-promise-chain.svg?branch=master)](https://travis-ci.org/BBVAEngineering/ember-route-promise-chain) [![GitHub version](https://badge.fury.io/gh/BBVAEngineering%2Fember-route-promise-chain.svg)](https://badge.fury.io/gh/BBVAEngineering%2Fember-route-promise-chain) [![Dependency Status](https://david-dm.org/BBVAEngineering/ember-route-promise-chain.svg)](https://david-dm.org/BBVAEngineering/ember-route-promise-chain)

[![NPM](https://nodei.co/npm/ember-route-promise-chain.png?downloads=true&downloadRank=true)](https://nodei.co/npm/ember-route-promise-chain/)

A tiny ember-cli addon to enable promise-based hooks upon entering or exiting routes.

## Usage

Create a new [instance-initializer](https://guides.emberjs.com/v2.14.0/applications/initializers/) and inject the addon.

```javascript
import injectPromiseChain from 'ember-route-promise-chain';

export function initialize(appInstance) {
  injectPromiseChain(appInstance);
}

export default {
	name: 'route-promise-chain',
	initialize
};
```

In order to define a new hook, you can setup your routes as follows:

```javascript
export default Ember.Route.extend({

  onEnter() {
    return [{
      promise: new Promise(resolve => resolve())
    }];
  },

  onExit() {
    return [{
      promise: new Promise(resolve => resolve())
    }];
  }

});
```

![Example 1](dots/example_1.png)

Also, you can setup conditions for you hook to execute. Every condition is evaluated just before `promise` is executed.

```javascript
export default Ember.Route.extend({

  onEnter() {
    return [{
      condition: () => true,
      promise: new Promise(resolve => resolve())
    }];
  }

});
```

On nested routes, hooks are executed in order `parent-child`. So, for example, in the next figure,

![Example 2](dots/example_2.png)

hooks, are executed as follows:

* onExit: Parent A -> Child A.A.
* onEnter: Parent B -> Child B.A.

Or, as follows:

* First, Parent A, onExit method.
* Next, Child A.A, onExit method.
* Next, Parent B, onEnter method.
* Last, Child B.A, onEnter method.

Every hook must return an array with objects with `promise` property. Optionally, a `condition` property can be used to define conditions for the object. This objects are known as `chains`.

Hooks `onEnter` and `onExit`, and properties `promise` and `condition` can be [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) functions.

```javascript
export default Ember.Route.extend({

  async onEnter() {
    return [{
      condition: () => this.get('fetched'),
      promise: async () => {
        const response = await this.fetch();

        this.set('fetched', true);
      }
    }];
  }

});
```

When a chain (`condition` or `promise` properties) returns a rejection, next chains on same hierarchy are not executed.

When a chain triggers a transition to another route, next chains on all hierarchies are not executed.

## Installation

* `git clone <repository-url>` this repository
* `cd ember-route-promise-chain`
* `npm install`

## Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).
