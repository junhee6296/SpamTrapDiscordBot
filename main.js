require('dotenv').config();

const { Client, GatewayIntentBits, Events } = require('discord.js');
const { registerSpamTrapHandler } = require('./handler/spamTrap');

const requiredEnv = [
  'BOT_TOKEN',
  'SPAM_TRAP_CHANNEL_ID',
  'ADMIN_LOG_CHANNEL_ID',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key] || process.env[key].trim().length === 0);

if (missingEnv.length > 0) {
  console.error(`[ENV ERROR] .env 파일에 다음 값이 없습니다: ${missingEnv.join(', ')}`);
  console.error('설정 방법: .env.example 파일을 .env로 복사한 뒤 값을 채워주세요.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`[READY] ${readyClient.user.tag} 로그인 완료`);
  console.log(`[SPAM TRAP] 감시 채널: ${process.env.SPAM_TRAP_CHANNEL_ID}`);
  console.log(`[SPAM TRAP] 로그 채널: ${process.env.ADMIN_LOG_CHANNEL_ID}`);
});

registerSpamTrapHandler(client, {
  spamTrapChannelId: process.env.SPAM_TRAP_CHANNEL_ID,
  adminLogChannelId: process.env.ADMIN_LOG_CHANNEL_ID,
});

process.on('unhandledRejection', (error) => {
  console.error('[UNHANDLED_REJECTION]', error);
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT_EXCEPTION]', error);
});

client.login(process.env.BOT_TOKEN);
