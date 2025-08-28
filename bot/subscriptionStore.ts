import * as fs from "fs";
import * as path from "path";
import { ConversationReference } from "botbuilder";

export interface Subscription {
  userId: string;
  location: string;
  time: string;
  conversation: Partial<ConversationReference>;
}

const filePath = path.resolve(__dirname, "../subscriptions.json");

function readSubscriptions(): Subscription[] {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeSubscriptions(subs: Subscription[]) {
  fs.writeFileSync(filePath, JSON.stringify(subs, null, 2));
}

class SubscriptionStore {
  private subs: Subscription[];

  constructor() {
    this.subs = readSubscriptions();
  }

  addSubscription(sub: Subscription) {
    this.subs.push(sub);
    writeSubscriptions(this.subs);
  }

  getSubscriptions(): Subscription[] {
    return this.subs;
  }
}

export const subscriptionStore = new SubscriptionStore();
