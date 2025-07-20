import fs from 'fs';
import path from 'path';

/**
 * Extract internal links from markdown content
 */
function extractInternalLinks(content, sourcePath, sourceTitle, sourceType) {
  const links = [];
  
  // Match markdown links [text](url) where url is internal (starts with /)
  const markdownLinkPattern = /\[([^\]]*)\]\(([^)]*)\)/g;
  let match;
  
  while ((match = markdownLinkPattern.exec(content)) !== null) {
    const text = match[1];
    const url = match[2];
    
    // Only process internal links (starting with / or relative paths)
    if (url.startsWith('/') || (!url.startsWith('http') && !url.startsWith('mailto:'))) {
      // Normalize URL to always start with /
      const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
      
      links.push({
        text,
        url: normalizedUrl,
        source: sourcePath,
        sourceTitle,
        sourceType
      });
    }
  }
  
  return links;
}

/**
 * Extract title from markdown frontmatter or filename
 */
function extractTitle(content, filename) {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const titleMatch = frontmatterMatch[1].match(/title:\s*["']([^"']+)["']/);
    if (titleMatch) {
      return titleMatch[1];
    }
  }
  
  // Fall back to filename without extension
  return filename.replace(/\.md$/, '').replace(/-/g, ' ');
}

/**
 * Build backlinks data structure
 */
export function buildBacklinks() {
  const backlinks = {};
  const projectRoot = process.cwd();
  
  // Process blog posts
  const blogDir = path.join(projectRoot, 'src/content/blog');
  if (fs.existsSync(blogDir)) {
    const blogFiles = fs.readdirSync(blogDir).filter(file => file.endsWith('.md'));
    
    blogFiles.forEach(file => {
      const filePath = path.join(blogDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = extractTitle(content, file);
      const blogUrl = `/blog/${file.replace('.md', '')}/`;
      
      const links = extractInternalLinks(content, blogUrl, title, 'blog');
      
      links.forEach(link => {
        // Normalize target URLs for consistent matching
        let targetUrl = link.url;
        if (targetUrl.endsWith('/')) {
          targetUrl = targetUrl.slice(0, -1);
        }
        
        if (!backlinks[targetUrl]) {
          backlinks[targetUrl] = [];
        }
        
        backlinks[targetUrl].push(link);
      });
    });
  }
  
  // Process project files
  const projectsDir = path.join(projectRoot, 'projects');
  if (fs.existsSync(projectsDir)) {
    const projectFiles = fs.readdirSync(projectsDir)
      .filter(file => file.endsWith('.md') && file !== 'README.md');
    
    projectFiles.forEach(file => {
      const filePath = path.join(projectsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = extractTitle(content, file);
      const projectUrl = `/projects/${file.replace('.md', '')}/`;
      
      const links = extractInternalLinks(content, projectUrl, title, 'project');
      
      links.forEach(link => {
        // Normalize target URLs for consistent matching
        let targetUrl = link.url;
        if (targetUrl.endsWith('/')) {
          targetUrl = targetUrl.slice(0, -1);
        }
        
        if (!backlinks[targetUrl]) {
          backlinks[targetUrl] = [];
        }
        
        backlinks[targetUrl].push(link);
      });
    });
  }
  
  return backlinks;
}

/**
 * Generate backlinks HTML for a specific page
 */
export function generateBacklinksHTML(pagePath, backlinksData) {
  // Normalize the page path for consistent matching
  let normalizedPath = pagePath;
  if (normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  
  const pageBacklinks = backlinksData[normalizedPath] || [];
  
  if (pageBacklinks.length === 0) {
    return '';
  }
  
  let html = '<section class="backlinks">\n';
  html += '<h2>Referenced by</h2>\n';
  html += '<ul class="backlinks-list">\n';
  
  pageBacklinks.forEach(link => {
    const typeLabel = link.sourceType === 'blog' ? 'Article' : 'Project';
    html += `  <li><a href="${link.source}">${link.sourceTitle}</a> <span class="backlink-type">(${typeLabel})</span></li>\n`;
  });
  
  html += '</ul>\n';
  html += '</section>';
  
  return html;
}

/**
 * Generate CSS for backlinks styling
 */
export function getBacklinksCSS() {
  return `
.backlinks {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.backlinks h2 {
  font-size: 1.3em;
  margin-bottom: 1rem;
  color: var(--text-primary);
  font-weight: 400;
}

.backlinks-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.backlinks-list li {
  margin-bottom: 0.5rem;
  font-size: 0.95em;
}

.backlinks-list a {
  color: var(--accent);
  text-decoration: none;
}

.backlinks-list a:hover {
  text-decoration: underline;
}

.backlink-type {
  color: var(--text-tertiary);
  font-size: 0.85em;
  font-style: italic;
}`;
}