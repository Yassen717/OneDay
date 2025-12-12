'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import NoteCard from '@/components/note-card';

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
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('oneday-notes', JSON.stringify(notes));
    } catch (error) {
      console.error('Failed to save notes to localStorage:', error);
    }
  }, [notes]);

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
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const editNote = (id: string, newText: string) => {
    const sanitizedText = sanitizeInput(newText);
    if (sanitizedText === '' || sanitizedText.length > MAX_NOTE_LENGTH) return;

    setNotes(notes.map(note =>
      note.id === id ? { ...note, text: sanitizedText } : note
    ));
    setEditingNoteId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addNote();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-2 text-balance">
            OneDay
          </h1>
          <p className="text-lg text-slate-600">
            Capture your ideas and thoughts in one place
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <div className="flex gap-2">
            <Input
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
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 h-12 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add
            </Button>
          </div>
          <div className="mt-2 flex justify-end">
            <span className={`text-xs ${input.length > MAX_NOTE_LENGTH * 0.9 ? 'text-orange-600 font-semibold' : 'text-slate-500'}`}>
              {input.length}/{MAX_NOTE_LENGTH}
            </span>
          </div>
        </div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-slate-500">
              Start by adding your first idea or note!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((note) => (
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
    </main>
  );
}