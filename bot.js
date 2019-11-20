const { ActivityHandler } = require('botbuilder');
const { TurnContext } = require('botbuilder');
const CAST_PREFIX = 'cast: ';

let subscribers = new Map();

class MyBot extends ActivityHandler {

    constructor() {
        super();
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            //let channelId = context.activity.channelId;
            let inquire = context.activity.text.toLowerCase();
            if (inquire === 'subscribe') {
                // do subscribe
                console.log("Adding... " + context.activity.from.id);
                //console.log(context.activity.from.name);
                if (subscribers.has(context.activity.from.id)) {
                    await context.sendActivity( `User '${context.activity.from.name}' already subscribed` );
                }
                else {
                    const reference = TurnContext.getConversationReference(context.activity);
                    subscribers.set(context.activity.from.id, reference);
                    await context.sendActivity( `To stop receiving notifications send 'stop'` );
                }
            }
            else if (inquire === 'unsubscribe' || inquire === 'cancel' || inquire === 'stop') {
                // do unsubscribe
                if (subscribers.has(context.activity.from.id)) {
                    subscribers.delete(context.activity.from.id);
                    await context.sendActivity( `User '${context.activity.from.name}' removed from subscribers.` );
                }
                else {
                    await context.sendActivity( `You are not subscribed.` );
                }
            }
            else if (inquire.startsWith(CAST_PREFIX)) {
                // broadcast this message to all subscribers without leading CAST_PREFIX
                const broadcastMessage = inquire.substring(CAST_PREFIX.length);
                console.log("Broadcast message: " + broadcastMessage);
                console.log("number of subscribers: " + subscribers.size);

                for (const key of subscribers.keys()) {
                    console.log("to: " + key);
                    const reference = subscribers.get(key);
                    await context.adapter.continueConversation(reference, async (proactiveTurnContext) => {
                        await proactiveTurnContext.sendActivity(broadcastMessage);
                    });
                }
            }
            // await context.sendActivity(`You said '${ context.activity.text }'`);
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(`Hello and welcome! Send 'subscribe' to start receiving notifications.`);
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.MyBot = MyBot;
