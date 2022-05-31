// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import P from "pino";
import storage from "node-persist";
import { v4 as uuid } from "uuid";
import { validate as isUuid } from "uuid";

const __data = {};
storage.init({
  dir: "./whatsapp_bot_db",
  logging: P().child({ level: "debug", stream: "storage" }),
});

const __get = async (object, id) => {
  if (typeof id != "undefined" && isUuid(id)) {
    const __id = object + ":" + id;
    const data = await storage.getItem(__id);
    return data ?? [];
  } else {
    const data =
      typeof storage?.valuesWithKeyMatch == "function"
        ? await storage?.valuesWithKeyMatch(`${object}`)
        : [];
    return data ?? [];
  }
};

const __set = async (object, id, data) => {
  if (!object || !data) return false;

  if (id) {
    const __id = object + ":" + id;
    const d = await __get(object, id);
    if (d.length) {
      return await storage.updateItem(__id, { ...d[0], ...data });
    } else {
      data["id"] = uuid();
      data["object"] = object;
      return await storage.setItem(data["object"] + ":" + data["id"], data);
    }
  } else {
    data["id"] = uuid();
    data["object"] = object;
    return await storage.setItem(data["object"] + ":" + data["id"], data);
  }
};

const __delete = async (object, id) => {
  const __id = object + ":" + id;
  const d = await storage.getItem(__id);
  if (d) {
    return await storage.removeItem(__id);
  }
  return false;
};

export default function handler(req, res) {
  const payload = req.body?.payload ?? null;
  const id = req.query?.id ?? null;
  const object = req.query?.object ?? null;
  switch (req.method) {
    case "GET":
      try {
        __get(object, id).then((payload) => {
          res.status(200).json({
            success: true,
            payload,
          });
        });
      } catch (error) {
        return res.status(404).json({
          success: false,
        });
      }

      break;
    case "POST":
    case "PUT":
      try {
        __set(object, id, payload).then((r) => {
          if (r) {
            return res.status(200).json({
              success: true,
              payload: r.content,
            });
          } else {
            return res.status(400).json({
              success: false,
            });
          }
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
        });
      }

      break;
    case "DELETE":
      try {
        __delete(object, id).then((r) => {
          if (r) {
            res.status(200).json({
              success: true,
            });
          } else {
            res.status(400).json({
              success: false,
            });
          }
        });
      } catch (error) {
        res.status(400).json({
          success: false,
        });
      }

      break;
    default:
      res.status(200).json({
        success: false,
      });

      break;
  }
}
