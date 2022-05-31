import Link from "next/link";
import React from "react";
import Layout from "../components/Layout";
import Whatsapp_QR from "../components/whatsapp/qr";

const Chats = () => {
  return (
    <div>
      <Layout>
        <h1 className="text-2xl text-gray-800 font-light">Chats</h1>
        <Whatsapp_QR />
      </Layout>
    </div>
  );
}; 

export default Chats;