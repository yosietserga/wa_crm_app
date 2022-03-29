import React, { useContext, useEffect } from "react";
import PedidoContext from "../../context/pedidos/pedidoContext";
import ProductoResumen from "./ProductoResumen";

const ResumenPedido = () => {
  // context
  const pedidoContext = useContext(PedidoContext);

  const { productos } = pedidoContext;

  useEffect(() => {}, [productos]);
  return (
    <div>
      <p className="mt-10 my-2 bg-white border-l-4 border-gray-800 text-gray-700 p-2 text-sm font-bold">
        3. Selecciona las cantidades del producto
      </p>
      {productos.length > 0 ? (
        productos.map((producto) => (
          <ProductoResumen key={producto.id} producto={producto} />
        ))
      ) : (
        <p className=" bg-gray-800 flex  justify-center mt-4 text-white text-2xl  border border-indigo-600  rounded py-3 ">
          No hay productos
        </p>
      )}
    </div>
  );
};

export default ResumenPedido;
