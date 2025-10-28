"use client";

import { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, Phone, PhoneOff, Activity } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "function";
  content: string;
  timestamp: Date;
  functionName?: string;
}

interface AssistantConfig {
  id: string;
  name: string;
  model?: string;
  voice?: string;
}

export default function VAPIAgentPage() {
  const { getToken } = useAuth();
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [devLogs, setDevLogs] = useState<Message[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<string>("24464697-8f45-4b38-b43a-d337f50c370e");
  const [callType, setCallType] = useState<"voice" | "text">("voice");
  const [assistants, setAssistants] = useState<AssistantConfig[]>([
    { id: "24464697-8f45-4b38-b43a-d337f50c370e", name: "Loading assistants...", model: "gpt-4", voice: "jennifer" }
  ]);
  const [showDevLogs, setShowDevLogs] = useState<boolean>(true);

  // Load assistants on mount
  useEffect(() => {
    const loadAssistants = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://peterental-vapi-github-newer.onrender.com";
        console.log("Loading assistants from:", backendUrl);

        // Get Clerk auth token
        const token = await getToken();
        if (!token) {
          throw new Error("Not authenticated - please sign in");
        }

        const response = await fetch(`${backendUrl}/vapi/assistants`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Assistants response:", data);

        // Backend returns { assistants: [...] }
        if (data.assistants && Array.isArray(data.assistants) && data.assistants.length > 0) {
          console.log(`✅ Loaded ${data.assistants.length} assistants from VAPI`);
          setAssistants(data.assistants);
          setSelectedAssistant(data.assistants[0].id);
          addDevLog("system", `✅ Loaded ${data.assistants.length} VAPI assistants`);
        } else {
          console.error("No assistants found in response:", data);
          addDevLog("system", "⚠️ No assistants found in backend response");
        }
      } catch (error) {
        console.error("Error loading assistants:", error);
        addDevLog("system", `❌ Error loading assistants: ${error instanceof Error ? error.message : error}`);
        // Keep default assistant so page doesn't break
      }
    };

    loadAssistants();
  }, []);

  useEffect(() => {
    // Initialize VAPI client
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
    console.log("VAPI Public Key loaded:", publicKey ? "Yes" : "No");
    addDevLog("system", `VAPI initialized with public key: ${publicKey ? "✅" : "❌"}`);

    if (!publicKey) {
      console.error("VAPI_PUBLIC_KEY not found in environment variables");
      addDevLog("system", "❌ VAPI_PUBLIC_KEY not found");
      return;
    }

    if (publicKey) {
      const vapiInstance = new Vapi(publicKey);
      setVapi(vapiInstance);

      // Event listeners
      vapiInstance.on("call-start", () => {
        console.log("Call started");
        setIsConnected(true);
        addMessage("assistant", "Connected! How can I help you today?");
      });

      vapiInstance.on("call-end", () => {
        console.log("Call ended");
        setIsConnected(false);
        setIsSpeaking(false);
        addMessage("assistant", "Call ended.");
      });

      vapiInstance.on("speech-start", () => {
        console.log("Assistant speaking");
        setIsSpeaking(true);
      });

      vapiInstance.on("speech-end", () => {
        console.log("Assistant stopped speaking");
        setIsSpeaking(false);
      });

      vapiInstance.on("message", (message: Record<string, unknown>) => {
        console.log("Message received:", message);

        // Log ALL messages to dev logs for debugging
        addDevLog("system", `📨 VAPI Message: ${message.type} - ${JSON.stringify(message).substring(0, 100)}`);

        // Handle different message types
        if (message.type === "transcript" && message.transcriptType === "final") {
          if (message.role === "user") {
            addMessage("user", message.transcript as string);
          } else if (message.role === "assistant") {
            addMessage("assistant", message.transcript as string);
          }
        }

        // Handle function calls
        if (message.type === "function-call") {
          const functionCall = message.functionCall as Record<string, unknown> | undefined;
          const funcName = functionCall?.name as string;
          const params = JSON.stringify(functionCall?.parameters || {});
          addMessage("function", `Calling ${funcName}...`, funcName);
          addDevLog("function", `🔧 Function call: ${funcName}\nParams: ${params}`);

          // Check if it's a calendar function to indicate Microsoft access
          if (funcName === "get_availability" || funcName === "set_appointment") {
            addDevLog("system", `🗓️ Agent accessing Microsoft Calendar via ${funcName}`);
          }
        }

        // Handle function results
        if (message.type === "function-call-result") {
          const functionCallResult = message.functionCallResult as Record<string, unknown> | undefined;
          const result = functionCallResult?.result || functionCallResult;
          const funcName = functionCallResult?.name as string;
          addMessage("function", `Result: ${JSON.stringify(result, null, 2)}`, funcName);
          addDevLog("function", `✅ Function result: ${funcName}\n${JSON.stringify(result, null, 2).substring(0, 200)}`);
        }
      });

      vapiInstance.on("error", (error: unknown) => {
        console.error("VAPI Error:", error);

        // Handle different error types
        let errorMessage = "Unknown error";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === "string") {
          errorMessage = error;
        } else if (error && typeof error === "object" && "message" in error) {
          errorMessage = String(error.message);
        } else if (error && typeof error === "object") {
          errorMessage = JSON.stringify(error);
        }

        addMessage("assistant", `Error: ${errorMessage}`);
        addDevLog("system", `❌ VAPI Error: ${errorMessage}\nFull error: ${JSON.stringify(error)}`);
      });
    }

    return () => {
      if (vapi) {
        vapi.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMessage = (role: "user" | "assistant" | "function", content: string, functionName?: string) => {
    setMessages(prev => [...prev, {
      role,
      content,
      timestamp: new Date(),
      functionName
    }]);
  };

  const addDevLog = (role: "user" | "assistant" | "function" | "system", content: string, functionName?: string) => {
    setDevLogs(prev => [...prev, {
      role: role as "user" | "assistant" | "function",
      content,
      timestamp: new Date(),
      functionName
    }]);
  };

  const startCall = async () => {
    if (!vapi) {
      addMessage("assistant", "Error: VAPI not initialized");
      addDevLog("system", "❌ VAPI not initialized");
      return;
    }

    if (!selectedAssistant) {
      addMessage("assistant", "Error: No assistant selected");
      addDevLog("system", "❌ No assistant selected");
      return;
    }

    try {
      addMessage("assistant", "Connecting...");
      addDevLog("system", `🚀 Starting call with assistant: ${selectedAssistant}`);
      // Start call with assistant ID
      await vapi.start(selectedAssistant);
      addDevLog("system", "✅ Call started successfully");
    } catch (error: unknown) {
      console.error("Failed to start call:", error);
      const errorMessage = error instanceof Error ? error.message : String(error) || "Unknown error";
      addMessage("assistant", `Error starting call: ${errorMessage}`);
      addDevLog("system", `❌ Failed to start call: ${errorMessage}`);
    }
  };

  const stopCall = () => {
    if (!vapi) {
      addDevLog("system", "❌ VAPI not initialized");
      return;
    }

    try {
      addMessage("assistant", "Disconnecting...");
      addDevLog("system", "🛑 Stopping call");
      vapi.stop();
      addDevLog("system", "✅ Call stopped successfully");
    } catch (error: unknown) {
      console.error("Error stopping call:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to stop call";
      addDevLog("system", `❌ Failed to stop call: ${errorMessage}`);
    }
  };

  const sendTextMessage = (text: string) => {
    if (!vapi || !isConnected) return;

    // Add user message to log
    addMessage("user", text);

    // Send to VAPI (text mode)
    vapi.send({
      type: "add-message",
      message: {
        role: "user",
        content: text
      }
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-800 bg-clip-text text-transparent">
            VAPI Agent Testing
          </h1>
          <p className="text-muted-foreground mt-2">
            Test voice and text conversations with your appointment setter agent
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Call Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Call Controls</CardTitle>
                <CardDescription>Start or stop a conversation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assistant Selector */}
                <div>
                  <label className="text-sm font-medium">Assistant</label>
                  <select
                    value={selectedAssistant}
                    onChange={(e) => setSelectedAssistant(e.target.value)}
                    disabled={isConnected}
                    className="w-full mt-2 p-2 border rounded-lg"
                  >
                    {assistants.map(assistant => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Call Type Toggle */}
                <div>
                  <label className="text-sm font-medium">Mode</label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant={callType === "voice" ? "default" : "outline"}
                      onClick={() => setCallType("voice")}
                      disabled={isConnected}
                      className="flex-1"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Voice
                    </Button>
                    <Button
                      variant={callType === "text" ? "default" : "outline"}
                      onClick={() => setCallType("text")}
                      disabled={isConnected}
                      className="flex-1"
                    >
                      Text
                    </Button>
                  </div>
                </div>

                {/* Start/Stop Button */}
                {!isConnected ? (
                  <Button
                    onClick={startCall}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Start Call
                  </Button>
                ) : (
                  <Button
                    onClick={stopCall}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <PhoneOff className="w-5 h-5 mr-2" />
                    End Call
                  </Button>
                )}

                {/* Status Indicators */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={isConnected ? "bg-green-600" : "bg-gray-400"}>
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  {isConnected && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">AI Speaking:</span>
                      <div className="flex items-center gap-2">
                        {isSpeaking && <Activity className="w-4 h-4 text-blue-600 animate-pulse" />}
                        <Badge variant={isSpeaking ? "default" : "secondary"}>
                          {isSpeaking ? "Speaking" : "Listening"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Function Info */}
            <Card>
              <CardHeader>
                <CardTitle>Available Functions</CardTitle>
                <CardDescription>Functions the agent can call</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <div className="font-semibold">get_availability</div>
                    <div className="text-xs text-muted-foreground">
                      Check available viewing times for properties
                    </div>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3">
                    <div className="font-semibold">set_appointment</div>
                    <div className="text-xs text-muted-foreground">
                      Book a property viewing appointment
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Test Messages */}
            {isConnected && callType === "text" && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Tests</CardTitle>
                  <CardDescription>Common test phrases</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={() => sendTextMessage("What times are available for 123 Main Street?")}
                  >
                    Check availability
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={() => sendTextMessage("Book me for 2pm tomorrow at 123 Main Street")}
                  >
                    Book appointment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Middle Column - Conversation Log */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader>
                <CardTitle>Conversation Log</CardTitle>
                <CardDescription>
                  Real-time transcript and function calls
                  {messages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMessages([])}
                      className="ml-4"
                    >
                      Clear
                    </Button>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No messages yet. Start a call to begin testing.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${message.role === "user"
                          ? "bg-blue-50 border-blue-200 ml-8"
                          : message.role === "assistant"
                            ? "bg-gray-50 border-gray-200 mr-8"
                            : "bg-yellow-50 border-yellow-200"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge
                            variant={
                              message.role === "user"
                                ? "default"
                                : message.role === "assistant"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {message.role === "user" ? "👤 You" : message.role === "assistant" ? "🤖 AI" : "🔧 Function"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        {message.functionName && (
                          <div className="text-xs font-mono text-purple-600 mb-1">
                            {message.functionName}
                          </div>
                        )}
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Dev Logs */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Dev Logs</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDevLogs(!showDevLogs)}
                  >
                    {showDevLogs ? "Hide" : "Show"}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Behind-the-scenes activity
                  {devLogs.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDevLogs([])}
                      className="ml-4"
                    >
                      Clear
                    </Button>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showDevLogs ? (
                  <Alert>
                    <AlertDescription>
                      Dev logs hidden. Click &quot;Show&quot; to see activity.
                    </AlertDescription>
                  </Alert>
                ) : devLogs.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No dev logs yet. Activity will appear here.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto font-mono text-xs">
                    {devLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded border ${log.role === "function"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-gray-50 border-gray-200"
                          }`}
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {formatTime(log.timestamp)}
                        </div>
                        <div className="whitespace-pre-wrap break-words">
                          {log.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
