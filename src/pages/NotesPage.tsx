import React, { useState, useEffect } from 'react';
import { supabase } from '../services/auth';
import SimpleNavbar from '../components news/navbar/SimpleNavbar';
import ProfilePopup from '../components/navbar/ProfilePopup';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const NotesPage: React.FC = () => {
  const [loginPopupActive, setLoginPopupActive] = useState(false);
  const [profilePopupActive, setProfilePopupActive] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
  // Effect for auth state
  useEffect(() => {
    supabase.auth.getSession().then((res) => {
      const currentUser = res.data.session?.user || null;
      setUser(currentUser);
    });
    
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
    });
    
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Sample notes data - in a real app, you would fetch these from your backend
  useEffect(() => {
    // Mock data for demonstration
    setNotes([
      {
        id: '1',
        title: 'Research on Machine Learning',
        content: 'Look into transformer architectures and their applications in natural language processing.',
        created_at: '2023-10-15T10:30:00Z'
      },
      {
        id: '2',
        title: 'Project Ideas',
        content: 'Build a personal knowledge management system with AI integration.',
        created_at: '2023-10-12T14:45:00Z'
      },
      {
        id: '3',
        title: 'Meeting Notes',
        content: 'Team sync: Discussed progress on the search feature, next steps for MFA integration.',
        created_at: '2023-10-10T09:15:00Z'
      }
    ]);
  }, []);

  const handleAddNote = () => {
    if (newNoteTitle.trim() && newNoteContent.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        title: newNoteTitle,
        content: newNoteContent,
        created_at: new Date().toISOString()
      };
      
      setNotes([newNote, ...notes]);
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsAddingNote(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="fixed top-0 left-0 right-0 z-20">
        <SimpleNavbar
          user={user}
          setLoginPopupActive={setLoginPopupActive}
          setProfilePopupActive={setProfilePopupActive}
        />
      </header>
      
      <main className="pt-[70px] px-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Notes</h1>
          <button 
            onClick={() => setIsAddingNote(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors"
          >
            Add Note
          </button>
        </div>
        
        {isAddingNote && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg shadow-sm">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note title"
              className="w-full p-2 border border-gray-300 rounded-md mb-2"
            />
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Note content"
              className="w-full p-2 border border-gray-300 rounded-md mb-3 h-24"
            />
            <div className="flex space-x-2 justify-end">
              <button 
                onClick={() => setIsAddingNote(false)}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddNote}
                className="px-3 py-1 bg-black text-white rounded-md hover:bg-black/80"
              >
                Save
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{note.title}</h2>
              <p className="text-gray-700 mb-3">{note.content}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{formatDate(note.created_at)}</span>
                <div className="space-x-2">
                  <button className="text-sm text-blue-500 hover:text-blue-700">Edit</button>
                  <button className="text-sm text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      {profilePopupActive && user && (
        <ProfilePopup
          user={user}
          onClose={() => setProfilePopupActive(false)}
        />
      )}
    </div>
  );
};

export default NotesPage;
