import React, { useState, useEffect, useContext } from "react";
import PedidoContext from "../../context/pedidos/pedidoContext";
import Select from "react-select";
import { gql, useQuery } from "@apollo/client";

const OBTENER_PRODUCTOS = gql`
  query ObtenerProductos {
    obtenerProductos {
      id
      nombre
      existencia
      precio
      creado
    }
  }
`;

const AsignarProductos = () => {
  // state
  const [producto, setProductos] = useState([]);
  const { data, loading, error } = useQuery(OBTENER_PRODUCTOS);

  // context
  const pedidoContext = useContext(PedidoContext);
  const { agregarProductos } = pedidoContext;

  useEffect(() => {
    // TODO: funcion para pasar pedidoState.js

    agregarProductos(producto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto]);

  const seleccionarProductos = (producto) => {
    setProductos(producto);
  };

  if (loading) return null;
  const { obtenerProductos } = data;

  return (
    <div>
      <p className="mt-10 my-2 bg-white border-l-4 border-gray-800 text-gray-700 p-2 text-sm font-bold">
        2. Selecciona productos
      </p>
      <Select
        className="mt-3"
        options={obtenerProductos}
        isMulti
        onChange={(opcion) => seleccionarProductos(opcion)}
        getOptionValue={(opciones) => opciones.id}
        getOptionLabel={(opciones) =>
          `${opciones.nombre} - ${opciones.existencia} Disponibles`
        }
        placeholder="Busca o selecciona el producto"
      />
    </div>
  );
};

export default AsignarProductos;
