import { PrismaClient } from "@prisma/client";
import common from "../utils/common.mjs";
const { log, empty, isset } = common;

const prisma = new PrismaClient();

const modelName = "order";

const __isset = (obj, k) => {
  return isset(obj[k]) && !empty(obj[k]);
};

const __getset = (obj, k, d) => {
   return __isset(obj, k) ? obj[k] : d;
};

const __updsert = (formData, cb) => {
    prisma[modelName]
      .create(formData)
      .then((resp) => {
        log(resp);
        if (typeof cb === "function") cb(resp);
      })
      .catch(log);
}

export function upsert(data, cb) {
  const formData = {};

  if (!isset(data?.title) || empty(data?.title))
    throw new Error("Error: Missing Title value in order");

  formData.title = __getset(data, "title", "");
  formData.description = __getset(data, "description", "");
  formData.currencyRate = __getset(data, "currencyRate", 1);
  formData.price = __getset(data, "price", 0);
  formData.currencySymbol = __getset(data, "currencySymbol", "USD");

  __updsert(formData, cb);
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