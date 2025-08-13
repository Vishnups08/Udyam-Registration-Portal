import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Simple attribute collector for inputs and selects
function toFormField(el: any) {
  const labelText = el.label || el.placeholder || el.name || el.id || "";
  const type = el.type || "text";
  const pattern = el.pattern || undefined;
  const required = Boolean(el.required);
  const maxLength = el.maxLength && el.maxLength > 0 ? el.maxLength : undefined;
  const minLength = undefined; // often not present
  return {
    id: el.id || el.name || labelText.replace(/\s+/g, "_").toLowerCase(),
    name: el.name || el.id || labelText.replace(/\s+/g, "_").toLowerCase(),
    label: labelText.trim(),
    placeholder: el.placeholder || undefined,
    type,
    validation: { required, maxLength, minLength, pattern },
  };
}

async function navigateWithRetry(page: any, url: string, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 180000 });
      return;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await delay(3000);
    }
  }
}

async function run() {
  const url = "https://udyamregistration.gov.in/UdyamRegistration.aspx";
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });
  page.setDefaultNavigationTimeout(180000);

  await navigateWithRetry(page, url);

  // Heuristic: collect inputs within visible forms in the first viewport
  const fields = await page.evaluate(() => {
    function getLabelFor(input: HTMLInputElement | HTMLSelectElement) {
      const id = (input as HTMLInputElement).id;
      if (id) {
        const lbl = document.querySelector(`label[for="${id}"]`);
        if (lbl) return (lbl as HTMLElement).innerText.trim();
      }
      // fallback: previous sibling label or parent text
      let el: any = input.previousElementSibling;
      if (el && el.tagName === "LABEL") return el.innerText.trim();
      return input.getAttribute("aria-label") || input.getAttribute("placeholder") || input.getAttribute("name") || id || "";
    }

    const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select"))
      .filter((i) => !["hidden", "submit", "button", "image"].includes((i as HTMLInputElement).type || ""));

    const mapped = inputs.slice(0, 20).map((i) => {
      const label = getLabelFor(i);
      const opt = (i.tagName === "SELECT") ? Array.from((i as HTMLSelectElement).options).map(o => ({ label: o.text, value: o.value })) : undefined;
      return {
        id: i.id || i.name || label.replace(/\s+/g, "_").toLowerCase(),
        name: i.getAttribute("name") || i.id || label.replace(/\s+/g, "_").toLowerCase(),
        label,
        placeholder: i.getAttribute("placeholder") || undefined,
        type: (i as HTMLInputElement).type || (i.tagName === "SELECT" ? "select" : "text"),
        options: opt,
        validation: {
          required: i.hasAttribute("required"),
          maxLength: (i as HTMLInputElement).maxLength > 0 ? (i as HTMLInputElement).maxLength : undefined,
          pattern: (i as HTMLInputElement).pattern || undefined,
        },
      };
    });

    return mapped;
  });

  const outDir = path.resolve(__dirname, "../../schema/generated");
  fs.mkdirSync(outDir, { recursive: true });
  const schema = { title: "Udyam Registration (scraped)", step: 1, fields };
  fs.writeFileSync(path.join(outDir, "step1.json"), JSON.stringify(schema, null, 2));

  await browser.close();
  console.log(`Scraped ${fields.length} fields -> ${path.join(outDir, "step1.json")}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
}); 