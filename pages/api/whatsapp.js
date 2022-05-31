import { Boom } from "@hapi/boom";
import { Server } from "socket.io";
import Bot from "../../bot.mjs";
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

process.on("unhandledRejection", console.log);

const __debug = false;

const keepAlive = () => {
  try {
    setInterval(() => {
      fetch("http://localhost:3000");
    }, 1000 * 30);
  } catch (e) {
    if (__debug) console.log(e);
  }
};

const __data = {};
storage.init({
  dir: "./whatsapp_bot_db",
  //logging: P().child({ level: "debug", stream: "storage" }),
});

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({
  //logger: P().child({ level: "debug", stream: "store" }),
});
store.readFromFile("./baileys_store_multi.json");
// save every 10s
let __i = setInterval(() => {
  store.writeToFile("./baileys_store_multi.json");
}, 10_000);

// eslint-disable-next-line react-hooks/rules-of-hooks
const { state, saveState } = useSingleFileAuthState("./auth_info_multi.json");

//fetch send create order
const createOrder = (fields, chatId) => {
  try {
    fetch(
      "http://localhost:3000/api/crud?" +
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
              email: fields["test_email"]?.data,
              phone: chatId.replace("@s.whatsapp.net", ""),
            },

            products: [
              {
                id: "",
                name: fields["custom_service"]?.data ?? "Test Covid",
                quantity: 1,
                price: fields["custom_service"]?.data ? 0 : 40,
              },
            ],

            total: fields["custom_service"]?.data ? 0 : 40,
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
  } catch (error) {
    if (__debug) console.log("createOrder", error);
  }
};

const getMessageType = (messageObj) => {
  if (typeof messageObj != "object" || !messageObj) return false;

  const types = {
    text: "conversation",
    extended: "extendedTextMessage",
    contact: "contactMessage",
    contactsArray: "contactsArrayMessage",
    groupInvite: "groupInviteMessage",
    list: "listMessage",
    buttons: "buttonsMessage",
    location: "locationMessage",
    liveLocation: "liveLocationMessage",
    protocol: "protocolMessage",
    image: "imageMessage",
    video: "videoMessage",
    sticker: "stickerMessage",
    document: "documentMessage",
    audio: "audioMessage",
    product: "productMessage",
  };

  for (let t in types) {
    if (typeof messageObj[types[t]] != "undefined" && !!messageObj[types[t]])
      return t;
  }
  return false;
};

const getTextMessage = (messageObj) => {
  const type = getMessageType(messageObj);
  if (__debug) console.log({ messageType: type }, messageObj);
  if (type == "text") return messageObj.conversation;
  if (type == "extended" && !!messageObj?.extendedTextMessage?.text)
    return messageObj.extendedTextMessage.text;
  if (
    typeof messageObj[type]?.caption != "undefined" &&
    !!messageObj[type]?.caption
  )
    return messageObj[type].caption;

  return false;
};

// start a connection
const startSock = async (ws_client) => {
  // fetch latest version of WA Web
  const { version, isLatest } = await fetchLatestBaileysVersion();
  if (__debug)
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    //logger: P({ level: "trace" }),
    printQRInTerminal: true,
    auth: state,
    defaultQueryTimeoutMs:3000,
    // implement to handle retries
    /*
    getMessage: async (key) => {
      return {
        conversation: "#hibot :)",
      };
    },
    */
  });

  store.bind(sock.ev);

  const sendToClient = async (event, msg) => {
    console.log(event, msg);
    return;
    if (!ws_client) return false;

    let messages = store.messages;
    let chats = store.chats.all();
    let contacts = store.contacts;
    /*
    for (let i in chats) {
      let c = chats[i];

      if (c.id.indexOf("@s.") == -1) continue;

      c["business"] = await sock.getBusinessProfile(c.id);
      c["img_url"] = await sock.profilePictureUrl(c.id);

      chats[i] = c;
    }
    */
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

  const sendMessageWTyping = async (msg, jid, opts) => {
    await sock.presenceSubscribe(jid);
    await delay(500);

    await sock.sendPresenceUpdate("composing", jid);
    await delay(2000);

    await sock.sendPresenceUpdate("paused", jid);

    await sock.sendMessage(jid, msg, opts);
  };

  keepAlive();

  sock.ev.on("messages.upsert", async (m) => {
    sendToClient("messages.upsert", m);

    if (__debug) console.log(JSON.stringify(m, undefined, 2));
    try {
      const msg = m.messages[0];
      const chatId = msg.key.remoteJid;
      if (
        !msg.key.fromMe &&
        m.type === "notify" &&
        //chatId.indexOf("@broadcast") === -1 //not statuses
        chatId == "584243580788-1589572562@g.us" //specific group
      ) {
        
        /*
        const textMessage = getTextMessage(msg.message);

        if (__debug) console.log("replying to", chatId);

        //check if bot has started for this messenger
        __data[chatId] = await storage.getItem(chatId);
        if (__debug)
          console.log("getting steps from chat " + chatId, __data[chatId]);
        if (!__data[chatId] || !__data[chatId].step) {
          //has not started
          __data[chatId] = {};
          if (__debug) {
            console.log("db doesn't exists for chat " + chatId, __data[chatId]);
          }
          //the begin
          let step = Bot.controls.getStep("begin");
          Bot.controls.setStep("begin");
          if (__debug)
            console.log("getting initial step for chat " + chatId, step);

          //init storage for this chat
          __data[chatId]["current_step"] = "begin";
          __data[chatId]["step"] = step;

          //check if bot it needs to be called
          let nextStep = Bot.controls.match(textMessage);
          if (__debug)
            console.log("checking if triggered for chat " + chatId, nextStep);

          if (nextStep) {
            if (__debug) console.log("sending message to chat " + chatId, step);
            //send reply of current step
            let __msg = step.reply.replace(/{{title}}/gi, msg.pushName);

            await sendMessageWTyping({ text: __msg }, chatId, { quoted: msg });

            //set which next step needs to take
            __data[chatId]["current_step"] = nextStep;
          }
        } else {
          //steps has been taken, already

          //get current step
          let step = Bot.controls.getStep(__data[chatId]["current_step"]);

          Bot.controls.setStep(__data[chatId]["current_step"]);
          __data[chatId]["step"] = step;

          //reply message container
          let __msg = "";

          //check if bot it needs to be called
          let nextStep;
          if (step?.isMedia && getMessageType(msg.message) == "image") {
            //specting image and received image
            nextStep = Bot.controls.match("isImage");
          } else if (step?.isMedia && getMessageType(msg.message) != "image") {
            //specting image and didn't receive image
            nextStep = false;
            __msg = "\n*-- Debe enviar foto / Must send photo --*\n";
          } else if (!!textMessage) {
            //specting text
            nextStep = Bot.controls.match(textMessage);
          } else {
            nextStep = false;
          }
          if (__debug)
            console.log(
              "checking if triggered for chat " + chatId,
              nextStep,
              getMessageType(msg.message),
              textMessage
            );

          //specting an answer or data to save
          if (typeof step.question != "undefined") {
            if (typeof __data[chatId]["form"] == "undefined") {
              __data[chatId]["form"] = {};
              __data[chatId]["form"]["timestamp"] = Date.now();
            }
            __data[chatId]["form"][step.question.key] = {
              label: step.question.label,
              data: textMessage,
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
              formData += field.label + ": " + field.data + "\n";
            }
          }
          if (typeof step.sendFormData != "undefined" && step.sendFormData) {
            let fields = __data[chatId]["form"];
            createOrder(fields, chatId);
          }
          if (nextStep) {
            step = Bot.controls.getStep(nextStep);
            __msg = formData + step.reply.replace(/{{title}}/gi, msg.pushName);

            //send reply of current step
            if (__debug) console.log("sending message to chat " + chatId, step);
            await sendMessageWTyping({ text: __msg }, chatId, { quoted: msg });

            //set which next step needs to take
            __data[chatId]["current_step"] = nextStep;
          } else if (typeof step.end == "undefined") {
            __data[chatId]["tries"] =
              parseInt(__data[chatId]["tries"] ?? 0) * 1 + 1;
            if (__data[chatId]["tries"] >= 2) {
              if (__debug)
                console.log(
                  "Error: reached max reply tries",
                  __data[chatId]["tries"]
                );

              __msg =
                "Lo siento! Intentos fallidos alcanzado, adios :)\n\n" +
                "Sorry! Max failed tries reached, Bye :)\n\n";

              __data[chatId]["current_step"] = "end";

              await sendMessageWTyping({ text: __msg }, chatId, { quoted:msg });
            } else {
              if (__debug)
                console.log("Failed reply tries", __data[chatId]["tries"]);

              __msg =
                formData + step.reply.replace(/{{title}}/gi, msg.pushName);

              __msg =
                "Lo Siento! No entendí, por favor ingrese una de las opciones disponibles\n\n" +
                __msg;

              //send reply of current step
              if (__debug)
                console.log("sending message to chat " + chatId, step);
              await sendMessageWTyping({ text: __msg }, chatId, { quoted:msg });
            }
          }

          Bot.controls.setStep(__data[chatId]["current_step"]);
          step = Bot.controls.getCurrentStep();
          if (typeof step.end != "undefined" && step.end) {
            //reset bot data for this chat
            __data[chatId] = null;
          }
        }
*/
        await storage.setItem(chatId, __data[chatId]);
        await sock?.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [
          msg.key.id,
        ]);
      }
    } catch (err) {
      if (__debug) console.error("Message Upsert", err);
    }
  });

  sock.ev.on("chats.upsert", (m) => sendToClient("chats.upsert", m));
  sock.ev.on("chats.delete", (m) => sendToClient("chats.delete", m));

  sock.ev.on("messages.upsert", (m) => sendToClient("messages.upsert", m));

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
      switch (error?.output?.statusCode) {
        case DisconnectReason.connectionClosed:
          startSock(ws_client);
          sock.terminate();
          break;
        case DisconnectReason.connectionLost:
          startSock(ws_client);
          sock.terminate();
          break;
        case DisconnectReason.connectionReplaced:
          startSock(ws_client);
          sock.terminate();
          break;
        case DisconnectReason.timedOut:
          if (__debug)
            console.log("Connection closed. Error:" + JSON.stringify(error));
          await delay(500);
          startSock(ws_client);
          sock.terminate();
          break;
        case DisconnectReason.loggedOut:
          if (__debug) console.log("Connection closed. You are logged out.");
          await delay(500);
          await sock.logout();
          await delay(500);
          sock.terminate();
          startSock(ws_client);
          
          break;
        case DisconnectReason.badSession:
          if (__debug) console.log("Connection closed. Bad session.");
          await delay(500);
          //await sock.logout();
          await delay(500);
          startSock(ws_client);
          sock.terminate();
          break;
        case DisconnectReason.restartRequired:
          if (__debug) console.log("Connection closed. Error:" + JSON.stringify(error));
          break;
        case DisconnectReason.multideviceMismatch:
          break;
        default:
          if (__debug)
            console.log("Connection closed. Error:" + JSON.stringify(error));
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
    let params = req.query;

    if (res.socket.server.io) {
      if (__debug) console.log("Socket is already running");
      server = res.socket.server.io;
    } else {
      if (__debug) console.log("Socket is initializing");
      server = new Server(res.socket.server);
      server.setMaxListeners(0);
      server.listen(res.socket.server);
      res.socket.server.io = server;
    }

    if (params?.logout) {
      try {
        const fs = require("fs");

        clearInterval(__i);
        fs.unlinkSync("./auth_info_multi.json");
        fs.unlinkSync("./baileys_store_multi.json");
        console.log(s, params);

        const s = makeWASocket({
          version,
          logger: P({ level: "trace" }),
          printQRInTerminal: true,
          auth: state,
        });


        s.logout();

        console.log("Logout request from webapp");
      } catch (e) {
        console.error("Websocket connection error:", e);
      }
      res.end();
      return false;
    }

    let sock = server.on("connection", (socket) => {
        try {
          if (__debug) console.log("WebSocket client connected", socket.id);
          const s = startSock(socket);
        } catch (e) {
          console.error("Websocket connection error:", e);
        }
    });

    res.end();
  } catch (e) {
    if (__debug) console.log("WebSocket error", e);
    res.end();
  }
}
