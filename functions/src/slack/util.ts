import { WebClient } from "@slack/web-api";
import { CoreMessage } from "../ai/agent/type";

export const client = new WebClient(process.env.SLACK_BOT_TOKEN);

export const getThread = async (
  channel_id: string,
  thread_ts: string,
  botUserId: string
): Promise<CoreMessage[]> => {
  const { messages } = await client.conversations.replies({
    channel: channel_id,
    ts: thread_ts,
    limit: 50,
  });

  if (!messages) throw new Error("No messages found in thread");

  const result = messages
    .map((message) => {
      const isBot = !!message.bot_id;

      // TODO: support other message types e.g. files, images, etc.

      if (!message.text) return null;

      // For app mentions, remove the mention prefix
      // For IM messages, keep the full text
      let content = message.text;
      if (!isBot && content.includes(`<@${botUserId}>`)) {
        content = content.replace(`<@${botUserId}> `, "");
      }

      return {
        role: isBot ? "model" : "user",
        content: [{ text: content }],
      } as CoreMessage;
    })
    .filter((msg): msg is CoreMessage => msg !== null);

  return result;
};

export const getBotId = async () => {
  const { user_id: botUserId } = await client.auth.test();

  if (!botUserId) {
    throw new Error("botUserId is undefined");
  }
  return botUserId;
};

export const getLinkToThread = async (
  channel: string,
  ts: string
): Promise<string> => {
  const { permalink } = await client.chat.getPermalink({
    channel,
    message_ts: ts,
  });

  if (!permalink) {
    throw new Error("Failed to get permalink for the thread");
  }

  return permalink;
};
