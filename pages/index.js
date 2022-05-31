import Layout from "../components/Layout";
import { useRouter } from "next/router";

export default function Index() {
  // consulta Apollo
  const router = useRouter();

  return (
    <div>
      <Layout>
        Bienvenido
      </Layout>
    </div>
  );
}
