import React from "react";
import qr from "qr-image";
import { WhatsAppContext } from "../../context/whatsAppContext";

const Whatsapp_QR = ({ children }) => {
  const [qrImage, setQR] = React.useState();

  let ws = React.useContext(WhatsAppContext);

  React.useEffect(() => {
    ws.socket.on("connection.update", (m) => {
      let data = JSON.parse(m);
      if (data?.qr) {
        let code = qr.imageSync(data.qr, { type: "svg" });
        setQR(code);
      }
      
      if (data.connection === "connecting") {
          setQR('<p>Conectando ...</p>');
      }
      
      if (data.connection === "close") {
          setQR('<p>Connection closed</p>');
      }
    });
  }, []);

  if (!qrImage) {
      return false;
  }

  return (
    <>
        <div dangerouslySetInnerHTML={{ __html: qrImage }} />
    </>
  );
};

export default Whatsapp_QR;