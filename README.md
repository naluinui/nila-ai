# NILA: Naturally In Line Agile - Slack Bot for Agile Teams

NILA is a Slack bot that helps development teams manage Agile workflows directly from their conversations. This project demonstrates how to build a powerful AI Agent with Firebase Genkit, leveraging tool callings to expand its capabilities beyond simple conversation.

## Architecture

NILA follows a straightforward flow to process user requests:

1. **💬 NILA on Slack**: Users interact with NILA by mentioning the bot in a Slack channel
2. **⚡️ Webhook (Cloud Functions)**: Firebase Cloud Functions process the incoming Slack events
3. **🧠 AI Agent (Firebase Genkit)**: The request is processed by a LLM-powered agent. With Genkit, you can choose LLM model of your choice. We're using Gemini 2.5 Flash in this demo
4. **⚒️ Tools**: The agent uses custom-built tools which we can define ourselves and GitHub MCP Server to take actions. In this demo, we built tool for sumarizing the messages in the thread and draft the issue.

Building it this way means that we can reuse the AI Flow with other webhooks of your choice. You can extend NILA to work with LINE, WhatsApp, or any other platform by simply creating another cloud function in `src/index.ts` while the core AI agent logic remains the same.

## Prerequisites

- Node.js
- pnpm
- Genkit
- Firebase CLI
- ngrok

## Setup

1. Install dependencies
   ```bash
   cd functions
   pnpm install
   ```
2. Setup Firebase Project

   1. Create a new Firebase project
   2. Enable Blazed plan (Pay-as-you-go) to be able to use Firebase Functions
   3. Update the `.firebaserc` file in your project's root directory to include your Firebase project name

    ```json
    {
    "projects": {
        "default": "[your_project_name]"
    }
    }
    
3. Setup Slack App
   
   1. `Go to https://api.slack.com/apps and click "Create New App"
   2. Choose "From an app manifest" option and select your workspace
   3. Update the JSON below with your app's name

   ```json
   {
       "display_information": {
           "name": "[YOUR_APP_NAME]",
           "description": "[YOUR_APP_DESCRIPTION]",
       },
       "features": {
           "bot_user": {
               "display_name": "[YOUR_APP_NAME]",
               "always_online": true
           }
       },
       "oauth_config": {
           "scopes": {
               "bot": [
                   "app_mentions:read",
                   "chat:write",
                   "files:read",
                   "groups:history",
                   "incoming-webhook",
                   "mpim:history"
               ]
           }
       },
       "settings": {
           "event_subscriptions": {
               "request_url": "https://[YOUR_DOMAIN]/events",
               "bot_events": [
                   "app_mention",
                   "message.mpim"
               ]
           },
           "org_deploy_enabled": true,
           "socket_mode_enabled": false,
           "token_rotation_enabled": false
       }
   }
   ```

   4. Go to "Basic Information" and find "Signing Secret" under "App Credentials". This will be an environment variable `SLACK_SIGNING_SECRET`
   5. Go to "OAuth & Permissions" and find "Bot User OAuth Token". This will be an environment variable `SLACK_BOT_TOKEN`
   6. Add your bot to a Slack channel for us to test in later step

    ```bash
    /invite @[YOUR_APP_NAME]
    ```

4. Setup GitHub Token
    To allow your AI Agent to manage GitHub, you will need `GITHUB_PERSONAL_ACCESS_TOKEN` the MCP Server.

    1. Go to [Create a GitHub Personal Access Token](https://github.com/settings/personal-access-tokens/new). Set name and description of the token
    2. Select Resource Owner: this can be your own GitHub or your organization. If you're not an organizatiom admin, you may required your admin to appove your request to create the token
    3. Choose Repository access: depends how much power you want to give to your AI. I'd only choose the repo I'm interested in only
    4. Choose Permission: The MCP server can use many of the GitHub APIs, so enable the permissions that you feel comfortable granting your AI tools to do is a good practice. For this AI agent, we only need READ & WRITE access to Issues, which will automatically enable the mandatory permission for Metadata too
    5. Click "Generate token", and you should get a token begining with `github_pat_[xyz]`. Keep that safe as you won't be able to have access to that again.

5. Set up your environment variables
   ```bash
   cp .secret.local.example .secret.local
   ```

6. Add your API keys to `.secret.local`:
   ```
   GOOGLEAI_API_KEY=your_api_key
   SLACK_BOT_TOKEN=your_bot_token
   SLACK_SIGNING_SECRET=your_signing_secret
   GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token
   ```

## Local development
Using Firebase Emulator Suite & Firebase Genkit UI to test things locally.

1. Run the local development server
    ```bash
    pnpm run dev
    ```

2. Set up ngrok to expose your local server (make your local emulators accessible online)
    ```bash
    ngrok http 5001
    ```

3. Update your Slack app's Event Subscriptions URL with the ngrok URL. It's under "Event Subscriptions" 
    ```
    https://[your-ngrok-id].ngrok.io/[YOUR_PROJECT_NAME]/us-central1/slack
    ```
    Wait for the Request URL Verified confirmation, then click the "Save changes" button

4. Add Slack Chatbot to the channel, and send your first message by mentioning its name.
    ```
    @NILA Hello, can you help me?
    ```
    You should have got the reply message, first saying "typing...", then later on with the acual reply from the AI Agent. 
   
### Debugging
- Use Firebase Emulators to debug your webhook function http://localhost:4001/logs
- Use Firebase Genkit UI to debug your AI Flow http://localhost:4000/ 

## Deployment

To authenticate with Firebase and access your projects, use the Firebase CLI login command:

```bash
$ firebase login
```

To keep your secret keys safe when using Firebase Functions, store then as secret values in Google Cloud Secret Manger:

```bash
$ firebase functions:secrets:set GOOGLEAI_API_KEY
? Enter a value for GOOGLEAI_API_KEY [input is hidden]
$ firebase functions:secrets:set SLACK_BOT_TOKEN
? Enter a value for SLACK_BOT_TOKEN [input is hidden]
$ firebase functions:secrets:set SLACK_SIGNING_SECRET
? Enter a value for SLACK_SIGNING_SECRET [input is hidden]
$ firebase functions:secrets:set GITHUB_PERSONAL_ACCESS_TOKEN
? Enter a value for GITHUB_PERSONAL_ACCESS_TOKEN [input is hidden]
```

To confirm your secret keys are correctly stored as secrets, use the following command:

```bash
$ firebase functions:secrets:access OPENAI_API_KEY
your_api_key
$ firebase functions:secrets:access SLACK_BOT_TOKEN
your_bot_token
$ firebase functions:secrets:access SLACK_SIGNING_SECRET
your_signing_secret
$ firebase functions:secrets:set GITHUB_PERSONAL_ACCESS_TOKEN
your_github_personal_access_token
```

After securing your secret keys, you're ready to deploy your application to Firebase Functions:

```bash
$ pnpm run deploy
```

Once deployed, update your Slack app's Event Subscriptions URL again with your production url.
`https://slack-[your_function_id]-uc.a.run.app/events`. Replace `[your_function_id]` with your Firebase project value, found in the Firebase Console under the Functions Dashboard.

### Suggested Prompts for NILA

```
@nila Hello! Can you help me track our project tasks?
@nila Create a new bug report for the login page crash on mobile devices
@nila Draft a task for implementing email notifications when tasks are assigned 
@nila List all open bugs in our repository
@nila What's the status of the dashboard page?
@nila Create a task to refactor the payment processing module with proper test coverage
```

Try these prompts or variations to see how NILA can assist your team with managing workflows directly from Slack conversations.

## Credits

This project was built upon the foundation provided by:
- Yuki Nagae's [Genkit Firebase Functions Slack Bolt Sample](https://github.com/yukinagae/genkit-firebase-functions-slack-bolt-sample)
- Handy's Slack util functions from [Vercel's AI SDK Slackbot](https://github.com/vercel-labs/ai-sdk-slackbot)

## License

Apache License
