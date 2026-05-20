import { ChatNodesManager } from "@/components/admin/chat-nodes-manager";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function ChatbotManagementPage() {
  const chatNodes = await prisma.defaultChatNodes.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const rows = chatNodes.map((node) => ({
    id: node.id,
    question: node.question,
    answer: node.answer,
    createdAt: formatDate(node.createdAt),
  }));

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-7">
      <div className="rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm">
        <h1 className="text-3xl leading-tight text-brown">
          Chatbot Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage default chat questions and answers for assistant responses.
        </p>
      </div>
      <ChatNodesManager chatNodes={rows} />
    </main>
  );
}
