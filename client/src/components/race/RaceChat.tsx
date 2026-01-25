import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageCircle, Send, WifiOff, AlertTriangle, XCircle, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface ChatMessage {
  id: number;
  username: string;
  avatarColor: string | null;
  message: string;
  isSystem: boolean;
  createdAt: string;
}

const MAX_CHAT_LENGTH = 500;

interface RaceChatProps {
  raceId: number;
  participantId: number;
  username: string;
  avatarColor: string | null;
  sendWsMessage: (msg: any) => void;
  messages: ChatMessage[];
  isEnabled: boolean;
  isCompact?: boolean;
  wsConnected?: boolean;
}

export function RaceChat({
  raceId,
  participantId,
  username,
  avatarColor,
  sendWsMessage,
  messages,
  isEnabled,
  isCompact = false,
  wsConnected = true
}: RaceChatProps) {
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHAT_LENGTH) {
      setInput(value);
      if (sendError) setSendError(null);
    }
  };

  const sendMessage = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !isEnabled) return;

    if (!wsConnected) {
      setSendError("Connection lost");
      toast.error("Cannot send message", {
        description: "Connection lost. Reconnecting...",
        icon: <WifiOff className="h-4 w-4" />
      });
      return;
    }

    if (trimmedInput.length > MAX_CHAT_LENGTH) {
      setSendError("Message too long");
      toast.error("Message too long", {
        description: `Maximum ${MAX_CHAT_LENGTH} characters allowed`,
        icon: <AlertTriangle className="h-4 w-4" />
      });
      return;
    }

    setSendError(null);

    try {
      sendWsMessage({
        type: "chat_message",
        raceId,
        participantId,
        content: trimmedInput,
      });
      setInput("");
    } catch (error) {
      setSendError("Failed to send");
      toast.error("Failed to send message", {
        description: "Please check your connection and try again",
        icon: <XCircle className="h-4 w-4" />
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getDisabledReason = (): string => {
    if (!wsConnected) return "Reconnecting to server...";
    if (!isEnabled) return "Chat disabled during active typing";
    return "";
  };

  const isInputDisabled = !isEnabled || !wsConnected;

  if (isCompact) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="border rounded-lg p-1.5 sm:p-2 bg-muted/20">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <MessageCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                  <span className="text-[10px] sm:text-xs font-medium">Chat</span>
                  {!wsConnected && <WifiOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500" />}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium">Race Chat</p>
                <p className="text-zinc-400">
                  {wsConnected
                    ? "Chat with other racers. Press Enter to send."
                    : "Reconnecting to chat server..."}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div
            ref={scrollRef}
            className="h-16 sm:h-20 overflow-y-auto mb-1 space-y-0.5 sm:space-y-1"
          >
            {messages.length === 0 ? (
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center py-0.5 sm:py-1">
                No messages
              </p>
            ) : (
              messages.slice(-10).map((msg, idx) => (
                <Tooltip key={msg.id || idx}>
                  <TooltipTrigger asChild>
                    <div className={`text-[10px] sm:text-xs cursor-default ${msg.isSystem ? 'text-muted-foreground italic' : ''}`}>
                      {!msg.isSystem && (
                        <span className="font-medium text-primary text-[10px] sm:text-xs">
                          {msg.username}:
                        </span>
                      )}{" "}
                      <span>{msg.message}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p className="text-xs">{msg.isSystem ? "System message" : `From ${msg.username}`}</p>
                  </TooltipContent>
                </Tooltip>
              ))
            )}
          </div>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={isInputDisabled ? getDisabledReason() || "Disabled" : "Chat..."}
                    disabled={isInputDisabled}
                    maxLength={MAX_CHAT_LENGTH}
                    className={`text-[10px] sm:text-xs h-5 sm:h-6 ${sendError ? 'border-red-500' : ''}`}
                    data-testid="input-chat-compact"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{isInputDisabled ? getDisabledReason() : "Type your message here"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={isInputDisabled || !input.trim()}
                  className="h-5 sm:h-6 px-1.5 sm:px-2"
                  data-testid="button-send-chat-compact"
                >
                  <Send className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Send message (Enter)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Card className="h-64">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <MessageCircle className="h-4 w-4" />
                  Race Chat
                  {!wsConnected && <WifiOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500" />}
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="font-medium">Race Chat</p>
                <p className="text-zinc-400">
                  Chat with other participants before and after the race.
                  Chat is disabled during active typing to prevent distraction.
                </p>
                <p className="text-zinc-400 mt-1">
                  <span className="text-primary">Tip:</span> Press Enter to send, max {MAX_CHAT_LENGTH} characters.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 h-[calc(100%-4rem)]">
          <div className="flex flex-col h-full">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto pr-2 mb-2"
            >
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center py-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      No messages yet. Say hi!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <Tooltip key={msg.id || idx}>
                      <TooltipTrigger asChild>
                        <div className={`text-xs cursor-default hover:bg-muted/30 rounded px-1 py-0.5 transition-colors ${msg.isSystem ? 'text-muted-foreground italic' : ''}`}>
                          {!msg.isSystem && (
                            <span className="font-medium text-primary text-[10px] sm:text-xs">
                              {msg.username}:
                            </span>
                          )}{" "}
                          <span>{msg.message}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">
                          {msg.isSystem
                            ? "System notification"
                            : `Message from ${msg.username}`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-1">
              {sendError && (
                <div className="flex items-center gap-1 text-xs text-red-500">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{sendError}</span>
                </div>
              )}
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1">
                      <Input
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isInputDisabled ? getDisabledReason() || "Chat disabled during race" : "Type a message..."}
                        disabled={isInputDisabled}
                        maxLength={MAX_CHAT_LENGTH}
                        className={`text-xs h-7 ${sendError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        data-testid="input-chat"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-medium">
                      {isInputDisabled ? getDisabledReason() : "Message Input"}
                    </p>
                    {!isInputDisabled && (
                      <p className="text-zinc-400">Press Enter to send</p>
                    )}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={sendMessage}
                      disabled={isInputDisabled || !input.trim()}
                      className="h-7 px-2"
                      data-testid="button-send-chat"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-medium">Send Message</p>
                    <p className="text-zinc-400">Or press Enter</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center justify-between">
                {input.length > MAX_CHAT_LENGTH * 0.8 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`text-xs flex items-center gap-1 ${input.length >= MAX_CHAT_LENGTH ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {input.length >= MAX_CHAT_LENGTH && <AlertTriangle className="h-3 w-3" />}
                        {input.length}/{MAX_CHAT_LENGTH}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{input.length >= MAX_CHAT_LENGTH ? "Character limit reached!" : `${MAX_CHAT_LENGTH - input.length} characters remaining`}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : <div />}
                {!wsConnected && (
                  <div className="text-xs text-yellow-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Reconnecting...
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
