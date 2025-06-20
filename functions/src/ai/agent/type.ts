import { z } from "../index";

const messageSchema = z.object({
  role: z.enum(["user", "tool", "model", "system"]),
  content: z.array(
    z.object({
      text: z.string(),
    })
  ),
});

export const messagesSchema = z.array(messageSchema);

export type CoreMessage = z.infer<typeof messageSchema>;
