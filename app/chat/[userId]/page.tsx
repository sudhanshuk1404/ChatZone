"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Message = {
  id: string;
  text: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
};

export default function ChatWithUser() {
  const params = useParams();
  const userId = params.userId as string;
  // receiverId from URL
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);
      console.log("You:", data.user.id, "Chatting with:", userId);

      const { data: allMessages, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (messageError) {
        console.error("❌ Failed to fetch messages:", messageError.message);
      } else {
        const filtered = allMessages?.filter(
          (msg) =>
            (msg.sender_id === data.user.id && msg.receiver_id === userId) ||
            (msg.sender_id === userId && msg.receiver_id === data.user.id)
        );
        console.log("✅ Filtered messages:", filtered);
        setMessages(filtered || []);
      }

      const channel = supabase
        .channel("supabase_realtime_messages_publication") // match your publication
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const msg = payload.new as Message;

            // Only show messages related to this user
            if (
              (msg.sender_id === data.user.id && msg.receiver_id === userId) ||
              (msg.sender_id === userId && msg.receiver_id === data.user.id)
            ) {
              setMessages((prev) => [...prev, msg]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    init();
  }, [router, userId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !user) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: userId,
      text: newMessage,
    });

    if (error) {
      console.error("Failed to send message:", error.message);
    } else {
      console.log("Message sent.");
      setNewMessage("");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Chat with user: {userId}</h1>

      <div className="h-64 overflow-y-auto border p-2 rounded bg-gray-100">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`my-1 p-2 rounded ${
              msg.sender_id === user?.id
                ? "bg-blue-500 text-white ml-auto max-w-[70%]"
                : "bg-white text-black mr-auto max-w-[70%]"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}
