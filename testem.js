<<<<<<< HEAD
/* eslint-env node */
'use strict';

||||||| parent of d83b5f0... message
/* eslint-env node */
=======
>>>>>>> d83b5f0... message
module.exports = {
<<<<<<< HEAD
	test_page: 'tests/index.html?hidepassed',
	disable_watching: true,
	launch_in_ci: [
		'Chrome'
	],
	launch_in_dev: [
		'Chrome'
	],
	browser_args: {
		Chrome: [
			'--headless',
			'--disable-gpu',
			'--remote-debugging-port=9222',
			'--window-size=1440,900'
		]
	}
||||||| parent of d83b5f0... message
  test_page: 'tests/index.html?hidepassed',
  disable_watching: true,
  launch_in_ci: [
    'PhantomJS'
  ],
  launch_in_dev: [
    'PhantomJS',
    'Chrome'
  ]
=======
  test_page: 'tests/index.html?hidepassed',
  disable_watching: true,
  launch_in_ci: [
    'Chrome'
  ],
  launch_in_dev: [
    'Chrome'
  ],
  browser_args: {
    Chrome: {
      ci: [
        // --no-sandbox is needed when running Chrome inside a container
        process.env.CI ? '--no-sandbox' : null,
        '--headless',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--mute-audio',
        '--remote-debugging-port=0',
        '--window-size=1440,900'
      ].filter(Boolean)
    }
  }
>>>>>>> d83b5f0... message
};
