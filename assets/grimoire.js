const POSTS_INDEX = "/posts/index.json";
const HOME_PATH = "/";
const POSTS_PER_PAGE = 8;
const CATEGORY_ORDER = ["ALL", "HTB ACTIVE", "HTB RETIRED", "RESEARCH", "MY CHALLENGES", "Blogs"];
const WORDS_PER_MINUTE = 200;
const MIN_READ_MINUTES = 1;
const GISCUS_CONFIG = {
  enabled: true,
  repo: "At0mXploit/At0mXploit.github.io",
  repoId: "R_kgDORXDSBw",
  category: "General",
  categoryId: "DIC_kwDORXDSB84C3HnV",
  mapping: "pathname",
  strict: "0",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "bottom",
  theme: "dark",
  lang: "en",
};

let postsCache = null;
let currentCategory = "ALL";
let currentPage = 1;
let currentSearchQuery = "";
let currentSearchToken = 0;
let postSearchTextCache = new Map();
let postReadTimeCache = new Map();
const GITHUB_URL = "https://github.com/At0mXploit";
let giscusMissingConfigLogged = false;
let activePostEnhancementsCleanup = null;
let keyboardShortcutsBound = false;
let homeCardNavIndex = -1;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function slugToTitle(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function categoryColorClass(color) {
  switch (color) {
    case "pink":
      return "bg-pink-400";
    case "blue":
      return "bg-blue-400";
    case "purple":
      return "bg-purple-400";
    case "green":
      return "bg-green-400";
    default:
      return "bg-orange-400";
  }
}

function normalizePost(post) {
  const id = post.id || post.slug || "";
  return {
    id,
    title: post.title || slugToTitle(id),
    date: post.date || "",
    category: post.category || "Blogs",
    excerpt: post.excerpt || "",
    tags: Array.isArray(post.tags) ? post.tags : [],
    color: post.color || "pink",
    path: post.path || `/posts/${id}.md`,
    cover: post.cover || "",
    machineStatus: post.machineStatus || "",
    os: post.os || "",
    difficulty: post.difficulty || "",
    sortOrder: Number.isFinite(post.sortOrder) ? post.sortOrder : null,
    readTime: post.readTime || "",
  };
}

function hasGiscusConfig() {
  return Boolean(
    GISCUS_CONFIG.enabled &&
    GISCUS_CONFIG.repo &&
    GISCUS_CONFIG.repoId &&
    GISCUS_CONFIG.category &&
    GISCUS_CONFIG.categoryId
  );
}

function mountGiscus(root, post) {
  const host = root.querySelector("[data-giscus-host]");
  if (!host) {
    return;
  }

  if (!hasGiscusConfig()) {
    if (!giscusMissingConfigLogged) {
      giscusMissingConfigLogged = true;
      console.warn("Giscus is enabled but missing required config values in GISCUS_CONFIG.");
    }
    host.innerHTML = "";
    return;
  }

  host.innerHTML = "";

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", GISCUS_CONFIG.repo);
  script.setAttribute("data-repo-id", GISCUS_CONFIG.repoId);
  script.setAttribute("data-category", GISCUS_CONFIG.category);
  script.setAttribute("data-category-id", GISCUS_CONFIG.categoryId);
  script.setAttribute("data-mapping", GISCUS_CONFIG.mapping);
  script.setAttribute("data-strict", GISCUS_CONFIG.strict);
  script.setAttribute("data-reactions-enabled", GISCUS_CONFIG.reactionsEnabled);
  script.setAttribute("data-emit-metadata", GISCUS_CONFIG.emitMetadata);
  script.setAttribute("data-input-position", GISCUS_CONFIG.inputPosition);
  script.setAttribute("data-theme", GISCUS_CONFIG.theme);
  script.setAttribute("data-lang", GISCUS_CONFIG.lang);
  script.setAttribute("data-loading", "lazy");
  if (GISCUS_CONFIG.mapping === "specific") {
    script.setAttribute("data-term", post.id);
  }

  host.appendChild(script);
}

function countWords(value) {
  const words = String(value || "").match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g);
  return words ? words.length : 0;
}

function formatReadTime(minutes) {
  return `${minutes} min read`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function estimateReadTimeLabel(text) {
  const words = countWords(text);
  const minutes = Math.max(MIN_READ_MINUTES, Math.ceil(words / WORDS_PER_MINUTE));
  return formatReadTime(minutes);
}

function estimateReadTimeFromMarkdown(markdown) {
  const plainText = preprocessMarkdown(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, " ")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, " ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, " $1 ")
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/^\s*[-*+]\s+/gm, " ")
    .replace(/^\s*\d+\.\s+/gm, " ")
    .replace(/^\|.*\|$/gm, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return estimateReadTimeLabel(plainText);
}

function fallbackReadTimeLabel(post) {
  return estimateReadTimeLabel([
    post.title,
    post.excerpt,
    post.category,
    ...(Array.isArray(post.tags) ? post.tags : []),
  ].join(" "));
}

async function loadPostReadTime(post, options = {}) {
  if (post.readTime) {
    postReadTimeCache.set(post.id, post.readTime);
    return post.readTime;
  }

  if (postReadTimeCache.has(post.id)) {
    return postReadTimeCache.get(post.id);
  }

  if (typeof options.markdown === "string") {
    const label = estimateReadTimeFromMarkdown(options.markdown);
    postReadTimeCache.set(post.id, label);
    return label;
  }

  const fallback = fallbackReadTimeLabel(post);

  try {
    const response = await fetch(post.path, { cache: "no-store" });
    if (!response.ok) {
      postReadTimeCache.set(post.id, fallback);
      return fallback;
    }

    const markdown = await response.text();
    const label = estimateReadTimeFromMarkdown(markdown);
    postReadTimeCache.set(post.id, label);
    return label;
  } catch (error) {
    console.error(error);
    postReadTimeCache.set(post.id, fallback);
    return fallback;
  }
}

async function loadPosts() {
  if (postsCache) {
    return postsCache;
  }

  const response = await fetch(POSTS_INDEX, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load posts index: ${response.status}`);
  }

  const posts = (await response.json())
    .map(normalizePost)
    .sort((a, b) => {
      if (Number.isFinite(a.sortOrder) && Number.isFinite(b.sortOrder) && a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      if (Number.isFinite(a.sortOrder) && !Number.isFinite(b.sortOrder)) {
        return -1;
      }
      if (!Number.isFinite(a.sortOrder) && Number.isFinite(b.sortOrder)) {
        return 1;
      }
      return String(b.date).localeCompare(String(a.date)) || String(a.title).localeCompare(String(b.title));
    });

  postsCache = posts;
  return posts;
}

function normalizeSearchText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function stripMarkdownForSearch(markdown) {
  return preprocessMarkdown(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, " $1 ")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, " $1 ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, " $1 ")
    .replace(/^#+\s+/gm, "")
    .replace(/^\|.*\|$/gm, " ")
    .replace(/[*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadPostSearchText(post) {
  if (postSearchTextCache.has(post.id)) {
    return postSearchTextCache.get(post.id);
  }

  const fallback = normalizeSearchText([
    post.title,
    post.excerpt,
    post.category,
    post.os,
    post.difficulty,
    ...(Array.isArray(post.tags) ? post.tags : []),
  ].join(" "));

  try {
    const response = await fetch(post.path, { cache: "no-store" });
    if (!response.ok) {
      postSearchTextCache.set(post.id, fallback);
      return fallback;
    }

    const markdown = await response.text();
    const combined = normalizeSearchText(`${fallback} ${stripMarkdownForSearch(markdown)}`);
    postSearchTextCache.set(post.id, combined);
    return combined;
  } catch (error) {
    console.error(error);
    postSearchTextCache.set(post.id, fallback);
    return fallback;
  }
}

async function filterPosts(posts) {
  const byCategory = currentCategory === "ALL"
    ? [...posts].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(a.title).localeCompare(String(b.title)))
    : posts.filter((post) => post.category === currentCategory);
  const query = normalizeSearchText(currentSearchQuery);

  if (!query) {
    return byCategory;
  }

  const terms = query.split(" ").filter(Boolean);
  const searchTexts = await Promise.all(byCategory.map((post) => loadPostSearchText(post)));
  return byCategory.filter((post, index) => terms.every((term) => searchTexts[index].includes(term)));
}

function renderInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="block my-8 mx-auto max-w-full h-auto border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" loading="lazy" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-pink-400 underline underline-offset-4 hover:text-pink-300 transition-colors">$1</a>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-black/50 border border-gray-600 px-2 py-1 rounded text-pink-400 font-mono text-sm">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}

function encodeAssetPath(value) {
  return String(value || "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function preprocessMarkdown(markdown) {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/^---\n[\s\S]*?\n---\n*/, "")
    .replace(/!\[\[([^\]]+)\]\]/g, (_, assetName) => {
      const name = String(assetName || "").trim();
      const lower = name.toLowerCase();
      const isImage = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"].some((ext) => lower.endsWith(ext));
      if (!isImage) {
        return escapeHtml(name);
      }
      return `![](/Machines/0%20-%20Images/${encodeAssetPath(name)})`;
    })
    .replace(/\]\(\/img\//g, "](/posts/img/")
    .replace(/\]\((?:\.\/)?img\//g, "](/posts/img/");
}

function normalizeCodeLang(codeLang) {
  const lang = String(codeLang || "").toLowerCase();
  if (["py", "python3"].includes(lang)) return "python";
  if (["sh", "shell", "zsh"].includes(lang)) return "bash";
  if (["javascript", "jsx", "ts", "tsx"].includes(lang)) return "js";
  if (["c++", "cc", "cxx"].includes(lang)) return "cpp";
  return lang;
}

function highlightCode(code, codeLang) {
  const lang = normalizeCodeLang(codeLang);
  const keywordSets = {
    bash: /\b(if|then|else|elif|fi|for|do|done|while|in|case|esac|function|export|sudo|echo|cat|grep|ls|cd|mv|cp|rm|tar|unzip|git|wget|curl|base64|xxd)\b/g,
    python: /\b(False|None|True|and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|if|import|in|is|lambda|not|or|pass|raise|return|try|while|with|yield)\b/g,
    c: /\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/g,
    cpp: /\b(auto|bool|break|case|catch|char|class|const|continue|default|delete|do|double|else|enum|explicit|false|float|for|if|int|long|namespace|new|nullptr|private|protected|public|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typename|union|unsigned|using|virtual|void|while)\b/g,
    js: /\b(await|break|case|catch|class|const|continue|default|delete|else|export|extends|false|finally|for|function|if|import|in|instanceof|let|new|null|return|static|super|switch|this|throw|true|try|typeof|var|while|yield)\b/g,
  };

  const patterns = {
    bash: [
      { type: "comment", regex: /#[^\n]*/g },
      { type: "string", regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g },
      { type: "number", regex: /\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b/g },
      { type: "keyword", regex: keywordSets.bash },
    ],
    python: [
      { type: "comment", regex: /#[^\n]*/g },
      { type: "string", regex: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g },
      { type: "number", regex: /\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b/g },
      { type: "keyword", regex: keywordSets.python },
    ],
    c: [
      { type: "comment", regex: /\/\/[^\n]*|\/\*[\s\S]*?\*\//g },
      { type: "string", regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g },
      { type: "number", regex: /\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b/g },
      { type: "keyword", regex: keywordSets.c },
    ],
    cpp: [
      { type: "comment", regex: /\/\/[^\n]*|\/\*[\s\S]*?\*\//g },
      { type: "string", regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g },
      { type: "number", regex: /\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b/g },
      { type: "keyword", regex: keywordSets.cpp },
    ],
    js: [
      { type: "comment", regex: /\/\/[^\n]*|\/\*[\s\S]*?\*\//g },
      { type: "string", regex: /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g },
      { type: "number", regex: /\b(?:0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b/g },
      { type: "keyword", regex: keywordSets.js },
    ],
  };

  const tokenClasses = {
    comment: "text-gray-500 italic",
    string: "text-green-400",
    number: "text-cyan-300",
    keyword: "text-pink-400 font-semibold",
  };

  const activePatterns = patterns[lang];
  if (!activePatterns) {
    return escapeHtml(code);
  }

  let cursor = 0;
  let html = "";

  while (cursor < code.length) {
    let nextMatch = null;
    let nextPattern = null;

    for (const pattern of activePatterns) {
      pattern.regex.lastIndex = cursor;
      const match = pattern.regex.exec(code);
      if (!match) continue;
      if (!nextMatch || match.index < nextMatch.index) {
        nextMatch = match;
        nextPattern = pattern;
      }
    }

    if (!nextMatch) {
      html += escapeHtml(code.slice(cursor));
      break;
    }

    if (nextMatch.index > cursor) {
      html += escapeHtml(code.slice(cursor, nextMatch.index));
    }

    html += `<span class="${tokenClasses[nextPattern.type]}">${escapeHtml(nextMatch[0])}</span>`;
    cursor = nextMatch.index + nextMatch[0].length;
  }

  return html;
}

function renderMarkdown(markdown) {
  const lines = preprocessMarkdown(markdown).split("\n");
  const html = [];
  let paragraph = [];
  let inCode = false;
  let codeLang = "";
  let codeLines = [];
  let listType = null;
  let quoteLines = [];
  let tableLines = [];

  function flushParagraph() {
    if (paragraph.length) {
      html.push(`<p class="text-lg font-medium text-gray-100 mb-6 leading-relaxed">${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }

  function flushList() {
    if (!listType) {
      return;
    }
    const tag = listType === "ol" ? "ol" : "ul";
    html.push(`<${tag} class="${tag === "ol" ? "list-decimal" : "list-disc"} list-inside text-gray-100 space-y-3 mb-6 ml-2">`);
    for (const item of quoteLines) {
      html.push(`<li class="text-lg font-medium leading-relaxed">${renderInline(item)}</li>`);
    }
    html.push(`</${tag}>`);
    listType = null;
    quoteLines = [];
  }

  function flushQuote() {
    if (listType || !quoteLines.length) {
      return;
    }
    html.push(`<blockquote class="border-l-4 border-pink-400 pl-6 my-6 italic text-gray-300">${quoteLines.map(renderInline).join("<br />")}</blockquote>`);
    quoteLines = [];
  }

  function flushTable() {
    if (!tableLines.length) {
      return;
    }

    const rows = tableLines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));

    tableLines = [];

    if (rows.length < 2) {
      paragraph.push(...rows.map((row) => row.join(" | ")));
      return;
    }

    const [header, ...body] = rows;
    const filteredBody = body.filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell)));

    html.push('<div class="my-8 overflow-x-auto border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">');
    html.push('<table class="min-w-full border-collapse bg-gray-950 text-gray-100">');
    html.push("<thead><tr>");
    for (const cell of header) {
      html.push(`<th class="border-2 border-gray-700 bg-yellow-400 px-4 py-3 text-left font-black text-black">${renderInline(cell)}</th>`);
    }
    html.push("</tr></thead>");
    html.push("<tbody>");
    for (const row of filteredBody) {
      html.push("<tr>");
      for (const cell of row) {
        html.push(`<td class="border-2 border-gray-800 px-4 py-3 align-top">${renderInline(cell)}</td>`);
      }
      html.push("</tr>");
    }
    html.push("</tbody></table></div>");
  }

  function flushCode() {
    if (!inCode) {
      return;
    }
    const className = codeLang ? `language-${escapeHtml(codeLang)}` : "";
    html.push(`<pre class="bg-black/70 border-2 border-gray-600 p-6 my-8 overflow-x-auto rounded"><code class="${className} font-mono text-sm">${highlightCode(codeLines.join("\n"), codeLang)}</code></pre>`);
    inCode = false;
    codeLang = "";
    codeLines = [];
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      if (inCode) {
        flushCode();
      } else {
        inCode = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      continue;
    }

    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      html.push('<hr class="border-0 h-1 bg-gradient-to-r from-pink-400 via-yellow-400 to-blue-400 my-10" />');
      continue;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushQuote();
      flushTable();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const classes = {
        1: "text-4xl md:text-6xl font-black text-white mb-4",
        2: "text-3xl font-black text-yellow-400 mt-14 mb-6 pt-4",
        3: "text-2xl font-black text-pink-400 mt-10 mb-4",
        4: "text-xl font-black text-cyan-400 mt-8 mb-3",
      };
      const style = level === 1 ? ' style="text-shadow:6px 6px 0px rgba(0,0,0,0.5)"' : level === 2 ? ' style="text-shadow:4px 4px 0px rgba(0,0,0,0.5)"' : "";
      html.push(`<h${level} id="${id}" class="${classes[level]}"${style}>${renderInline(text)}</h${level}>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      flushTable();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      quoteLines.push(orderedMatch[1].trim());
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.*)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushQuote();
      flushTable();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      quoteLines.push(unorderedMatch[1].trim());
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      flushTable();
      quoteLines.push(quoteMatch[1]);
      continue;
    }

    if (/^\|.*\|$/.test(line.trim())) {
      flushParagraph();
      flushList();
      flushQuote();
      tableLines.push(line);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  flushQuote();
  flushTable();
  flushCode();

  return html.join("");
}

function extractTableOfContents(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${htmlContent}</div>`, "text/html");
  return Array.from(doc.body.querySelectorAll("h1, h2, h3, h4"))
    .map((heading) => ({
      id: heading.id,
      title: (heading.textContent || "").trim(),
      level: Number(heading.tagName.slice(1)),
    }))
    .filter((entry) => entry.id && entry.title);
}

function buildTableOfContents(entries) {
  if (!entries.length) {
    return "";
  }

  return `
    <aside class="mb-8">
      <div class="bg-black/50 border-4 border-pink-400 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div class="inline-block bg-pink-400 border-2 border-black px-3 py-1 rotate-[-2deg] mb-4 transition-transform duration-200 ease-out hover:rotate-0 hover:scale-105">
          <span class="font-black text-black uppercase text-sm">Table of Contents</span>
        </div>
        <nav aria-label="Table of contents">
          <ul class="space-y-3">
            ${entries
              .map(
                (entry) => `
                  <li>
                    <a
                      href="#${escapeHtml(entry.id)}"
                      data-toc-link
                      data-toc-target="${escapeHtml(entry.id)}"
                      class="block text-sm font-bold text-gray-200 hover:text-pink-300 transition-colors"
                      style="padding-left:${(entry.level - 2) * 16}px"
                    >${escapeHtml(entry.title)}</a>
                  </li>
                `
              )
              .join("")}
          </ul>
        </nav>
      </div>
    </aside>
  `;
}

function ensureMain() {
  return document.querySelector("#root main");
}

function getInjectedRoots(main) {
  return {
    homeRoots: Array.from(main.querySelectorAll("[data-grimoire-root]")),
    postRoots: Array.from(main.querySelectorAll("[data-grimoire-post-root]")),
  };
}

function ensureSingleRoot(main, attribute) {
  const roots = Array.from(main.querySelectorAll(`[${attribute}]`));
  const [primary, ...extra] = roots;
  extra.forEach((node) => node.remove());
  if (primary) {
    return primary;
  }
  const root = document.createElement("div");
  root.setAttribute(attribute, "true");
  main.appendChild(root);
  return root;
}

function setNativeContentHidden(main, hidden) {
  Array.from(main.children).forEach((child) => {
    if (child.hasAttribute("data-grimoire-root") || child.hasAttribute("data-grimoire-post-root")) {
      return;
    }
    child.hidden = hidden;
    child.setAttribute("aria-hidden", hidden ? "true" : "false");
  });
}

function setRoute(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "auto" });
}

function ensureGithubLink() {
  const footer = document.querySelector("footer");
  const footerLinks = footer ? Array.from(footer.querySelectorAll("div")).find((node) => node.className && String(node.className).includes("flex") && String(node.className).includes("gap-5")) : null;
  if (!footerLinks || footerLinks.querySelector("[data-github-link]")) {
    return;
  }

  const githubAnchor = document.createElement("a");
  githubAnchor.href = GITHUB_URL;
  githubAnchor.target = "_blank";
  githubAnchor.rel = "noopener noreferrer";
  githubAnchor.setAttribute("data-github-link", "true");
  githubAnchor.className = "w-12 h-12 flex items-center justify-center border-3 border-white/40 text-white hover:bg-white/10 hover:scale-110 transition-all";
  githubAnchor.setAttribute("aria-label", "GitHub");
  githubAnchor.setAttribute("title", "GitHub");
  githubAnchor.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" style="display:block;fill:currentColor;">
      <path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.12.82-.26.82-.58v-2.02c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.72.08-.72 1.2.09 1.84 1.24 1.84 1.24 1.08 1.83 2.82 1.3 3.5 1 .11-.79.42-1.3.76-1.6-2.66-.31-5.46-1.34-5.46-5.94 0-1.31.47-2.39 1.23-3.23-.12-.3-.53-1.55.12-3.22 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.28-1.55 3.28-1.23 3.28-1.23.66 1.67.25 2.92.13 3.22.77.84 1.23 1.92 1.23 3.23 0 4.61-2.81 5.62-5.49 5.92.43.37.82 1.1.82 2.23v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"></path>
    </svg>
  `;
  footerLinks.appendChild(githubAnchor);
}

function attachTiltEffects(root) {
  root.querySelectorAll("[data-tilt]").forEach((element) => {
    if (element.dataset.tiltBound === "true") {
      return;
    }

    element.dataset.tiltBound = "true";
    const baseTransform = element.style.transform || "";
    element.dataset.baseTransform = baseTransform;
    element.style.transformStyle = "preserve-3d";
    element.style.willChange = "transform";
    element.style.transition = element.style.transition || "transform 160ms ease";

    element.addEventListener("mousemove", (event) => {
      const rect = element.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = px * 10;
      const rotateX = py * -10;
      const lift = element.dataset.tiltLift || "";
      element.style.transform = `${element.dataset.baseTransform || ""} perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) ${lift}`.trim();
    });

    element.addEventListener("mouseleave", () => {
      element.style.transform = element.dataset.baseTransform || "";
    });
  });
}

function buildCategoryButtons(posts) {
  const discovered = posts.map((post) => post.category).filter(Boolean);
  const categories = ["ALL", ...CATEGORY_ORDER.filter((name) => name !== "ALL" && discovered.includes(name)), ...discovered.filter((name) => !CATEGORY_ORDER.includes(name))];
  const palette = ["bg-yellow-400", "bg-orange-400", "bg-green-400", "bg-blue-400", "bg-pink-400", "bg-cyan-400"];
  return categories
    .map((category, index) => {
      const selected = currentCategory === category;
      const colorClass = palette[index % palette.length];
      return `
        <button
          type="button"
          data-category="${escapeHtml(category)}"
          data-tilt
          data-tilt-lift="translateY(-2px)"
          style="transform: rotate(${index % 2 === 0 ? "-2deg" : "2deg"})"
          class="${selected ? colorClass : "bg-gray-800"} border-4 border-black px-5 py-2 font-black text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:rotate-0 ${selected ? "text-black scale-105" : "text-gray-300 hover:text-white"}"
        >${escapeHtml(category)}</button>
      `;
    })
    .join("");
}

function buildPostCards(posts, category = "ALL") {
  if (!posts.length) {
    return `
      <div class="text-center py-16">
        <div class="bg-gray-900/60 border-8 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rotate-1">
          <p class="text-3xl font-black text-gray-300" style="text-shadow:4px 4px 0px rgba(0,0,0,0.5)">NO POST FOUND</p>
        </div>
      </div>
    `;
  }

  return posts
    .map((post, index) => {
      const colorClass = categoryColorClass(post.color);
      const metaBits = [post.machineStatus ? post.machineStatus.toUpperCase() : "", post.os, post.difficulty].filter(Boolean);
      const tags = post.tags
        .filter((tag) => String(tag).toLowerCase() !== "retired")
        .map(
          (tag, tagIndex) => `
            <div style="transform: rotate(${tagIndex % 2 === 0 ? "-2deg" : "2deg"})" class="bg-white border-3 border-black px-4 py-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span class="font-black text-black text-sm">#${escapeHtml(tag)}</span>
            </div>
          `
        )
        .join("");

      return `
        <a
          href="/post/${encodeURIComponent(post.id)}"
          data-post-link="${escapeHtml(post.id)}"
          data-tilt
          data-tilt-lift="translateY(-4px)"
          style="animation-delay:${index * 0.15}s;transform:rotate(${index % 2 === 0 ? "-2deg" : "2deg"})"
          class="group relative block bg-gray-900/60 border-8 border-black p-8 md:p-10 hover:bg-gray-900/80 transition-all hover:scale-[1.02] hover:rotate-0 animate-fade-in shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          <div class="absolute -top-6 -right-6 w-24 h-24 ${colorClass} rounded-full blur-2xl opacity-40"></div>
          <div class="absolute -top-2 left-1/4 w-24 h-8 bg-yellow-100/80 border-2 border-yellow-200 rotate-[-3deg] opacity-60"></div>
          <div class="absolute -top-2 right-1/3 w-20 h-8 bg-yellow-100/80 border-2 border-yellow-200 rotate-2 opacity-60"></div>
          <div class="flex flex-col md:flex-row items-start gap-8 relative z-10">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-4 flex-wrap">
                ${post.date ? `
                  <div class="bg-black border-2 border-white px-3 py-1">
                    <span class="text-white font-black text-xs uppercase">${escapeHtml(post.date)}</span>
                  </div>
                ` : ""}
                <div class="bg-white border-3 border-black px-3 py-1">
                  <span class="font-black text-black text-xs" data-read-time="${escapeHtml(post.id)}">${escapeHtml(post.readTime || "...")}</span>
                </div>
                <div class="${colorClass} border-4 border-black px-3 py-1 rotate-[-2deg]">
                  <span class="text-black font-black text-xs uppercase">${escapeHtml(post.category)}</span>
                </div>
                ${metaBits.map((bit) => `
                  <div class="bg-white border-3 border-black px-3 py-1">
                    <span class="font-black text-black text-xs uppercase">${escapeHtml(bit)}</span>
                  </div>
                `).join("")}
              </div>
              <h3 class="text-3xl md:text-4xl font-black mb-4 text-white group-hover:scale-105 transition-transform" style="text-shadow:4px 4px 0px rgba(0,0,0,0.5)">${escapeHtml(post.title)}</h3>
              <p class="text-lg text-gray-200 font-bold leading-relaxed mb-5">${escapeHtml(post.excerpt)}</p>
              <div class="flex flex-wrap gap-3">${tags}</div>
            </div>
            <div class="flex-shrink-0 ${colorClass} border-4 border-black w-14 h-14 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer">
              <span class="text-black font-black text-2xl">→</span>
            </div>
          </div>
          <svg class="absolute bottom-4 left-8 right-8 h-2" viewBox="0 0 400 10">
            <path d="M 0 5 Q 100 8, 200 5 T 400 5" stroke="currentColor" stroke-width="2" fill="none" class="text-white/10" stroke-linecap="round"></path>
          </svg>
        </a>
      `;
    })
    .join("");
}

function normalizeTags(tags) {
  return (Array.isArray(tags) ? tags : [])
    .map((tag) => String(tag || "").trim().toLowerCase())
    .filter((tag) => tag && tag !== "retired");
}

function buildRelatedPosts(currentPost, posts) {
  const currentTags = new Set(normalizeTags(currentPost.tags));
  if (!currentTags.size) {
    return "";
  }

  const candidates = posts
    .filter((post) => post.id !== currentPost.id)
    .map((post) => {
      const tags = normalizeTags(post.tags);
      const shared = tags.filter((tag) => currentTags.has(tag));
      return { post, score: shared.length };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return String(b.post.date).localeCompare(String(a.post.date)) || String(a.post.title).localeCompare(String(b.post.title));
    })
    .slice(0, 3);

  if (!candidates.length) {
    return "";
  }

  return `
    <section class="mt-12" data-related-posts>
      <div class="bg-gray-900/55 border-6 border-black p-7 md:p-10 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <div class="mb-8">
          <h2 class="text-3xl md:text-4xl font-black text-white" style="text-shadow:4px 4px 0px rgba(0,0,0,0.4)">RELATED POSTS</h2>
        </div>
        <div class="space-y-8 md:space-y-10">
          ${candidates.map(({ post, score }) => `
            <a
              href="/post/${encodeURIComponent(post.id)}"
              data-post-link="${escapeHtml(post.id)}"
              data-related-link
              class="group relative block bg-gray-900/60 border-8 border-black p-8 md:p-10 hover:bg-gray-900/80 transition-all hover:scale-[1.01] animate-fade-in shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
            >
              <div class="relative z-10 flex items-start gap-6">
                <div class="flex-1">
                <div class="flex items-center gap-3 mb-5 flex-wrap">
                  <div class="bg-black border-2 border-white px-3 py-1">
                    <span class="text-white font-black text-xs uppercase">${score} shared tag${score === 1 ? "" : "s"}</span>
                  </div>
                  <div class="bg-pink-400 border-4 border-black px-3 py-1 rotate-[-2deg]">
                    <span class="text-black font-black text-xs uppercase">${escapeHtml(post.category || "Post")}</span>
                  </div>
                </div>
                <h3 class="text-2xl md:text-3xl font-black text-white mb-4 leading-tight group-hover:scale-[1.01] transition-transform" style="text-shadow:3px 3px 0px rgba(0,0,0,0.5)">${escapeHtml(post.title)}</h3>
                <p class="text-base text-gray-200 font-bold leading-relaxed">${escapeHtml(post.excerpt || "Related writeup")}</p>
                </div>
                <div class="flex-shrink-0 bg-pink-400 border-4 border-black w-14 h-14 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span class="text-black font-black text-2xl">→</span>
                </div>
              </div>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function attachPostProgressAndToc(root) {
  const progress = root.querySelector("[data-reading-progress]");
  const content = root.querySelector("[data-post-content]");
  const tocLinks = Array.from(root.querySelectorAll("[data-toc-link]"));
  const headings = tocLinks
    .map((link) => {
      const id = link.getAttribute("data-toc-target") || "";
      return { link, target: id ? document.getElementById(id) : null, id };
    })
    .filter((entry) => entry.target && entry.id);

  const setActiveHeading = (id) => {
    tocLinks.forEach((link) => {
      const active = (link.getAttribute("data-toc-target") || "") === id;
      link.classList.toggle("text-pink-300", active);
      link.classList.toggle("underline", active);
      link.classList.toggle("underline-offset-4", active);
    });
  };

  const onScroll = () => {
    if (progress && content) {
      const contentTop = content.getBoundingClientRect().top + window.scrollY;
      const start = contentTop - 120;
      const total = Math.max(1, content.scrollHeight - window.innerHeight * 0.35);
      const ratio = clamp((window.scrollY - start) / total, 0, 1);
      progress.style.width = `${(ratio * 100).toFixed(2)}%`;
    }

    if (headings.length) {
      const offset = 140;
      let activeId = headings[0].id;
      for (const entry of headings) {
        if (!entry.target) {
          continue;
        }
        if (entry.target.getBoundingClientRect().top - offset <= 0) {
          activeId = entry.id;
        } else {
          break;
        }
      }
      setActiveHeading(activeId);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  };
}

function attachKeyboardShortcuts() {
  if (keyboardShortcutsBound) {
    return;
  }
  keyboardShortcutsBound = true;

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = !!target && (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable
    );

    const homeRoot = document.querySelector("[data-grimoire-root]");
    const homeVisible = homeRoot && !homeRoot.hidden;
    if (!homeVisible) {
      return;
    }

    const searchInput = homeRoot.querySelector("[data-search-input]");
    const searchClear = homeRoot.querySelector("[data-search-clear]");

    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
      return;
    }

    if (event.key === "Escape" && searchInput && (currentSearchQuery.trim() || searchInput.value.trim())) {
      event.preventDefault();
      if (searchClear) {
        searchClear.click();
      } else {
        searchInput.value = "";
        const form = homeRoot.querySelector("[data-search-form]");
        if (form) {
          form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
      }
      return;
    }

    if ((event.key === "j" || event.key === "k") && !isTyping) {
      const cards = Array.from(homeRoot.querySelectorAll("[data-post-link]"));
      if (!cards.length) {
        return;
      }
      event.preventDefault();
      const focusedIndex = cards.findIndex((card) => card === document.activeElement);
      const baseIndex = focusedIndex >= 0 ? focusedIndex : homeCardNavIndex;
      const delta = event.key === "j" ? 1 : -1;
      const nextIndex = clamp((baseIndex >= 0 ? baseIndex : (delta > 0 ? -1 : cards.length)) + delta, 0, cards.length - 1);
      homeCardNavIndex = nextIndex;
      const card = cards[nextIndex];
      if (card) {
        card.focus();
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  });
}

function buildPagination(totalPages) {
  if (totalPages <= 1) {
    return "";
  }

  const buttons = Array.from({ length: totalPages }, (_, index) => index + 1)
    .map(
      (page) => `
        <button
          type="button"
          data-page="${page}"
          data-tilt
          data-tilt-lift="translateY(-2px)"
          class="border-4 border-black w-12 h-12 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${currentPage === page ? "bg-yellow-400 text-black" : "bg-gray-800 text-gray-300 hover:text-white"}"
        >${page}</button>
      `
    )
    .join("");

  return `
    <div class="flex justify-center items-center gap-4 mt-16">
      <button type="button" data-page-prev data-tilt data-tilt-lift="translateY(-2px)" class="border-4 border-black px-5 py-2 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${currentPage === 1 ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-pink-400 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"}" ${currentPage === 1 ? "disabled" : ""}>← PREV</button>
      <div class="flex gap-2">${buttons}</div>
      <button type="button" data-page-next data-tilt data-tilt-lift="translateY(-2px)" class="border-4 border-black px-5 py-2 font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${currentPage === totalPages ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-pink-400 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"}" ${currentPage === totalPages ? "disabled" : ""}>NEXT →</button>
    </div>
  `;
}

function buildSearchSummary(filteredCount, totalCount) {
  const query = currentSearchQuery.trim();
  if (!query) {
    return "";
  }

  return `
    <div class="-mt-3 mb-8 text-center">
      <div class="inline-block bg-black border-4 border-white px-5 py-3 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg]">
        <p class="text-sm md:text-base font-black uppercase tracking-wider text-white">
          ${filteredCount} / ${totalCount} match${filteredCount === 1 ? "" : "es"} for "${escapeHtml(query)}"
        </p>
      </div>
    </div>
  `;
}

function buildSearchBox() {
  return `
    <div class="mb-12">
      <div class="relative max-w-4xl mx-auto bg-gray-900/90 border-8 border-black px-4 py-5 md:px-6 md:py-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] rotate-[-1deg]">
        <form data-search-form class="flex flex-col md:flex-row gap-3 md:items-stretch">
          <input
            type="search"
            name="q"
            value="${escapeHtml(currentSearchQuery)}"
            placeholder="Search in Grimoire"
            data-search-input
            spellcheck="false"
            autocomplete="off"
            class="w-full min-w-0 bg-black text-white border-4 border-white px-5 py-4 font-bold text-base outline-none placeholder:text-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          />
          <button
            type="submit"
            data-search-submit
            data-tilt
            data-tilt-lift="translateY(-2px)"
            class="bg-blue-400 border-4 border-black px-6 py-4 font-black text-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >Search</button>
          ${currentSearchQuery.trim() ? `
            <button
              type="button"
              data-search-clear
              data-tilt
              data-tilt-lift="translateY(-2px)"
              class="bg-pink-400 border-4 border-black px-6 py-4 font-black text-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >Clear</button>
          ` : ""}
        </form>
      </div>
    </div>
  `;
}

function buildGrimoireSection(posts, filtered) {
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  currentPage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  return `
    <section class="pt-32 pb-24 px-6 relative" id="posts">
      <div class="absolute top-40 right-[8%] w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-20 left-[10%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <svg class="absolute top-12 right-[5%] w-48 h-48 text-pink-400/20 animate-spin-slow" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="8,8"></circle>
        <path d="M 30 40 L 70 40 M 30 50 L 70 50 M 30 60 L 70 60" stroke="currentColor" stroke-width="2"></path>
      </svg>
      <svg class="absolute bottom-32 left-[12%] w-40 h-40 text-blue-400/15" viewBox="0 0 100 100">
        <path d="M 50 10 L 90 90 L 10 90 Z" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="6,6" class="animate-pulse"></path>
      </svg>
      <div class="max-w-5xl mx-auto">
        <div class="mb-20 text-center relative">
          <div class="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-32 border-8 border-yellow-400/20 rounded-full rotate-12"></div>
          <div class="absolute -top-8 left-[15%] bg-yellow-400 border-4 border-black px-3 py-1 rotate-[-15deg] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-wiggle">
            <p class="text-black font-black text-sm">NEW!</p>
          </div>
          <div class="absolute -top-6 right-[20%] bg-red-500 border-4 border-black px-3 py-1 rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce-crazy">
            <p class="text-black font-black text-sm">HOT!</p>
          </div>
          <h2 class="text-6xl md:text-8xl font-black mb-6 relative z-10" style="text-shadow:8px 8px 0px rgba(236, 72, 153, 0.4)">
            <span class="text-yellow-400">GRIM</span><span class="text-white">OIRE</span>
          </h2>
          <div class="relative inline-block">
            <svg class="absolute -inset-6 w-[calc(100%+3rem)] h-[calc(100%+3rem)]" viewBox="0 0 200 80">
              <path d="M 100 5 L 110 25 L 125 20 L 120 35 L 135 40 L 120 50 L 125 65 L 100 55 L 75 65 L 80 50 L 65 40 L 80 35 L 75 20 L 90 25 Z" fill="#3b82f6" opacity="0.2"></path>
            </svg>
            <div class="relative bg-blue-400 border-4 border-black px-8 py-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-1" data-tilt data-tilt-lift="translateY(-3px)">
              <p class="text-black font-black uppercase tracking-wider">Breaking Things & Taking Names</p>
            </div>
          </div>
        </div>
        ${buildSearchBox()}
        ${buildSearchSummary(filtered.length, posts.length)}
        <div class="flex flex-wrap justify-center gap-4 mb-16">${buildCategoryButtons(posts)}</div>
        <div class="space-y-10">${buildPostCards(paginated, currentCategory)}</div>
        ${buildPagination(totalPages)}
      </div>
    </section>
  `;
}

function attachPostScrollTopButton(root) {
  let button = document.querySelector("[data-scroll-top-btn-global]");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-scroll-top-btn-global", "true");
    button.setAttribute("aria-label", "Scroll to top");
    button.setAttribute("title", "Scroll to top");
    button.className = "fixed bottom-6 right-6 z-[9999] bg-yellow-400 border-4 border-black w-14 h-14 flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all";
    button.innerHTML = '<span class="text-black font-black text-2xl">↑</span>';
    document.body.appendChild(button);
  }

  const onClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  button.addEventListener("click", onClick);

  return () => {
    button.removeEventListener("click", onClick);
    button.remove();
  };
}

function attachHomeEvents(root, posts) {
  const rerenderHome = async () => {
    await renderHome(posts);
    ensureGithubLink();
    window.scrollTo({ top: root.offsetTop - 40, behavior: "smooth" });
  };

  root.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", async () => {
      currentCategory = button.getAttribute("data-category") || "ALL";
      currentPage = 1;
      await rerenderHome();
    });
  });

  root.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", async () => {
      currentPage = Number(button.getAttribute("data-page")) || 1;
      await rerenderHome();
    });
  });

  const prev = root.querySelector("[data-page-prev]");
  if (prev) {
    prev.addEventListener("click", async () => {
      currentPage -= 1;
      await rerenderHome();
    });
  }

  const next = root.querySelector("[data-page-next]");
  if (next) {
    next.addEventListener("click", async () => {
      currentPage += 1;
      await rerenderHome();
    });
  }

  const searchForm = root.querySelector("[data-search-form]");
  const searchInput = root.querySelector("[data-search-input]");
  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      currentSearchQuery = searchInput.value || "";
      currentPage = 1;
      ++currentSearchToken;
      await renderHome(posts);
      ensureGithubLink();
      window.scrollTo({ top: root.offsetTop - 40, behavior: "smooth" });
    });
  }

  const searchClear = root.querySelector("[data-search-clear]");
  if (searchClear) {
    searchClear.addEventListener("click", async () => {
      currentSearchQuery = "";
      currentPage = 1;
      ++currentSearchToken;
      await renderHome(posts);
      ensureGithubLink();
      window.scrollTo({ top: root.offsetTop - 40, behavior: "smooth" });
    });
  }

  root.querySelectorAll("[data-post-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const id = link.getAttribute("data-post-link");
      if (id) {
        setRoute(`/post/${id}`);
      }
    });
  });
}

async function hydrateReadTimeBadges(root, posts, token) {
  const nodes = Array.from(root.querySelectorAll("[data-read-time]"));
  if (!nodes.length) {
    return;
  }

  const postById = new Map(posts.map((post) => [post.id, post]));

  await Promise.all(nodes.map(async (node) => {
    const postId = node.getAttribute("data-read-time") || "";
    const post = postById.get(postId);
    if (!post) {
      return;
    }
    const label = await loadPostReadTime(post);
    if (token !== currentSearchToken) {
      return;
    }
    node.textContent = label;
  }));
}

async function renderHome(posts, options = {}) {
  const main = ensureMain();
  if (!main) {
    return;
  }

  const section = ensureSingleRoot(main, "data-grimoire-root");
  const { postRoots } = getInjectedRoots(main);

  setNativeContentHidden(main, false);
  postRoots.forEach((node) => node.remove());
  section.hidden = false;
  if (activePostEnhancementsCleanup) {
    activePostEnhancementsCleanup();
    activePostEnhancementsCleanup = null;
  }

  const token = options.token ?? ++currentSearchToken;
  const filtered = await filterPosts(posts);
  if (token !== currentSearchToken) {
    return;
  }

  section.innerHTML = buildGrimoireSection(posts, filtered);
  attachHomeEvents(section, posts);
  attachTiltEffects(section);
  attachKeyboardShortcuts();
  ensureGithubLink();
  hydrateReadTimeBadges(section, posts, token).catch((error) => console.error(error));
}

async function renderPost(posts, id) {
  const main = ensureMain();
  if (!main) {
    return;
  }

  const post = posts.find((entry) => entry.id === id);
  const homeRoot = ensureSingleRoot(main, "data-grimoire-root");
  const postRoot = ensureSingleRoot(main, "data-grimoire-post-root");

  setNativeContentHidden(main, true);
  homeRoot.hidden = true;
  postRoot.hidden = false;
  if (activePostEnhancementsCleanup) {
    activePostEnhancementsCleanup();
    activePostEnhancementsCleanup = null;
  }

  if (!post) {
    scrollToTop();
    postRoot.innerHTML = `
      <div class="min-h-screen flex items-center justify-center px-6">
        <div class="text-center">
          <h1 class="text-6xl font-black text-white mb-4">404</h1>
          <p class="text-xl text-gray-400 mb-8">Post not found!</p>
          <a href="/" data-home-link data-tilt data-tilt-lift="translateY(-3px)" class="bg-pink-400 border-4 border-black px-6 py-3 text-black font-black inline-block">GO HOME</a>
        </div>
      </div>
    `;
    attachTiltEffects(postRoot);
    const homeLink = postRoot.querySelector("[data-home-link]");
    if (homeLink) {
      homeLink.addEventListener("click", (event) => {
        event.preventDefault();
        setRoute(HOME_PATH);
      });
    }
    return;
  }

  const response = await fetch(post.path, { cache: "no-store" });
  const markdown = response.ok ? await response.text() : "# Failed To Load Post";
  const htmlContent = renderMarkdown(markdown);
  const tableOfContents = extractTableOfContents(htmlContent);
  const relatedPosts = buildRelatedPosts(post, posts);
  const colorClass = categoryColorClass(post.color);
  const readTime = await loadPostReadTime(post, { markdown });
  scrollToTop();

  postRoot.innerHTML = `
    <article class="py-24 px-6 relative min-h-screen" data-grimoire-post-shell>
      <div class="fixed top-3 left-4 right-4 z-[9999] h-3 bg-black/85 border-2 border-white/80 rounded-full pointer-events-none">
        <div data-reading-progress class="h-full w-0 rounded-full bg-gradient-to-r from-pink-400 via-yellow-400 to-blue-400 transition-[width] duration-150 shadow-[0_0_14px_rgba(244,114,182,0.9)]"></div>
      </div>
      <div class="absolute top-40 right-[8%] w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-20 left-[10%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div class="max-w-7xl mx-auto">
        <div class="relative bg-gray-900/60 border-8 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-12" data-tilt data-tilt-lift="translateY(-4px)">
          <div class="absolute -top-6 -right-6 w-32 h-32 ${colorClass} rounded-full blur-2xl opacity-40"></div>
          <div class="flex items-center gap-4 mb-6 flex-wrap">
            ${post.date ? `
              <div class="bg-black border-2 border-white px-4 py-2">
                <span class="text-white font-black text-sm uppercase">${escapeHtml(post.date)}</span>
              </div>
            ` : ""}
            <div class="bg-white border-3 border-black px-4 py-2">
              <span class="font-black text-black text-sm">${escapeHtml(readTime)}</span>
            </div>
            <div class="${colorClass} border-4 border-black px-4 py-2 rotate-[-2deg]">
              <span class="text-black font-black text-sm uppercase">${escapeHtml(post.category)}</span>
            </div>
            ${[post.machineStatus ? post.machineStatus.toUpperCase() : "", post.os, post.difficulty].filter(Boolean).map((bit) => `
              <div class="bg-white border-3 border-black px-4 py-2">
                <span class="font-black text-black text-sm uppercase">${escapeHtml(bit)}</span>
              </div>
            `).join("")}
          </div>
          <div class="mb-8">
            <div>
              <h1 class="text-4xl md:text-6xl font-black text-white mb-4" style="text-shadow:6px 6px 0px rgba(0,0,0,0.5)">${escapeHtml(post.title)}</h1>
              <div class="flex flex-wrap gap-3">
                ${post.tags
                  .filter((tag) => String(tag).toLowerCase() !== "retired")
                  .map(
                    (tag, index) => `
                      <div style="transform: rotate(${index % 2 === 0 ? "-2deg" : "2deg"})" class="bg-white border-3 border-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <span class="font-black text-black">#${escapeHtml(tag)}</span>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
        ${buildTableOfContents(tableOfContents)}
        <div class="markdown-content prose prose-invert prose-pink max-w-none" data-post-content>
          <div class="bg-gray-900/40 border-4 border-gray-700 p-8 md:p-12 shadow-lg">${htmlContent}</div>
        </div>
        <section class="mt-12" data-comments-section>
          <div class="bg-gray-900/40 border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 class="text-2xl md:text-3xl font-black text-white mb-5" style="text-shadow:4px 4px 0px rgba(0,0,0,0.4)">COMMENTS</h2>
            <div data-giscus-host></div>
          </div>
        </section>
        ${relatedPosts}
        <div class="mt-12 text-center">
          <a href="/" data-home-link data-tilt data-tilt-lift="translateY(-4px)" class="inline-block bg-yellow-400 border-8 border-black px-12 py-5 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all rotate-[-2deg] hover:rotate-0">
            <span class="font-black text-2xl text-black uppercase">BACK HOME →</span>
          </a>
        </div>
      </div>
    </article>
  `;
  attachTiltEffects(postRoot);

  postRoot.querySelectorAll("[data-home-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      setRoute(HOME_PATH);
    });
  });

  postRoot.querySelectorAll("[data-toc-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("data-toc-target") || "";
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        target.style.scrollMarginTop = "6rem";
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  postRoot.querySelectorAll("[data-post-link], [data-related-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("data-post-link") || "";
      if (targetId) {
        setRoute(`/post/${targetId}`);
      }
    });
  });

  mountGiscus(postRoot, post);
  const detachProgressAndToc = attachPostProgressAndToc(postRoot);
  const detachScrollTop = attachPostScrollTopButton(postRoot);
  attachKeyboardShortcuts();
  activePostEnhancementsCleanup = () => {
    detachProgressAndToc();
    detachScrollTop();
  };
}

function currentPostId() {
  const match = window.location.pathname.match(/^\/post\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function renderRoute() {
  const main = ensureMain();
  if (!main) {
    window.requestAnimationFrame(renderRoute);
    return;
  }

  try {
    const posts = await loadPosts();
    const postId = currentPostId();

    if (postId) {
      await renderPost(posts, postId);
    } else {
      await renderHome(posts);
    }
    ensureGithubLink();
  } catch (error) {
    console.error(error);
  }
}

window.addEventListener("popstate", () => {
  window.requestAnimationFrame(renderRoute);
});

if (document.readyState === "complete" || document.readyState === "interactive") {
  window.requestAnimationFrame(renderRoute);
} else {
  window.addEventListener("DOMContentLoaded", () => {
    window.requestAnimationFrame(renderRoute);
  }, { once: true });
}
