import * as React from "react";

//communication
import io from "Socket.IO-client";
const log = console.log;
const WhatsAppContext = React.createContext(null);
const WhatsAppProvider = ({ children }) => {
  let socket;
  let ws = {};

  if (!socket) {
    fetch("http://localhost:3000/api/whatsapp");

    socket = io();

    socket.on("connect", () => {
      log("connected");

      socket.on("chats.set", (m) => {
        log("chats.set", m);
      });
      
      socket.on("connection.update", (m) => {
        let data = JSON.parse(m);
        log("connecttion", JSON.parse(m));
      });
      
      socket.on("messages.update", (m) =>
        log("messages.update", JSON.parse(m))
      );
      
      socket.on("messages.upsert", (m) =>
        log("messages.upsert", JSON.parse(m))
      );

      socket.on("message-receipt.update", (m) =>
        log("message-receipt.update", JSON.parse(m))
      );

      socket.on("presence.update", (m) =>
        log("presence.update", JSON.parse(m))
      );

      socket.on("chats.update", (m) => 
        log("chats.update", JSON.parse(m))
      );

      socket.on("qr", (m) =>
        log("qr", JSON.parse(m))
      );
    });

    ws.socket = socket;
  }

  return (
    <WhatsAppContext.Provider value={ws}>{children}</WhatsAppContext.Provider>
  );
};

export { WhatsAppContext, WhatsAppProvider };
