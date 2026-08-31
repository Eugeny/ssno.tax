import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(projectRoot, "oidc-applications.json");
const shellPath = resolve(projectRoot, "index.html");
const outputDirectory = resolve(projectRoot, "dist");
const outputPath = resolve(outputDirectory, "index.html");
const stylesheetPath = resolve(projectRoot, "index.css");
const filterScriptPath = resolve(projectRoot, "filter.js");
const logoPath = resolve(projectRoot, "taxfree.svg");
const marker = "<!-- OIDC_APPLICATIONS -->";

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol)
      ? escapeHtml(url.href)
      : "#";
  } catch {
    return "#";
  }
};

const externalLink = (url, label) =>
  `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;

const renderLicense = (license) => {
  const isBsl = /^BSL\b/i.test(license);
  if (!isBsl) return escapeHtml(license);

  return `<span class="license-alert" title="Business Source License"><span class="license-alert-icon" aria-hidden="true">⚠</span><span><span class="visually-hidden">Warning: </span>${escapeHtml(license)}</span></span>`;
};

const renderOidcStatus = (status = "built_in") => {
  const isExtension = status === "extension";
  const label = isExtension ? "Extension required" : "Built-in";
  const className = isExtension ? "extension" : "built-in";

  return `<span class="oidc-status oidc-status--${className}" role="img" aria-label="${label}" title="${label}"></span>`;
};

const renderStatusLegend = () => `
    <div class="oidc-legend" aria-label="OIDC support legend">
      <span><span class="oidc-status oidc-status--built-in" aria-hidden="true"></span> Built-in</span>
      <span><span class="oidc-status oidc-status--extension" aria-hidden="true"></span> Extension required</span>
    </div>`;

const renderNotes = (notes = []) => {
  if (!notes.length) return "";

  return `
    <aside class="catalog-notes" aria-label="Catalog notes">
      <h2>Notes</h2>
      <ul>
        ${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("\n        ")}
      </ul>
    </aside>`;
};

const renderFilters = (categoryEntries) => `
    <nav class="category-filters" aria-label="Filter applications by category">
      <span class="filter-label">Filter by category</span>
      <div class="filter-buttons" role="group" aria-label="Application categories">
        <button class="category-filter" type="button" data-category="all" aria-pressed="true">All <span>(${data.applications.length})</span></button>
        ${categoryEntries
          .map(
            ([category, applications]) =>
              `<button class="category-filter" type="button" data-category="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(category)} <span>(${applications.length})</span></button>`,
          )
          .join("\n        ")}
      </div>
    </nav>`;

const renderApplication = (application) => {
  const logo = application.logo_url
    ? `<img class="application-logo" src="${safeUrl(application.logo_url)}" alt="" width="32" height="32" loading="lazy" decoding="async" />`
    : "";

  return `
          <tr>
            <th scope="row">
              <a class="application-name" href="${safeUrl(application.project_url)}" target="_blank" rel="noopener noreferrer">
                ${logo}
                <span>${escapeHtml(application.name)}</span>
              </a>
            </th>
            <td>${renderOidcStatus(application.oidc_status)}</td>
            <td>${renderLicense(application.license)}</td>
            <td>${escapeHtml(application.description)}</td>
            <td>${externalLink(application.documentation_url, "Documentation")}</td>
          </tr>`;
};

const renderCategory = ([category, applications]) => `
    <section class="category-section" data-category="${escapeHtml(category)}">
      <h2>${escapeHtml(category)}</h2>
      <div class="table-wrapper">
        <table class="application-table">
          <caption class="visually-hidden">${escapeHtml(category)} applications</caption>
          <thead>
            <tr>
              <th scope="col">Application</th>
              <th scope="col">OIDC support</th>
              <th scope="col">License</th>
              <th scope="col">Description</th>
              <th scope="col">Links</th>
            </tr>
          </thead>
          <tbody>
            ${applications.map(renderApplication).join("\n")}
          </tbody>
        </table>
      </div>
    </section>`;

const data = JSON.parse(await readFile(sourcePath, "utf8"));
const shell = await readFile(shellPath, "utf8");

if (!Array.isArray(data.applications)) {
  throw new Error("oidc-applications.json must contain an applications array");
}

const categories = new Map();
for (const application of data.applications) {
  if (!application.name || !application.category) {
    throw new Error("Every application must have a name and category");
  }

  const categoryApplications = categories.get(application.category) ?? [];
  categoryApplications.push(application);
  categories.set(application.category, categoryApplications);
}

for (const applications of categories.values()) {
  applications.sort((a, b) => a.name.localeCompare(b.name));
}

const categoryEntries = [...categories.entries()].sort(([a], [b]) =>
  a.localeCompare(b),
);

const generatedContent = `
  <div class="oidc-catalog" data-application-count="${data.applications.length}">
    <p class="catalog-count">${data.applications.length} applications</p>
    ${renderStatusLegend()}
    ${renderFilters(categoryEntries)}
    ${renderNotes(data.notes)}
    ${categoryEntries.map(renderCategory).join("\n")}
  </div>`;

const markerCount = shell.split(marker).length - 1;
if (markerCount !== 1) {
  throw new Error(`Expected exactly one ${marker} marker in index.html`);
}

const output = shell.replace(marker, generatedContent.trim());
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, output);

for (const [sourceFile, outputFile] of [
  [stylesheetPath, "index.css"],
  [filterScriptPath, "filter.js"],
  [logoPath, "taxfree.svg"],
]) {
  try {
    await copyFile(sourceFile, resolve(outputDirectory, outputFile));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

console.log(`Built ${outputPath} from ${data.applications.length} applications.`);
