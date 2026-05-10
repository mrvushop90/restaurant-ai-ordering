const OpenAI = require("openai");

const RESTAURANT_NAME = "Com Tam Bros";
const RESTAURANT_ADDRESS = "28565 Hesperian Blvd Hayward CA 94545";
const RESTAURANT_HOURS = "Open Daily 9 AM to 9 PM";
const PICKUP_TIME = "15 to 20 minutes";
const TAX_RATE = 0.0825;
const VOICE = "Polly.Joanna-Neural";
const FALLBACK_VOICE = "Polly.Ruth-Neural";
const MAX_HISTORY_MESSAGES = 20;
const VOICE_PATH = "/voice";

const MENU = [
  {
    name: "Pho Tai",
    price: 11.99,
    aliases: ["pho tai", "tai pho", "rare beef pho"],
    allowedModifiers: ["No Basil", "No Bean Sprouts", "No Basil and Bean Sprouts"]
  },
  {
    name: "Pho Chin",
    price: 11.99,
    aliases: ["pho chin", "chin pho", "brisket pho"],
    allowedModifiers: ["No Basil", "No Bean Sprouts", "No Basil and Bean Sprouts"]
  },
  {
    name: "Pho Bo Vien",
    price: 11.99,
    aliases: ["pho bo vien", "bo vien pho", "beef meatball pho", "meatball pho"],
    allowedModifiers: ["No Basil", "No Bean Sprouts", "No Basil and Bean Sprouts"]
  },
  {
    name: "Pho Dac Biet",
    price: 12.99,
    aliases: ["pho dac biet", "dac biet pho", "special pho", "combination pho"],
    allowedModifiers: ["No Basil", "No Bean Sprouts", "No Basil and Bean Sprouts"]
  },
  {
    name: "Pho Ga",
    price: 11.99,
    aliases: ["pho ga", "chicken pho"],
    allowedModifiers: ["No Basil", "No Bean Sprouts", "No Basil and Bean Sprouts"]
  },
  {
    name: "Kids Pho",
    price: 11.99,
    aliases: ["kids pho", "kid pho", "children pho", "small pho"],
    allowedModifiers: ["No Onion", "No Cilantro", "No Basil", "No Bean Sprouts"]
  },
  {
    name: "Single Grill Plate",
    price: 14.99,
    aliases: ["single grill plate", "single plate", "single com tam"],
    allowedModifiers: [
      "Grilled Pork Chop",
      "Pork Skewer",
      "Grilled Chicken",
      "Korean Short Ribs",
      "Grilled Shrimp",
      "Pork Skin",
      "Egg Cake",
      "Fried Egg",
      "Extra Pork Chop",
      "Extra Pork Skewer",
      "Extra Chicken",
      "Extra Short Ribs",
      "Extra Shrimp"
    ]
  },
  {
    name: "Little Bro Plate",
    price: 17.99,
    aliases: ["little bro plate", "little bro", "little bro combo"],
    allowedModifiers: [
      "Grilled Pork Chop",
      "Pork Skewer",
      "Grilled Chicken",
      "Korean Short Ribs",
      "Grilled Shrimp",
      "Pork Skin",
      "Extra Pork Chop",
      "Extra Pork Skewer",
      "Extra Chicken",
      "Extra Short Ribs",
      "Extra Shrimp"
    ]
  },
  {
    name: "Big Bro Plate",
    price: 19.99,
    aliases: ["big bro plate", "big bro", "big bro combo"],
    allowedModifiers: [
      "Grilled Pork Chop",
      "Pork Skewer",
      "Grilled Chicken",
      "Korean Short Ribs",
      "Grilled Shrimp",
      "Extra Pork Chop",
      "Extra Pork Skewer",
      "Extra Chicken",
      "Extra Short Ribs",
      "Extra Shrimp"
    ]
  },
  {
    name: "Vermicelli Bowl",
    price: 14.99,
    aliases: ["vermicelli bowl", "bun bowl", "bun", "rice noodle bowl"],
    allowedModifiers: ["Grilled Pork", "Grilled Chicken", "Grilled Shrimp", "Crispy Egg Roll"]
  },
  {
    name: "Vermicelli Combo Bowl",
    price: 17.99,
    aliases: ["vermicelli combo bowl", "combo vermicelli bowl", "bun combo"],
    allowedModifiers: ["Grilled Pork Half", "Grilled Chicken Half"]
  },
  {
    name: "Crispy Egg Rolls",
    price: 8.5,
    aliases: ["crispy egg rolls", "egg rolls", "cha gio"]
  },
  {
    name: "Shrimp Spring Rolls",
    price: 9.5,
    aliases: ["shrimp spring rolls", "spring rolls", "goi cuon tom"]
  },
  {
    name: "Double Decker Roll",
    price: 9.5,
    aliases: ["double decker roll", "saigon crunch", "double decker"]
  },
  {
    name: "Avocado Roll",
    price: 9.4,
    aliases: ["avocado roll"]
  },
  {
    name: "Chicken Roll",
    price: 9.95,
    aliases: ["chicken roll"]
  },
  {
    name: "Chicken Salad",
    price: 13.99,
    aliases: ["chicken salad"]
  },
  {
    name: "Avocado Salad",
    price: 13.99,
    aliases: ["avocado salad"]
  },
  {
    name: "Vietnamese Iced Coffee",
    price: 7.0,
    aliases: ["vietnamese iced coffee", "ca phe sua da", "iced coffee"]
  },
  {
    name: "Thai Iced Tea",
    price: 7.0,
    aliases: ["thai iced tea"]
  },
  {
    name: "Strawberry Pomegranate Lemonade",
    price: 7.0,
    aliases: ["strawberry pomegranate lemonade", "pomegranate lemonade"]
  },
  {
    name: "Mango Passion",
    price: 7.0,
    aliases: ["mango passion"]
  }
];

const MODIFIER_PRICES = {
  "No Basil": 0,
  "No Bean Sprouts": 0,
  "No Basil and Bean Sprouts": 0,
  "No Onion": 0,
  "No Cilantro": 0,
  "Grilled Pork Chop": 0,
  "Pork Skewer": 0,
  "Grilled Chicken": 0,
  "Korean Short Ribs": 1.5,
  "Grilled Shrimp": 1.5,
  "Grilled Pork": 0,
  "Crispy Egg Roll": 0,
  "Grilled Pork Half": 0,
  "Grilled Chicken Half": 0,
  "Pork Skin": 2.0,
  "Egg Cake": 3.5,
  "Fried Egg": 2.0,
  "Extra Pork Chop": 3.0,
  "Extra Pork Skewer": 3.0,
  "Extra Chicken": 3.0,
  "Extra Short Ribs": 4.0,
  "Extra Shrimp": 4.0
};

const ITEM_LOOKUP = buildItemLookup(MENU);
const callStore = global.__comTamBrosCallStore || (global.__comTamBrosCallStore = {});

function buildItemLookup(items) {
  const lookup = {};

  for (const item of items) {
    const keys = [item.name].concat(item.aliases || []);
    for (const key of keys) {
      lookup[String(key).trim().toLowerCase()] = item;
    }
  }

  return lookup;
}

function escapeForTwiml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function formatMoney(value) {
  return roundMoney(value).toFixed(2);
}

function trimHistory(history) {
  return history.slice(-MAX_HISTORY_MESSAGES);
}

function getSession(callSid) {
  if (!callStore[callSid]) {
    callStore[callSid] = {
      history: [],
      customerName: "",
      orderItems: [],
      greeted: false
    };
  }

  return callStore[callSid];
}

function clearSession(callSid) {
  delete callStore[callSid];
}

function appendHistory(session, role, content) {
  session.history = trimHistory([
    ...session.history,
    { role, content: String(content || "") }
  ]);
}

function toTitleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function normalizeModifierName(rawModifier) {
  const modifier = String(rawModifier || "").trim();
  if (!modifier) {
    return "";
  }

  const normalized = modifier.toLowerCase();
  const aliasMap = {
    "no bean sprouts": "No Bean Sprouts",
    "no basil": "No Basil",
    "no basil no bean sprouts": "No Basil and Bean Sprouts",
    "no basil and bean sprouts": "No Basil and Bean Sprouts",
    "no onion": "No Onion",
    "no cilantro": "No Cilantro",
    "grilled pork chop": "Grilled Pork Chop",
    "pork chop": "Grilled Pork Chop",
    "pork skewer": "Pork Skewer",
    "skewer": "Pork Skewer",
    "grilled chicken": "Grilled Chicken",
    "chicken": "Grilled Chicken",
    "korean short ribs": "Korean Short Ribs",
    "short ribs": "Korean Short Ribs",
    "grilled shrimp": "Grilled Shrimp",
    "shrimp": "Grilled Shrimp",
    "grilled pork": "Grilled Pork",
    "crispy egg roll": "Crispy Egg Roll",
    "crispy egg rolls": "Crispy Egg Roll",
    "grilled pork half": "Grilled Pork Half",
    "grilled chicken half": "Grilled Chicken Half",
    "pork skin": "Pork Skin",
    "egg cake": "Egg Cake",
    "fried egg": "Fried Egg",
    "extra pork chop": "Extra Pork Chop",
    "extra pork skewer": "Extra Pork Skewer",
    "extra chicken": "Extra Chicken",
    "extra short ribs": "Extra Short Ribs",
    "extra shrimp": "Extra Shrimp"
  };

  return aliasMap[normalized] || toTitleCase(modifier);
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized = [];

  for (const item of items) {
    const rawName = item && item.name ? String(item.name).trim() : "";
    const menuItem = ITEM_LOOKUP[rawName.toLowerCase()];

    if (!menuItem) {
      continue;
    }

    const rawQuantity = Number(item.quantity);
    const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? Math.floor(rawQuantity) : 1;
    const rawModifiers = Array.isArray(item && item.modifiers) ? item.modifiers : [];
    const modifiers = [];

    for (const rawModifier of rawModifiers) {
      const normalizedModifier = normalizeModifierName(rawModifier);
      if (!normalizedModifier) {
        continue;
      }

      if (Array.isArray(menuItem.allowedModifiers) && !menuItem.allowedModifiers.includes(normalizedModifier)) {
        continue;
      }

      if (!modifiers.includes(normalizedModifier)) {
        modifiers.push(normalizedModifier);
      }
    }

    normalized.push({
      name: menuItem.name,
      quantity,
      modifiers
    });
  }

  return normalized;
}

function calculateOrder(orderItems) {
  const items = normalizeOrderItems(orderItems).map((item) => {
    const menuItem = ITEM_LOOKUP[item.name.toLowerCase()];
    const modifierTotal = roundMoney(
      item.modifiers.reduce((sum, modifier) => sum + Number(MODIFIER_PRICES[modifier] || 0), 0)
    );
    const unitPrice = roundMoney(menuItem.price + modifierTotal);
    const lineTotal = roundMoney(unitPrice * item.quantity);

    return {
      name: item.name,
      quantity: item.quantity,
      modifiers: item.modifiers,
      basePrice: menuItem.price,
      modifierTotal,
      unitPrice,
      lineTotal
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
  const tax = roundMoney(subtotal * TAX_RATE);
  const total = roundMoney(subtotal + tax);

  return { items, subtotal, tax, total };
}

function orderSummary(items) {
  if (!items.length) {
    return "no items";
  }

  return items
    .map((item) => {
      const modifierText = item.modifiers.length ? ` with ${item.modifiers.join(", ")}` : "";
      return `${item.quantity} ${item.name}${modifierText}`;
    })
    .join(", ");
}

function noSpeechPrompt(session) {
  if (!session.greeted) {
    return `Thank you for calling ${RESTAURANT_NAME}, this is Jenny. What can I get started for you today?`;
  }

  return "Sorry, I didn't catch that bro. What would you like to order?";
}

function buildSystemPrompt(session) {
  const order = calculateOrder(session.orderItems);

  return `
You are Jenny, the phone order taker for Com Tam Bros in Hayward, California.
You are warm, casual, fun, and sound like a Vietnamese-American friend helping someone order food.
Never sound robotic, stiff, or corporate.
Never admit to being AI.
If the caller asks if you are AI, say exactly: No I'm Jenny, I work here

Personality and tone:
- Maximum 3 sentences per reply.
- Warm, casual, playful energy.
- You can naturally say things like "Oh good choice bro", "You're gonna love that", "That's our most popular", "Oh perfect", or "I got you", but do not force a catchphrase every time.
- Sound human and conversational, not scripted.
- If the customer is unsure, guide them casually.
- If the customer is rude, stay chill and helpful.
- Once you know the customer's name, use it naturally once in a while, but do not overdo it.

Language behavior:
- Handle English and Vietnamese naturally.
- If the caller speaks Vietnamese, respond naturally in Vietnamese.
- If the caller mixes English and Vietnamese, match that naturally.

Conversation rules:
- Take the order item by item.
- Keep the running order updated every turn.
- If the customer asks what they ordered, read back the current full order naturally.
- Ask follow-up questions only when needed to finish an item, especially protein choices.
- You can answer menu questions, hours, address, payment, and pickup time.
- You may suggest one popular item or drink naturally, but do not keep upselling.
- If they reached the wrong place, politely explain this is Com Tam Bros in Hayward.
- If there is an active order and customerName is missing, ask for their name before finalizing.
- Do not finalize unless there is at least one valid item and a customer name.
- Do not invent menu items, ingredients, or policies.
- Only include valid menu items from the menu below in orderItems.
- Your reply field must be exactly what Jenny would say out loud.

Restaurant facts:
- Name: ${RESTAURANT_NAME}
- Address: ${RESTAURANT_ADDRESS}
- Hours: ${RESTAURANT_HOURS}
- Pickup only.
- Pickup time is about ${PICKUP_TIME}.
- Tax rate is ${(TAX_RATE * 100).toFixed(2)}%.
- Customer can pay when they pick up.

Menu guidance:
- Pho comes with rice noodles, cooked bean sprouts, and basil by default.
- Pho herb preferences can be saved as modifiers: No Basil, No Bean Sprouts, No Basil and Bean Sprouts.
- Kids Pho is a small bowl with brisket only, no onion, no cilantro.
- Grill plates require a protein choice: Grilled Pork Chop, Pork Skewer, Grilled Chicken, Korean Short Ribs (+$1.50), or Grilled Shrimp (+$1.50).
- Little Bro Plate includes protein plus egg cake plus fried egg.
- Big Bro Plate includes protein plus pork skin plus egg cake plus fried egg.
- Vermicelli Bowl requires one protein choice: Grilled Pork, Grilled Chicken, Grilled Shrimp (+$1.50), or Crispy Egg Roll.
- Vermicelli Combo Bowl includes Grilled Shrimp x2 plus Crispy Egg Roll x1 plus either Grilled Pork Half or Grilled Chicken Half.
- Modifier pricing matters, so preserve paid protein choices and extras exactly in modifiers.

How to use orderItems:
- Return the full current order every time, not just the newest item.
- Use exact menu item names for name.
- Use modifiers for protein choices, herb choices, and extras.
- Examples:
- Single Grill Plate with Korean Short Ribs => {"name":"Single Grill Plate","quantity":1,"modifiers":["Korean Short Ribs"]}
- Pho Tai with no basil => {"name":"Pho Tai","quantity":1,"modifiers":["No Basil"]}
- Vermicelli Bowl with grilled shrimp => {"name":"Vermicelli Bowl","quantity":1,"modifiers":["Grilled Shrimp"]}
- Big Bro Plate with grilled chicken and extra fried egg is not valid because only allowed modifiers should be used from menu; do not invent extras not listed.

Order finalization:
- When the order is complete and the customer gives their name, speak naturally and warmly.
- When you are ready for final confirmation, set orderFinalized to true.
- The spoken confirmation should match this style exactly in meaning:
"Perfect! So I have [order] for [name]. Total comes to $[total] with tax. We'll have that ready in about 15 to 20 minutes. See you soon!"
- Keep it within 3 sentences.

Return format:
- Return JSON only.
- Use this exact shape:
{"reply":"","orderFinalized":false,"customerName":"","orderItems":[]}

Full menu:
- PHO:
- Pho Tai $11.99
- Pho Chin $11.99
- Pho Bo Vien $11.99
- Pho Dac Biet $12.99
- Pho Ga $11.99
- Kids Pho $11.99
- GRILL PLATES:
- Single Grill Plate $14.99
- Little Bro Plate $17.99
- Big Bro Plate $19.99
- Grill plate protein choices: Grilled Pork Chop, Pork Skewer, Grilled Chicken, Korean Short Ribs +$1.50, Grilled Shrimp +$1.50
- VERMICELLI BOWLS:
- Vermicelli Bowl $14.99
- Vermicelli Combo Bowl $17.99
- APPETIZERS:
- Crispy Egg Rolls $8.50
- Shrimp Spring Rolls $9.50
- Double Decker Roll $9.50
- Avocado Roll $9.40
- Chicken Roll $9.95
- SALADS:
- Chicken Salad $13.99
- Avocado Salad $13.99
- DRINKS:
- Vietnamese Iced Coffee $7
- Thai Iced Tea $7
- Strawberry Pomegranate Lemonade $7
- Mango Passion $7

Current customer name: ${session.customerName || "unknown"}
Current order summary: ${orderSummary(order.items)}
Current subtotal: $${formatMoney(order.subtotal)}
Current tax: $${formatMoney(order.tax)}
Current total: $${formatMoney(order.total)}
`.trim();
}

async function getOpenAIResponse(context, session) {
  const client = new OpenAI({
    apiKey: context.OPENAI_API_KEY
  });

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 220,
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt(session) },
      ...session.history
    ]
  });

  const content = completion &&
    completion.choices &&
    completion.choices[0] &&
    completion.choices[0].message &&
    completion.choices[0].message.content
    ? completion.choices[0].message.content
    : "{}";

  return JSON.parse(content);
}

function normalizeRecordingUrl(recordingUrl) {
  const trimmed = String(recordingUrl || "").trim();
  if (!trimmed) {
    return "";
  }

  return /\.(wav|mp3)$/i.test(trimmed) ? trimmed : `${trimmed}.wav`;
}

async function getDeepgramTranscript(context, recordingUrl) {
  const apiKey = String(context.DEEPGRAM_API_KEY || "").trim();
  const audioUrl = normalizeRecordingUrl(recordingUrl);

  if (!apiKey) {
    throw new Error("Missing DEEPGRAM_API_KEY");
  }

  if (!audioUrl) {
    return "";
  }

  const params = new URLSearchParams({
    model: "nova-3",
    language: "multi",
    smart_format: "true"
  });

  const response = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: audioUrl })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepgram request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const transcript = data &&
    data.results &&
    data.results.channels &&
    data.results.channels[0] &&
    data.results.channels[0].alternatives &&
    data.results.channels[0].alternatives[0] &&
    data.results.channels[0].alternatives[0].transcript
    ? String(data.results.channels[0].alternatives[0].transcript).trim()
    : "";

  return transcript;
}

function normalizeOpenAIResult(result, session) {
  const customerName = result && result.customerName
    ? String(result.customerName).trim()
    : session.customerName;

  const orderItems = normalizeOrderItems(result && result.orderItems);
  const reply = result && result.reply
    ? String(result.reply).trim()
    : "For sure, what else can I get for you?";
  const orderFinalized = Boolean(
    result &&
    result.orderFinalized &&
    customerName &&
    orderItems.length > 0
  );

  return {
    reply,
    orderFinalized,
    customerName,
    orderItems
  };
}

function buildFinalConfirmation(session) {
  const order = calculateOrder(session.orderItems);
  const summary = orderSummary(order.items);

  return `Perfect! So I have ${summary} for ${session.customerName}. Total comes to $${formatMoney(order.total)} with tax. We'll have that ready in about ${PICKUP_TIME}. See you soon!`;
}

exports.handler = async function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const callSid = event.CallSid || "unknown-call";
  const recordingUrl = String(event.RecordingUrl || "").trim();
  const session = getSession(callSid);
  const BASE_URL = String(context.BASE_URL || "").trim();
  const spokenTexts = [];

  function speak(text) {
    const spoken = escapeForTwiml(String(text || "").trim()).slice(0, 650);
    if (spoken) spokenTexts.push(spoken);
  }

  function sendResponse(finalize) {
    if (finalize) {
      for (const text of spokenTexts) {
        const forceSay = String(context.FORCE_SAY || "").trim() === "1";
        if (!forceSay && BASE_URL) {
          twiml.play(`${BASE_URL}/tts?text=${encodeURIComponent(text)}&voice=marin`);
        } else {
          twiml.say({ voice: FALLBACK_VOICE || VOICE, language: "en-US" }, text);
        }
      }
      twiml.hangup();
    } else {
      for (const text of spokenTexts) {
        const forceSay = String(context.FORCE_SAY || "").trim() === "1";
        if (!forceSay && BASE_URL) {
          twiml.play(`${BASE_URL}/tts?text=${encodeURIComponent(text)}&voice=marin`);
        } else {
          twiml.say({ voice: FALLBACK_VOICE || VOICE, language: "en-US" }, text);
        }
      }

      twiml.record({
        action: VOICE_PATH,
        method: "POST",
        maxLength: 15,
        timeout: 3,
        playBeep: false,
        trim: "trim-silence"
      });
    }
  }

  console.log("CALL RECEIVED:", callSid, "RECORDING URL:", recordingUrl);

  try {
    if (!recordingUrl) {
      const prompt = noSpeechPrompt(session);
      session.greeted = true;
      appendHistory(session, "assistant", prompt);

      speak(prompt);
      sendResponse(false);
      return callback(null, twiml);
    }

    let speechResult = "";
    try {
      console.log("CALLING DEEPGRAM...");
      speechResult = await getDeepgramTranscript(context, recordingUrl);
      console.log("DEEPGRAM TRANSCRIPT:", speechResult);
    } catch (error) {
      console.log("DEEPGRAM ERROR:", error.message);
      const fallbackReply = "Sorry bro, I missed that. Can you say it one more time?";
      appendHistory(session, "assistant", fallbackReply);

      speak(fallbackReply);
      sendResponse(false);
      return callback(null, twiml);
    }

    if (!speechResult) {
      const retryPrompt = "Sorry bro, I didn't catch that. What would you like to order?";
      appendHistory(session, "assistant", retryPrompt);

      speak(retryPrompt);
      sendResponse(false);
      return callback(null, twiml);
    }

    session.greeted = true;
    appendHistory(session, "user", speechResult);

    let openAIResult;
    try {
      console.log("CALLING OPENAI...");
      openAIResult = await getOpenAIResponse(context, session);
      console.log("OPENAI RESPONSE:", JSON.stringify(openAIResult));
    } catch (error) {
      console.log("OPENAI ERROR:", error.message);
      const fallbackReply = "Sorry bro, give me one quick second.";
      appendHistory(session, "assistant", fallbackReply);

      speak(fallbackReply);
      sendResponse(false);
      return callback(null, twiml);
    }

    const parsed = normalizeOpenAIResult(openAIResult, session);
    session.customerName = parsed.customerName;
    session.orderItems = parsed.orderItems;

    if (parsed.orderFinalized) {
      const finalReply = buildFinalConfirmation(session);
      appendHistory(session, "assistant", finalReply);

      speak(finalReply);
      speak("Thank you for calling Com Tam Bros.");
      sendResponse(true);
      clearSession(callSid);
      return callback(null, twiml);
    }

    appendHistory(session, "assistant", parsed.reply);
    speak(parsed.reply);
    sendResponse(false);
    return callback(null, twiml);
  } catch (error) {
    console.log("HANDLER ERROR:", error.message);
    const fallbackReply = "Sorry bro, give me one quick second.";
    speak(fallbackReply);
    sendResponse(false);
    return callback(null, twiml);
  }
};
