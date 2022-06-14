import { Boom } from "@hapi/boom";
import { Server } from "socket.io";
import fs from "fs";
import P from "pino";
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
    if (!ws_client) return false;

    let messages = store.messages;
    let chats = store.chats.all();
    let contacts = store.contacts;
    
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

  sock.ev.on("qr", (m) => sendToClient("qr", m));

  const closeConn = async (sock) => {
    sock.ev.on("close", async () => {
      await sock?.destroy();
    });
    await sock?.end();
  };

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      // reconnect if not logged out
      let error = new Boom(lastDisconnect.error);
      switch (error?.output?.statusCode) {
        case DisconnectReason.connectionClosed:
          startSock(ws_client);
          await closeConn(sock);
          break;
        case DisconnectReason.connectionLost:
          await closeConn(sock);
          startSock(ws_client);
          break;
        case DisconnectReason.connectionReplaced:
          startSock(ws_client);
          await closeConn(sock);
          break;
        case DisconnectReason.timedOut:
          if (__debug)
            console.log("Connection closed. Error:" + JSON.stringify(error));
          await delay(500);
          await closeConn(sock);
          startSock(ws_client);
          break;
        case DisconnectReason.loggedOut:
          if (__debug) console.log("Connection closed. You are logged out.");
          await delay(500);
          await sock.logout();
          await delay(500);
          await closeConn(sock);
          
          clearInterval(__i);
          fs.unlinkSync("./auth_info_multi.json");
          fs.unlinkSync("./baileys_store_multi.json");

          startSock(ws_client);
          
          break;
        case DisconnectReason.badSession:
          if (__debug) console.log("Connection closed. Bad session.");
          await delay(500);
          await sock.logout();
          await delay(500);
          await closeConn(sock);

          clearInterval(__i);
          fs.unlinkSync("./auth_info_multi.json");
          fs.unlinkSync("./baileys_store_multi.json");

          startSock(ws_client);
          
          break;
        case DisconnectReason.restartRequired:
          if (__debug) console.log("Connection closed. Error:" + JSON.stringify(error));
          await closeConn(sock);
          startSock(ws_client);
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
        s?.close();
        s?.destroy();

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
