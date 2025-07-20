import fs from 'fs';
import path from 'path';
import { buildBacklinks } from './backlinks.js';

/**
 * Recursively scan public directory for static pages
 */
function addStaticPages(dir, basePath, existingPages) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const urlPath = basePath + '/' + entry.name;
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        addStaticPages(fullPath, urlPath, existingPages);
        
        // If directory contains index.html, add the directory path as a page
        const indexPath = path.join(fullPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          existingPages.add(urlPath);
        }
      } else if (entry.name === 'index.html') {
        // index.html files are served at their directory path
        existingPages.add(basePath || '/');
      } else if (entry.name.endsWith('.html')) {
        // Other HTML files are served with their filename (minus extension)
        const name = entry.name.replace('.html', '');
        existingPages.add(basePath + '/' + name);
      }
    }
  } catch (error) {
    // Silently ignore directories we can't read
    console.warn(`Warning: Could not read directory ${dir}`);
  }
}

/**
 * Get all existing page paths in the site
 */
function getExistingPages() {
  const existingPages = new Set();
  const projectRoot = process.cwd();
  
  // Add root pages
  existingPages.add('/');
  existingPages.add('/blog');
  existingPages.add('/projects');
  existingPages.add('/tags');
  
  // Add blog posts
  const blogDir = path.join(projectRoot, 'src/content/blog');
  if (fs.existsSync(blogDir)) {
    const blogFiles = fs.readdirSync(blogDir).filter(file => file.endsWith('.md'));
    blogFiles.forEach(file => {
      const slug = file.replace('.md', '');
      existingPages.add(`/blog/${slug}`);
    });
  }
  
  // Add project pages
  const projectsDir = path.join(projectRoot, 'projects');
  if (fs.existsSync(projectsDir)) {
    const projectFiles = fs.readdirSync(projectsDir)
      .filter(file => file.endsWith('.md') && file !== 'README.md');
    projectFiles.forEach(file => {
      const slug = file.replace('.md', '');
      existingPages.add(`/projects/${slug}`);
    });
  }
  
  // Add static pages from public directory
  const publicDir = path.join(projectRoot, 'public');
  if (fs.existsSync(publicDir)) {
    addStaticPages(publicDir, '', existingPages);
  }
  
  return existingPages;
}

/**
 * Identify links pointing to non-existent pages
 */
export function findMissingPages() {
  const backlinksData = buildBacklinks();
  const existingPages = getExistingPages();
  const missingPages = [];
  
  // Check each target URL in the backlinks data
  for (const [targetPath, links] of Object.entries(backlinksData)) {
    // Normalize the path for comparison
    let normalizedPath = targetPath;
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }
    // Remove trailing slash for consistency
    if (normalizedPath.endsWith('/') && normalizedPath !== '/') {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    
    // Skip image files and other resources that shouldn't be pages
    const skipExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.pdf', '.zip', '.css', '.js', '.json', '.xml'];
    const shouldSkip = skipExtensions.some(ext => normalizedPath.toLowerCase().endsWith(ext));
    
    // Check if this page exists
    if (!shouldSkip && !existingPages.has(normalizedPath) && !existingPages.has(`${normalizedPath}/`)) {
      // Generate a title from the path
      const pathParts = normalizedPath.split('/').filter(Boolean);
      const title = pathParts.length > 0 
        ? pathParts[pathParts.length - 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Untitled Page';
      
      missingPages.push({
        path: normalizedPath,
        title,
        links
      });
    }
  }
  
  return missingPages;
}

/**
 * Generate the content for a stub page
 */
export function generateStubPageContent(stubPage) {
  const { title, links } = stubPage;
  
  // Group links by source type
  const projectLinks = links.filter(link => link.sourceType === 'project');
  const blogLinks = links.filter(link => link.sourceType === 'blog');
  
  let content = `# ${title}

*This page doesn't exist yet, but it's referenced by other content on this site.*

## Referenced by

`;

  if (projectLinks.length > 0) {
    content += `### Projects\n\n`;
    projectLinks.forEach(link => {
      content += `- [${link.sourceTitle}](${link.source}) mentions "${link.text}"\n`;
    });
    content += '\n';
  }
  
  if (blogLinks.length > 0) {
    content += `### Articles\n\n`;
    blogLinks.forEach(link => {
      content += `- [${link.sourceTitle}](${link.source}) mentions "${link.text}"\n`;
    });
    content += '\n';
  }
  
  content += `---

*This is a stub page. The content referenced here may be added in the future.*`;
  
  return content;
}

/**
 * Create stub page files
 */
export function createStubPages() {
  const missingPages = findMissingPages();
  const projectRoot = process.cwd();
  
  if (missingPages.length === 0) {
    console.log('No missing pages found - all internal links point to existing content.');
    return;
  }
  
  console.log(`Found ${missingPages.length} missing pages. Creating stub pages...`);
  
  missingPages.forEach(stubPage => {
    const { path: pagePath } = stubPage;
    const pathParts = pagePath.split('/').filter(Boolean);
    
    if (pathParts.length === 0) return; // Skip root page
    
    // Determine where to create the stub page
    let targetDir;
    let filename;
    
    if (pathParts[0] === 'projects' && pathParts.length === 2) {
      // This is a project page
      targetDir = path.join(projectRoot, 'projects');
      filename = `${pathParts[1]}.md`;
    } else if (pathParts[0] === 'blog' && pathParts.length === 2) {
      // This is a blog post - we'll create a stub in the content collection
      targetDir = path.join(projectRoot, 'src/content/blog');
      filename = `${pathParts[1]}.md`;
    } else {
      // For other paths, create in projects directory as a fallback
      targetDir = path.join(projectRoot, 'projects');
      filename = `${pathParts[pathParts.length - 1]}.md`;
    }
    
    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const filePath = path.join(targetDir, filename);
    
    // Only create if file doesn't already exist
    if (!fs.existsSync(filePath)) {
      const content = generateStubPageContent(stubPage);
      
      // Add appropriate frontmatter for blog posts
      if (pathParts[0] === 'blog') {
        const frontmatter = `---
title: "${stubPage.title}"
date: ${new Date().toISOString().split('T')[0]}
description: "Stub page for ${stubPage.title}"
tags: ["stub"]
---

`;
        fs.writeFileSync(filePath, frontmatter + content, 'utf-8');
      } else {
        fs.writeFileSync(filePath, content, 'utf-8');
      }
      
      console.log(`Created stub page: ${filePath} for path ${pagePath}`);
    } else {
      console.log(`Stub page already exists: ${filePath}`);
    }
  });
  
  console.log(`Stub page generation complete. Created pages for ${missingPages.length} missing links.`);
}