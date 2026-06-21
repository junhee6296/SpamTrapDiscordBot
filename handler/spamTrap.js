const { Events, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { cutText, formatBooleanOX } = require('../utils');

const APPEAL_FORM_URL = 'https://forms.gle/GDjJUNUq8XtudMAr7';
const processingUsers = new Set();

function buildDmText(guildName) {
  return [
    `안녕하세요. ${guildName} 서버 보안 시스템에 의해 자동 차단되었습니다.`,
    '',
    '회원님의 Discord 계정이 해킹되었거나, 토큰 탈취/악성 앱 연동 등으로 인해 스팸 메시지를 전송한 것으로 감지되었습니다.',
    '',
    '차단 사유:',
    '권한이 있는 채널들에 무작위로 메시지를 전송하는 해킹 계정의 패턴이 감지되었고, 서버의 스팸 트랩 채널에 메시지가 전송되었습니다.',
    '',
    // 항소 폼을 사용하지 않으시려면 아래 문단과 APPEAL_FORM_URL 변수를 제거하세요.
    '서버 복귀를 원하신다면 아래 항소 폼을 작성해 주세요.',
    APPEAL_FORM_URL,
    '',
    '해킹 의심 시 대처 방법:',
    '1. Discord 비밀번호를 즉시 변경하세요.',
    '2. 2단계 인증을 활성화하세요.',
    '3. Discord 사용자 설정 > 승인한 앱에서 수상한 앱 권한을 제거하세요.',
    '4. 최근 실행한 프로그램, 브라우저 확장 프로그램, 다운로드 파일을 점검하세요.',
    '5. 같은 비밀번호를 사용하는 다른 사이트의 비밀번호도 함께 변경하세요.',
    '6. 계정 보안 조치가 끝난 뒤 항소 폼을 제출해 주세요.',
  ].join('\n');
}

function getAttachmentText(message) {
  if (!message.attachments || message.attachments.size === 0) return '없음';
  return message.attachments.map((attachment) => attachment.url).join('\n');
}

function getContentText(message) {
  const content = message.content?.trim();
  if (content) return content;

  if (message.attachments?.size > 0) {
    return '(텍스트 없음: 첨부파일 메시지)';
  }

  return '(메시지 내용 없음: Message Content Intent가 꺼져 있거나 임베드/스티커 메시지일 수 있음)';
}

async function sendSecurityLog(client, options) {
  const {
    adminLogChannelId,
    user,
    message,
    dmSuccess,
    banSuccess,
    banErrorText,
    banReason,
  } = options;

  const logChannel = await client.channels.fetch(adminLogChannelId).catch(() => null);

  if (!logChannel || !logChannel.isTextBased()) {
    console.error(`[SpamTrap] 로그 채널을 찾을 수 없거나 텍스트 채널이 아닙니다: ${adminLogChannelId}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(banSuccess ? 0xff0000 : 0xff9900)
    .setTitle('🚨 스팸 트랩 감지')
    .setDescription(
      banSuccess
        ? '스팸 트랩 채널에 메시지가 감지되어 사용자를 자동 차단했습니다.'
        : '스팸 트랩 채널에 메시지가 감지되었지만, 자동 차단에 실패했습니다.'
    )
    .addFields(
      {
        name: '대상 사용자',
        value: `${user.tag} / <@${user.id}>\nID: \`${user.id}\``,
        inline: false,
      },
      {
        name: '트랩 채널',
        value: `<#${message.channelId}>`,
        inline: true,
      },
      {
        name: 'DM 전송',
        value: formatBooleanOX(dmSuccess),
        inline: true,
      },
      {
        name: '밴 처리',
        value: formatBooleanOX(banSuccess),
        inline: true,
      },
      {
        name: '차단한 메시지',
        value: cutText(getContentText(message), 1000),
        inline: false,
      },
      {
        name: '첨부파일',
        value: cutText(getAttachmentText(message), 1000),
        inline: false,
      },
      {
        name: '메시지 링크',
        value: message.url || '없음',
        inline: false,
      },
      {
        name: '차단 사유',
        value: banReason,
        inline: false,
      }
    )
    .setFooter({ text: 'OttoMod Spam Trap' })
    .setTimestamp();

  if (!banSuccess) {
    embed.addFields({
      name: '밴 실패 오류',
      value: cutText(banErrorText, 900),
      inline: false,
    });
  }

  await logChannel.send({
    embeds: [embed],
    allowedMentions: { parse: [] },
  });
}

function registerSpamTrapHandler(client, config) {
  const { spamTrapChannelId, adminLogChannelId } = config;

  client.on(Events.MessageCreate, async (message) => {
    if (!message.inGuild()) return;
    if (message.author.bot) return;
    if (message.channelId !== spamTrapChannelId) return;

    const userId = message.author.id;

    if (processingUsers.has(userId)) return;
    processingUsers.add(userId);

    const user = message.author;
    const guild = message.guild;
    const banReason = 'Spam trap triggered: hidden spam-trap channel message. Account may be compromised.';

    let dmSuccess = false;
    let banSuccess = false;
    let banErrorText = '없음';

    try {
      try {
        await user.send({
          content: buildDmText(guild.name),
          allowedMentions: { parse: [] },
        });
        dmSuccess = true;
      } catch (_) {
        dmSuccess = false;
      }

      try {
        const me = guild.members.me;
        if (me && !me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
          throw new Error('봇에게 멤버 차단하기(Ban Members) 권한이 없습니다.');
        }

        await guild.members.ban(userId, {
          reason: banReason,
          // 최근 스팸 메시지도 같이 지우려면 아래 값을 60, 3600 등으로 바꾸세요.
          deleteMessageSeconds: 3600, // 최근 1시간(3600초) 동안의 메시지 삭제
        });
        banSuccess = true;
      } catch (error) {
        banSuccess = false;
        banErrorText = error?.message || String(error);
      }

      await sendSecurityLog(client, {
        adminLogChannelId,
        user,
        message,
        dmSuccess,
        banSuccess,
        banErrorText,
        banReason,
      });
    } catch (error) {
      console.error('[SpamTrap] 처리 중 오류:', error);
    } finally {
      processingUsers.delete(userId);
    }
  });
}

module.exports = {
  registerSpamTrapHandler,
};
