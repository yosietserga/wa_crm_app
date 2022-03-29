import Link from "next/link";
import React from "react";
import Layout from "../components/Layout";

const STATUS_PENDING  = 1;
const STATUS_PAID     = 2;
const STATUS_SHIPPED  = 3;
const STATUS_COMPLETE = 4;
const STATUS_CANCELED = 5;
const STATUS_REFUND   = 6;

const Pedidos2 = ({ data }) => {

  const pedidos = data.map((v,k) => {
    return <Pedido key={k} data={v} />;
  });

  return (
    <div>
      <Layout>
        <h1 className="text-2xl text-gray-800 font-light">Pedidos</h1>
        {data.length === 0 && (
          <p className="mt-5 text-center text-2xl"> No hay pedidos</p>
        )}
        {data && pedidos}
      </Layout>
    </div>
  );
};

const Pedido = ({ data }) => {
  const [orderStatus, setOrderStatus] = React.useState(STATUS_PENDING);
  const [cssclass, setCssClass] = React.useState("border-yellow-500");

  const handleCssClass = (v) => {
    if (v == STATUS_PENDING) {
      setCssClass("border-yellow-500");
    } else if (v == STATUS_COMPLETE) {
      setCssClass("border-green-600");
    } else if (v == STATUS_CANCELED) {
      setCssClass("border-red-500");
    }
  };

  const handleOrderStatus = (v) => {
    setOrderStatus(v);
    handleCssClass(v);
  };

  return (
    <div
      className={`${cssclass} border-t-4 mt-4 bg-white rounded p-6 md:grid md:grid-cols-2 md:gap-4 shadow-lg`}
    >
      <div>
        <div className="font-bold text-gray">
          Cliente: {data?.customer?.name}
        </div>
        {data?.customer?.email && (
          <p className="flex items-center my-2">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
            {data?.customer?.email}
          </p>
        )}

        {data?.customer?.phone && (
          <p className="flex items-center my-2">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              ></path>
            </svg>
            {data?.customer?.phone}
          </p>
        )}
        <h2 className="text-gray-800 font-bold">Estado Pedido:</h2>
        <select
          value={orderStatus}
          className="mt-2 apperance-none bg-blue-600 border border-blue-600 text-white p-2 
          text-center rounded leadinh-tight focus:outline-none focus:bg-blue-600 focus:border-blue-500 uppercase text-xs font-bold"
          onChange={(e) => handleOrderStatus(e.target.value)}
        >
          <option value={STATUS_COMPLETE}>COMPLETADO</option>
          <option value={STATUS_PENDING}>PENDIENTE</option>
          <option value={STATUS_CANCELED}>CANCELADO</option>
        </select>
      </div>
      <div>
        <h2 className="text-gray-800 font-bold mt-2">Resumen del Pedido</h2>
        {data.products.map((product) => (
          <div key={product.id} className="mt-4 ">
            <p className="text-sm text-gray-600">Producto: {product.name}</p>
            <p className="text-sm text-gray-600">
              Cantidad: {product.quantity}
            </p>
          </div>
        ))}
        <p className="text-gray-800 mt-3 font-bold">
          Total a pagar:
          <span className="font-light">{data?.total}€</span>
        </p>
        <button
          className="flex items-center mt-4 bg-red-800 px-5 py-2 
          inline-block text-white rounded leading-tight uppercase text-xs"
          onClick={() => confirmarEliminarPedido()}
        >
          Eliminar order
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
};;

export async function getServerSideProps() {
  const resp = await fetch(
    "http://127.0.0.1:3000/api/crud?" +
      new URLSearchParams({
        object: "order",
      }),
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  const data = await resp.json();

  return {
    props: {
      data: data.success ? data.payload : [],
    },
  };
}

export default Pedidos2;
