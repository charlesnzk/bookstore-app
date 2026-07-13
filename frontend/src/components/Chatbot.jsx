import {
  Button,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  ActionIcon,
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import api from "../api/axios";

const INITIAL_MESSAGE = {
  role: "bot",
  text: "Hi! Got any questions about delivery, orders or where we ship to? Please let me know.",
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const viewport = useRef(null);

  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chat/", { message });
      setMessages((prev) => [...prev, { role: "bot", text: res.data.reply }]);
    } catch {
      notifications.show({
        message: "Chatbot unavailable. Please try again.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) {
    return (
      <Button
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          zIndex: 1000,
          borderRadius: "50px",
        }}
        onClick={() => setOpen(true)}
        aria-label="Open support chat"
      >
        💬 Support Chat
      </Button>
    );
  }

  return (
    <Paper
      withBorder
      shadow="md"
      radius="md"
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        width: "340px",
        height: "460px",
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
      }}
    >
      <Group
        justify="space-between"
        p="sm"
        style={{ borderBottom: "1px solid #eee" }}
      >
        <Text fw={600} size="sm">
          Support
        </Text>
        <ActionIcon
            variant="subtle"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
        >
            ✕
        </ActionIcon>
      </Group>

      <ScrollArea
        flex={1}
        p="sm"
        viewportRef={viewport}
        aria-live="polite"
        aria-label="Chat messages"
        >
        <Stack gap="xs">
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Paper
                px="sm"
                py="xs"
                radius="md"
                style={{
                  maxWidth: "80%",
                  background: msg.role === "user" ? "#228be6" : "#f1f3f5",
                  color: msg.role === "user" ? "white" : "inherit",
                }}
              >
                <Text size="sm">{msg.text}</Text>
              </Paper>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <Loader size="xs" />
            </div>
          )}
        </Stack>
      </ScrollArea>

      <Group p="sm" style={{ borderTop: "1px solid #eee" }} gap="xs">
        <TextInput
          flex={1}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          size="sm"
        />
        <Button size="sm" onClick={handleSend} loading={loading}>
          Send
        </Button>
      </Group>
    </Paper>
  );
}
