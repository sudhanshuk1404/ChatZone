"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Smile, Mic } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface Message {
  id: string;
  text: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
}

const avatarColors = [
  "bg-red-400",
  "bg-blue-400",
  "bg-green-400",
  "bg-yellow-400",
  "bg-pink-400",
  "bg-purple-400",
  "bg-indigo-400",
];

function getAvatarColor(userId: string) {
  const index = userId.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
}

export default function ChatClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const router = useRouter();
  const searchParams = useSearchParams();
  const receiverId = searchParams.get("userId");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let statusChannel: any;
    let messagesChannel: any;

    const loadInitialData = async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) return;
      setCurrentUser(userData.user);

      const { data: userList } = await supabase
        .from("users")
        .select("id, email, name, avatar_url")
        .neq("id", userData.user.id);

      setUsers(userList || []);
      setupRealtimeSubscriptions(userData.user.id);
    };

    const setupRealtimeSubscriptions = (userId: string) => {
      statusChannel = supabase
        .channel("realtime:users")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "users",
          },
          (payload) => {
            const updatedUser = payload.new as User;
            if (updatedUser.id === userId) return;
            setUsers((prev) =>
              prev.map((u) =>
                u.id === updatedUser.id ? { ...u, ...updatedUser } : u
              )
            );
          }
        )
        .subscribe((status) => setConnectionStatus(status));

      if (receiverId) {
        loadMessages(userId, receiverId);
        messagesChannel = supabase
          .channel("realtime:messages")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
            },
            (payload) => {
              const newMsg = payload.new as Message;
              if (
                (newMsg.sender_id === userId &&
                  newMsg.receiver_id === receiverId) ||
                (newMsg.sender_id === receiverId &&
                  newMsg.receiver_id === userId)
              ) {
                setMessages((prev) => [...prev, newMsg]);
              }
            }
          )
          .subscribe();
      }
    };

    const loadMessages = async (senderId: string, receiverId: string) => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
        )
        .order("created_at");
      setMessages(data || []);
    };

    loadInitialData();

    return () => {
      if (statusChannel) supabase.removeChannel(statusChannel);
      if (messagesChannel) supabase.removeChannel(messagesChannel);
    };
  }, [receiverId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !receiverId || !currentUser) return;
    await supabase.from("messages").insert({
      sender_id: currentUser.id,
      receiver_id: receiverId,
      text: newMessage,
    });
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const chatUser = users.find((u) => u.id === receiverId);

  return (
    <div className="flex h-screen">
      <aside className="w-[30%] border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Chats</h2>
          <div className="text-xs text-gray-500 mt-1">
            Status:{" "}
            {connectionStatus === "SUBSCRIBED" ? "Connected" : "Connecting..."}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className={`p-4 hover:bg-gray-100 cursor-pointer border-b flex gap-3 items-center ${
                user.id === receiverId ? "bg-blue-50" : ""
              }`}
              onClick={() => router.push(`/chat?userId=${user.id}`)}
            >
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(
                    user.id
                  )}`}
                >
                  <span>
                    {(user.name || user.email)?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 truncate">
                <div className="font-medium text-sm truncate">
                  {user.name || user.email}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <Button
            onClick={handleLogout}
            className="w-full"
            variant="destructive"
          >
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 bg-[#efeae2] flex flex-col">
        {receiverId ? (
          <>
            <div className="p-4 border-b bg-white flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    chatUser ? getAvatarColor(chatUser.id) : "bg-gray-300"
                  }`}
                >
                  <span>
                    {(chatUser?.name || chatUser?.email)
                      ?.charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <div className="font-semibold">
                  {chatUser?.name || chatUser?.email}
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[30%] px-4 py-2 rounded-xl shadow-sm text-sm whitespace-pre-wrap break-words ${
                    msg.sender_id === currentUser?.id
                      ? "bg-[#25D366] text-white ml-auto text-right"
                      : "bg-white text-black mr-auto text-left"
                  }`}
                >
                  <div>{msg.text}</div>
                  <div className="text-[10px] mt-1 opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 flex items-center gap-2 bg-white border-t">
              <Paperclip className="text-gray-500" size={20} />
              <Smile className="text-gray-500" size={20} />
              <Input
                className="flex-1"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Mic className="text-gray-500" size={20} />
              <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium">No chat selected</h3>
              <p className="mt-1">Choose a conversation from the sidebar</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
