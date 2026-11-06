"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChefHat, Send, X } from "lucide-react";
import Markdown from "@/components/Markdown";
import { useIAChat, nextChatId, type ChatMsg } from "@/lib/ia/useChat";

const CHIPS = [
  "Quais opções não levam carne?",
  "Tem algum prato com peixe?",
  "Quero comer por até R$ 30",
];
const greeting = (): ChatMsg => ({
  id: nextChatId(),
  role: "assistant",
  content:
    "Olá! Sou o Chef IA. Posso consultar ingredientes, preços e opções do cardápio para ajudar você a escolher.",
});

export default function ChefIA({
  raised = false,
  produtoIds,
}: {
  raised?: boolean;
  produtoIds?: number[];
}) {
  const [open, setOpen] = useState(false);
  const [initial] = useState(() => [greeting()]);
  const { messages, loading, send, fonte } = useIAChat(
    "totem",
    initial,
    undefined,
    produtoIds,
  );
  const [input, setInput] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const style = { "--chef-bottom": raised ? "100px" : "20px" } as CSSProperties;

  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (open && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);
  useEffect(() => {
    if (!open) return;
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus({ preventScroll: true });
      }
    }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  function close() {
    setOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  }
  function submit() {
    if (!input.trim() || loading) return;
    void send(input);
    setInput("");
  }
  return (
    <div className="chef-widget" style={style}>
      <button
        ref={buttonRef}
        type="button"
        className="chef-launcher"
        aria-label={open ? "Fechar Chef IA" : "Abrir Chef IA"}
        aria-expanded={open}
        aria-controls="chef-conversa"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <X size={20} aria-hidden="true" />
        ) : (
          <ChefHat size={21} aria-hidden="true" />
        )}
        <span>Chef IA</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.section
            id="chef-conversa"
            className="chef-popup"
            role="dialog"
            aria-modal="false"
            aria-labelledby="chef-titulo"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
          >
            <header className="chef-header">
              <span className="chef-avatar">
                <ChefHat size={19} aria-hidden="true" />
              </span>
              <div>
                <strong id="chef-titulo">Chef IA</strong>
                <small>
                  {fonte === "local"
                    ? "Consulta local ao cardápio"
                    : fonte === "ollama" || fonte === "groq"
                      ? "IA conectada ao cardápio"
                      : "Ajuda para escolher seu pedido"}
                </small>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar conversa"
                className="chef-close"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div
              ref={scrollRef}
              className="chef-messages"
              role="log"
              aria-label="Conversa com o Chef IA"
              aria-live="polite"
              aria-relevant="additions text"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chef-message chef-message-${msg.role}${msg.error ? " chef-message-error" : ""}`}
                >
                  {msg.content ? (
                    <Markdown>{msg.content}</Markdown>
                  ) : (
                    <span role="status">Consultando o cardápio…</span>
                  )}
                </div>
              ))}
            </div>
            {messages.length === 1 && (
              <div className="chef-suggestions">
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={loading}
                    onClick={() => void send(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <form
              className="chef-composer"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                maxLength={3000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Como posso ajudar?"
                aria-label="Sua pergunta ao Chef IA"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Enviar pergunta"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
