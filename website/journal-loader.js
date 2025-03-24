class JournalEntry {
    constructor(markdown) {
        this.parseMarkdown(markdown);
    }

    parseMarkdown(markdown) {
        // Extract title (first h1)
        const titleMatch = markdown.match(/# (.*)/);
        this.title = titleMatch ? titleMatch[1].replace(/\[(.*?)\]\(.*?\)/g, '$1') : '';

        // Extract date
        const dateMatch = markdown.match(/<!-- Date -->\s*([^\n]*)/);
        this.date = dateMatch ? dateMatch[1].trim() : '';

        // Extract location
        const locationMatch = markdown.match(/<!-- Location -->\s*([^\n]*)/);
        this.location = locationMatch ? locationMatch[1].trim() : '';

        // Extract description (everything between Location and the image)
        const descriptionMatch = markdown.match(/<!-- Description -->\s*([^!]*)/);
        this.description = descriptionMatch ? descriptionMatch[1].trim() : '';

        // Extract image path
        const imageMatch = markdown.match(/!\[.*?\]\((.*?)\)/);
        this.imagePath = imageMatch ? imageMatch[1] : '';
    }

    createHtmlElement() {
        const template = document.getElementById('entry-template');
        const entry = template.content.cloneNode(true);

        // Fill in the template
        entry.querySelector('h2').textContent = this.title;
        entry.querySelector('.date').textContent = this.date;
        entry.querySelector('.location').textContent = this.location;
        entry.querySelector('.content').textContent = this.description;

        const img = entry.querySelector('.entry-image');
        if (this.imagePath) {
            // Handle both relative and absolute paths
            const webPath = this.imagePath.startsWith('./') 
                ? this.imagePath.replace('./journal-entries/', '../journal-enteries/') 
                : this.imagePath;
            img.src = webPath;
            img.alt = `Image for ${this.title}`;
        } else {
            img.remove(); // Remove the img element if no image
        }

        return entry;
    }
}

async function displayError(message) {
    const entriesContainer = document.getElementById('entries-container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    entriesContainer.appendChild(errorDiv);
}

async function loadEntries() {
    const entriesContainer = document.getElementById('entries-container');
    entriesContainer.innerHTML = ''; // Clear existing entries

    try {
        const response = await fetch('../journal-enteries/');
        if (!response.ok) {
            throw new Error('Could not load journal entries directory');
        }

        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        // Find all markdown files
        const mdFiles = Array.from(doc.querySelectorAll('a'))
            .map(a => a.href)
            .filter(href => href.endsWith('.md'))
            .map(href => href.split('/').pop());

        if (mdFiles.length === 0) {
            throw new Error('No journal entries found');
        }

        // Sort files by date (newest first)
        mdFiles.sort((a, b) => b.localeCompare(a));

        // Show loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = 'Loading entries...';
        entriesContainer.appendChild(loadingDiv);

        // Load each markdown file
        for (const file of mdFiles) {
            try {
                const markdownResponse = await fetch(`../journal-enteries/${file}`);
                if (!markdownResponse.ok) {
                    console.error(`Failed to load entry: ${file}`);
                    continue;
                }
                
                const markdown = await markdownResponse.text();
                const entry = new JournalEntry(markdown);
                entriesContainer.appendChild(entry.createHtmlElement());
            } catch (error) {
                console.error(`Error processing entry ${file}:`, error);
            }
        }

        // Remove loading state
        loadingDiv.remove();

        // Show message if no entries were loaded successfully
        if (entriesContainer.children.length === 0) {
            displayError('No entries could be loaded. Please check the journal-enteries folder.');
        }

    } catch (error) {
        console.error('Error loading journal entries:', error);
        displayError('Failed to load journal entries. Please make sure the server is running and try again.');
    }
}

// Add styles for error and loading states
const style = document.createElement('style');
style.textContent = `
    .error-message {
        padding: 20px;
        background-color: #fff;
        border-radius: 16px;
        color: #dc3545;
        text-align: center;
        margin: 20px 0;
        box-shadow: var(--shadow-card);
    }
    .loading {
        padding: 20px;
        text-align: center;
        color: var(--color-text-secondary);
    }
`;
document.head.appendChild(style);

// Load entries when the page loads
document.addEventListener('DOMContentLoaded', loadEntries);