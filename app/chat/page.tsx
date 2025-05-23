import { Suspense } from "react";
import ChatClient from "./ChatClient";

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <ChatClient />
    </Suspense>
  );
}
