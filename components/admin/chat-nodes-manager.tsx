"use client";

import { useState, useTransition } from "react";
import { BotMessageSquare, Pencil, Plus, Trash2 } from "lucide-react";

import {
  createChatNode,
  deleteChatNode,
  updateChatNode,
} from "@/app/(private)/bookings/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type ChatNode = {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
};

type ChatNodesManagerProps = {
  chatNodes: ChatNode[];
};

export function ChatNodesManager({ chatNodes }: ChatNodesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<ChatNode | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<ChatNode | null>(null);

  return (
    <section id="chatbot-nodes" className="grid scroll-mt-20 gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">
            Chatbot Nodes
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage default question and answer pairs for the chatbot.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus />
          Add node
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Answer</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chatNodes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-28 text-center text-muted-foreground"
                >
                  No chatbot nodes yet.
                </TableCell>
              </TableRow>
            ) : (
              chatNodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell className="max-w-80">
                    <div className="truncate font-medium">{node.question}</div>
                  </TableCell>
                  <TableCell className="max-w-[32rem]">
                    <div className="line-clamp-2 whitespace-normal text-muted-foreground">
                      {node.answer}
                    </div>
                  </TableCell>
                  <TableCell>{node.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setNodeToEdit(node)}
                      >
                        <Pencil />
                        <span className="sr-only">Edit chat node</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setNodeToDelete(node)}
                      >
                        <Trash2 />
                        <span className="sr-only">Delete chat node</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ChatNodeDialog
        action={createChatNode}
        description="Create a reusable default response for the future chatbot."
        isPending={isPending}
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
        startTransition={startTransition}
        title="Add chat node"
      />

      <ChatNodeDialog
        action={updateChatNode}
        description="Update this default chatbot response."
        isPending={isPending}
        node={nodeToEdit}
        onOpenChange={(open) => !open && setNodeToEdit(null)}
        open={Boolean(nodeToEdit)}
        startTransition={startTransition}
        title="Edit chat node"
      />

      <AlertDialog
        open={Boolean(nodeToDelete)}
        onOpenChange={(open) => !open && setNodeToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat node?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the default chatbot answer for "
              {nodeToDelete?.question}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending || !nodeToDelete}
              onClick={(event) => {
                event.preventDefault();
                if (!nodeToDelete) return;

                const nodeId = nodeToDelete.id;

                startTransition(() => {
                  void deleteChatNode(nodeId).then(() => {
                    setNodeToDelete(null);
                  });
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function ChatNodeDialog({
  action,
  description,
  isPending,
  node,
  onOpenChange,
  open,
  startTransition,
  title,
}: {
  action: (formData: FormData) => Promise<void>;
  description: string;
  isPending: boolean;
  node?: ChatNode | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  startTransition: ReturnType<typeof useTransition>[1];
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          action={(formData) => {
            startTransition(() => {
              void action(formData).then(() => {
                onOpenChange(false);
              });
            });
          }}
          className="grid gap-4"
        >
          {node && <input type="hidden" name="id" value={node.id} />}
          <div className="grid gap-2">
            <Label htmlFor={node ? `question-${node.id}` : "question-new"}>
              Question
            </Label>
            <Input
              id={node ? `question-${node.id}` : "question-new"}
              name="question"
              placeholder="What are your opening hours?"
              required
              defaultValue={node?.question}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={node ? `answer-${node.id}` : "answer-new"}>
              Answer
            </Label>
            <Textarea
              id={node ? `answer-${node.id}` : "answer-new"}
              name="answer"
              placeholder="Write the chatbot response."
              required
              defaultValue={node?.answer}
              className="min-h-32"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              <BotMessageSquare />
              {node ? "Save changes" : "Create node"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
