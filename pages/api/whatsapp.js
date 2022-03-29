import { Boom } from "@hapi/boom";
import { Server } from "socket.io";
import Bot from "../../bot.js";
import P from "pino";
import storage from "node-persist";
import makeWASocket, {
  AnyMessageContent,
  delay,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  useSingleFileAuthState,
} from "@adiwajshing/baileys";

const __data = {};
storage.init({
  dir: "./whatsapp_bot_db",
  logging: P().child({ level: "debug", stream: "storage" }),
});

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({
  //logger: P().child({ level: "debug", stream: "store" }),
});
store.readFromFile("./baileys_store_multi.json");
// save every 10s
setInterval(() => {
  store.writeToFile("./baileys_store_multi.json");
}, 10_000);

const { state, saveState } = useSingleFileAuthState("./auth_info_multi.json");

//fetch send create order
const createOrder = (fields) => {
    fetch(
    "http://127.0.0.1:3000/api/crud?" +
        new URLSearchParams({
        object: "order",
        }),
    {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        payload: {
            customer: {
            id: "",
            name: fields["test_fullname"]?.data,
            phone: chatId.replace(
                "@s.whatsapp.net",
                ""
            ),
            },

            products: [
            {
                id: "",
                name:
                fields["custom_service"]?.data ??
                "Test Covid",
                quantity: 1,
                price: fields["custom_service"]?.data
                ? 0
                : 40,
            },
            ],

            total: fields["custom_service"]?.data
            ? 0
            : 40,
            status: 1,
            note: `Fecha: ${fields["test_date"]?.data}
Hotel: ${fields["test_hotel"]?.data}
Fecha: ${fields["test_habitacion"]?.data}
Custom Service: ${fields["custom_service"]?.data ?? ""}
`,
        },
        }),
    }
    );
};


// start a connection
const startSock = async (ws_client) => {
    // fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        //logger: P({ level: "trace" }),
        printQRInTerminal: true,
        auth: state,
        // implement to handle retries
        getMessage: async (key) => {
            return {
                conversation: "hello",
            };
        },
    });

    store.bind(sock.ev);
    
    const sendToClient = async (event, msg) => {
        if (!ws_client) return false;

        let messages = store.messages;
        let chats = store.chats.all();
        let contacts = store.contacts;

        for (let i in chats) {
            let c = chats[i];

            if (c.id.indexOf("@s.") == -1) continue;

            c["business"] = await sock.getBusinessProfile(c.id);
            c["img_url"] = await sock.profilePictureUrl(c.id);

            chats[i] = c;
        }

        delete messages["status@broadcast"];

        ws_client?.broadcast?.emit(
            event,
            JSON.stringify({
                data: msg,
                messages,
                contacts,
                chats,
            })
        );
    };

    const sendMessageWTyping = async (msg, jid) => {
        await sock.presenceSubscribe(jid);
        await delay(500);

        await sock.sendPresenceUpdate("composing", jid);
        await delay(2000);

        await sock.sendPresenceUpdate("paused", jid);

        await sock.sendMessage(jid, msg);
    };

    sock.ev.on("messages.upsert", async (m) => {
    
        sendToClient("messages.upsert", m);

        console.log(JSON.stringify(m, undefined, 2));
        try {
            const msg = m.messages[0];
            const chatId = msg.key.remoteJid;
            if (
                !msg.key.fromMe &&
                m.type === "notify" &&
                chatId.indexOf("@broadcast") === -1 && //not statuses
                chatId.indexOf("@g.us") === -1 //not groups
            ) {
                console.log("replying to", chatId);

                //check if bot has started for this messenger
                __data[chatId] = await storage.getItem(chatId);
                console.log("getting steps from chat " + chatId, __data[chatId]);

                if (!__data[chatId] || !__data[chatId].step) {
                    //has not started
                    __data[chatId] = {};
                    console.log(
                        "db doesn't exists for chat " + chatId,
                        __data[chatId]
                    );

                    //the begin
                    let step = Bot.controls.getStep("begin");
                    Bot.controls.setStep("begin");
                    console.log("getting initial step for chat " + chatId, step);

                    //init storage for this chat
                    __data[chatId]["current_step"] = "begin";
                    __data[chatId]["step"] = step;

                    //check if bot it needs to be called
                    let nextStep = Bot.controls.match(msg.message.conversation);
                    console.log("checking if triggered for chat " + chatId, nextStep);

                    if (nextStep) {
                        console.log("sending message to chat " + chatId, step);
                        //send reply of current step
                        let __msg = step.reply.replace(/{{title}}/gi, msg.pushName);

                        await sendMessageWTyping({ text: __msg }, chatId);

                        //set which next step needs to take
                        __data[chatId]["current_step"] = nextStep;
                    }
                } else {
                    //steps has been taken, already

                    //get current step
                    let step = Bot.controls.getStep(__data[chatId]["current_step"]);

                    Bot.controls.setStep(__data[chatId]["current_step"]);
                    __data[chatId]["step"] = step;

                    //check if bot it needs to be called
                    let nextStep;
                    if (typeof step.isMedia != "undefined" && typeof msg.message.imageMessage != "undefined") {
                        nextStep = Bot.controls.match("isImage");
                    } else if (typeof step.isMedia == "undefined") {
                        nextStep = Bot.controls.match(msg.message.conversation);
                    }
                    console.log("checking if triggered for chat " + chatId, nextStep);
                    
                    //specting an answer or data to save 
                    if (typeof step.question != "undefined") {
                        if (typeof __data[chatId]["form"] == "undefined") {
                            __data[chatId]["form"] = {};
                            __data[chatId]["form"]["timestamp"] = Date.now();
                        }
                        __data[chatId]["form"][step.question.key] = {
                            label: step.question.label,
                            data: msg.message.conversation,
                        };
                    }
                    
                    //send form data saved 
                    let formData = "";
                    if (
                      typeof step.sendFormData != "undefined" &&
                      typeof __data[chatId]["form"] != "undefined"
                    ) {
                        formData =
                          "-----------------------------------------\nDatos enviados / Data Sent:\n-----------------------------------------\n";
                        for (let i in __data[chatId]["form"]) {
                            let field = __data[chatId]["form"][i];
                            if (!field || !field.label) continue;
                            formData += field.label +": "+ field.data +"\n";
                        }
                    }
                    if (typeof step.sendFormData != "undefined" && step.sendFormData) {
                        createOrder(fields);
                    }
                    if (nextStep) {
                            step = Bot.controls.getStep( nextStep );
                        let __msg = formData + step.reply.replace(
                          /{{title}}/gi,
                          msg.pushName
                        );

                        //send reply of current step
                        console.log("sending message to chat " + chatId, step);
                        await sendMessageWTyping({ text: __msg }, chatId);

                        //set which next step needs to take
                        __data[chatId]["current_step"] = nextStep;
                    } else if (typeof step.end == "undefined") {
                        let __msg = formData + step.reply.replace(
                          /{{title}}/gi,
                          msg.pushName
                        );
                        __msg =
                        "Lo Siento! No entendí, por favor ingrese una de las opciones disponibles\n\n" +
                        __msg;

                        //send reply of current step
                        console.log("sending message to chat " + chatId, step);
                        await sendMessageWTyping({ text: __msg }, chatId);
                    }

                    let fields = __data[chatId]["form"];

                    Bot.controls.setStep(__data[chatId]["current_step"]);
                    step = Bot.controls.getCurrentStep();
                    if (typeof step.end != "undefined" && step.end) {
                        

                        //reset bot data for this chat
                        __data[chatId] = null;
                    }
                }

                await storage.setItem(chatId, __data[chatId]);
                await sock?.sendReadReceipt(
                    msg.key.remoteJid,
                    msg.key.participant,
                    [msg.key.id]
                );
            }
        } catch (err) {
            console.error(err);
        }
    });

    sock.ev.on("messages.update", (m) => sendToClient("messages.update", m));
    sock.ev.on("message-receipt.update", (m) => sendToClient("message-receipt.update", m));
    sock.ev.on("presence.update", (m) => sendToClient("presence.update", m));
    sock.ev.on("chats.update", (m) => {
        let c = m[0]; 
        if (c.id !== "status@broadcast") sendToClient("chats.update", m);
    });
    sock.ev.on("contacts.upsert", (m) => sendToClient("contacts.upsert", m));
    sock.ev.on("contacts.update", (m) => sendToClient("contacts.update", m));
    sock.ev.on("qr", (m) => sendToClient("qr", m));
    
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            // reconnect if not logged out
            let error = new Boom(lastDisconnect.error);
            switch(error?.output?.statusCode) {
                case DisconnectReason.connectionClosed:
                    startSock(ws_client);
                    break;
                case DisconnectReason.connectionLost:
                    startSock(ws_client);
                    break;
                case DisconnectReason.connectionReplaced:
                    startSock(ws_client);
                    break;
                case DisconnectReason.timedOut:
                    console.log(
                      "Connection closed. Error:" + JSON.stringify(error)
                    );
                    await delay(500);
                    startSock(ws_client);
                    return;
                    break;
                case DisconnectReason.loggedOut:
                    console.log("Connection closed. You are logged out.");
                    break;
                case DisconnectReason.badSession:
                    break;
                case DisconnectReason.restartRequired:
                    console.log(
                      "Connection closed. Error:" +
                        JSON.stringify(error)
                    );

                    sock.logout().then(()=>{
                        startSock(ws_client);
                    });
                    break;
                case DisconnectReason.multideviceMismatch:
                    break;
            }
        }
        sendToClient("connection.update", update);
    });
    // listen for when the auth credentials is updated
    sock.ev.on("creds.update", saveState);

    return sock;
};

export default function handler(req, res) {
  try {
    let server;

    if (res.socket.server.io) {
      console.log("Socket is already running");
      server = res.socket.server.io;
    } else {
      console.log("Socket is initializing");
      server = new Server(res.socket.server);

      res.socket.server.io = server;
    }

    let sock = 

    server.on("connection", (socket) => {
        console.log("WebSocket client connected");
        startSock( socket );
    });

    server.on("close", () => {
      console.log("Socket closed");
    });
  
    server.on("error", (error) => {
      console.log({error});
    });
  
    res.end();

  } catch (e) {
    console.log({error:e})
  }
}
