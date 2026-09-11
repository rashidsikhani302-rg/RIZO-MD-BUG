require('dotenv').config();
require('./setting/config');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const fs2 = require("fs");
const path = require('path');
const chalk = require('chalk');
const { sleep } = require('./utils');
const { BOT_TOKEN } = require('./token');
const { autoLoadPairs } = require('./autoload');
const axios = require("axios");

// ========== BOT INITIALIZATION ==========
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const adminFilePath = path.join(__dirname, 'kingbadboitimewisher', 'admin.json');
let adminIDs = [];
const userStates = new Map();
const users = {}; // Fixed: users array defined

const exists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

// ========== LOAD ADMIN IDs ==========
const loadAdminIDs = async () => {
    const ownerID = '7463354069';
    const defaultAdmins = [ownerID];

    if (!(await exists(adminFilePath))) {
        await fs.writeFile(adminFilePath, JSON.stringify(defaultAdmins, null, 2));
        adminIDs = defaultAdmins;
        console.log('✅ Created admin.json with default owner ID');
    } else {
        try {
            const raw = await fs.readFile(adminFilePath, 'utf8');
            adminIDs = JSON.parse(raw);
        } catch (err) {
            console.error('Error loading admin.json:', err);
            adminIDs = defaultAdmins;
        }
    }
    console.log('📥 Loaded Admin IDs:', adminIDs);
};
loadAdminIDs();

// ========== AUTO-LOAD LOOP ==========
let isShuttingDown = false;
let isAutoLoadRunning = false;

const runAutoLoad = async () => {
    if (isAutoLoadRunning || isShuttingDown) return;
    isAutoLoadRunning = true;

    try {
        console.log('⏱️ INITIATING AUTO-LOAD');
        await autoLoadPairs();
        console.log('✅ AUTO-LOAD COMPLETED');
    } catch (e) {
        console.error('❌ AUTO-LOAD FAILED:', e);
    } finally {
        isAutoLoadRunning = false;
    }
};

const startAutoLoadLoop = () => {
    runAutoLoad();
    setInterval(runAutoLoad, 60 * 60 * 1000);
};
startAutoLoadLoop();

// ========== GRACEFUL SHUTDOWN ==========
const gracefulShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`🛑 Received ${signal}. Shutting down gracefully...`);
    bot.stopPolling();
    console.log('✅ Bot stopped successfully');
    process.exit(0);
};

// ========== CHECK CHANNELS ==========
const checkUserJoinedChannels = async (userId) => {
    const channels = ['@https://t.me/rizoxnbtech'];
    let allJoined = true;

    for (const channel of channels) {
        try {
            const member = await bot.getChatMember(channel, userId);
            if (['left', 'kicked'].includes(member.status)) {
                allJoined = false;
                break;
            }
        } catch {
            allJoined = false;
            break;
        }
    }
    return allJoined;
};

// ========== SEND CHANNELS REQUIRED ==========
const sendChannelsRequiredMessage = async (chatId) => {
    return bot.sendMessage(chatId,
        `🚨 *You must join our official channels before pairing.*`,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📢 CHANNEL', url: 'https://t.me/rizoxnbtech' }],
                    [{ text: 'I HAVE JOINED', callback_data: 'check_join' }]
                ]
            }
        }
    );
};

// ========== SEND GROUP MESSAGE ==========
const sendGroupMessage = async (chatId, replyToMessageId = null) => {
    const botInfo = await bot.getMe();
    const botUsername = botInfo.username;

    const message = `╭━━〔 🛡️ 𝙑𝙄𝙋 𝙎𝙀𝘾𝙐𝙍𝙀 〕━━╮
➤ Use in DM 👇
╰━━〔 🚀 𝙎𝙏𝘼𝙍𝙏 𝙉𝙊𝙒 〕━━╯`;

    const options = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🚀 START NOW', url: `https://t.me/${botUsername}?start=pair` }]
            ]
        }
    };

    if (replyToMessageId) {
        options.reply_to_message_id = replyToMessageId;
    }

    return bot.sendMessage(chatId, message, options);
};

// ========== /start COMMAND (SINGLE DEFINITION) ==========
bot.onText(/\/start/, async (msg) => {
    const userId = msg.chat.id;
    const name = msg.from.first_name || "User";

    users[userId] = {
        id: userId,
        name: msg.from.first_name || "User",
        username: msg.from.username || "no_username"
    };

    const TELEGRAM_CHANNELS = [
        { name: "📢 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦 𝐂𝐡𝐚𝐧𝐧𝐞𝐥", url: "https://t.me/rizoxnbtech" }
    ];

    const WHATSAPP_CHANNELS = [
        { name: "📢 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐂𝐡𝐚𝐧𝐧𝐞𝐥", url: "https://whatsapp.com/channel/0029Vb9684d1SWszhXpuCr3g" }
    ];

    const inlineKeyboard = [];
    for (const channel of TELEGRAM_CHANNELS) {
        inlineKeyboard.push([{ text: channel.name, url: channel.url }]);
    }
    for (const channel of WHATSAPP_CHANNELS) {
        inlineKeyboard.push([{ text: channel.name, url: channel.url }]);
    }
    inlineKeyboard.push([
        { text: "👑 𝐎𝐰𝐧𝐞𝐫", url: "https://t.me/rizohacker" }
    ]);

    const menuText = `
╔═══𖠁RIZO TOXIC𖠁═══╗
  
 ╞═══════𖠁𐂃𖠁═══════╡

║ 👑 𝐎𝐖𝐍𝐄𝐑 : RIZO TOXIC   
║ 🎭 𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑 : @rizohacker
║ ⚡ 𝐒𝐓𝐀𝐓𝐔𝐒 : օղlíղҽ 24/7
║ 💥 𝐒𝐄𝐑𝐕𝐈𝐂𝐄 : 𝐅𝐑𝐄𝐄 𝐒𝐄𝐑𝐕𝐄𝐑

 ╞═══════𖠁𐂃𖠁═══════╡

║ 📲 𝐀𝐕𝐀𝐈𝐋𝐀𝐁𝐋𝐄 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒:

🔹 /pair <number> - Get pairing code
🔹 /delpair - Clear your session
🔹 /listpair - My connections
🔹 /runtime - Bot run time 
🔹 /chatid - Get your chatid

Example: \`/pair 92370xxxx\`

║ 🔒 𝐘𝐎𝐔𝐑 𝐒𝐄𝐒𝐒𝐈𝐎𝐍 𝐈𝐒 𝐏𝐑𝐈𝐕𝐀𝐓𝐄 
      𝐀𝐍𝐃 𝐒𝐄𝐂𝐔𝐑𝐄!

 ╞═══════𖠁𐂃𖠁═══════╡
    `;

    const imageUrl = "https://i.postimg.cc/9XxMCVLF/Screenshot-20250802-114226-3.jpg";

    try {
        const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
        const imgBuffer = Buffer.from(imgRes.data);

        await bot.sendPhoto(userId, imgBuffer, {
            caption: menuText,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: inlineKeyboard
            }
        });
    } catch (e) {
        console.error("Telegram start error:", e.message);
        await bot.sendMessage(userId, menuText, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: inlineKeyboard
            }
        });
    }
});

// ========== /pair COMMAND ==========
bot.onText(/\/pair(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';
    const text = match[1]?.trim();

    if (isGroup) {
        return sendGroupMessage(chatId, msg.message_id);
    }

    const allJoined = await checkUserJoinedChannels(userId);

    if (!allJoined) {
        return sendChannelsRequiredMessage(chatId);
    }

    if (!text) {
        userStates.set(userId, { step: 'awaiting_number' });
        return bot.sendMessage(chatId,
            `🔐 *Please send your WhatsApp number*\n\nExample: /pair 923xxxxxxxxx\n\nOr just type: 923xxxxxxxxx`,
            { parse_mode: 'Markdown' }
        );
    }

    if (/[a-z]/i.test(text)) {
        return bot.sendMessage(chatId, '❌ *Letters are not allowed.*\n\nPlease send only numbers.', { parse_mode: 'Markdown' });
    }

    if (!/^\d{7,15}$/.test(text)) {
        return bot.sendMessage(chatId, '❌ *Invalid format.*\n\nPlease send a valid WhatsApp number.\nExample: 923xxxxxxxxx', { parse_mode: 'Markdown' });
    }

    if (text.startsWith('0')) {
        return bot.sendMessage(chatId, '❌ *Numbers starting with 0 are not allowed.*\n\nPlease include country code.', { parse_mode: 'Markdown' });
    }

    const countryCode = text.slice(0, 3);
    if (["252", "201"].includes(countryCode)) {
        return bot.sendMessage(chatId, '❌ *Numbers with this country code are not supported.*', { parse_mode: 'Markdown' });
    }

    const pairingFolder = path.join(__dirname, 'kingbadboitimewisher', 'pairing');
    if (!(await exists(pairingFolder))) {
        await fs.mkdir(pairingFolder, { recursive: true });
    }

    const files = await fs.readdir(pairingFolder);
    const pairedCount = files.filter(f => f.endsWith('@s.whatsapp.net')).length;

    if (pairedCount >= 1000) {
        return bot.sendMessage(chatId, '❌ *Pairing limit reached.*\n\nPlease try again later.', { parse_mode: 'Markdown' });
    }

    userStates.delete(userId);

    try {
        const startpairing = require('./pair.js');
        const Xreturn = text + "@s.whatsapp.net";

        await bot.sendMessage(chatId, '⏳ *Generating pairing code...*\n\nPlease wait a moment.', { parse_mode: 'Markdown' });

        await startpairing(Xreturn);
        await sleep(4000);

        const pairingFile = path.join(pairingFolder, 'pairing.json');
        const cu = await fs.readFile(pairingFile, 'utf-8');
        const cuObj = JSON.parse(cu);
        delete require.cache[require.resolve('./pair.js')];

        return bot.sendMessage(chatId,
            `🔗 *Pairing Code for WhatsApp*\n\n` +
            `📝 *Code:* 👉 \`${cuObj.code}\` 👈\n\n` +
            `➡️ *Instructions:*\n` +
            `1. Open WhatsApp\n` +
            `2. Go to Settings → Linked Devices\n` +
            `3. Tap "Link a Device"\n` +
            `4. Enter this code\n\n` +
            `⚠️ *Code expires in 2 minutes*`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: `📋 Copy: ${cuObj.code}`, callback_data: `copy_code_${cuObj.code}` }]
                    ]
                }
            }
        );

    } catch (error) {
        console.error('PAIR COMMAND ERROR:', error);
        bot.sendMessage(chatId, '❌ *Pairing service is temporarily unavailable.*\n\nPlease try again later.', { parse_mode: 'Markdown' });
    }
});

// ========== /unpair COMMAND ==========
bot.onText(/\/unpair(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const input = match[1]?.trim();
    const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

    if (isGroup) {
        return bot.sendMessage(chatId, '❌ Please use /unpair in my private chat.', { parse_mode: 'Markdown' });
    }

    try {
        if (!input) {
            return bot.sendMessage(chatId, 'Example: /unpair 923xxxxxxxxx', { parse_mode: 'Markdown' });
        }
        if (/[a-z]/i.test(input)) {
            return bot.sendMessage(chatId, 'Letters not allowed. Use: /unpair 923xxxxxxxxx', { parse_mode: 'Markdown' });
        }
        if (!/^\d{7,15}$/.test(input)) {
            return bot.sendMessage(chatId, 'Invalid format. Use: /unpair 923xxxxxxxxx', { parse_mode: 'Markdown' });
        }
        if (input.startsWith('0')) {
            return bot.sendMessage(chatId, 'Numbers starting with 0 not allowed.', { parse_mode: 'Markdown' });
        }

        const jidSuffix = `${input}`;
        const pairingPath = path.join(__dirname, 'kingbadboitimewisher', 'pairing');

        if (!(await exists(pairingPath))) {
            return bot.sendMessage(chatId, 'No paired devices found.');
        }

        const entries = await fs.readdir(pairingPath, { withFileTypes: true });
        const matched = entries.find(entry => entry.isDirectory() && entry.name.endsWith(jidSuffix));

        if (!matched) {
            return bot.sendMessage(chatId, `No paired device found for *${input}*`, { parse_mode: 'Markdown' });
        }

        const targetPath = path.join(pairingPath, matched.name);
        await fs.rm(targetPath, { recursive: true, force: true });

        return bot.sendMessage(chatId, `✅ Paired user *${input}* has been deleted successfully`, { parse_mode: 'Markdown' });

    } catch (err) {
        console.error('UNPAIR ERROR:', err);
        bot.sendMessage(chatId, 'Failed to delete paired user. Please try again.');
    }
});

// ========== CALLBACK QUERY ==========
bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;
    const chatId = msg.chat.id;

    if (data && data.startsWith('copy_code_')) {
        const code = data.replace('copy_code_', '');
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: `✅ Code copied: ${code}`,
            show_alert: true
        });
        return;
    }

    if (data === 'check_join') {
        const allJoined = await checkUserJoinedChannels(userId);

        if (allJoined) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '✅ Thanks for joining! Now use /pair command.',
                show_alert: true
            });
            await bot.sendMessage(chatId, '✅ *Thanks for joining all channels!*\n\nNow send /pair to start pairing.', { parse_mode: 'Markdown' });
        } else {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: '❌ Please join all channels first!',
                show_alert: true
            });
        }
        return;
    }
});

// ========== TEXT MESSAGE HANDLER ==========
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (msg.chat.type !== 'private') return;
    if (!text) return;
    if (text.startsWith('/')) return;

    const userState = userStates.get(userId);
    if (!userState || userState.step !== 'awaiting_number') return;

    const phoneRegex = /^\d{7,15}$/;
    if (!phoneRegex.test(text)) return;

    userStates.delete(userId);

    const allJoined = await checkUserJoinedChannels(userId);

    if (!allJoined) {
        return bot.sendMessage(chatId,
            `🚨 *You must join our official channels before pairing.*`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📢 CHANNEL', url: 'https://t.me/RIZO TOXIC_OFFICIAL' }],
                        [{ text: 'I HAVE JOINED', callback_data: 'check_join' }]
                    ]
                }
            }
        );
    }

    if (/[a-z]/i.test(text)) {
        return bot.sendMessage(chatId, '❌ Letters are not allowed. Send only numbers.');
    }

    if (text.startsWith('0')) {
        return bot.sendMessage(chatId, '❌ Numbers starting with 0 are not allowed.');
    }

    const countryCode = text.slice(0, 3);
    if (["252", "201"].includes(countryCode)) {
        return bot.sendMessage(chatId, '❌ Numbers with this country code are not supported.');
    }

    const pairingFolder = path.join(__dirname, 'kingbadboitimewisher', 'pairing');
    if (!(await exists(pairingFolder))) {
        await fs.mkdir(pairingFolder, { recursive: true });
    }

    const files = await fs.readdir(pairingFolder);
    const pairedCount = files.filter(f => f.endsWith('@s.whatsapp.net')).length;

    if (pairedCount >= 1000) {
        return bot.sendMessage(chatId, '❌ Pairing limit reached. Try again later.');
    }

    try {
        const startpairing = require('./pair.js');
        const Xreturn = text + "@s.whatsapp.net";

        await bot.sendMessage(chatId, '⏳ Generating pairing code...');

        await startpairing(Xreturn);
        await sleep(4000);

        const pairingFile = path.join(pairingFolder, 'pairing.json');
        const cu = await fs.readFile(pairingFile, 'utf-8');
        const cuObj = JSON.parse(cu);
        delete require.cache[require.resolve('./pair.js')];

        return bot.sendMessage(chatId,
            `🔗 *Pairing Code*\n\n📝 Code: \`${cuObj.code}\`\n\n1. Open WhatsApp\n2. Settings → Linked Devices\n3. Link a Device\n4. Enter this code`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: `📋 Copy: ${cuObj.code}`, callback_data: `copy_code_${cuObj.code}` }]
                    ]
                }
            }
        );

    } catch (error) {
        console.error('PAIRING ERROR:', error);
        bot.sendMessage(chatId, '❌ Pairing failed. Try again later.');
    }
});

// ========== POLLING ERROR ==========
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

// ========== PROCESS HANDLERS ==========
process.on("uncaughtException", (err) => {
    console.error('Uncaught Exception:', err);
});
process.on("unhandledRejection", (err) => {
    console.error('Unhandled Rejection:', err);
});
process.removeAllListeners("warning");
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('message', (msg) => {
    if (msg === 'shutdown') gracefulShutdown('PM2_SHUTDOWN');
});

console.log('🤖 RIZO TOXIC Bot started successfully!');
console.log('📱 Bot is running...');