import * as React from "react";

//communication
import io from "socket.io-client";
const log = console.log;
const WhatsAppContext = React.createContext(null);
const WhatsAppProvider = ({ children }) => {
  let socket;
  let ws = {};

  if (!socket) {
    try {
      fetch("http://localhost:3000/api/whatsapp", {
        method: 'GET',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error( error );
    }

    socket = io();

    socket.on("connection.update", (m) => {
      let data = JSON.parse(m);
    });

    socket.on("qr", (m) => log("qr", JSON.parse(m)));
    
    ws.socket = socket;
  }

  return (
    <WhatsAppContext.Provider value={ws}>{children}</WhatsAppContext.Provider>
  );
};

export { WhatsAppContext, WhatsAppProvider };
