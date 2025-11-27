import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMemes } from '../context/MemeContext';
import formatDate from '../utils/formatDate';
import type { Comment as CommentType, User } from '../types';

interface CommentItemProps {
  comment: CommentType;
  user: User | null;
  replyingTo: number | null;
  setReplyingTo: React.Dispatch<React.SetStateAction<number | null>>;
  replyText: string;
  setReplyText: React.Dispatch<React.SetStateAction<string>>;
  handleReply: (parentId: number) => Promise<void>;
  editingComment: number | null;
  setEditingComment: React.Dispatch<React.SetStateAction<number | null>>;
  editText: string;
  setEditText: React.Dispatch<React.SetStateAction<string>>;
  handleEditComment: (commentId: number) => Promise<void>;
  handleDeleteComment: (commentId: number) => Promise<void>;
  depth?: number;
}

const CommentItem = ({
  comment,
  user,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  handleReply,
  editingComment,
  setEditingComment,
  editText,
  setEditText,
  handleEditComment,
  handleDeleteComment,
  depth = 0
}: CommentItemProps) => {
  const isDeleted = comment.is_deleted === 1;
  const isOwner = user?.id === comment.user_id;
  const canDelete = isOwner || user?.role === 'admin' || user?.role === 'moderator';
  const hasReplies = !!comment.replies && comment.replies.length > 0;

  return (
    <div
      className={`${depth > 0 ? 'ml-6 border-l-2 pl-4 border-gray-200' : ''} ${
        depth === 0 ? 'border-b pb-4' : 'pb-2'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {comment.authorName} {comment.authorSurname}
            </span>
            <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
          </div>
          {editingComment === comment.id ? (
            <div className="mt-2">
              <textarea
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                className="w-full p-2 border rounded resize-none text-sm"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => void handleEditComment(comment.id)}
                  disabled={!editText.trim()}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setEditingComment(null);
                    setEditText('');
                  }}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-sm whitespace-pre-wrap ${isDeleted ? 'text-gray-400 italic' : 'text-gray-700'}`}>
              {isDeleted ? 'Комментарий удален' : comment.text}
            </p>
          )}
          {!isDeleted && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                  setReplyText('');
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {replyingTo === comment.id ? 'Отмена' : 'Ответить'}
              </button>
              {isOwner && (
                <button
                  onClick={() => {
                    setEditingComment(comment.id);
                    setEditText(comment.text);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Редактировать
                </button>
              )}
            </div>
          )}
          {replyingTo === comment.id && (
            <div className="mt-2">
              <textarea
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Написать ответ..."
                className="w-full p-2 border rounded resize-none text-sm"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => void handleReply(comment.id)}
                  disabled={!replyText.trim()}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Отправить
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
        {canDelete && editingComment !== comment.id && (
          <button
            onClick={() => void handleDeleteComment(comment.id)}
            className="ml-2 text-red-600 hover:text-red-800 text-sm"
            title="Удалить комментарий"
          >
            ✕
          </button>
        )}
      </div>
      {hasReplies && comment.replies && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
              editingComment={editingComment}
              setEditingComment={setEditingComment}
              editText={editText}
              setEditText={setEditText}
              handleEditComment={handleEditComment}
              handleDeleteComment={handleDeleteComment}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CommentsProps {
  memeId: number;
}

const Comments = ({ memeId }: CommentsProps) => {
  const { authFetch, user } = useAuth();
  const { refreshMemes } = useMemes();

  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const loadComments = useCallback(async () => {
    if (!memeId) return;
    setIsLoadingComments(true);
    try {
      const res = await authFetch(`/api/comments/meme/${memeId}`);
      if (res.ok) {
        const data: CommentType[] = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [authFetch, memeId]);

  useEffect(() => {
    if (memeId) {
      void loadComments();
    }
  }, [memeId, loadComments]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !memeId) return;
    try {
      const res = await authFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meme_id: memeId, text: newComment.trim() })
      });
      if (res.ok) {
        setNewComment('');
        await loadComments();
        await refreshMemes();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleReply = async (parentId: number) => {
    if (!replyText.trim() || !memeId) return;
    try {
      const res = await authFetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meme_id: memeId, text: replyText.trim(), parent_id: parentId })
      });
      if (res.ok) {
        setReplyText('');
        setReplyingTo(null);
        await loadComments();
        await refreshMemes();
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editText.trim()) return;
    try {
      const res = await authFetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText.trim() })
      });
      if (res.ok) {
        setEditText('');
        setEditingComment(null);
        await loadComments();
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const res = await authFetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await loadComments();
        await refreshMemes();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const countComments = (items: CommentType[]): number =>
    items.reduce((acc, current) => {
      const repliesCount = current.replies ? countComments(current.replies) : 0;
      return acc + 1 + repliesCount;
    }, 0);

  const totalComments = countComments(comments);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Комментарии ({totalComments})</h3>

      <div className="mb-4">
        <textarea
          value={newComment}
          onChange={(event) => setNewComment(event.target.value)}
          placeholder="Оставить комментарий..."
          className="w-full p-2 border rounded resize-none"
          rows={3}
        />
        <button
          onClick={() => void handleAddComment()}
          disabled={!newComment.trim()}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Отправить
        </button>
      </div>

      {isLoadingComments ? (
        <div className="text-gray-500">Загрузка комментариев...</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-500">Пока нет комментариев</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              user={user}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
              editingComment={editingComment}
              setEditingComment={setEditingComment}
              editText={editText}
              setEditText={setEditText}
              handleEditComment={handleEditComment}
              handleDeleteComment={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comments;


