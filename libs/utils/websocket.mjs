import WASocket from "@adiwajshing/baileys";
import Chat from "../models/chat.mjs";
import Message from "../models/message.mjs";
import Order from "../models/order.mjs";
import Step from "../models/step.mjs";

const __debug = true;

const { DisconnectReason, delay } = WASocket;

const OnConnection = async (update) => {
  const { connection, lastDisconnect } = update;
  if (connection === "close") {
    // reconnect if not logged out
    let error = new Boom(lastDisconnect.error);
    switch (error?.output?.statusCode) {
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
        if (__debug)
          console.log("Connection closed. Error:" + JSON.stringify(error));
        await delay(500);
        startSock(ws_client);
        return;
        break;
      case DisconnectReason.loggedOut:
        if (__debug) console.log("Connection closed. You are logged out.");
        await delay(500);
        await sock.logout();
        await delay(500);
        startSock(ws_client);
        break;
      case DisconnectReason.badSession:
        if (__debug) console.log("Connection closed. Bad session.");
        await delay(500);
        //await sock.logout();
        await delay(500);
        startSock(ws_client);
        break;
      case DisconnectReason.restartRequired:
        if (__debug)
          console.log("Connection closed. Error:" + JSON.stringify(error));
        break;
      case DisconnectReason.multideviceMismatch:
        break;
      default:
        if (__debug)
          console.log("Connection closed. Error:" + JSON.stringify(error));
        break;
    }
  }
};

//fetch send create order
const createOrder = (fields, chatId) => {
  try {
    const formData = {
      title: "Test Covid",
      description: `Cliente: ${fields["test_fullname"]?.data} <
Email: ${fields["test_email"]?.data}>
Phone: ${chatId.replace("@s.whatsapp.net", "")}
Fecha: ${fields["test_date"]?.data}
Hotel: ${fields["test_hotel"]?.data}
Habitacion: ${fields["test_habitacion"]?.data}
Price: $40 USD`,
      price: 40,
    };

    Order.upsert(formData);
  } catch (error) {
    if (__debug) console.log("createOrder", error);
  }
};

const setStep = (chatId, body, cb) => {
  try {
    const formData = {
      chatId,
      body: JSON.stringify(body),
    };

    Step.upsert(formData, cb);
  } catch (error) {
    if (__debug) console.log("setStep", error);
  }
};

const getStep = async (chatId, cb) => {
  try {
    return await Step.get({ chatId }, true, cb);
  } catch (error) {
    if (__debug) console.log("getStep", error);
  }
};

const createChat = (chatId, type, body, cb) => {
  try {
    const formData = {
      chatId,
      body: JSON.stringify(body),
      type,
    };

    Chat.upsert(formData, cb);
  } catch (error) {
    if (__debug) console.log("createChat", error);
  }
};

const createMessage = (messageId, chatId, type, body, replied, cb) => {
  try {
    const formData = {
      messageId,
      chatId,
      replied,
      body: JSON.stringify(body),
      type: getMessageType(body?.message),
    };

    createChat(chatId, "direct", {id:chatId}, (resp)=>{
      console.log("response create chat", resp);
      Message.upsert(formData, cb);
    });
    
  } catch (error) {
    if (__debug) console.log("createMessage", error);
  }
};

const getMessagesWithoutReplies = (chatId, cb) => {
  if (typeof chatId === "undefined") {
    return Message.get({ replied: 0 }, true, cb);
  } else {
    return Message.get({ chatId, replied: 0 }, true, cb);
  }
}

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
  if (!messageObj || typeof messageObj === "undefined") return false;
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

const walkThroughChats = () => {
  let messages = store.messages;
  for (let chatId in messages) {
    let m = messages[chatId].toJSON()[0];
    if (__debug) console.log("walkThroughChats", chatId);

    followBotMessage(m, chatId);
  }
};

const WebsocketUtils = {
  getMessageType,
  getTextMessage,
  createMessage,
  createOrder,
  createChat,
  OnConnection,
  getMessagesWithoutReplies,
  getStep,
  setStep
};
export default WebsocketUtils;