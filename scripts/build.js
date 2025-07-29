#!/usr/bin/env node

import { execSync } from 'child_process';
import { exit } from 'process';

/**
 * Enhanced build script with explicit error handling and messaging
 * This script ensures that build failures are made explicit and provide helpful debugging information
 */

const STEPS = [
  {
    name: 'Generate stub pages',
    command: 'node scripts/generate-stubs.js',
    description: 'Generating stub pages for non-existent links...'
  },
  {
    name: 'Astro type sync',
    command: 'astro sync',
    description: 'Syncing Astro types and generating definitions...'
  },
  {
    name: 'Astro type check',
    command: 'astro check',
    description: 'Running Astro type checking...'
  },
  {
    name: 'Astro build',
    command: 'astro build',
    description: 'Building the site with Astro...'
  }
];

function runStep(step, index) {
  console.log(`\n[${index + 1}/${STEPS.length}] ${step.description}`);
  console.log(`Command: ${step.command}`);
  
  try {
    execSync(step.command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${step.name} completed successfully`);
  } catch (error) {
    console.error(`\n❌ Build failed at step: ${step.name}`);
    console.error(`Command that failed: ${step.command}`);
    console.error(`Exit code: ${error.status}`);
    
    if (error.stderr) {
      console.error(`Error output: ${error.stderr.toString()}`);
    }
    
    console.error(`\n🔍 Debug information:`);
    console.error(`- Step ${index + 1} of ${STEPS.length} failed`);
    console.error(`- Previous steps completed successfully`);
    console.error(`- Check the command output above for specific error details`);
    
    // Provide step-specific debugging hints
    switch (step.name) {
      case 'Generate stub pages':
        console.error(`- Hint: Check if scripts/generate-stubs.js exists and has proper permissions`);
        break;
      case 'Astro type sync':
        console.error(`- Hint: This usually fails due to malformed frontmatter in markdown files`);
        console.error(`- Check YAML syntax in files under src/content/`);
        break;
      case 'Astro type check':
        console.error(`- Hint: Type checking failed - look for TypeScript errors above`);
        console.error(`- Ensure all imports and type definitions are correct`);
        break;
      case 'Astro build':
        console.error(`- Hint: Build process failed - check for runtime errors or missing dependencies`);
        break;
    }
    
    exit(1);
  }
}

console.log('🚀 Starting enhanced build process...');
console.log(`Total steps: ${STEPS.length}`);

for (let i = 0; i < STEPS.length; i++) {
  runStep(STEPS[i], i);
}

console.log('\n🎉 Build completed successfully!');
console.log('All steps passed. The site is ready for deployment.');