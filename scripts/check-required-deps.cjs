#!/usr/bin/env node
const path = require('node:path');

const packages = ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'];
const missing = [];

for (const pkg of packages) {
  try {
    require.resolve(pkg);
  } catch (error) {
    missing.push(pkg);
  }
}

if (missing.length > 0) {
  const relativeScript = path.relative(process.cwd(), __filename);
  console.error(
    `\nMissing required packages: ${missing.join(', ')}.\n` +
      'Run "npm install" to install the latest dependencies before starting the dev server.\n',
  );
  console.error(`Detected by ${relativeScript}`);
  process.exit(1);
}
