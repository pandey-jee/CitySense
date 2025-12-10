// Enhanced Issue Card component with voting, commenting, and location
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { voteOnIssue, addComment, getLocationName } from '../../services/database';
import IssueMapModal from './IssueMapModal';

const IssueCard = ({ issue, onUpdate }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [locationName, setLocationName] = useState('Loading location...');

  // Get location name from coordinates
  useEffect(() => {
    if (issue.latitude && issue.longitude) {
      getLocationName(issue.latitude, issue.longitude)
        .then(name => setLocationName(name))
        .catch(() => setLocationName(`${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`));
    }
  }, [issue.latitude, issue.longitude]);

  const handleVote = async (voteType) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    try {
      await voteOnIssue(issue.id, user.uid, voteType);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote. Please try again.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      await addComment(issue.id, {
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        text: newComment.trim(),
        timestamp: new Date().toISOString()
      });
      setNewComment('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-100 text-red-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      case 5: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const userVote = issue.votes?.find(vote => vote.userId === user?.uid);
  const upvotes = issue.votes?.filter(vote => vote.type === 'up').length || 0;
  const downvotes = issue.votes?.filter(vote => vote.type === 'down').length || 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 transform hover:-translate-y-1">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{issue.title}</h3>
          <p className="text-gray-600 mb-4 leading-relaxed">{issue.description}</p>
          
          {/* Location */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>📍 {locationName}</span>
            </div>
            {issue.latitude && issue.longitude && (
              <button
                onClick={() => setShowMapModal(true)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center font-medium transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                </svg>
                View on Map
              </button>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-sm font-medium">
              {issue.category}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(issue.status)}`}>
              {issue.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(issue.severity)}`}>
              Severity {issue.severity}
            </span>
          </div>
        </div>
        
        {/* Image */}
        {issue.imageURL && (
          <img
            src={issue.imageURL}
            alt="Issue"
            className="w-24 h-24 object-cover rounded-xl ml-4 shadow-md"
          />
        )}
      </div>

      {/* Voting Section */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center space-x-3">
          {/* Upvote */}
          <button
            onClick={() => handleVote('up')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              userVote?.type === 'up' 
                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:scale-105'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{upvotes}</span>
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote('down')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
              userVote?.type === 'down' 
                ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:scale-105'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{downvotes}</span>
          </button>

          {/* Comments */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-blue-50 hover:scale-105 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{issue.comments?.length || 0}</span>
          </button>
        </div>

        {/* Timestamp and Reporter */}
        <div className="text-sm text-gray-500 text-right">
          <div className="font-medium text-gray-700">By: {issue.userName || 'Anonymous'}</div>
          <div className="text-xs">{new Date(issue.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h4 className="font-bold text-lg mb-4 flex items-center">
            <span className="mr-2">💬</span>
            Comments ({issue.comments?.length || 0})
          </h4>
          
          {/* Existing Comments */}
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {issue.comments?.map((comment, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-sm text-gray-800">{comment.userName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed">{comment.text}</p>
              </div>
            )) || <p className="text-gray-500 text-sm text-center py-4">No comments yet. Be the first to comment!</p>}
          </div>

          {/* Add Comment Form */}
          {user && (
            <form onSubmit={handleAddComment} className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                Post
              </button>
            </form>
          )}
          {!user && (
            <p className="text-gray-500 text-sm text-center py-4 bg-gray-50 rounded-xl">
              Please login to add comments.
            </p>
          )}
        </div>
      )}
      
      {/* Map Modal */}
      <IssueMapModal
        issue={issue}
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
      />
    </div>
  );
};

export default IssueCard;
