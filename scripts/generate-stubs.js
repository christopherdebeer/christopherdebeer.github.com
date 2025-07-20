#!/usr/bin/env node

import { createStubPages } from '../src/utils/stub-pages.js';

console.log('Generating stub pages for non-existent links...');

try {
  createStubPages();
  console.log('Stub page generation completed successfully.');
  process.exit(0);
} catch (error) {
  console.error('Error generating stub pages:', error);
  process.exit(1);
}