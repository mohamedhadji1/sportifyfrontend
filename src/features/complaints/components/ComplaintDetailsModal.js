import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  User,
  Calendar,
  Building,
  Send,
  Brain,
  Zap,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../../shared/ui/components/Button';
import useComplaints from '../hooks/useComplaints';

const ComplaintDetailsModal = ({ 
  complaint, 
  onClose, 
  onUpdate,
  userRole = 'Player', // 'Player', 'Manager', 'Admin'
  aiEnabled = false,
  generateAIResponse = null,
  generateResponseOptions = null,
  aiInsights = {}
}) => {
  const { addComment } = useComplaints();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [aiGeneratedResponse, setAiGeneratedResponse] = useState('');
  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [responseOptions, setResponseOptions] = useState([]);

  const getStatusDisplay = (status) => {
    const statusConfig = {
      'open': {
        color: 'bg-yellow-500/80 text-yellow-100',
        icon: <AlertCircle size={16} className="mr-2" />,
        text: 'Open'
      },
      'in-progress': {
        color: 'bg-blue-500/80 text-blue-100',
        icon: <Clock size={16} className="mr-2" />,
        text: 'In Progress'
      },
      'resolved': {
        color: 'bg-green-500/80 text-green-100',
        icon: <CheckCircle size={16} className="mr-2" />,
        text: 'Resolved'
      },
      'closed': {
        color: 'bg-gray-500/80 text-gray-100',
        icon: <XCircle size={16} className="mr-2" />,
        text: 'Closed'
      }
    };
    return statusConfig[status] || statusConfig['open'];
  };

  const getPriorityColor = (priority) => {
    const priorityColors = {
      'low': 'text-green-400',
      'medium': 'text-yellow-400',
      'high': 'text-orange-400',
      'urgent': 'text-red-400'
    };
    return priorityColors[priority] || 'text-gray-400';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'court': <Building size={16} />,
      'booking': <Calendar size={16} />,
      'payment': <MessageSquare size={16} />,
      'staff': <User size={16} />,
      'facility': <Building size={16} />,
      'team': <User size={16} />,
      'technical': <MessageSquare size={16} />,
      'other': <MessageSquare size={16} />
    };
    return icons[category] || icons['other'];
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      setCommentError('');
      await addComment(complaint._id, comment.trim());
      setComment('');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add comment:', error);
      setCommentError(error.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // AI Response Functions
  const handleGenerateAIResponse = async () => {
    if (!generateAIResponse || !aiEnabled) return;
    
    setGeneratingResponse(true);
    try {
      const response = generateAIResponse(complaint);
      setAiGeneratedResponse(response);
      setComment(response);
      
      // Also generate multiple options if function is available
      if (generateResponseOptions) {
        const options = generateResponseOptions(complaint);
        setResponseOptions(options);
      }
    } catch (error) {
      console.error('Failed to generate AI response:', error);
    } finally {
      setGeneratingResponse(false);
    }
  };

  const handleUseResponseOption = (responseText) => {
    setComment(responseText);
    setAiGeneratedResponse(responseText);
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(aiGeneratedResponse);
  };

  if (!complaint) return null;

  const statusDisplay = getStatusDisplay(complaint.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{complaint.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="font-mono">#{complaint._id.slice(-6).toUpperCase()}</span>
                <span>•</span>
                <span>{new Date(complaint.createdAt).toLocaleString()}</span>
                {complaint.submittedBy && (
                  <>
                    <span>•</span>
                    <span>by {complaint.submittedBy.userName}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors ml-4"
            >
              <X size={24} />
            </button>
          </div>

          {/* Status and Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700 p-3 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Status</div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusDisplay.color}`}>
                {statusDisplay.icon}
                {statusDisplay.text}
              </span>
            </div>

            <div className="bg-slate-700 p-3 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Category</div>
              <div className="flex items-center text-white">
                {getCategoryIcon(complaint.category)}
                <span className="ml-2 capitalize">{complaint.category}</span>
              </div>
            </div>

            <div className="bg-slate-700 p-3 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Priority</div>
              <span className={`font-semibold capitalize ${getPriorityColor(complaint.priority)}`}>
                {complaint.priority}
              </span>
            </div>
          </div>

          {/* Related To */}
          {complaint.relatedTo?.referenceName && (
            <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg mb-6">
              <div className="text-blue-300 text-sm font-medium mb-1">Related To</div>
              <div className="text-blue-200">
                {complaint.relatedTo.referenceName} ({complaint.relatedTo.type})
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <div className="text-gray-300 font-medium mb-2">Description</div>
            <div className="bg-slate-700 p-4 rounded-lg text-gray-200 whitespace-pre-wrap">
              {complaint.description}
            </div>
          </div>

          {/* Resolution (if exists) */}
          {complaint.resolution?.description && (
            <div className="mb-6">
              <div className="text-green-300 font-medium mb-2">Resolution</div>
              <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
                <div className="text-green-200 whitespace-pre-wrap mb-2">
                  {complaint.resolution.description}
                </div>
                {complaint.resolution.resolvedBy && (
                  <div className="text-green-400 text-sm">
                    Resolved by {complaint.resolution.resolvedBy.adminName} on{' '}
                    {new Date(complaint.resolution.resolvedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments/Responses */}
          <div className="mb-6">
            <div className="text-gray-300 font-medium mb-3">
              Comments & Responses ({complaint.comments?.length || 0})
            </div>
            
            {complaint.comments?.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {complaint.comments.map((comment, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      comment.authorRole === 'Player' 
                        ? 'bg-slate-700' 
                        : 'bg-blue-900/20 border border-blue-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">{comment.authorName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          comment.authorRole === 'Admin' 
                            ? 'bg-red-500/20 text-red-300'
                            : comment.authorRole === 'Manager'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {comment.authorRole}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className={`text-sm ${
                      comment.authorRole === 'Player' ? 'text-gray-300' : 'text-blue-200'
                    }`}>
                      {comment.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                <p>No comments yet</p>
              </div>
            )}
          </div>

          {/* AI Response Generator - Only for Managers/Admins */}
          {aiEnabled && (userRole === 'Manager' || userRole === 'Admin') && complaint.status !== 'closed' && (
            <div className="border-t border-slate-600 pt-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-purple-300">
                  <Brain className="mr-2" size={20} />
                  <span className="font-medium">🤖 AI Response Generator</span>
                </div>
                <Button
                  onClick={handleGenerateAIResponse}
                  disabled={generatingResponse}
                  variant="secondary"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {generatingResponse ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="mr-2" />
                      Generate Response
                    </>
                  )}
                </Button>
              </div>

              {/* AI Insights Display */}
              {aiInsights.sentimentAnalysis && aiInsights.sentimentAnalysis[complaint._id] && (
                <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-300 mb-2">🔍 AI Analysis:</div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400">Sentiment:</span>
                      <div className={`font-medium capitalize ${
                        aiInsights.sentimentAnalysis[complaint._id].sentiment === 'very_negative' ? 'text-red-400' :
                        aiInsights.sentimentAnalysis[complaint._id].sentiment === 'negative' ? 'text-orange-400' :
                        aiInsights.sentimentAnalysis[complaint._id].sentiment === 'positive' ? 'text-green-400' :
                        'text-gray-300'
                      }`}>
                        {aiInsights.sentimentAnalysis[complaint._id].sentiment.replace('_', ' ')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Urgency:</span>
                      <div className="text-purple-300 font-medium capitalize">
                        {aiInsights.sentimentAnalysis[complaint._id].urgency}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Priority:</span>
                      <div className="text-blue-300 font-medium capitalize">
                        {aiInsights.sentimentAnalysis[complaint._id].suggestedPriority}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Response Options */}
              {responseOptions.length > 0 && (
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-gray-300">Select a response style:</div>
                  {responseOptions.map((option) => (
                    <div key={option.id} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-purple-300 font-medium">
                          ✨ {option.tone} Style
                        </span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUseResponseOption(option.response)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Use This
                          </Button>
                          <Button
                            onClick={() => navigator.clipboard.writeText(option.response)}
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                          >
                            <Copy size={12} />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 max-h-24 overflow-y-auto">
                        {option.response.substring(0, 200)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Single Generated Response */}
              {aiGeneratedResponse && responseOptions.length === 0 && (
                <div className="bg-slate-700/30 rounded-lg p-4 mb-4 border border-purple-500/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-purple-300 font-medium">🤖 AI Generated Response</span>
                    <Button
                      onClick={handleCopyResponse}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Copy size={12} className="mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="text-sm text-gray-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {aiGeneratedResponse}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Comment */}
          {complaint.status !== 'closed' && (
            <div className="border-t border-slate-600 pt-4">
              <div className="text-gray-300 font-medium mb-3">
                Add {userRole === 'Player' ? 'Comment' : 'Response'}
              </div>
              {commentError && (
                <div className="mb-3 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {commentError}
                </div>
              )}
              <div className="flex gap-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={`Type your ${userRole === 'Player' ? 'comment' : 'response'}...`}
                  rows={3}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={submitting || !comment.trim()}
                  variant="primary"
                  className="self-end"
                >
                  <Send size={16} className="mr-1" />
                  {submitting ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          )}

          {complaint.status === 'closed' && (
            <div className="border-t border-slate-600 pt-4 text-center text-gray-400">
              <p>This complaint has been closed. No further comments can be added.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailsModal;
