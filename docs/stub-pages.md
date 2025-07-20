# Stub Page Generation

This site automatically creates stub pages for internal links that point to non-existent content.

## How it works

1. **Link Detection**: The system scans all blog posts and project pages for internal markdown links
2. **Missing Page Identification**: Compares found links against existing pages
3. **Stub Generation**: Creates placeholder pages for missing links with appropriate backlinks
4. **Build Integration**: Runs automatically before each build

## Generated Stub Structure

Each stub page includes:
- A clear title derived from the URL path
- Indication that it's a placeholder page  
- **Complete backlinks** showing which pages reference it and what link text was used
- Proper categorization by content type (Articles vs Projects)

## File Locations

- **Project stubs**: `projects/{slug}.md`
- **Blog stubs**: `src/content/blog/{slug}.md` (with proper frontmatter)

## Exclusions

The system automatically skips:
- Image files (`.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`)
- Document files (`.pdf`, `.zip`)
- Web assets (`.css`, `.js`, `.json`, `.xml`)
- External links (starting with `http` or `mailto:`)

## Usage

### Manual Generation
```bash
npm run generate-stubs
```

### Automatic Generation (during build)
```bash  
npm run build  # Includes stub generation
```

The stub generation is integrated into the build process and will run automatically during deployment.