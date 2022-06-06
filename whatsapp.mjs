import Bot from "./bot.mjs";
import P from "pino";
import WebsocketUtils from "./libs/utils/websocket.mjs";
import WASocket from "@adiwajshing/baileys";

const {
  getMessageType,
  getTextMessage,
  createMessage,
  createOrder,
  OnConnection,
  getMessagesWithoutReplies,
  getStep,
  setStep,
} = WebsocketUtils;

const {
  makeInMemoryStore,
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  delay,
} = WASocket;
const makeWASocket = WASocket.default;


const __debug = false;

const __data = {};

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({
  logger: P().child({ level: "debug", stream: "store" }),
});
store.readFromFile("./baileys_store_multi.json");
// save every 10s
setInterval(() => {
  store.writeToFile("./baileys_store_multi.json");
}, 10_000);

// eslint-disable-next-line react-hooks/rules-of-hooks
const { state, saveState } = useSingleFileAuthState(
  "./auth_info_multi.json"
);

// start a connection
export async function startSock (){
  // fetch latest version of WA Web
  const { version, isLatest } = await fetchLatestBaileysVersion();
  if (__debug)
    console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const sock = makeWASocket({
    version,
    //logger: P({ level: "trace" }),
    printQRInTerminal: true,
    auth: state,
    //defaultQueryTimeoutMs:3000,
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


  const sendMessageWTyping = async (msg, jid, opts, m) => {
    try {
      await sock.presenceSubscribe(jid);
      await delay(500);

      await sock.sendPresenceUpdate("composing", jid);
      await delay(2000);

      await sock.sendPresenceUpdate("paused", jid);
      const r = await sock.sendMessage(jid, msg, opts);
      if (r.status === 1) {
        console.log("message wa sent", r);

        createMessage(m?.key.id, jid, getMessageType(m?.message), m, 1, async resp => {
          console.log("message wa db updated", resp);
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const saveMessages = (data) => {
    for (let i in data.messages) {
      let m = data.messages[i];
      if (
        !m?.key.fromMe &&
        m?.key.remoteJid.indexOf("@broadcast") === -1 && //not statuses
        m?.key.remoteJid.indexOf("@g.us") === -1 //not groups
      ) {
        createMessage(m?.key.id, m?.key.remoteJid, getMessageType(m), m);
      }
    }
  };

  sock.ev.on("messages.upsert", saveMessages);
  sock.ev.on("messages.update", saveMessages);
  
  setInterval(() => {
    getMessagesWithoutReplies(null, (messages)=>{
      messages.map(async m => {
        //await delay(500);
        try {
          const msg = JSON.parse(JSON.parse(m.body));
          const chatId = m.chat.chatId;
          const textMessage = getTextMessage(msg?.message);


          //check if bot has started for this messenger
          const __d = await getStep(chatId);console.log(__d);
          __data[chatId] = __d[0] ? JSON.parse(JSON.parse(__d[0]?.body)) : {};

          if (__debug) console.log("getting steps from chat " + chatId, __data[chatId]);
          
          if (!__data[chatId] || !__data[chatId]?.step) {
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

              await sendMessageWTyping({ text: __msg }, chatId, { quoted: msg }, msg);

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
              await sendMessageWTyping({ text: __msg }, chatId, { quoted: msg }, msg);

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

                await sendMessageWTyping({ text: __msg }, chatId, { quoted:msg }, msg);
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
                await sendMessageWTyping({ text: __msg }, chatId, { quoted:msg }, msg);
              }
            }

            Bot.controls.setStep(__data[chatId]["current_step"]);

            step = Bot.controls.getCurrentStep();
            if (typeof step.end != "undefined" && step.end) {
              //reset bot data for this chat
              __data[chatId] = {};
            }
          }

          setStep(chatId, __data[chatId], () => {
            createMessage(
              msg?.key.id,
              msg?.key.remoteJid,
              getMessageType(msg?.message),
              msg,
              1
            ); //message answered, replied or processed
          });

          await sock?.sendReadReceipt(msg.key.remoteJid, msg.key.participant, [
            msg.key.id,
          ]);
        } catch (err) {
          if (__debug) console.error("Message Upsert", err);
        }
      });
    });
  }, 1000 * 1);


  sock.ev.on("connection.update", (data) => {
    OnConnection(data, sock);
  });
  sock.ev.on("creds.update", saveState);

  return sock;
};

startSock();
