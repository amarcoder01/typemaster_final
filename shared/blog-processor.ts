
import { z } from "zod";

export interface BlogFrontmatter {
    title?: string;
    excerpt?: string;
    description?: string;
    date?: string;
    author?: string;
    tags?: string[];
    category?: string;
    coverImage?: string;
    draft?: boolean;
    [key: string]: any;
}

export interface BlogProcessingResult {
    content: string; // Content WITHOUT frontmatter
    frontmatter: BlogFrontmatter;
    raw: string; // Original content
}

export interface ValidationIssue {
    type: "error" | "warning";
    message: string;
    fixable?: boolean;
    suggestion?: string;
}

export interface BlogValidationResult {
    isValid: boolean;
    issues: ValidationIssue[];
    stats: {
        wordCount: number;
        readingTimeMinutes: number;
        headingCount: { h1: number; h2: number; h3: number };
        paragraphCount: number;
        linkCount: { internal: number; external: number };
        imageCount: number;
    };
}

export interface HeadingItem {
    level: number;
    text: string;
    id: string;
}

// --- Filler Phrases to Remove ---
const FILLER_PHRASES = [
    /^In this article,?\s*/gim,
    /^As you (may )?know,?\s*/gim,
    /^It('s| is) (important|worth noting|no secret) (to note |that )?/gim,
    /^(First|Firstly|Second|Secondly|Third|Thirdly|Finally),?\s*/gim,
    /^(In conclusion|To conclude|To sum up|In summary),?\s*/gim,
    /^(Basically|Essentially|Obviously|Clearly|Simply put),?\s*/gim,
    /^Without further ado,?\s*/gim,
    /^Let('s| us) (dive|get started|begin|take a look),?\s*/gim,
    /^(Have you ever wondered|Did you know that)\s*/gim,
];

// --- Frontmatter Handling ---

/**
 * Parses frontmatter from markdown string.
 * Supports YAML-style bounds (--- ... ---) with robust edge case handling.
 * Handles Windows/Unix line endings, trailing whitespace, and multi-line values.
 */
export function processBlogContent(rawMarkdown: string): BlogProcessingResult {
    // Normalize line endings to Unix style
    const normalized = rawMarkdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // More robust frontmatter regex that handles:
    // - Optional trailing whitespace after delimiters
    // - Both \n--- and ---\n patterns
    // - Empty frontmatter blocks
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
    const match = normalized.match(frontmatterRegex);

    let frontmatter: BlogFrontmatter = {};
    let content = normalized;

    if (match) {
        try {
            const yamlStr = match[1];
            let currentKey: string | null = null;
            let currentValue: string[] = [];
            let inMultilineValue = false;
            let inArray = false;
            let arrayValues: string[] = [];

            const lines = yamlStr.split("\n");

            const saveCurrentField = () => {
                if (currentKey) {
                    if (inArray && arrayValues.length > 0) {
                        frontmatter[currentKey] = arrayValues;
                    } else if (currentValue.length > 0) {
                        const value = currentValue.join("\n").trim();
                        // Try to parse booleans and numbers
                        if (value.toLowerCase() === "true") {
                            frontmatter[currentKey] = true;
                        } else if (value.toLowerCase() === "false") {
                            frontmatter[currentKey] = false;
                        } else if (/^-?\d+(\.\d+)?$/.test(value)) {
                            frontmatter[currentKey] = parseFloat(value);
                        } else {
                            frontmatter[currentKey] = value;
                        }
                    }
                }
                currentKey = null;
                currentValue = [];
                inMultilineValue = false;
                inArray = false;
                arrayValues = [];
            };

            lines.forEach((line, idx) => {
                const trimmedLine = line.trim();

                // Check for array item (starts with "- ")
                if (inArray && /^\s*-\s+/.test(line)) {
                    let arrayItem = line.replace(/^\s*-\s+/, "").trim();
                    // Remove quotes if present
                    if ((arrayItem.startsWith('"') && arrayItem.endsWith('"')) ||
                        (arrayItem.startsWith("'") && arrayItem.endsWith("'"))) {
                        arrayItem = arrayItem.slice(1, -1);
                    }
                    arrayValues.push(arrayItem);
                    return;
                }

                // Check for multiline continuation (indented line)
                if (inMultilineValue && /^\s+/.test(line) && !line.includes(":")) {
                    currentValue.push(trimmedLine);
                    return;
                }

                // Check for new key: value pair
                const colonIndex = line.indexOf(":");
                if (colonIndex > 0 && !/^\s/.test(line)) {
                    // Save previous field
                    saveCurrentField();

                    currentKey = line.slice(0, colonIndex).trim();
                    let value = line.slice(colonIndex + 1).trim();

                    // Check for inline array [a, b, c]
                    if (value.startsWith("[") && value.endsWith("]")) {
                        const arrayContent = value.slice(1, -1);
                        frontmatter[currentKey] = arrayContent
                            .split(",")
                            .map(v => v.trim().replace(/^["']|["']$/g, ""))
                            .filter(Boolean);
                        currentKey = null;
                        return;
                    }

                    // Check for multiline indicator or empty value (array/multiline follows)
                    if (value === "" || value === "|" || value === ">") {
                        inMultilineValue = true;
                        // Check if next line starts with "- " (array)
                        const nextLine = lines[idx + 1];
                        if (nextLine && /^\s*-\s+/.test(nextLine)) {
                            inArray = true;
                        }
                        return;
                    }

                    // Remove quotes if present
                    if ((value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }

                    currentValue.push(value);
                }
            });

            // Don't forget the last field
            saveCurrentField();

            // Remove frontmatter from content
            content = normalized.replace(frontmatterRegex, "");
        } catch (e) {
            console.error("Failed to parse frontmatter", e);
            // Still strip the frontmatter block even if parsing fails
            content = normalized.replace(frontmatterRegex, "");
        }
    }

    return { content: content.trim(), frontmatter, raw: rawMarkdown };
}

/**
 * Extracts headings from markdown content for TOC generation.
 */
export function extractHeadings(content: string): HeadingItem[] {
    const { content: body } = processBlogContent(content);
    // Strip code blocks before extracting headings to avoid comments being seen as headings
    const cleanBody = stripCodeBlocks(body);
    const headings: HeadingItem[] = [];
    const lines = cleanBody.split("\n");

    lines.forEach(line => {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
            const level = match[1].length;
            const text = match[2].replace(/[#*`\[\]]/g, "").trim();
            const id = text
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .replace(/\s+/g, "-");
            headings.push({ level, text, id });
        }
    });

    return headings;
}

// --- Content Normalization ---

/**
 * Normalizes blog content for production consistency.
 * Applies formatting rules for professional output.
 */
export function normalizeBlogContent(content: string): string {
    // First, strip frontmatter to avoid modifying it
    const { content: body, frontmatter, raw } = processBlogContent(content);
    let normalized = body;

    // 1. Normalize line endings
    normalized = normalized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // 2. Trim trailing whitespace from each line
    normalized = normalized.split("\n").map(line => line.trimEnd()).join("\n");

    // 3. Enforce section spacing (ensure 1 empty line before headers)
    normalized = normalized.replace(/([^\n])\n(#{1,6}\s)/g, "$1\n\n$2");

    // 4. Fix heading hierarchy (Downgrade H1s in body to H2s, as H1 is title)
    // Only match at line start, outside of code blocks
    const lines = normalized.split("\n");
    let inCodeBlock = false;
    normalized = lines.map(line => {
        if (line.startsWith("```")) {
            inCodeBlock = !inCodeBlock;
            return line;
        }
        if (!inCodeBlock && /^#\s+(.+)$/.test(line)) {
            return line.replace(/^#\s+/, "## ");
        }
        return line;
    }).join("\n");

    // 5. Normalize list markers (convert * to - for consistency)
    normalized = normalized.replace(/^(\s*)\*\s+/gm, "$1- ");

    // 6. Ensure space after list markers
    normalized = normalized.replace(/^(\s*)-([^\s-])/gm, "$1- $2");

    // 7. Remove common filler phrases (at start of sentences)
    FILLER_PHRASES.forEach(pattern => {
        normalized = normalized.replace(pattern, "");
    });

    // 8. Break long paragraphs (>500 chars) at sentence boundaries
    normalized = breakLongParagraphs(normalized, 500);

    // 9. Normalize multiple blank lines to max 2
    normalized = normalized.replace(/\n{3,}/g, "\n\n");

    // 10. Ensure content ends with single newline
    normalized = normalized.trim() + "\n";

    // Reconstruct with frontmatter if it existed
    if (Object.keys(frontmatter).length > 0) {
        const yamlLines = Object.entries(frontmatter).map(([key, value]) => {
            if (Array.isArray(value)) {
                return `${key}:\n${value.map(v => `  - "${v}"`).join("\n")}`;
            }
            if (typeof value === "string" && (value.includes("\n") || value.includes(":"))) {
                return `${key}: "${value.replace(/"/g, '\\"')}"`;
            }
            return `${key}: ${value}`;
        });
        return `---\n${yamlLines.join("\n")}\n---\n\n${normalized}`;
    }

    return normalized;
}

/**
 * Breaks paragraphs that exceed maxLength at sentence boundaries.
 */
function breakLongParagraphs(content: string, maxLength: number): string {
    const paragraphs = content.split(/\n\s*\n/);

    const processed = paragraphs.map(paragraph => {
        // Skip code blocks, lists, headings, blockquotes
        if (
            paragraph.startsWith("```") ||
            paragraph.startsWith("#") ||
            paragraph.startsWith(">") ||
            paragraph.startsWith("-") ||
            paragraph.startsWith("*") ||
            /^\d+\.\s/.test(paragraph)
        ) {
            return paragraph;
        }

        if (paragraph.length <= maxLength) {
            return paragraph;
        }

        // Split at sentence boundaries
        const sentences = paragraph.match(/[^.!?]+[.!?]+\s*/g) || [paragraph];
        const chunks: string[] = [];
        let currentChunk = "";

        sentences.forEach(sentence => {
            if ((currentChunk + sentence).length > maxLength && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        });

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks.join("\n\n");
    });

    return processed.join("\n\n");
}

/**
 * Suggests automatic structure improvements for content lacking organization.
 */
export function suggestStructure(content: string): {
    needsStructure: boolean;
    suggestions: string[];
} {
    const { content: body } = processBlogContent(content);
    const suggestions: string[] = [];

    const h2Count = (body.match(/^##\s/gm) || []).length;
    const h3Count = (body.match(/^###\s/gm) || []).length;
    const paragraphs = body.split(/\n\s*\n/).filter(p => p.trim() && !p.startsWith("#"));

    if (h2Count === 0) {
        suggestions.push("Add H2 sections to organize your content (e.g., ## Why It Matters, ## How It Works)");
    }

    if (h2Count > 0 && h3Count === 0 && paragraphs.length > 5) {
        suggestions.push("Consider adding H3 subsections to break up longer sections");
    }

    if (paragraphs.length >= 3) {
        const firstPara = paragraphs[0];
        if (firstPara && firstPara.length < 100) {
            suggestions.push("Expand your introduction to 2-3 sentences for better context");
        }
    }

    // Check for conclusion
    const lastSection = body.split(/^##\s/gm).pop() || "";
    if (!lastSection.toLowerCase().includes("conclusion") &&
        !lastSection.toLowerCase().includes("summary") &&
        !lastSection.toLowerCase().includes("takeaway")) {
        suggestions.push("Consider adding a conclusion section (## Conclusion or ## Key Takeaways)");
    }

    return {
        needsStructure: suggestions.length > 0,
        suggestions
    };
}

// --- Validation ---

/**
 * Removes fenced code blocks from content to avoid false matches in analysis.
 */
function stripCodeBlocks(content: string): string {
    return content.replace(/```[\s\S]*?```/g, "\n");
}

/**
 * Comprehensive SEO and content validation.
 */
export function validateBlogContent(content: string, metaDescription?: string): BlogValidationResult {
    const issues: ValidationIssue[] = [];
    const { content: body } = processBlogContent(content);

    // Strip code blocks to prevent false positives (e.g. comments as H1s, links in code)
    const cleanBody = stripCodeBlocks(body);

    // Calculate stats on clean body (except word count which handles its own stripping)
    const wordCount = countWords(body);
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const h1Matches = cleanBody.match(/^#\s/gm) || [];
    const h2Matches = cleanBody.match(/^##\s/gm) || [];
    const h3Matches = cleanBody.match(/^###\s/gm) || [];
    const paragraphs = cleanBody.split(/\n\s*\n/).filter((p: string) => p.trim() && !p.startsWith("#") && !p.startsWith(">") && !p.startsWith("-") && !p.startsWith("```"));

    // Count links (exclude code)
    const internalLinkRegex = /\[.*?\]\((\/|https?:\/\/typemasterai\.com)/g;
    const externalLinkRegex = /\[.*?\]\(https?:\/\/(?!typemasterai\.com)/g;
    const internalLinks = (cleanBody.match(internalLinkRegex) || []).length;
    const externalLinks = (cleanBody.match(externalLinkRegex) || []).length;

    // Count images (exclude code)
    const imageRegex = /!\[.*?\]\(.*?\)/g;
    const images = cleanBody.match(imageRegex) || [];
    const imageCount = images.length;

    const stats = {
        wordCount,
        readingTimeMinutes,
        headingCount: { h1: h1Matches.length, h2: h2Matches.length, h3: h3Matches.length },
        paragraphCount: paragraphs.length,
        linkCount: { internal: internalLinks, external: externalLinks },
        imageCount
    };

    // 1. H1 Check - No H1s allowed in body (title is separate)
    if (h1Matches.length > 0) {
        issues.push({
            type: "error",
            message: `Found ${h1Matches.length} H1 tag(s) in body. Use H2 (##) for top-level sections.`,
            fixable: true,
            suggestion: "Click 'Auto-Fix' to convert H1s to H2s"
        });
    }

    // 2. H2 Presence
    if (h2Matches.length === 0) {
        issues.push({
            type: "error",
            message: "No H2 sections found. Add at least one subsection for better structure.",
            fixable: false,
            suggestion: "Add sections like: ## Introduction, ## Key Points, ## Conclusion"
        });
    }

    // 3. Meta Description Check
    if (!metaDescription) {
        issues.push({
            type: "error",
            message: "Meta description is missing.",
            fixable: false,
            suggestion: "Add a 120-160 character description summarizing the article"
        });
    } else if (metaDescription.length > 160) {
        issues.push({
            type: "warning",
            message: `Meta description is ${metaDescription.length} characters (max 160).`,
            fixable: false,
            suggestion: `Trim to: "${metaDescription.substring(0, 157)}..."`
        });
    } else if (metaDescription.length < 70) {
        issues.push({
            type: "warning",
            message: `Meta description is only ${metaDescription.length} characters (recommended 120-160).`,
            fixable: false,
            suggestion: "Expand description for better SEO visibility"
        });
    }

    // 4. Internal Link Check
    if (internalLinks === 0) {
        issues.push({
            type: "warning",
            message: "No internal links found. Consider linking to other articles.",
            fixable: false,
            suggestion: "Add links like [typing tips](/blog/typing-tips) to improve SEO"
        });
    }

    // 5. Readability (Paragraph length > 500 chars)
    paragraphs.forEach((p: string, i: number) => {
        if (p.length > 500) {
            issues.push({
                type: "warning",
                message: `Paragraph ${i + 1} is ${p.length} characters. Consider breaking it up.`,
                fixable: true,
                suggestion: "Click 'Auto-Fix' to split long paragraphs"
            });
        }
    });

    // 6. Image alt text check
    images.forEach((img: string, i: number) => {
        const altMatch = img.match(/!\[(.*?)\]/);
        const altText = altMatch ? altMatch[1] : "";
        if (!altText || altText.trim() === "") {
            issues.push({
                type: "warning",
                message: `Image ${i + 1} is missing alt text.`,
                fixable: false,
                suggestion: "Add descriptive alt text for accessibility and SEO: ![description](url)"
            });
        }
    });

    // 7. Keyword stuffing check in headings
    const headings = extractHeadings(body);
    const headingTexts = headings.map(h => h.text.toLowerCase());
    const wordFrequency: Record<string, number> = {};

    headingTexts.forEach(text => {
        text.split(/\s+/).forEach(word => {
            if (word.length > 4) { // Only check meaningful words
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
        });
    });

    Object.entries(wordFrequency).forEach(([word, count]) => {
        if (count >= 3 && headings.length >= 3) {
            issues.push({
                type: "warning",
                message: `Possible keyword stuffing: "${word}" appears ${count} times in headings.`,
                fixable: false,
                suggestion: "Vary your heading language to avoid SEO penalties"
            });
        }
    });

    // 8. Content length check
    if (wordCount < 300) {
        issues.push({
            type: "warning",
            message: `Content is only ${wordCount} words. Consider expanding for better SEO.`,
            fixable: false,
            suggestion: "Aim for at least 500-1000 words for comprehensive coverage"
        });
    }

    // 9. Heading hierarchy check (H3 without H2)
    if (h3Matches.length > 0 && h2Matches.length === 0) {
        issues.push({
            type: "warning",
            message: "H3 headings found without H2 parents. This breaks heading hierarchy.",
            fixable: false,
            suggestion: "Add H2 sections before using H3 subsections"
        });
    }

    return {
        isValid: !issues.some(i => i.type === "error"),
        issues,
        stats
    };
}

/**
 * Count words in markdown content (excluding code blocks and metadata).
 */
function countWords(md: string): number {
    const text = md
        .replace(/```[\s\S]*?```/g, " ") // Remove code blocks
        .replace(/`[^`]*`/g, " ") // Remove inline code
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // Extract link text
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, " ") // Remove images
        .replace(/[#*_>\-\[\]()!|]/g, " ") // Remove markdown syntax
        .replace(/\s+/g, " ")
        .trim();

    if (!text) return 0;
    return text.split(" ").filter(Boolean).length;
}

/**
 * Generate a preview-safe version of content with all processing applied.
 */
export function getPreviewContent(rawMarkdown: string): {
    html: string;
    frontmatter: BlogFrontmatter;
    stats: BlogValidationResult["stats"];
    headings: HeadingItem[];
} {
    const { content, frontmatter } = processBlogContent(rawMarkdown);
    const validation = validateBlogContent(rawMarkdown);
    const headings = extractHeadings(rawMarkdown);

    return {
        html: content, // Still markdown, but frontmatter-free
        frontmatter,
        stats: validation.stats,
        headings
    };
}

// =============================================================================
// INTELLIGENT AUTO-FORMATTING SYSTEM
// Transforms plain English into professional blog structure
// =============================================================================

// Topic detection patterns for intelligent section generation
const TOPIC_PATTERNS = {
    howTo: /\b(how to|steps to|guide to|tutorial|learn to|way to|method)\b/i,
    whyImportant: /\b(why|important|matters|benefits|advantages|reasons)\b/i,
    whatIs: /\b(what is|definition|meaning|understand|explain|overview)\b/i,
    tips: /\b(tips|tricks|hacks|advice|suggestions|recommendations)\b/i,
    comparison: /\b(vs\.?|versus|compared|comparison|difference|better)\b/i,
    list: /\b(\d+\s+(ways|tips|steps|things|reasons|methods|strategies))\b/i,
    problem: /\b(problem|issue|challenge|mistake|error|wrong)\b/i,
    solution: /\b(solution|fix|solve|resolve|answer|overcome)\b/i,
    best: /\b(best|top|ultimate|essential|must-have|key)\b/i,
};

// Transition phrases for professional flow
const TRANSITION_INTRO = [
    "Understanding this concept is essential for anyone looking to improve.",
    "This topic has gained significant attention in recent years.",
    "Many people struggle with this challenge, but solutions exist.",
    "The importance of this subject cannot be overstated.",
];

const TRANSITION_SECTION = [
    "Building on this foundation",
    "Taking this further",
    "Another key aspect to consider",
    "Equally important",
    "Furthermore",
    "In addition to this",
];

const TRANSITION_CONCLUSION = [
    "In summary",
    "To wrap up",
    "The key takeaway here",
    "Moving forward",
    "With these insights",
];

/**
 * Detects the type of content based on patterns
 */
function detectContentType(text: string): string[] {
    const types: string[] = [];
    Object.entries(TOPIC_PATTERNS).forEach(([type, pattern]) => {
        if (pattern.test(text)) {
            types.push(type);
        }
    });
    return types.length > 0 ? types : ["general"];
}

/**
 * Splits text into sentences using robust boundary detection
 */
function splitIntoSentences(text: string): string[] {
    // Handle common abbreviations to avoid false splits
    const preserved = text
        .replace(/Mr\./g, "Mr\u0000")
        .replace(/Mrs\./g, "Mrs\u0000")
        .replace(/Ms\./g, "Ms\u0000")
        .replace(/Dr\./g, "Dr\u0000")
        .replace(/Prof\./g, "Prof\u0000")
        .replace(/Jr\./g, "Jr\u0000")
        .replace(/Sr\./g, "Sr\u0000")
        .replace(/vs\./g, "vs\u0000")
        .replace(/etc\./g, "etc\u0000")
        .replace(/e\.g\./g, "e\u0000g\u0000")
        .replace(/i\.e\./g, "i\u0000e\u0000")
        .replace(/(\d)\./g, "$1\u0000"); // Numbers with periods

    // Split on sentence boundaries
    const sentences = preserved.split(/(?<=[.!?])\s+(?=[A-Z])/);

    // Restore abbreviations
    return sentences.map(s => s.replace(/\u0000/g, ".").trim()).filter(Boolean);
}

/**
 * Groups sentences into logical paragraphs (2-4 sentences each)
 */
function groupIntoParagraphs(sentences: string[], targetSize: number = 3): string[][] {
    const paragraphs: string[][] = [];
    let current: string[] = [];

    sentences.forEach((sentence, idx) => {
        current.push(sentence);

        // Create paragraph break based on:
        // 1. Reached target size
        // 2. Topic shift detected (transition words)
        // 3. Question followed by statement
        const isTopicShift = /^(However|But|Although|On the other hand|In contrast|Meanwhile|Nevertheless)/i.test(sentence);
        const isQuestionAnswer = idx > 0 && sentences[idx - 1].endsWith("?") && !sentence.endsWith("?");

        if (current.length >= targetSize || isTopicShift || isQuestionAnswer) {
            if (current.length > 0) {
                paragraphs.push([...current]);
                current = [];
            }
        }
    });

    if (current.length > 0) {
        paragraphs.push(current);
    }

    return paragraphs;
}

/**
 * Detects potential section boundaries based on content analysis
 */
function detectSectionBoundaries(paragraphs: string[][]): number[] {
    const boundaries: number[] = [];

    paragraphs.forEach((para, idx) => {
        if (idx === 0) return; // Skip first paragraph (intro)

        const text = para.join(" ").toLowerCase();
        const prevText = paragraphs[idx - 1]?.join(" ").toLowerCase() || "";

        // Detect topic changes
        const hasTopicChange =
            // Explicit transition phrases
            /^(now|next|another|additionally|furthermore|moreover|however|but|in contrast)/i.test(para[0]) ||
            // Question starting a new topic
            para[0].endsWith("?") ||
            // Numbered points
            /^(\d+[\.\)]|first|second|third|finally)/i.test(para[0]) ||
            // Significant content length difference
            (para.join(" ").length > prevText.length * 2);

        if (hasTopicChange && idx > 1) {
            boundaries.push(idx);
        }
    });

    return boundaries;
}

/**
 * Generates intelligent section headings based on content
 */
function generateSectionHeading(paragraphs: string[][], startIdx: number, endIdx: number, sectionNum: number): string {
    const content = paragraphs.slice(startIdx, endIdx).flat().join(" ");
    const types = detectContentType(content);

    // Extract key nouns/phrases from content for heading
    const keyPhrases = extractKeyPhrases(content);

    if (types.includes("howTo")) {
        return keyPhrases.length > 0
            ? `How to ${capitalizeFirst(keyPhrases[0])}`
            : `Step ${sectionNum}: Getting Started`;
    }
    if (types.includes("whyImportant")) {
        return keyPhrases.length > 0
            ? `Why ${capitalizeFirst(keyPhrases[0])} Matters`
            : "Why This Matters";
    }
    if (types.includes("tips")) {
        return keyPhrases.length > 0
            ? `Tips for ${capitalizeFirst(keyPhrases[0])}`
            : "Practical Tips";
    }
    if (types.includes("problem")) {
        return keyPhrases.length > 0
            ? `Common ${capitalizeFirst(keyPhrases[0])} Challenges`
            : "Understanding the Challenge";
    }
    if (types.includes("solution")) {
        return keyPhrases.length > 0
            ? `${capitalizeFirst(keyPhrases[0])} Solutions`
            : "Effective Solutions";
    }
    if (types.includes("best")) {
        return keyPhrases.length > 0
            ? `Best ${capitalizeFirst(keyPhrases[0])} Practices`
            : "Best Practices";
    }

    // Default headings based on position
    const defaultHeadings = [
        "Key Concepts",
        "Important Considerations",
        "Deeper Insights",
        "Practical Applications",
        "Advanced Strategies",
    ];

    return defaultHeadings[sectionNum % defaultHeadings.length];
}

/**
 * Extracts key phrases from content for heading generation
 */
function extractKeyPhrases(text: string): string[] {
    // Remove common words and extract meaningful phrases
    const stopWords = new Set([
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "must", "shall", "can", "need", "to", "of",
        "in", "for", "on", "with", "at", "by", "from", "as", "into", "through",
        "during", "before", "after", "above", "below", "between", "under",
        "again", "further", "then", "once", "here", "there", "when", "where",
        "why", "how", "all", "each", "every", "both", "few", "more", "most",
        "other", "some", "such", "no", "nor", "not", "only", "own", "same",
        "so", "than", "too", "very", "just", "also", "now", "this", "that",
        "these", "those", "it", "its", "you", "your", "we", "our", "they", "their"
    ]);

    const words = text.toLowerCase()
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));

    // Count word frequency
    const freq: Record<string, number> = {};
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

    // Return top phrases
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);
}

function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts bullet-like patterns into proper markdown lists
 */
function convertToLists(text: string): string {
    const lines = text.split("\n");
    const result: string[] = [];
    let inList = false;

    lines.forEach(line => {
        const trimmed = line.trim();

        // Detect list-like patterns
        const listPatterns = [
            /^[\-\*\•]\s*/,           // Already bullets
            /^\d+[\.\)]\s+/,          // Numbered: 1. or 1)
            /^[a-z][\.\)]\s+/i,       // Lettered: a. or a)
            /^(?:First|Second|Third|Fourth|Fifth|Finally|Lastly)[,:]?\s+/i,
        ];

        const isListItem = listPatterns.some(p => p.test(trimmed));

        if (isListItem) {
            // Convert to standard markdown bullet
            const content = trimmed
                .replace(/^[\-\*\•]\s*/, "")
                .replace(/^\d+[\.\)]\s+/, "")
                .replace(/^[a-z][\.\)]\s+/i, "")
                .replace(/^(?:First|Second|Third|Fourth|Fifth|Finally|Lastly)[,:]?\s+/i, "");

            result.push(`- ${content}`);
            inList = true;
        } else if (inList && trimmed === "") {
            result.push("");
            inList = false;
        } else {
            result.push(line);
            inList = false;
        }
    });

    return result.join("\n");
}

/**
 * Improves sentence clarity and removes weak language
 */
function improveSentenceClarity(text: string): string {
    let improved = text;

    // Remove weak openers
    const weakPatterns = [
        [/^I think that\s+/gim, ""],
        [/^I believe that\s+/gim, ""],
        [/^It seems that\s+/gim, ""],
        [/^There is a\s+/gim, "A "],
        [/^There are\s+/gim, ""],
        [/^It is important to note that\s+/gim, ""],
        [/^The fact that\s+/gim, ""],
        [/\s+very\s+/gi, " "],
        [/\s+really\s+/gi, " "],
        [/\s+just\s+/gi, " "],
        [/\s+basically\s+/gi, " "],
        [/\s+actually\s+/gi, " "],
        [/\s+literally\s+/gi, " "],
    ] as const;

    weakPatterns.forEach(([pattern, replacement]) => {
        improved = improved.replace(pattern, replacement);
    });

    return improved;
}

/**
 * Main auto-formatting function that transforms plain text into professional blog structure
 */
export function autoFormatContent(rawText: string, title?: string): string {
    // Preserve any existing frontmatter
    const { content: existingContent, frontmatter } = processBlogContent(rawText);

    // Check if content already has structure (headings)
    const hasExistingStructure = /^#{1,3}\s+.+$/m.test(existingContent);

    let text = existingContent;

    // Step 1: Basic cleanup and normalization
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    text = text.replace(/\n{3,}/g, "\n\n");
    text = text.trim();

    // If content already has markdown structure, just normalize it
    if (hasExistingStructure) {
        return normalizeBlogContent(rawText);
    }

    // Step 2: Improve sentence clarity
    text = improveSentenceClarity(text);

    // Step 3: Remove filler phrases
    FILLER_PHRASES.forEach(pattern => {
        text = text.replace(pattern, "");
    });

    // Step 4: Convert list-like patterns to proper lists
    text = convertToLists(text);

    // Step 5: Split into sentences
    const sentences = splitIntoSentences(text);

    if (sentences.length < 3) {
        // Too short to structure, just clean up
        return normalizeBlogContent(rawText);
    }

    // Step 6: Group sentences into paragraphs
    const paragraphs = groupIntoParagraphs(sentences, 3);

    // Step 7: Detect section boundaries
    const boundaries = detectSectionBoundaries(paragraphs);

    // Step 8: Build structured content
    const structuredParts: string[] = [];

    // Introduction (first 1-2 paragraphs)
    const introEnd = boundaries.length > 0 ? Math.min(boundaries[0], 2) : Math.min(2, paragraphs.length);
    const introParagraphs = paragraphs.slice(0, introEnd);

    introParagraphs.forEach(para => {
        structuredParts.push(para.join(" "));
    });

    // Add sections
    if (paragraphs.length > introEnd) {
        const sectionStarts = [introEnd, ...boundaries.filter(b => b > introEnd)];
        const sectionEnds = [...sectionStarts.slice(1), paragraphs.length];

        // Ensure we have at least one middle section
        if (sectionStarts.length === 1 && paragraphs.length > introEnd + 2) {
            // Create artificial sections every 2-3 paragraphs
            const remaining = paragraphs.length - introEnd;
            const sectionsNeeded = Math.max(2, Math.min(4, Math.ceil(remaining / 3)));
            const sectionSize = Math.ceil(remaining / sectionsNeeded);

            sectionStarts.length = 0;
            sectionEnds.length = 0;

            for (let i = 0; i < sectionsNeeded; i++) {
                const start = introEnd + (i * sectionSize);
                const end = Math.min(start + sectionSize, paragraphs.length);
                if (start < paragraphs.length) {
                    sectionStarts.push(start);
                    sectionEnds.push(end);
                }
            }
        }

        sectionStarts.forEach((start, idx) => {
            const end = sectionEnds[idx];
            const sectionParagraphs = paragraphs.slice(start, end);

            if (sectionParagraphs.length === 0) return;

            // Generate section heading
            const heading = generateSectionHeading(paragraphs, start, end, idx + 1);
            structuredParts.push(`\n## ${heading}\n`);

            sectionParagraphs.forEach(para => {
                structuredParts.push(para.join(" "));
            });
        });
    }

    // Add conclusion if content is substantial
    if (sentences.length > 10 && !structuredParts.some(p => p.includes("## Conclusion"))) {
        const lastParagraph = paragraphs[paragraphs.length - 1];
        const lastContent = lastParagraph?.join(" ") || "";

        // Only add conclusion heading if the last section isn't already a conclusion
        if (!lastContent.toLowerCase().includes("in conclusion") &&
            !lastContent.toLowerCase().includes("to summarize")) {
            // Move last paragraph to conclusion
            const conclusionIdx = structuredParts.length - 1;
            if (conclusionIdx > 0) {
                const lastPart = structuredParts.pop();
                structuredParts.push("\n## Conclusion\n");
                if (lastPart) structuredParts.push(lastPart);
            }
        }
    }

    // Step 9: Join and clean up
    let result = structuredParts.join("\n\n");

    // Step 10: Final normalization
    result = result.replace(/\n{3,}/g, "\n\n");
    result = result.trim();

    // Reconstruct with frontmatter if existed
    if (Object.keys(frontmatter).length > 0) {
        const yamlLines = Object.entries(frontmatter).map(([key, value]) => {
            if (Array.isArray(value)) {
                return `${key}:\n${value.map(v => `  - "${v}"`).join("\n")}`;
            }
            if (typeof value === "string" && (value.includes("\n") || value.includes(":"))) {
                return `${key}: "${value.replace(/"/g, '\\"')}"`;
            }
            return `${key}: ${value}`;
        });
        return `---\n${yamlLines.join("\n")}\n---\n\n${result}\n`;
    }

    return result + "\n";
}

/**
 * Quick format that applies just essential formatting without restructuring
 */
export function quickFormatContent(text: string): string {
    let formatted = text;

    // 1. Normalize whitespace
    formatted = formatted.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    formatted = formatted.replace(/\n{3,}/g, "\n\n");
    formatted = formatted.replace(/[ \t]+$/gm, "");

    // 2. Improve clarity
    formatted = improveSentenceClarity(formatted);

    // 3. Convert lists
    formatted = convertToLists(formatted);

    // 4. Break long paragraphs
    formatted = breakLongParagraphs(formatted, 400);

    // 5. Remove fillers
    FILLER_PHRASES.forEach(pattern => {
        formatted = formatted.replace(pattern, "");
    });

    return formatted.trim() + "\n";
}
