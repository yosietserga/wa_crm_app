import React from "react";
import qr from "qr-image";
import { WhatsAppContext } from "../../context/whatsAppContext";

let i;

const Whatsapp_QR = () => {
  const [qrImage, setQR] = React.useState();

  let ws = React.useContext(WhatsAppContext);

  React.useEffect(() => {
    ws.socket.on("connection.update", (m) => {
      let { data } = JSON.parse(m);
      if (data?.qr) {
        i = setTimeout(() => {
          clearTimeout(i);

          let code = qr.imageSync(data.qr, { type: "svg" });
          setQR(code);
        }, 500);
      } else if (data.connection === "close") {
        setQR(false);
      } else if (data.connection === "open") {
        setQR(false);
      } else {
        setQR(false);
      }
    });
  }, [ws]);

  console.log({ qrImage });

  const handleWALogout = (e) => {
    fetch("http://localhost:3000/api/whatsapp?logout=1");
  }

  if (!qrImage) {
    return (
      <>
        <button
          type="button"
          className="bg-blue-800 w-full sm:w-auto font-bold uppercase text-xs rounded py-2 px-2 text-white shadow-md"
          onClick={handleWALogout}
        >
          Logout from whatsApp
        </button>
      </>
    );
  }

  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: qrImage }}
        style={{ maxWidth: "250px" }}
      />
    </>
  );
};

export default Whatsapp_QR;
