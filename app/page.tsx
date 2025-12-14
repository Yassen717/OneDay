'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Loader2, Download, Upload } from 'lucide-react';
import NoteCard from '@/components/note-card';
import { ThemeToggle } from '@/components/theme-toggle';

interface Note {
  id: string;
  text: string;
  color: string;
  timestamp: Date;
}

const COLORS = [
  'bg-orange-200',
  'bg-blue-200',
  'bg-green-200',
  'bg-pink-200',
  'bg-purple-200',
  'bg-yellow-200',
  'bg-cyan-200',
  'bg-rose-200',
];

const MAX_NOTE_LENGTH = 500;

export default function OneDay() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('oneday-notes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        // Convert timestamp strings back to Date objects
        const notesWithDates = parsedNotes.map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp),
        }));
        setNotes(notesWithDates);
      } catch (error) {
        console.error('Failed to parse saved notes:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    // Skip saving on initial load
    if (isLoading) return;

    try {
      localStorage.setItem('oneday-notes', JSON.stringify(notes));
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof DOMException && (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        toast.error('Storage limit reached! Please delete some notes or export your data.');
      } else {
        console.error('Failed to save notes to localStorage:', error);
        toast.error('Failed to save notes. Please try again.');
      }
    }
  }, [notes, isLoading]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl+N or Cmd+N: Focus new note input
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        noteInputRef.current?.focus();
      }
      // Escape: Clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const getRandomColor = () => {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  const sanitizeInput = (text: string): string => {
    return text.trim().replace(/\s+/g, ' ');
  };

  const addNote = () => {
    const sanitizedText = sanitizeInput(input);

    // Validate input
    if (sanitizedText === '') return;
    if (sanitizedText.length > MAX_NOTE_LENGTH) return;

    const newNote: Note = {
      id: uuidv4(),
      text: sanitizedText,
      color: getRandomColor(),
      timestamp: new Date(),
    };

    setNotes([newNote, ...notes]);
    setInput('');
    toast.success('Note created successfully!');
  };

  const deleteNote = (id: string) => {
    setDeleteNoteId(id);
  };

  const confirmDelete = () => {
    if (deleteNoteId) {
      setNotes(notes.filter(note => note.id !== deleteNoteId));
      toast.success('Note deleted');
      setDeleteNoteId(null);
    }
  };

  const editNote = (id: string, newText: string) => {
    const sanitizedText = sanitizeInput(newText);
    if (sanitizedText === '' || sanitizedText.length > MAX_NOTE_LENGTH) return;

    setNotes(notes.map(note =>
      note.id === id ? { ...note, text: sanitizedText } : note
    ));
    setEditingNoteId(null);
    toast.success('Note updated');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addNote();
    }
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(note =>
    note.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-50 mb-2 text-balance">
              OneDay
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Capture your ideas and thoughts in one place
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {notes.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={exportNotes}
                  className="w-10 h-10 rounded-full"
                  title="Export notes"
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById('import-file')?.click()}
                  className="w-10 h-10 rounded-full"
                  title="Import notes"
                >
                  <Upload className="h-5 w-5" />
                </Button>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={importNotes}
                  className="hidden"
                />
              </>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <div className="flex gap-2">
            <Input
              ref={noteInputRef}
              type="text"
              placeholder="What's on your mind today?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_NOTE_LENGTH}
              className="flex-1 h-12 text-base"
            />
            <Button
              onClick={addNote}
              size="lg"
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-6 h-12 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </Button>
          </div>
          <div className="mt-2 flex justify-end">
            <span className={`text-xs ${input.length > MAX_NOTE_LENGTH * 0.9 ? 'text-orange-600 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
              {input.length}/{MAX_NOTE_LENGTH}
            </span>
          </div>
        </div>

        {/* Search Section */}
        {notes.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search notes... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Found {filteredNotes.length} of {notes.length} notes
              </p>
            )}
          </div>
        )}

        {/* Notes Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Loading your notes...
            </p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-slate-500 dark:text-slate-400">
              Start by adding your first idea or note!
            </p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-slate-500 dark:text-slate-400">
              No notes found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onDelete={deleteNote}
                onEdit={editNote}
                isEditing={editingNoteId === note.id}
                onStartEdit={() => setEditingNoteId(note.id)}
                onCancelEdit={() => setEditingNoteId(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteNoteId !== null} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}