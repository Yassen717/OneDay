import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Note {
  id: string;
  text: string;
  color: string;
  timestamp: Date;
}

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, onDelete }: NoteCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div
      className={`${note.color} rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between min-h-48 group`}
    >
      <p className="text-slate-800 text-base leading-relaxed break-words">
        {note.text}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-600 font-medium">
          {formatDate(note.timestamp)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(note.id)}
          aria-label="Delete note"
          title="Delete note"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-slate-600 hover:text-red-600 hover:bg-white/50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
