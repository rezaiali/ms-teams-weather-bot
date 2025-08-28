// Import required packages
import * as restify from "restify";

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import { BotFrameworkAdapter, TurnContext } from "botbuilder";
import cron from "node-cron";
import { subscriptionStore } from "./subscriptionStore";

// This bot's main dialog.
import { TeamsBot } from "./teamsBot";

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
  appId: process.env.BOT_ID,
  appPassword: process.env.BOT_PASSWORD,
});

// Catch-all for errors.
const onTurnErrorHandler = async (context: TurnContext, error: Error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights.
  console.error(`\n [onTurnError] unhandled error: ${error}`);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
    "OnTurnError Trace",
    `${error}`,
    "https://www.botframework.com/schemas/error",
    "TurnError"
  );

  // Send a message to the user
  await context.sendActivity(
    `The bot encountered unhandled error:\n ${error.message}`
  );
  await context.sendActivity(
    "To continue to run this bot, please fix the bot source code."
  );
};

// Set the onTurnError for the singleton BotFrameworkAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Create the bot that will handle incoming messages.
const bot = new TeamsBot();

cron.schedule("* * * * *", async () => {
  const now = new Date();
  const current = now.toTimeString().slice(0, 5);
  const subs = subscriptionStore.getSubscriptions();
  for (const sub of subs) {
    if (sub.time === current) {
      const [city, country] = sub.location.split(",");
      await adapter.continueConversation(sub.conversation, async (context) => {
        const card = await bot.renderCoords(
          "daily",
          null,
          null,
          city,
          country
        );
        await context.sendActivity({ attachments: [card] });
      });
    }
  }
});

// Create HTTP server.
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\nBot Started, ${server.name} listening to ${server.url}`);
});

// Listen for incoming requests.
server.post("/api/messages", async (req, res) => {
  await adapter.processActivity(req, res, async (context) => {
    await bot.run(context);
  });
});
