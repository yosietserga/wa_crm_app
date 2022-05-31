import { PrismaClient } from "@prisma/client";
import common from "../utils/common.mjs";
const {log, empty, isset} = common;

const prisma = new PrismaClient();

const modelName = "chat";

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
}

export function upsert(data, cb) {
  const formData = {};

  if (!isset(data?.chatId) || empty(data?.chatId))
    throw new Error("Error: Missing chatId value in chat");

  formData.chatId = __getset(data, "chatId", "");
  formData.type = __getset(data, "type", "direct"); //direct or group
  formData.body = JSON.stringify(__getset(data, "body", ""));

  __updsert(formData, { chatId: formData.chatId }, cb);
}

export function get(data, withInclude = false, cb = null) {
  const where = {};
  const include = {};

  if (isset(data?.chatId) && !empty(data?.chatId)) {
    where.chatId = data.chatId;
  }

  if (isset(data?.type) && !empty(data?.type)) {
    where.type = data.type;
  }

  if (withInclude) {
    include.messages = true;
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

export function remove(chatId, cb) {
  if (!isset(chatId) || empty(chatId)) return false;

  prisma[modelName]
    .delete({
      where: {
        chatId,
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