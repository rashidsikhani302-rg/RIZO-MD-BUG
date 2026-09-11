const { cmd } = require('../command');
const config = require("../config");

cmd({
  pattern: "antilink",
  desc: "Enable/disable anti-link protection",
  category: "group",
  fromMe: true, // or isBotAdmins: true
  use: '<on/off>'
}, async (m, match) => {
  if (!m.isGroup) return m.reply("❌ This command only works in groups!");
  
  const action = match[1]?.toLowerCase();
  
  if (action === 'on') {
    config.ANTI_LINK = 'true';
    await m.reply("✅ *Anti-link enabled!* Links will now be auto-deleted 🔥 RIZO TOXIC-𝐌𝐃 𝐕𝟏.𝟎");
  } 
  else if (action === 'off') {
    config.ANTI_LINK = 'false';
    await m.reply("❌ *Anti-link disabled!* Links are now allowed 🔥 RIZO TOXIC-𝐌𝐃 𝐕𝟏.𝟎");
  } 
  else {
    await m.reply(`🔍 Anti-link status: *${config.ANTI_LINK === 'true' ? 'ENABLED' : 'DISABLED'}*\n\nUsage: *.antilink on* or *.antilink off*`);
  }
});