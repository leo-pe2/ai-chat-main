export async function sendDiscordError(errorText: string): Promise<void> {
  const webhookUrl = process.env.REACT_APP_DISCORD_WEBHOOK;
  console.log('Discord webhook URL:', webhookUrl); 
  if (!webhookUrl) {
    console.error("Discord webhook URL is not defined");
    return;
  }
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `Error: ${errorText}` }),
    });
    if (!response.ok) {
      console.error('Failed to send error to Discord:', response.status, response.statusText);
    } else {
      console.log('Webhook sent successfully');
    }
  } catch (err) {
    console.error("Failed to send error to Discord:", err);
  }
}
