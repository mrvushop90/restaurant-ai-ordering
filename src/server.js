require("dotenv").config();

const express = require("express");
const menu = require("../data/menu.json");

const app = express();
const port = process.env.PORT || 3000;
const TAX_RATE = 0.0825;
let nextOrderNumber = 1001;

const menuItems = Object.values(menu).flat();

function findMenuItemByName(name) {
  return menuItems.find((menuItem) => menuItem.name === name);
}

function roundCurrency(amount) {
  return Number(amount.toFixed(2));
}

function getMissingRequiredFields(body) {
  const { customerName, phone, orderType, items } = body || {};
  const missing = [];

  if (!customerName) {
    missing.push("customerName");
  }

  if (!phone) {
    missing.push("phone");
  }

  if (!orderType) {
    missing.push("orderType");
  }

  if (!Array.isArray(items)) {
    missing.push("items");
  }

  return missing;
}

function buildOrderQuote(body) {
  const { customerName, phone, orderType, items } = body || {};
  let subtotal = 0;
  const quotedItems = [];

  for (const item of items) {
    const itemName = typeof item === "string" ? item : item && item.name;
    const qty =
      typeof item === "string"
        ? 1
        : Number.isFinite(item && item.qty) && item.qty > 0
          ? item.qty
          : 1;
    const menuItem = findMenuItemByName(itemName);

    if (!menuItem) {
      return {
        ok: false,
        message: "Item not found",
        item: itemName,
      };
    }

    const lineTotal = roundCurrency(menuItem.price * qty);
    subtotal += lineTotal;
    quotedItems.push(
      typeof item === "string"
        ? {
            name: itemName,
            qty,
            price: menuItem.price,
            lineTotal,
          }
        : {
            ...item,
            name: itemName,
            qty,
            price: menuItem.price,
            lineTotal,
          },
    );
  }

  subtotal = roundCurrency(subtotal);

  const tax = roundCurrency(subtotal * TAX_RATE);
  const total = roundCurrency(subtotal + tax);

  return {
    ok: true,
    customerName,
    phone,
    orderType,
    subtotal,
    tax,
    total,
    items: quotedItems,
  };
}

function createOrderNumber() {
  const orderNumber = `ORD-${nextOrderNumber}`;
  nextOrderNumber += 1;
  return orderNumber;
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/*
Order schema:
- customerName
- phone
- orderType
- items
- modifiers
- subtotal
- tax
- total
- pickupTime
*/

app.get("/", (req, res) => {
  res.type("text/plain").send("Restaurant AI Ordering server is running");
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "restaurant-ai-ordering",
  });
});

app.get("/menu", (req, res) => {
  res.json(menu);
});

app.post("/orders/test", (req, res) => {
  res.json({
    ok: true,
    received: req.body,
  });
});

app.post("/orders/validate", (req, res) => {
  const missing = getMissingRequiredFields(req.body);

  if (missing.length > 0) {
    return res.status(400).json({
      ok: false,
      missing,
    });
  }

  res.json({
    ok: true,
    message: "Order is valid",
  });
});

app.post("/orders/quote", (req, res) => {
  const missing = getMissingRequiredFields(req.body);

  if (missing.length > 0) {
    return res.status(400).json({
      ok: false,
      message: "Invalid order payload",
    });
  }

  const quote = buildOrderQuote(req.body);

  if (!quote.ok) {
    return res.status(400).json(quote);
  }

  res.json(quote);
});

app.post("/orders/submit", (req, res) => {
  const missing = getMissingRequiredFields(req.body);

  if (missing.length > 0) {
    return res.status(400).json({
      ok: false,
      message: "Invalid order payload",
      missing,
    });
  }

  const quote = buildOrderQuote(req.body);

  if (!quote.ok) {
    return res.status(400).json(quote);
  }

  res.json({
    ok: true,
    message: "Order submitted",
    orderNumber: createOrderNumber(),
    customerName: quote.customerName,
    phone: quote.phone,
    orderType: quote.orderType,
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
    items: quote.items,
  });
});

app.post("/twilio/voice", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Hello, thank you for calling. This is the restaurant AI assistant test line.
  </Say>
</Response>`;

  res.type("text/xml").send(twiml);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
