'use strict';
const { version } = require('../package.json');
if (process.env.RELEASE_TAG !== `v${version}`) {
  console.error(`Release tag must be v${version}, matching package.json.`);
  process.exit(1);
}
