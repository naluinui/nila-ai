import { onRequest } from "firebase-functions/v2/https";

import { verifySignature } from "./slack/verification";
import { createReceiver } from "./slack";

export const slack = onRequest(
  {
    secrets: [
      "GOOGLEAI_API_KEY",
      "SLACK_BOT_TOKEN",
      "SLACK_SIGNING_SECRET",
      "GITHUB_PERSONAL_ACCESS_TOKEN",
    ],
  },
  async (req, res) => {
    if (!verifySignature(req, process.env.SLACK_SIGNING_SECRET || "")) {
      res.status(400).send("Request verification failed");
      return;
    }

    return createReceiver().app(req, res);
  }
);
