import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

function createFallback() {
  return {
    title: "Udyam Registration - Step 2 (PAN Validation)",
    step: 2,
    fields: [
      {
        id: "panNumber",
        name: "panNumber",
        label: "PAN Number",
        placeholder: "ABCDE1234F",
        type: "text",
        validation: {
          required: true,
          minLength: 10,
          maxLength: 10,
          pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
          helpText: "Format: [A-Z]{5}[0-9]{4}[A-Z]",
        },
      },
      {
        id: "pincode",
        name: "pincode",
        label: "PIN Code",
        placeholder: "6-digit PIN",
        type: "tel",
        validation: { minLength: 6, maxLength: 6, pattern: "^[0-9]{6}$" },
      },
      { id: "state", name: "state", label: "State", type: "text" },
      { id: "city", name: "city", label: "City", type: "text" },
    ],
  };
}

async function navigate(page: any, url: string) {
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 180000 });
  } catch {
    await delay(3000);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 });
  }
}

async function run() {
  const url = "https://udyamregistration.gov.in/UdyamRegistration.aspx";
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await navigate(page, url);

  // Try to find PAN and related fields in DOM by labels/placeholders
  const fields = await page.evaluate(() => {
    function getLabel(el: HTMLInputElement | HTMLSelectElement) {
      const id = (el as HTMLInputElement).id;
      if (id) {
        const lab = document.querySelector(`label[for="${id}"]`);
        if (lab) return (lab as HTMLElement).innerText.trim();
      }
      const prev = el.previousElementSibling as HTMLElement | null;
      if (prev && prev.tagName === "LABEL") return prev.innerText.trim();
      return el.getAttribute("placeholder") || el.getAttribute("name") || id || "";
    }

    function toField(el: HTMLInputElement | HTMLSelectElement) {
      const label = getLabel(el);
      const type = (el as HTMLInputElement).type || (el.tagName === "SELECT" ? "select" : "text");
      return {
        id: el.id || el.getAttribute("name") || label.replace(/\s+/g, "_").toLowerCase(),
        name: el.getAttribute("name") || el.id || label.replace(/\s+/g, "_").toLowerCase(),
        label,
        placeholder: el.getAttribute("placeholder") || undefined,
        type,
        validation: {
          required: el.hasAttribute("required"),
          maxLength: (el as HTMLInputElement).maxLength > 0 ? (el as HTMLInputElement).maxLength : undefined,
          pattern: (el as HTMLInputElement).pattern || undefined,
        },
      };
    }

    const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select"));
    const result = inputs
      .filter((el) => {
        const txt = `${getLabel(el)} ${(el as HTMLInputElement).placeholder || ""}`.toLowerCase();
        return /\bpan\b/.test(txt) || /pin\s*code|pincode/.test(txt) || /state/.test(txt) || /city|district/.test(txt);
      })
      .map(toField);

    // Ensure PAN is first
    result.sort((a, b) => (a.label.toLowerCase().includes("pan") ? -1 : b.label.toLowerCase().includes("pan") ? 1 : 0));
    return result.slice(0, 6);
  });

  const outDir = path.resolve(__dirname, "../../schema/generated");
  fs.mkdirSync(outDir, { recursive: true });
  const schema = fields && fields.length >= 1 ? { title: "Udyam Registration (scraped)", step: 2, fields } : createFallback();
  fs.writeFileSync(path.join(outDir, "step2.json"), JSON.stringify(schema, null, 2));

  await browser.close();
  console.log(`Step 2 schema -> ${path.join(outDir, "step2.json")} (fields: ${schema.fields.length})`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
}); 