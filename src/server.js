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
  { name: "Pho Tai", price: 11.99 },
  { name: "Pho Chin", price: 11.99 },
  { name: "Pho Bo Vien", price: 11.99 },
  { name: "Pho Dac Biet", price: 12.99 },
  { name: "Pho Ga", price: 11.99 },
  { name: "Kids Pho", price: 11.99 },
  { name: "Single Grill Plate", price: 14.99 },
  { name: "Little Bro Plate", price: 17.99 },
  { name: "Big Bro Plate", price: 19.99 },
  { name: "Pork Skin", price: 2.0 },
  { name: "Egg Cake", price: 3.5 },
  { name: "Fried Egg", price: 2.0 },
  { name: "Extra Pork Chop", price: 3.0 },
  { name: "Extra Pork Skewer", price: 3.0 },
  { name: "Extra Chicken", price: 3.0 },
  { name: "Extra Short Ribs", price: 4.0 },
  { name: "Extra Shrimp", price: 4.0 },
  { name: "Vermicelli Bowl", price: 14.99 },
  { name: "Vermicelli Combo Bowl", price: 17.99 },
  { name: "Crispy Egg Rolls Cha Gio", price: 8.5 },
  { name: "Shrimp Spring Rolls Goi Cuon Tom", price: 9.5 },
  { name: "Double Decker Roll Saigon Crunch", price: 9.5 },
  { name: "Avocado Roll", price: 9.4 },
  { name: "Chicken Roll", price: 9.95 },
  { name: "Chicken Salad", price: 13.99 },
  { name: "Avocado Salad", price: 13.99 },
  { name: "Vietnamese Iced Coffee Ca Phe Sua Da", price: 7.0 },
  { name: "Thai Iced Tea", price: 7.0 },
  { name: "Strawberry Pomegranate Lemonade", price: 7.0 },
  { name: "Mango Passion", price: 7.0 }
];

const MENU_BY_NAME = MENU.reduce((acc, item) => {
  acc[item.name.toLowerCase()] = item;
  return acc;
}, {});

const callStore = global.__phoAestheticCallStore || (global.__phoAestheticCallStore = {});

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

function normalizeOrderItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const normalized = [];

  for (const item of items) {
    const rawName = item && item.name ? String(item.name).trim() : "";
    const menuItem = MENU_BY_NAME[rawName.toLowerCase()];

    if (!menuItem) {
      continue;
    }

    const rawQuantity = Number(item.quantity);
    const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? Math.floor(rawQuantity) : 1;
    const modifiers = Array.isArray(item && item.modifiers)
      ? item.modifiers.map((modifier) => String(modifier).trim()).filter(Boolean)
      : [];

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
    const menuItem = MENU_BY_NAME[item.name.toLowerCase()];
    const lineTotal = roundMoney(menuItem.price * item.quantity);

    return {
      name: item.name,
      quantity: item.quantity,
      modifiers: item.modifiers,
      unitPrice: menuItem.price,
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
    return `Thank you for calling ${RESTAURANT_NAME}, this is Sofia. What can I get started for you today?`;
  }

  return "Sorry, I didn't catch that. What would you like to order?";
}

function buildSystemPrompt(session) {
  const order = calculateOrder(session.orderItems);
  return `
You are Sofia, a fun, casual, friendly Vietnamese-American restaurant order taker at Com Tam Bros.
You sound like talking to a friend, warm and natural, never robotic and never corporate.
Never admit to being AI.
If asked if you are AI, say exactly: No I am just Sofia I work here

Personality and tone:
- Keep every spoken reply to a maximum of 3 sentences.
- Sound casual, warm, and human with a Vietnamese-American vibe.
- Use natural phrases when they fit, not every time: "Oh good choice bro", "You're gonna love that", "That's our most popular one", "Oh perfect", "Mmhmm".
- Make light food jokes only when it feels natural.
- Show genuine interest and react like a real person.
- If the customer is indecisive, say naturally: "Take your time, no rush, I got you".
- If the customer says something funny, laugh naturally: "Ha, I like that".
- Once you know the customer's name, use it naturally once in a while, but do not overdo it.
- If the customer is rude, stay warm and patient: "Hey, I get it, I'm here to help".
- If they change the order multiple times, stay relaxed and human: "You're good, we do this all the time, what's the final version?"

Language behavior:
- Handle English and Vietnamese naturally.
- If the customer speaks Vietnamese, respond naturally in Vietnamese.

How to answer naturally:
- If asked what you recommend, share a genuine favorite and why.
- If asked for the best seller, say Pho Dac Biet and explain why people love it.
- If asked what is popular, mention 2 or 3 popular items, not the whole menu.
- If asked what they should get, ask what kinds of flavors or proteins they like, then make a personalized suggestion.
- If asked whether something is spicy, explain the heat level naturally.
- If asked what is in an item, describe the ingredients conversationally.
- If asked whether something is vegetarian, check the menu and be honest.
- If asked about gluten free options, explain what is available and do not overpromise.
- If asked about nuts, answer directly.
- If asked for no cilantro, say naturally: "Absolutely, I'll make a note of that".
- If asked for substitutions, say naturally: "Sure thing, we can work with that".
- If asked for extra broth, say naturally: "No problem at all".
- If asked for less spicy, say naturally: "Got it, I'll let the kitchen know".
- If asked for something on the side, say naturally: "You got it".
- If they change their mind mid-order, say naturally: "Oh no problem, happens all the time, let me fix that".
- If the customer seems unsure, say naturally: "No pressure, take your time, what sounds good to you?"
- If they ask a weird question, answer naturally and you may use light humor if it fits.
- If someone seems confused or has the wrong number, politely clarify that they reached Com Tam Bros in Hayward.

Restaurant info:
- Address: We're at 28565 Hesperian Blvd in Hayward, California 94545.
- Hours: We're open daily 9 AM to 9 PM.
- Delivery: Right now we're pickup only.
- Order changes later: Absolutely, just call back anytime.
- Cards: Yep, all major cards.
- Phone payment: You can pay when you pick up.
- Wait time: Should be ready in about 15 to 20 minutes, maybe sooner depending on how busy we are.
- If asked when it will be ready: "Let me check... should be just a few more minutes".

Ordering behavior:
- Take the order item by item.
- Keep the full running order updated on every turn.
- If the customer asks what they ordered or asks you to repeat it, read back the full current order naturally and clearly.
- Handle modifications and add-ons naturally.
- Answer questions about the menu, hours, address, wait time, payment, and pickup.
- For pho, mention it is served with rice noodles, cooked bean sprouts, and basil by default.
- For pho, handle herb preferences naturally. Options include no basil, no bean sprouts, or no basil and bean sprouts.
- For Kids Pho, mention naturally that it comes as a small bowl with brisket only, no onion, and no cilantro.
- For grill plates, ask which protein they want.
- If the customer orders a Little Bro Plate or Big Bro Plate, explain naturally what comes with it.
- Little Bro Plate includes 3 items: choice of protein plus egg cake plus fried egg.
- Big Bro Plate includes 4 items: choice of protein plus pork skin plus egg cake plus fried egg.
- Protein choices for grill plates are Grilled Pork Chop, Pork Skewer served off skewer, Grilled Chicken, Korean Short Ribs for $1.50 extra, or Grilled Shrimp for $1.50 extra.
- For Vermicelli Bowl, ask which protein they want.
- Vermicelli Bowl protein choices are Grilled Pork, Grilled Chicken, Grilled Shrimp for $1.50 extra, or Crispy Egg Roll.
- Vermicelli Combo Bowl includes Grilled Shrimp x2 plus Crispy Egg Roll x1 plus choice of Grilled Pork half or Grilled Chicken half.
- Handle grill plate protein add-ons and pho herb preferences naturally in modifiers.
- You may naturally offer drinks or appetizers, but do not upsell repeatedly.
- Ask for the customer name if it is still missing and there is an active order.
- Do not finalize the order until there is at least one valid item and a customer name.
- Do not invent menu items, ingredients, policies, or prices.
- Only include valid menu items from the menu below in orderItems.
- Use the running order and customer name already collected whenever appropriate.
- Your reply field must contain exactly what Sofia would say out loud.

Order finalization:
- When the order is complete and the customer gives their name, finalize warmly in this exact style:
"Perfect! So I have [order] for [name]. Total comes to $[total] with tax. We'll have that ready in about 15 to 20 minutes. See you soon!"
- When you give that final confirmation, set orderFinalized to true so the call can end cleanly.

Return format:
- Return JSON only.
- Use this exact shape:
{"reply":"","orderFinalized":false,"customerName":"","orderItems":[]}

Restaurant details:
Name: ${RESTAURANT_NAME}
Address: ${RESTAURANT_ADDRESS}
Hours: ${RESTAURANT_HOURS}
Pickup time: ${PICKUP_TIME}
Tax rate: ${(TAX_RATE * 100).toFixed(2)}%

Menu:
- PHO NOODLE SOUP - served with rice noodles, cooked bean sprouts, and basil:
- Pho Tai $11.99 - rare beef pho
- Pho Chin $11.99 - brisket pho
- Pho Bo Vien $11.99 - beef meatball pho
- Pho Dac Biet $12.99 - rare beef, brisket, and meatballs
- Pho Ga $11.99 - chicken pho
- Kids Pho $11.99 - small bowl, brisket only, no onion, no cilantro
- Herb options for pho: Basil and cooked bean sprouts default, No Basil, No Bean Sprouts, No Basil and Bean Sprouts
- GRILL PLATES - Com Tam - all served with lettuce, cucumber, pickled carrot and daikon, scallion oil, crispy chicharron, and house fish sauce:
- Single Grill Plate $14.99 - choose one protein
- Little Bro Plate $17.99 - 3 items, choice of protein plus egg cake plus fried egg
- Big Bro Plate $19.99 - 4 items, choice of protein plus pork skin plus egg cake plus fried egg
- Grill plate proteins: Grilled Pork Chop (Suon Nuong), Pork Skewer served off skewer (Thit Xien Nuong), Grilled Chicken (Ga Nuong), Korean Short Ribs add $1.50, Grilled Shrimp add $1.50
- Protein add-ons: Pork Skin $2, Egg Cake $3.50, Fried Egg $2, Extra Pork Chop $3, Extra Pork Skewer $3, Extra Chicken $3, Extra Short Ribs $4, Extra Shrimp $4
- VERMICELLI BOWLS - Bun - served with vermicelli noodles, lettuce, cucumber, pickled carrot and daikon, herbs, and house fish sauce:
- Vermicelli Bowl $14.99 - choose protein: Grilled Pork, Grilled Chicken, Grilled Shrimp add $1.50, or Crispy Egg Roll
- Vermicelli Combo Bowl $17.99 - includes Grilled Shrimp x2 plus Crispy Egg Roll x1 plus choice of Grilled Pork half or Grilled Chicken half
- APPETIZERS:
- Crispy Egg Rolls Cha Gio 3 pieces $8.50
- Shrimp Spring Rolls Goi Cuon Tom $9.50 - shrimp, vermicelli, herbs, wrapped in rice paper, served with peanut sauce
- Double Decker Roll Saigon Crunch $9.50 - crispy egg roll wrapped with lettuce and rice paper
- Avocado Roll $9.40 - avocado, lettuce, cucumber, and pickles wrapped in rice paper
- Chicken Roll $9.95 - grilled chicken, lettuce, and pickles wrapped in rice paper
- SALADS:
- Chicken Salad $13.99 - grilled chicken, lettuce, cucumber, pickled carrot and daikon, herbs, fried shallots, house vinaigrette
- Avocado Salad $13.99 - avocado, lettuce, cucumber, pickled carrot and daikon, herbs, fried shallots, house vinaigrette, vegetarian
- DRINKS - Vietnamese Classics:
- Vietnamese Iced Coffee Ca Phe Sua Da $7 - strong Vietnamese coffee with condensed milk over ice
- Thai Iced Tea $7
- Fresh Drinks - Refreshers:
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
    max_tokens: 200,
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

function normalizeOpenAIResult(result, session) {
  const customerName = result && result.customerName
    ? String(result.customerName).trim()
    : session.customerName;

  const orderItems = normalizeOrderItems(result && result.orderItems);
  const reply = result && result.reply
    ? String(result.reply).trim()
    : "Sure thing, what else can I get for you?";
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

  return `Perfect, I have ${summary}. The subtotal is $${formatMoney(order.subtotal)}, tax is $${formatMoney(order.tax)}, and your total is $${formatMoney(order.total)}. ${session.customerName}, your order will be ready for pickup in ${PICKUP_TIME}.`;
}

exports.handler = async function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const callSid = event.CallSid || "unknown-call";
  const speechResult = String(event.SpeechResult || "").trim();
  const session = getSession(callSid);
  const BASE_URL = String(context.BASE_URL || "").trim();
  const spokenTexts = [];

  function speak(text) {
    const spoken = String(text || "").trim().slice(0, 650);
    if (spoken) spokenTexts.push(spoken);
  }

  function sendResponse(finalize) {
    if (finalize) {
      for (const text of spokenTexts) {
        const forceSay = String(context.FORCE_SAY || "").trim() === "1";
        if (!forceSay && BASE_URL) {
          twiml.play(`${BASE_URL}/tts?text=${encodeURIComponent(text)}&voice=marin`);
        } else {
          twiml.say({ voice: FALLBACK_VOICE, language: "en-US" }, text);
        }
      }
      twiml.hangup();
    } else {
      const gather = twiml.gather({
        input: "speech",
        action: "/voice",
        method: "POST",
        timeout: 3,
        speechTimeout: "auto",
        language: "en-US"
      });
      for (const text of spokenTexts) {
        const forceSay = String(context.FORCE_SAY || "").trim() === "1";
        if (!forceSay && BASE_URL) {
          gather.play(`${BASE_URL}/tts?text=${encodeURIComponent(text)}&voice=marin`);
        } else {
          gather.say({ voice: FALLBACK_VOICE, language: "en-US" }, text);
        }
      }
    }
  }

  console.log("CALL RECEIVED:", callSid, "SPEECH:", speechResult);

  try {
    if (!speechResult) {
      const prompt = noSpeechPrompt(session);
      session.greeted = true;
      appendHistory(session, "assistant", prompt);

      speak(prompt);
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
      const fallbackReply = "Sorry about that give me just one second";
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
    const fallbackReply = "Sorry about that give me just one second";
    speak(fallbackReply);
    sendResponse(false);
    return callback(null, twiml);
  }
};
