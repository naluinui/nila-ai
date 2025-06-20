import { App, ExpressReceiver } from "@slack/bolt";
import { getBotId, getLinkToThread, getThread } from "./util";
import { chatAgent } from "../ai/agent";

// Create a slack receiver
export const createReceiver = () => {
  const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET || "",
    endpoints: "/events",
    processBeforeResponse: true,
  });

  const app = new App({
    receiver: receiver,
    token: process.env.SLACK_BOT_TOKEN,
    processBeforeResponse: true,
  });

  // Global error handler
  app.error(async (error) => {
    console.error(error);
  });

  app.event("app_mention", async ({ event, context, client, say }) => {
    const { bot_id: botId, text: rawInput, channel } = event;
    const { retryNum } = context;
    const ts = event.thread_ts || event.ts;

    if (retryNum) return; // skip if retry
    if (botId) return; // skip if bot mentions itself

    // Getting context messages from the thread
    const botUserId = await getBotId(); // get the bot user id
    const messages = await getThread(channel, ts, botId || botUserId);

    // thinking...
    const botMessage = await say({
      thread_ts: ts,
      text: "typing...",
    });
    if (!botMessage.ts) return; // skip if failed to send message

    console.info("[Slack] Input:", rawInput);

    // Calling the chat agent with the messages + context
    const answer = await chatAgent(
      // Input: messages from the thread
      messages,
      // Context: Passing extra context to agent. Read more: https://genkit.dev/docs/context/
      {
        context: {
          // link to thread so that agent can refer to it when needed (for task description)
          link_to_thread: await getLinkToThread(channel, ts),
          // default github owner and repo (so that agent can use it for all operations, but can be overridden by user)
          github_owner: "zubalis",
          github_repo: "wi-desktop",
        },
      }
    );

    console.info("[AI] ✨ Answer:", answer);

    await client.chat.update({
      channel,
      ts: botMessage.ts as string,
      text: answer || "Sorry, I don't know the answer.",
    });
  });

  return receiver;
};
