// app.js
function money(n) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function qs(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name);
}

// OPTIONAL: set your Make.com webhook URL here (or leave empty to disable)
const MAKE_WEBHOOK_URL = ""; // e.g. "https://hook.us1.make.com/xxxxx"

async function pingMake(eventType, payload) {
  if (!MAKE_WEBHOOK_URL) return;
  try {
    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, ...payload, ts: Date.now() })
    });
  } catch (e) {
    // Silent fail so it never breaks your store UI
    console.warn("Make webhook failed:", e);
  }
}

function renderIndex() {
  const grid = document.getElementById("grid");
  const products = window.PRODUCTS || [];

  grid.innerHTML = products.map(p => `
    <a class="card" href="product.html?id=${encodeURIComponent(p.id)}">
      <div class="thumb"><img src="${p.image}" alt="${p.name}"></div>
      <div class="content">
        <div class="title">${p.name}</div>
        <div class="desc">${p.description}</div>
        <div class="row">
          <div class="price">${money(p.price)}</div>
          <div class="btn">View</div>
        </div>
      </div>
    </a>
  `).join("");
}

function renderProduct() {
  const id = qs("id");
  const p = (window.PRODUCTS || []).find(x => x.id === id);

  const mount = document.getElementById("productMount");
  if (!p) {
    mount.innerHTML = `<div class="page" style="padding:18px;">Product not found.</div>`;
    return;
  }

  document.title = `${p.name} — Store`;

  mount.innerHTML = `
    <div class="page">
      <div class="page-inner">
        <div class="page-media"><img src="${p.image}" alt="${p.name}"></div>
        <div class="page-info">
          <div class="pill">Ships via Printify</div>
          <h2>${p.name}</h2>
          <div class="price" style="font-size:18px;">${money(p.price)}</div>
          <p>${p.description}</p>
          <div class="kv">
            ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
            <a class="btn" id="buyBtn" href="${p.checkoutUrl}" target="_blank" rel="noopener">
              Buy now
            </a>
            <a class="btn" href="index.html" style="border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.06);">
              Back
            </a>
          </div>

          <p style="font-size:12px; color: var(--muted); margin-top:10px;">
            Tip: set your checkout link’s success URL to <b>/success.html</b> and cancel URL to <b>/cancel.html</b>.
          </p>
        </div>
      </div>
    </div>
  `;

  // Ping Make when someone clicks "Buy" (not a confirmed purchase—just intent)
  const buyBtn = document.getElementById("buyBtn");
  buyBtn.addEventListener("click", () => {
    pingMake("buy_click", { productId: p.id, productName: p.name, price: p.price });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.getAttribute("data-page");
  if (page === "index") renderIndex();
  if (page === "product") renderProduct();
});
