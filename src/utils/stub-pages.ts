import fs from 'fs';
import path from 'path';
import { buildBacklinks } from './backlinks.ts';

interface StubPage {
  path: string;
  title: string;
  links: Array<{
    text: string;
    url: string;
    source: string;
    sourceTitle: string;
    sourceType: 'blog' | 'project';
  }>;
}

/**
 * Get all existing page paths in the site
 */
function getExistingPages(): Set<string> {
  const existingPages = new Set<string>();
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
  
  return existingPages;
}

/**
 * Identify links pointing to non-existent pages
 */
export function findMissingPages(): StubPage[] {
  const backlinksData = buildBacklinks();
  const existingPages = getExistingPages();
  const missingPages: StubPage[] = [];
  
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
    
    // Check if this page exists
    if (!existingPages.has(normalizedPath) && !existingPages.has(`${normalizedPath}/`)) {
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
export function generateStubPageContent(stubPage: StubPage): string {
  const { title, links, path: pagePath } = stubPage;
  
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
export function createStubPages(): void {
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
    let targetDir: string;
    let filename: string;
    
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