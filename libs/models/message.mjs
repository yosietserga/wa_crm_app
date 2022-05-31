import { PrismaClient } from "@prisma/client";
import common from "../utils/common.mjs";
const { log, empty, isset } = common;

const prisma = new PrismaClient();

const modelName = "message";

const __isset = (obj, k) => {
  return isset(obj[k]) && !empty(obj[k]);
};

const __getset = (obj, k, d) => {
  return __isset(obj, k) ? obj[k] : d;
};

const __updsert = (formData, where, cb) => {
  prisma[modelName]
    .upsert({
      where,
      create: formData,
      update: formData,
    })
    .then((resp) => {
      log(resp);
      if (typeof cb === "function") cb(resp);
    })
    .catch(log);
};

export function upsert(data, cb) {
  const formData = {};

  if (
    !isset(data?.messageId) 
    || empty(data?.messageId)
    || !isset(data?.chatId) 
    || empty(data?.chatId)
  ) {
      throw new Error("Error: Missing chatId or messageId value in message");
  }

  formData.messageId = __getset(data, "messageId", "");
  formData.chatId = __getset(data, "chatId", "");
  formData.type = __getset(data, "type", "text"); //text, media, reply, mention, button
  formData.body = JSON.stringify(__getset(data, "body", ""));
  formData.replied = __getset(data, "replied", 0);

  __updsert(formData, { messageId: formData.messageId }, cb);
}

export function get(data, withInclude = false, cb = null) {
  const where = {};
  const include = {};

  if (isset(data?.messageId) && !empty(data?.messageId)) {
    where.messageId = data.messageId;
  }

  if (isset(data?.chatId) && !empty(data?.chatId)) {
    where.chatId = data.chatId;
  }

  if (isset(data?.type) && !empty(data?.type)) {
    where.type = data.type;
  }

  if (isset(data?.replied) && !empty(data?.replied)) {
    where.replied = data.replied;
  }

  if (withInclude) {
    include.chat = true;
  }

  prisma[modelName]
    .findMany({
      where,
      include,
    })
    .then((resp) => {
      log(resp);
      if (typeof cb === "function") cb(resp);
    })
    .catch(log);
}

export function remove(messageId, cb) {
  if (!isset(messageId) || empty(messageId)) return false;

  prisma[modelName]
    .delete({
      where: {
        messageId,
      },
    })
    .then((resp) => {
      log(resp);
      if (typeof cb === "function") cb(resp);
    })
    .catch(log);
}

const model = {
  upsert,
  get,
  remove,
};
export default model;