export async function sendTelegramPhoto(params: {
  name: string;
  type: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const { name, type, timestamp, latitude, longitude, photoUrl } = params;
  const caption =
    `\u{1F551} <b>${type}</b>\n\n` +
    `<b>Name:</b> ${name}\n` +
    `<b>Time:</b> ${timestamp}\n` +
    `<b>Location:</b> <a href="https://maps.google.com/?q=${latitude},${longitude}">View on Map</a>`;

  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: "HTML",
    }),
  });
}
