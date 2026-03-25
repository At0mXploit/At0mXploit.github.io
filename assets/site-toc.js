function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPostContent() {
  if (!window.location.pathname.startsWith("/post/")) {
    return null;
  }

  return document.querySelector(".markdown-content");
}

function collectHeadings(content) {
  return Array.from(content.querySelectorAll("h1, h2, h3, h4"))
    .map((heading) => ({
      id: heading.id,
      title: (heading.textContent || "").trim(),
      level: Number(heading.tagName.slice(1)),
    }))
    .filter((entry) => entry.id && entry.title);
}

function ensureLayout(content) {
  const parent = content.parentElement;
  if (!parent) {
    return null;
  }

  return parent;
}

function buildToc(entries) {
  const aside = document.createElement("aside");
  aside.dataset.siteToc = "true";
  aside.className = "mb-8";

  const items = entries
    .map(
      (entry) => `
        <li>
          <a
            href="#${escapeHtml(entry.id)}"
            class="block text-sm font-bold text-gray-200 hover:text-pink-300 transition-colors"
            style="padding-left:${(entry.level - 2) * 16}px"
          >${escapeHtml(entry.title)}</a>
        </li>
      `
    )
    .join("");

  aside.innerHTML = `
    <div class="bg-black/50 border-4 border-pink-400 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div class="inline-block bg-pink-400 border-2 border-black px-3 py-1 rotate-[-2deg] mb-4 transition-transform duration-200 ease-out hover:rotate-0 hover:scale-105">
        <span class="font-black text-black uppercase text-sm">Table of Contents</span>
      </div>
      <nav aria-label="Table of contents">
        <ul class="space-y-3">${items}</ul>
      </nav>
    </div>
  `;

  aside.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const href = link.getAttribute("href") || "";
      const targetId = href.startsWith("#") ? href.slice(1) : "";
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        target.style.scrollMarginTop = "1.5rem";
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  return aside;
}

function renderTableOfContents() {
  const content = getPostContent();
  if (!content) {
    document.querySelectorAll("[data-site-toc]").forEach((node) => node.remove());
    return;
  }

  if (document.querySelector("[data-toc-link]")) {
    return;
  }

  const headings = collectHeadings(content);
  const layout = ensureLayout(content);
  if (!layout) {
    return;
  }

  layout.querySelectorAll("[data-site-toc]").forEach((node) => node.remove());
  if (!headings.length) {
    return;
  }

  layout.insertBefore(buildToc(headings), content);
}

let renderTimer = null;

function scheduleRender() {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(renderTableOfContents, 50);
}

const observer = new MutationObserver(() => {
  scheduleRender();
});

observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("load", scheduleRender);
window.addEventListener("popstate", scheduleRender);
scheduleRender();
