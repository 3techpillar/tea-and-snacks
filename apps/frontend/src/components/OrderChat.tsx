import { useState, useRef, useEffect } from "react";
import type { DemoOrder } from "@tea-and-snacks/shared";
import { Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";

type OrderChatProps = {
  order: DemoOrder;
  isVendor?: boolean;
  onMessageSent?: (order: DemoOrder) => void;
};

export function OrderChat({ order, isVendor = false, onMessageSent }: OrderChatProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = useMutation({
    mutationFn: (message: string) => ordersApi.addChatMessage(order.id, message),
    onSuccess: (updatedOrder) => {
      setText("");
      if (onMessageSent) {
        onMessageSent(updatedOrder);
      } else {
        queryClient.setQueryData(
          isVendor ? ["admin-orders", order.id] : ["orders", order.id],
          updatedOrder
        );
      }
    }
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [order.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sendMessage.isPending) return;
    sendMessage.mutate(text);
  };

  const myRole = isVendor ? "vendor" : "customer";

  return (
    <section className="surface-card mt-5 p-5 flex flex-col h-[400px]">
      <h2 className="text-lg font-semibold mb-4 border-b border-border pb-2">Order Notes / Chat</h2>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2"
      >
        {order.messages && order.messages.length > 0 ? (
          order.messages.map((m, i) => {
            const isMe = m.senderRole === myRole;
            return (
              <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {m.senderRole === "admin" ? "Admin" : m.senderName}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${isMe
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : m.senderRole === "admin"
                        ? "bg-chili-soft text-chili-ink rounded-tl-sm border border-chili/20"
                        : "bg-accent/50 text-foreground rounded-tl-sm"
                    }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic">
            No messages yet. Send a note to the {isVendor ? "customer" : "vendor"}!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isVendor ? "Message customer..." : "Message vendor..."}
          className="flex-1 rounded-full border border-input bg-transparent px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary pr-12"
          disabled={sendMessage.isPending || order.status === "Cancelled" || order.status === "Completed"}
        />
        <button
          type="submit"
          disabled={!text.trim() || sendMessage.isPending || order.status === "Cancelled" || order.status === "Completed"}
          className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
