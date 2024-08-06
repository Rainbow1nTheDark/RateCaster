"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { NextPage } from "next";
import { useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

// Define the types for the Modal component props
interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isVisible, onClose, children }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white border-2 border-red-500 p-4 rounded-lg">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-red-500 font-bold">
            X
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

const RegisterProject: NextPage = () => {
  const { data: hash, isPending, writeContract } = useWriteContract();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    parsedUrl: "",
  });
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    const parseUrl = (url: string) => {
      try {
        const newUrl = new URL(url);
        let hostname = newUrl.hostname.replace("www.", "");
        hostname = hostname.substring(0, hostname.lastIndexOf("."));
        return hostname;
      } catch (error) {
        console.error("Invalid URL", error);
        return "";
      }
    };

    if (name === "url") {
      const parsed = parseUrl(value);
      setFormData(prev => ({
        ...prev,
        parsedUrl: parsed,
      }));
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const description = formData.get("description") as string;

    await writeContract({
      address: deployedContracts[84532].DappRatingSystem.address,
      abi: deployedContracts[84532].DappRatingSystem.abi,
      functionName: "registerDapp",
      args: [name, description, url],
    });

    setIsModalVisible(true);
  };

  return (
    <div className="flex flex-col items-center pt-10 w-full">
      <form onSubmit={submit} className="space-y-4 w-full max-w-md">
        <div className="flex flex-col">
          <label className="block mb-2">Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-300 focus:outline-none focus:border-red-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="block mb-2">Website:</label>
          <input
            type="text"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-300 focus:outline-none focus:border-red-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="block mb-2">Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border-2 border-gray-300 focus:outline-none focus:border-red-500"
          />
        </div>
        <button
          disabled={isPending}
          type="submit"
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2.5 px-4 mt-4"
        >
          {isPending ? "Confirming..." : "Register"}
        </button>
      </form>
      <Modal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)}>
        {hash ? (
          <div>
            <p className="text-green-500 font-bold">The Project is Registered!</p>
            <p>Hash: {hash}</p>
          </div>
        ) : (
          <p className="text-yellow-500 font-bold">Confirming Transaction</p>
        )}
      </Modal>
    </div>
  );
};

export default RegisterProject;
