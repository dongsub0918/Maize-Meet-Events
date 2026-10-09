import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDatabase, getEvents, getSavedEventIds, toggleSavedEvent } from '../db/database';
import { getPreferences, resetPreferences } from '../storage/preferences';

const AppContext = createContext(null);

export function AppContextProvider({ children, initialSession }) {
  const [session, setSession] = useState(initialSession);
  const [events, setEvents] = useState([]);
  const [savedEventIds, setSavedEventIds] = useState([]);
  const [preferences, setPreferences] = useState({
    darkTheme: false,
  });

  useEffect(() => {
    getEvents().then(setEvents);
    getSavedEventIds().then(setSavedEventIds);
    getPreferences().then(setPreferences);
  }, []);

  async function toggleSaved(eventId) {
    const isSaved = await toggleSavedEvent(eventId);
    setSavedEventIds((current) =>
      isSaved ? [...current, eventId] : current.filter((id) => id !== eventId)
    );
    return isSaved;
  }

  // Clears saved events, notes, settings, and the session, both in storage
  // and in memory. Registrations are intentionally left untouched.
  async function resetAppData() {
    const db = await getDatabase();
    await db.execAsync('DELETE FROM saved_events; DELETE FROM notes;');
    await resetPreferences();
    setSavedEventIds([]);
    setPreferences({ darkTheme: false });
    setSession(null);
  }

  const value = {
    session,
    setSession,
    events,
    setEvents,
    savedEventIds,
    toggleSaved,
    resetAppData,
    preferences,
    setPreferences,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used inside AppContextProvider');
  }
  return context;
}
