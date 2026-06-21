# OttoMod Spam Trap Bot

스팸 트랩 채널에 메시지가 올라오면 아래 순서로 처리하는 Discord.js v14 봇입니다.

1. 대상 사용자에게 DM 전송
2. 사용자 자동 차단
3. 관리자/보안 로그 채널에 임베드 전송
4. 로그 임베드에 DM 전송 성공 여부 O/X 표시

## 필요한 권한

봇 역할이 차단 대상 역할보다 위에 있어야 합니다.

봇 권한:

- View Channels
- Send Messages
- Embed Links
- Ban Members
- Read Message History

Developer Portal의 Bot 설정에서 아래 Intent를 켜야 합니다.

- Message Content Intent

## 설치 방법

```bash
npm install
```

## 설정 방법

`.env.example` 파일을 복사해서 `.env` 파일을 만들고 편집하세요.

`.env` 예시:

```env
BOT_TOKEN=봇_토큰
SPAM_TRAP_CHANNEL_ID=0000000000000000000
ADMIN_LOG_CHANNEL_ID=0000000000000000000
```

`setting.example.json` 파일을 복사해서 `setting.json`파일을 만들고 편집하세요

### 항소용 폼 이용 가이드
`setting.json` 예시:
```
{
  "appealFormUrl": "form.google.com/000000",
  "description": "차단 항소용 폼"
}
```
만약 항소 폼을 이용하지 않을 계획이시라면, `setting.json`을 만드실 필요 없이 `handler/spamTrap.JS`의 16번째줄 부근에 있는 주석을 따라 2~3여줄의 코드를 삭제하고 이용하시면 됩니다.

## 실행 방법

리눅스/우분투 서버에서 이용하기 기준입니다.

```bash
npm install -g pm2
pm2 start main.js --name ottomod-spam-trap
pm2 save
```

## 수정 위치

- 스팸 트랩 처리 로직: `handler/spamTrap.js`
- 봇 시작 파일: `main.js`
- 공통 함수: `utils.js`
- 환경변수 예시: `.env.example`

## 주의

`.env` 파일을 개인 용도로 수정하셨다면, 외부에 유출하지 마세요. 채널 정보 및 봇 토큰 정보가 담긴 곳입니다.