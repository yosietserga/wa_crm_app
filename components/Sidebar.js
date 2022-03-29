import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const Sidebar = () => {
  //rouiting de next
  const router = useRouter();

  return (
    <aside className="bg-gray-800 sm:w-1/3 xl:w-1/5 sm:min-h-screen p-5">
      <div>
        <p className="text-white text-2xl font-black">CRM Clientes</p>
      </div>
      <nav className="mt-5 list-none">
        <li
          className={router.pathname === "/chats" ? "bg-blue-800 p-3" : "p-3"}
        >
          <Link href="/chats">
            <a className="text-white ">Chat Bot</a>
          </Link>
        </li>

        <li
          className={router.pathname === "/pedidos" ? "bg-blue-800 p-3" : "p-3"}
        >
          <Link href="/pedidos">
            <a className="text-white ">Pedidos</a>
          </Link>
        </li>

        <li
          className={router.pathname === "/about" ? "bg-blue-800 p-3" : "p-3"}
        >
          <Link href="/about">
            <a className="text-white ">About Us</a>
          </Link>
        </li>
      </nav>

    </aside>
  );
};

export default Sidebar;
