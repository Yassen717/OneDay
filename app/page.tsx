'use client';

import { useState, useEffect, useRef } from 'react';
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
import { UserProfile } from '@/components/user-profile';
import { logout, User } from '@/lib/auth';

interface Note {
  id: string;
  text: string;
  color: string;
  createdAt: string;
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
  const [user, setUserState] = useState<User | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  // Token is now in httpOnly cookie, sent automatically by the browser
  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Cookie is sent automatically by the browser
        const res = await fetch('/api/auth/verify');
        
        if (!res.ok) {
          localStorage.removeItem('oneday-user');
          window.location.href = '/login';
          return;
        }

        const data = await res.json();
        setUserState(data.user);
        await fetchNotes();
      } catch (error) {
        console.error('Auth verification failed:', error);
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for notes-updated event from AI chat
    const handleNotesUpdated = () => {
      fetchNotes();
    };
    window.addEventListener("notes-updated", handleNotesUpdated);
    return () => window.removeEventListener("notes-updated", handleNotesUpdated);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        noteInputRef.current?.focus();
      }
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

  const addNote = async () => {
    const sanitizedText = sanitizeInput(input);
    if (sanitizedText === '' || sanitizedText.length > MAX_NOTE_LENGTH) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: sanitizedText, color: getRandomColor() }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes([data.note, ...notes]);
        setInput('');
        toast.success('Note created successfully!');
      } else {
        toast.error('Failed to create note');
      }
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const deleteNote = (id: string) => {
    setDeleteNoteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteNoteId) return;

    try {
      const res = await fetch(`/api/notes?id=${deleteNoteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotes(notes.filter(note => note.id !== deleteNoteId));
        toast.success('Note deleted');
      } else {
        toast.error('Failed to delete note');
      }
    } catch (error) {
      toast.error('Failed to delete note');
    } finally {
      setDeleteNoteId(null);
    }
  };

  const editNote = async (id: string, newText: string) => {
    const sanitizedText = sanitizeInput(newText);
    if (sanitizedText === '' || sanitizedText.length > MAX_NOTE_LENGTH) return;

    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, text: sanitizedText }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes(notes.map(note => note.id === id ? data.note : note));
        setEditingNoteId(null);
        toast.success('Note updated');
      } else {
        toast.error('Failed to update note');
      }
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const exportNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oneday-notes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${notes.length} notes`);
  };

  const importNotes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedNotes = JSON.parse(e.target?.result as string);
        if (!Array.isArray(importedNotes)) {
          toast.error('Invalid file format');
          return;
        }

        let successCount = 0;

        for (const note of importedNotes) {
          if (note.text && note.color) {
            try {
              await fetch('/api/notes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: note.text, color: note.color }),
              });
              successCount++;
            } catch {}
          }
        }

        await fetchNotes();
        toast.success(`Imported ${successCount} notes`);
      } catch (error) {
        toast.error('Failed to import notes. Invalid file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addNote();
    }
  };

  const filteredNotes = notes.filter(note =>
    note.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    setUserState(null);
    setNotes([]);
    toast.success('Logged out successfully');
    window.location.reload();
  };

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
            {user && <UserProfile user={user} onLogout={handleLogout} />}
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