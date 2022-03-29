import "../styles/globals.css";
import { ApolloProvider } from "@apollo/client";
import client from "../config/apollo";
import { WhatsAppProvider } from "../context/whatsAppContext";

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <WhatsAppProvider>
          <Component {...pageProps} />
      </WhatsAppProvider>
    </ApolloProvider>
  );
}

export default MyApp;
