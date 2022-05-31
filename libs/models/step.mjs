import { PrismaClient } from "@prisma/client";
import common from "../utils/common.mjs";
const { log, empty, isset } = common;

const prisma = new PrismaClient();

const modelName = "step";

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
    !isset(data?.chatId) 
    || empty(data?.chatId)
  ) {
      throw new Error("Error: Missing chatId value in step");
  }

  formData.chatId = __getset(data, "chatId", "");
  formData.body = JSON.stringify(__getset(data, "body", ""));

  __updsert(formData, { chatId: formData.chatId }, cb);
}

export async function get(data, withInclude = false) {
  const where = {};
  const include = {};

  if (isset(data?.chatId) && !empty(data?.chatId)) {
    where.chatId = data.chatId;
  }

  if (withInclude) {
    include.chat = true;
  }

  return await prisma[modelName]
    .findMany({
      where,
      include,
    });
}

export function remove(id, cb) {
  if (!isset(id) || empty(id)) return false;

  prisma[modelName]
    .delete({
      where: {
        id,
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