'use client';

import { useState } from 'react';
import { AlertCircle, Info, AlertTriangle, XCircle, Sparkles, Loader2, MessageCircle, TrendingUp, Activity, Bell } from 'lucide-react';
import type { Recommendation } from '@/app/types/pnode-detail';

interface Props {
  recommendations: Recommendation[];
  nodeData: any;
  darkMode: boolean;
}

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function Recommendations({ recommendations, nodeData, darkMode }: Props) {
  const [aiReview, setAiReview] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());

  const suggestedQuestions = [
    {
      id: 'health',
      icon: Activity,
      question: "Is my node healthy right now?",
      color: "from-green-500 to-emerald-500",
      borderColor: "border-green-500/30"
    },
    {
      id: 'earnings',
      icon: TrendingUp,
      question: "Am I earning what I should be earning?",
      color: "from-yellow-500 to-orange-500",
      borderColor: "border-orange-500/30"
    },
    {
      id: 'action',
      icon: Bell,
      question: "Do I need to take any action?",
      color: "from-purple-500 to-pink-500",
      borderColor: "border-purple-500/30"
    }
  ];

  const generateAIAnalysis = async () => {
    if (!nodeData) {
      setError('Node data is not available');
      return;
    }
    
    setIsAiLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate AI review');
      }

      const result = await response.json();
      setAiReview(result.review);
      setHasGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate AI insights. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const askQuestion = async (questionId: string, question: string) => {
    setChatMessages(prev => [...prev, {
      type: 'user',
      content: question,
      timestamp: new Date()
    }]);

    setAskedQuestions(prev => new Set(prev).add(questionId));
    setIsAsking(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question,
          nodeData,
          recommendations 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const result = await response.json();
      
      setChatMessages(prev => [...prev, {
        type: 'ai',
        content: result.answer,
        timestamp: new Date()
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        type: 'ai',
        content: "I'm having trouble answering that right now. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsAsking(false);
    }
  };

  const cardClass = darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200';
  
  const getSeverityConfig = (severity: Recommendation['severity']) => {
    switch (severity) {
      case 'critical': return { icon: XCircle, bgClass: 'bg-red-500/10', textClass: 'text-red-400', borderClass: 'border-red-500/20' };
      case 'high': return { icon: AlertCircle, bgClass: 'bg-orange-500/10', textClass: 'text-orange-400', borderClass: 'border-orange-500/20' };
      case 'medium': return { icon: AlertTriangle, bgClass: 'bg-yellow-500/10', textClass: 'text-yellow-400', borderClass: 'border-yellow-500/20' };
      default: return { icon: Info, bgClass: 'bg-blue-500/10', textClass: 'text-blue-400', borderClass: 'border-blue-500/20' };
    }
  };

  const availableQuestions = suggestedQuestions.filter(q => !askedQuestions.has(q.id));

  return (
    <div className={`p-6 rounded-xl border ${cardClass} space-y-6 shadow-xl`}>
      
      {/* AI INSIGHTS SECTION */}
      <div className={`p-5 rounded-lg border-2 border-purple-500/30 bg-gradient-to-br ${darkMode ? 'from-purple-900/20 to-transparent' : 'from-purple-50/50 to-white'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              XandExpert AI Review
            </h2>
          </div>
          
          {!hasGenerated && (
            <button
              onClick={generateAIAnalysis}
              disabled={isAiLoading}
              className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition ${
                isAiLoading
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Analysis
                </>
              )}
            </button>
          )}
        </div>

        {!hasGenerated && !isAiLoading && (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Get an AI-powered analysis of your node's performance using Llama 3.3 70B.
          </p>
        )}

        {isAiLoading && (
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing node performance with AI...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <XCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {hasGenerated && aiReview && (
          <div>
            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-black/20' : 'bg-white/50'}`}>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {aiReview}
              </p>
            </div>

            {/* CHAT INTERFACE */}
            {chatMessages.length > 0 && (
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          : darkMode
                          ? 'bg-gray-800 text-gray-200'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.type === 'ai' && (
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="w-3 h-3 text-purple-400" />
                          <span className="text-xs font-semibold text-purple-400">XandExpert</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                
                {isAsking && (
                  <div className="flex justify-start">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUGGESTED QUESTIONS */}
            {availableQuestions.length > 0 && (
              <div className="space-y-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-500'} mb-2`}>
                  Quick Insights
                </p>
                <div className="grid gap-1.5">
                  {availableQuestions.map((q) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={q.id}
                        onClick={() => askQuestion(q.id, q.question)}
                        disabled={isAsking}
                        className={`group relative overflow-hidden px-3 py-2 rounded-md border transition-all text-left ${
                          darkMode 
                            ? 'border-gray-700 hover:border-purple-500/50 bg-gray-800/20 hover:bg-gray-800/40' 
                            : 'border-gray-200 hover:border-purple-400/50 bg-white/50 hover:bg-purple-50/50'
                        } ${isAsking ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded bg-gradient-to-br ${q.color} text-white flex-shrink-0`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {q.question}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <hr className={darkMode ? 'border-gray-800' : 'border-gray-100'} />

      {/* STANDARD RECOMMENDATIONS */}
      <div>
        <h2 className="text-xl font-bold mb-4">Action Items</h2>
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <div className="flex items-center gap-2 text-green-500">
              <Activity className="w-4 h-4" />
              <p className="text-sm font-medium">Your node is perfectly optimized</p>
            </div>
          ) : (
            recommendations.map((rec, idx) => {
              const config = getSeverityConfig(rec.severity);
              const Icon = config.icon;
              return (
                <div key={idx} className={`p-4 rounded-lg border ${config.borderClass} ${config.bgClass}`}>
                  <div className="flex gap-3">
                    <Icon className={`w-5 h-5 ${config.textClass} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{rec.category}</span>
                      </div>
                      <p className="text-sm mb-2">{rec.message}</p>
                      <div className={`text-xs p-2 rounded ${darkMode ? 'bg-black/20 text-gray-400' : 'bg-white/50 text-gray-600'}`}>
                        <strong className={config.textClass}>Recommended Action:</strong> {rec.action}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}