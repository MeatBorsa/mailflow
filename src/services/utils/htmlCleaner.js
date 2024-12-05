const { parse } = require('node-html-parser');

class HtmlCleaner {
    static clean(htmlContent) {
        try {
            const root = parse(htmlContent);

            // Remove common noise elements
            const noiseSelectors = [
                'script',           // JavaScript
                'style',           // CSS
                'head',            // Head section
                'link',            // External resources
                'meta',            // Meta tags
                'img[width="1"]',  // Pixel trackers
                'img[height="1"]', // Pixel trackers
                'img[src*="track"]', // Common tracking images
                'img[src*="pixel"]', // Pixel trackers
                '.track',          // Tracking elements
                '#track',          // Tracking elements
                '[style*="display:none"]', // Hidden elements
                '[style*="display: none"]', // Hidden elements
                'iframe',          // Embedded frames
                'noscript'         // Noscript content
            ];

            // Remove all noise elements
            noiseSelectors.forEach(selector => {
                root.querySelectorAll(selector).forEach(elem => elem.remove());
            });

            // Preserve tables by converting them to markdown-like format
            root.querySelectorAll('table').forEach(table => {
                const rows = table.querySelectorAll('tr').map(row => {
                    const cells = row.querySelectorAll('td, th').map(cell => {
                        // Clean cell content of any remaining HTML
                        return cell.text.trim().replace(/\s+/g, ' ');
                    });
                    return cells.join(' | ');
                });
                table.replaceWith('\n' + rows.join('\n') + '\n');
            });

            // Replace breaks and horizontal rules with newlines
            root.querySelectorAll('br, hr').forEach(elem => elem.replaceWith('\n'));

            // Handle block elements with double newlines
            const blockElements = [
                'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'blockquote', 'pre', 'address'
            ];

            blockElements.forEach(tag => {
                root.querySelectorAll(tag).forEach(elem => {
                    elem.replaceWith('\n\n' + elem.text.trim() + '\n\n');
                });
            });

            // Remove any remaining HTML tags but keep their content
            let text = root.text;

            // Clean up whitespace
            text = text
                .replace(/\n{3,}/g, '\n\n')     // Replace multiple newlines with double newlines
                .replace(/[ \t]+/g, ' ')         // Replace multiple spaces/tabs with single space
                .replace(/ +\n/g, '\n')          // Remove spaces before newlines
                .replace(/\n +/g, '\n')          // Remove spaces after newlines
                .replace(/^\s+|\s+$/g, '')       // Trim start and end
                .replace(/\u00A0/g, ' ')         // Replace non-breaking spaces
                .replace(/\r\n/g, '\n')          // Normalize line endings
                .trim();

            // Add some basic structure back if completely flattened
            if (!text.includes('\n\n')) {
                text = text.replace(/\./g, '.\n\n');
            }

            return text;
        } catch (error) {
            console.warn('HTML cleaning failed:', error);
            // Return original content if parsing fails
            return htmlContent;
        }
    }
}

module.exports = HtmlCleaner; 