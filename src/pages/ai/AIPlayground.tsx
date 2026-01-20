import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  SentIcon,
  Add01Icon,
  UserIcon,
  Settings01Icon,
  Delete02Icon,
  ComputerVideoIcon,
  RobotIcon,
  AiChat02Icon,
  LeftToRightListNumberIcon,
  Copy01Icon,
} from '@hugeicons/core-free-icons';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  avatar?: string;
}

interface ChatSession {
  id: string;
  title: string;
  agent_id: string;
  last_message_at: string;
  created: string;
  expand?: {
    agent_id: Agent;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created: string;
}

export function AIPlayground() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('已复制到剪贴板');
    } catch (err) {
      toast.error('复制失败');
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (currentSession) {
      fetchMessages(currentSession.id);
    } else {
      setMessages([]);
    }
  }, [currentSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchAgents = async () => {
    try {
      const records = await pb.collection('ai_agents').getFullList<Agent>({
        requestKey: null
      });
      setAgents(records);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Fetch agents error:', error);
      }
    }
  };

  const fetchSessions = async () => {
    try {
      const records = await pb.collection('ai_chat_sessions').getFullList<ChatSession>({
        sort: '-last_message_at',
        expand: 'agent_id',
        requestKey: null
      });
      setSessions(records);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Fetch sessions error:', error);
      }
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const records = await pb.collection('ai_chat_messages').getFullList<ChatMessage>({
        filter: `session_id = "${sessionId}"`,
        sort: 'created',
        requestKey: null
      });
      setMessages(records);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Fetch messages error:', error);
      }
    }
  };

  const createNewSession = async (agent: Agent) => {
    if (!user) {
      toast.error('请先登录');
      return;
    }
    try {
      const payload = {
        user_id: user.id,
        agent_id: agent.id,
        title: `与 ${agent.name} 的对话`,
      };
      const session = await pb.collection('ai_chat_sessions').create(payload);

      // Construct full session object without re-fetching to avoid potential expand issues
      const newSession: ChatSession = {
        ...session,
        expand: {
          agent_id: agent
        }
      } as any;

      setSessions([newSession, ...sessions]);
      setCurrentSession(newSession);
      toast.success('新会话已开启');
    } catch (error: any) {
      console.error('Create session error details:', JSON.stringify(error.data, null, 2));
      toast.error('创建会话失败: ' + (error.message || '未知错误'));
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await pb.collection('ai_chat_sessions').delete(id);
      setSessions(sessions.filter(s => s.id !== id));
      if (currentSession?.id === id) {
        setCurrentSession(null);
      }
      toast.success('会话已删除');
    } catch (error) {
      toast.error('删除会话失败');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSession || isLoading) return;

    const userContent = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // 1. Prepare UI immediately
      const tempUserMsg: ChatMessage = {
        id: 'temp-user-' + Date.now(),
        role: 'user',
        content: userContent,
        created: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempUserMsg]);

      // 2. Start saving user message and calling AI in parallel
      const saveUserMsgPromise = pb.collection('ai_chat_messages').create({
        session_id: currentSession.id,
        role: 'user',
        content: userContent,
      });

      // 3. Call AI via Vite Proxy
      try {
        const proxyUrl = '/api/llm/chat/completions';
        const model = import.meta.env.VITE_ALI_LLM_MODEL || 'qwen-turbo';

        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: currentSession.expand?.agent_id?.system_prompt || 'You are a helpful assistant.' },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: userContent }
            ],
            stream: true // Enable streaming
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'AI 响应错误');
        }

        // Wait for user message to be saved to replace temp ID (optional, but good for consistency)
        const savedUserMsg = await saveUserMsgPromise;
        setMessages(prev => prev.map(msg => msg.id === tempUserMsg.id ? (savedUserMsg as any) : msg));

        // Initialize empty assistant message
        let aiContent = '';
        // Create a temporary message in UI state to show streaming content
        const tempMsgId = 'temp-ai-' + Date.now();
        const tempMsg: ChatMessage = {
          id: tempMsgId,
          role: 'assistant',
          content: '',
          created: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);

        // Process the stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

              const data = trimmedLine.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  aiContent += content;
                  // Update UI with accumulated content
                  const currentContent = aiContent; // Capture current state of aiContent
                  setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.id === tempMsgId) {
                      return [...prev.slice(0, -1), { ...lastMsg, content: currentContent }];
                    }
                    return prev;
                  });
                }
              } catch (e) {
                console.error('Error parsing stream chunk:', e);
              }
            }
          }
        }

        // Save the final complete message to database
        const aiMsg = await pb.collection('ai_chat_messages').create({
          session_id: currentSession.id,
          role: 'assistant',
          content: aiContent,
        });

        // Replace temp message with actual database record
        setMessages(prev => prev.map(msg =>
          msg.id === tempMsgId
            ? (aiMsg as any)
            : msg
        ));

      } catch (err) {
        console.error('LLM API Error:', err);
        toast.error('大模型调用失败');
      } finally {
        setIsLoading(false);
        // Update session last_message_at (optional, wrapped in try-catch to avoid breaking chat)
        try {
          await pb.collection('ai_chat_sessions').update(currentSession.id, {
            last_message_at: new Date().toISOString(),
          });
        } catch (e) {
          // ignore if field doesn't exist
        }
        fetchSessions();
      }
    } catch (error) {
      console.error('Save message error:', error);
      toast.error('发送消息失败');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      {/* Sessions Sidebar */}
      <div className={cn(
        "flex flex-col border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300",
        isSidebarOpen ? "w-80" : "w-0 overflow-hidden"
      )}>
        <div className="p-4 space-y-4 border-b border-neutral-200 dark:border-neutral-800">
          <Button
            className="w-full justify-start p-5 bg-blue-100 border-1 border-blue-300 text-blue-700 hover:bg-blue-200 rounded-2xl"
            onClick={() => setCurrentSession(null)}
          >
            <HugeiconsIcon icon={Add01Icon} className="h-5 w-5" />
            <span className="font-medium">新对话</span>
          </Button>

          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">历史对话</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSidebarOpen(false)}>
              <HugeiconsIcon icon={LeftToRightListNumberIcon} className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSession(session)}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                  currentSession?.id === session.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                )}
              >
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10 border border-neutral-200 dark:border-neutral-700">
                    <AvatarImage src={session.expand?.agent_id.avatar ? pb.files.getURL(session.expand.agent_id, session.expand.agent_id.avatar) : ''} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {session.expand?.agent_id.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-medium truncate text-sm">{session.title}</p>
                    <span className="text-[10px] opacity-60">
                      {session.last_message_at ? format(new Date(session.last_message_at), 'MM-dd') : format(new Date(session.created), 'MM-dd')}
                    </span>
                  </div>
                  <p className="text-xs truncate opacity-70">
                    {session.expand?.agent_id.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  onClick={(e) => deleteSession(session.id, e)}
                >
                  <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-50/50 dark:bg-neutral-950/20 relative">
        {/* Reopen Sidebar Button - Floating */}
        {!isSidebarOpen && (
          <div className="absolute top-4 left-4 z-50">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl bg-white dark:bg-neutral-900 shadow-md border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
              onClick={() => setIsSidebarOpen(true)}
            >
              <HugeiconsIcon icon={LeftToRightListNumberIcon} className="h-5 w-5" />
            </Button>
          </div>
        )}

        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className={cn(
              "p-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between transition-all",
              !isSidebarOpen && "pl-16"
            )}>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentSession.expand?.agent_id.avatar ? pb.files.getURL(currentSession.expand.agent_id, currentSession.expand.agent_id.avatar) : ''} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {currentSession.expand?.agent_id.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                    {currentSession.expand?.agent_id.name}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {currentSession.expand?.agent_id.description}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full">
                  <HugeiconsIcon icon={RobotIcon} className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <HugeiconsIcon icon={Settings01Icon} className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg, index) => {
                  const isLast = index === messages.length - 1;
                  const showLoading = isLast && isLoading && msg.role === 'assistant';

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-4",
                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        {msg.role === 'user' ? (
                          <>
                            <AvatarImage src={user?.avatar ? pb.files.getURL(user, user.avatar) : ''} />
                            <AvatarFallback className="bg-neutral-200 dark:bg-neutral-800">
                              <HugeiconsIcon icon={UserIcon} className="h-5 w-5" />
                            </AvatarFallback>
                          </>
                        ) : (
                          <>
                            <AvatarImage src={currentSession.expand?.agent_id.avatar ? pb.files.getURL(currentSession.expand.agent_id, currentSession.expand.agent_id.avatar) : ''} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              <HugeiconsIcon icon={RobotIcon} className="h-5 w-5" />
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className={cn(
                        "flex flex-col gap-1 max-w-[80%]",
                        msg.role === 'user' ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm leading-relaxed relative overflow-hidden group/bubble",
                          msg.role === 'user'
                            ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                            : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-none shadow-sm prose dark:prose-invert prose-sm max-w-none"
                        )}>
                          {msg.role === 'assistant' ? (
                            <>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                              {showLoading && (
                                <div className={cn(
                                  "flex items-center gap-1.5 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 animate-in fade-in duration-500",
                                  !msg.content && "border-none mt-0 pt-0"
                                )}>
                                  <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"></span>
                                  </div>
                                  <span className="text-[10px] font-medium text-blue-500/70 dark:text-blue-400/70 uppercase tracking-wider">
                                    {msg.content ? '正在输出' : '正在思考'}
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            msg.content
                          )}

                          {/* Shimmer effect background when empty and loading */}
                          {showLoading && !msg.content && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/10 dark:via-blue-900/5 to-transparent -translate-x-full animate-shimmer" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 px-1">
                          <span className="text-[10px] text-neutral-400">
                            {format(new Date(msg.created), 'HH:mm')}
                          </span>
                          {msg.role === 'assistant' && msg.content && (
                            <button
                              onClick={() => handleCopy(msg.content)}
                              className="flex items-center gap-1 text-[10px] font-medium text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              <HugeiconsIcon
                                icon={Copy01Icon}
                                className={cn("h-3 w-3")}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
              <div className="max-w-3xl mx-auto flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    placeholder="输入消息..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="pr-12 py-6 rounded-2xl border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus-visible:ring-blue-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-neutral-400">
                      <HugeiconsIcon icon={ComputerVideoIcon} className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="rounded-2xl h-12 w-12 bg-blue-600 hover:bg-blue-700 p-0 shadow-lg shadow-blue-500/20"
                >
                  <HugeiconsIcon icon={SentIcon} className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center text-blue-600 mb-6">
              <HugeiconsIcon icon={AiChat02Icon} className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">欢迎来到 AI 助手</h3>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-8">
              选择一个智能体开始对话，或者从下方创建一个新的会话。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className="group hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
                  onClick={() => createNewSession(agent)}
                >
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-12 w-12 ring-2 ring-neutral-50 dark:ring-neutral-800">
                        <AvatarImage src={agent.avatar ? pb.files.getURL(agent, agent.avatar) : ''} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {agent.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <h4 className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 transition-colors">
                          {agent.name}
                        </h4>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0 h-4">
                          智能体
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 text-left line-clamp-2">
                      {agent.description}
                    </p>
                    <div className="mt-4 flex justify-end">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {agents.length === 0 && (
                <div className="col-span-full py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
                  <p className="text-neutral-400">暂无可用智能体，请联系管理员配置</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
