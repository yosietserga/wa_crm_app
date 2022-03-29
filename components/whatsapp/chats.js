import React from "react";
import moment from "moment";
import WhatsApp_QR from "./qr";
import { WhatsAppContext } from "../../context/whatsAppContext";

const Whatsapp_Chats = () => {
  const [chats, setChats] = React.useState([]);
  const [conn, setConn] = React.useState(true);

  let ws = React.useContext(WhatsAppContext);

  let messages = [];

  ws.socket.on("messages.upsert", (m) => {
    messages = [];
    const data =  JSON.parse(m);

    for (let i in data.messages) {
      let m = data.messages[i];
      let lm = m.slice(-1);
      let lastMsg = lm[0];

      if (
        lastMsg?.key &&
        typeof lastMsg?.message != "undefined" &&
        typeof lastMsg?.message?.conversation != "undefined" &&
        lastMsg?.status != "SERVER_ACK" &&
        lastMsg?.status != "DELIVERY_ACK"
      ) {
        messages.push({
          id: lastMsg.key.remoteJid,
          fromMe: lastMsg.key.fromMe,
          message: lastMsg.message?.conversation,
          pushName: lastMsg?.pushName,
          timestamp: moment(lastMsg?.messageTimestamp).fromNow(),
          status: lastMsg?.status,
        });
      }
    }
    setChats( messages );
  });

  ws.socket.on("qr", (m) =>{
    setConn(false);
  });

  return (
    <>
      {!conn && WhatsApp_QR}
      {conn && chats.map(c => {
        let phone = c.id.substr(0, c.id.indexOf("@"));
        let isGroup = c.id.indexOf("@g.us") != -1;
        return (
          <div
            key={c.id}
            style={{ borderBottom: "dashed 3px #ccc", padding: "3px 0" }}
          >
            <span>
              Chat with: <b>{phone}</b>
              {isGroup ? <small>{'<group>'}</small> : ""}
            </span>
            <br />
            <span>Time:{c.timestamp}</span>
            <br />
            <span>Status:{c.status}</span>
            <br />
            <span>{c.pushName + " said: " + c.message}</span>
            <hr />
          </div>
        );
      })}
    </>
  );
};

export default Whatsapp_Chats;