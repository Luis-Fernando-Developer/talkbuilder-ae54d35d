import { Settings } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <div className="fixed top-0  left-0 h-16 w-full bg-gray-800 text-white flex flex-col justify-between py-2 px-9 z-[99]">
      <h1 className="w-full text-center">Talk-Flow-Creator</h1>
      <div className=" flex w-full justify-between">
        <span className="cursor-pointer" onClick={() => navigate("/")}>
          WORKSPACE
        </span>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Settings className="relative z-10 w-6 h-6 cursor-pointer" />
          </DropdownMenu.Trigger>

          <DropdownMenu.Content
            side="left"
            sideOffset={8}
            className="relative z-10 data-[side=left]:animate-slide-down data-[side=right]:animate-slide-up p-2 bg-white rounded-md shadow-md text-gray-800"
          >
            <DropdownMenu.Item
              className="select-none outline-none cursor-pointer px-3 rounded-md data-[highlighted]:bg-gray-100 data-[highlighted]:text-green-500"
              onClick={() => navigate("/workspace/perfil")}
            >
              PERFIL
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="select-none outline-none cursor-pointer px-3 rounded-md data-[highlighted]:bg-gray-100 data-[highlighted]:text-green-500"
              onClick={() => navigate("/workspace/configs")}
            >
              CONFIGURAÇÕES
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}
