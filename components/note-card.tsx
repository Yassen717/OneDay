import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Note {
  id: string;
  text: string;
  color: string;
  timestamp: Date;
}

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

export default function NoteCard({
  note,
  onDelete,
  onEdit,
  isEditing,
  onStartEdit,
  onCancelEdit
}: NoteCardProps) {
  const [editText, setEditText] = useState(note.text);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleSave = () => {
    onEdit(note.id, editText);
  };

  const handleCancel = () => {
    setEditText(note.text);
    onCancelEdit();
  };

  return (
    <div
      className={`${note.color} rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between min-h-48 group`}
      onDoubleClick={() => !isEditing && onStartEdit()}
    >
      {isEditing ? (
        <>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="text-slate-800 text-base leading-relaxed resize-none bg-white/50 border-slate-400 focus:border-slate-600"
            rows={4}
            autoFocus
          />
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="p-1 h-auto text-slate-600 hover:text-slate-800 hover:bg-white/50"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="p-1 h-auto text-green-600 hover:text-green-800 hover:bg-white/50"
            >
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-slate-800 text-base leading-relaxed break-words">
            {note.text}
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              {formatDate(note.timestamp)}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={onStartEdit}
                aria-label="Edit note"
                title="Edit note"
                className="p-1 h-auto text-slate-600 hover:text-blue-600 hover:bg-white/50"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(note.id)}
                aria-label="Delete note"
                title="Delete note"
                className="p-1 h-auto text-slate-600 hover:text-red-600 hover:bg-white/50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
