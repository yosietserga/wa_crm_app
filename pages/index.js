import Layout from "../components/Layout";
import Whatsapp_Chats from "../components/whatsapp/chats";
import { useRouter } from "next/router";

export default function Index() {
  // consulta Apollo
  const router = useRouter();

  return (
    <div>
      <Layout>
        <Whatsapp_Chats />
      </Layout>
    </div>
  );
}
