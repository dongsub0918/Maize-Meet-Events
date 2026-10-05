import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getEvents, getSavedEventIds, toggleSavedEvent } from '../db/database';
import { getPreferences } from '../storage/preferences';

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

  // [Modified] QA-02: Tracks which events have a save/unsave write in progress,
  // so fast repeated taps on a heart cannot start overlapping database writes.
  const pendingSaveIds = useRef(new Set());

  // [Modified] QA-02: Toggles an event's saved state. This context is the single
  // source of truth that every heart icon reads from:
  //   1. If a toggle for this event is already running, ignore the extra tap.
  //   2. Flip the saved state right away so the heart responds instantly.
  //   3. Write to SQLite, then set the state to whatever the database actually stored.
  //   4. If the write fails, restore the previous state so the heart never shows a wrong value.
  // The state update also prevents the same id from appearing twice in the list.
  async function toggleSaved(eventId) {
    if (pendingSaveIds.current.has(eventId)) {
      return savedEventIds.includes(eventId);
    }
    pendingSaveIds.current.add(eventId);
    const wasSaved = savedEventIds.includes(eventId);
    const applySaved = (isSaved) =>
      setSavedEventIds((current) => {
        const withoutEvent = current.filter((id) => id !== eventId);
        return isSaved ? [...withoutEvent, eventId] : withoutEvent;
      });

    applySaved(!wasSaved);
    try {
      const isSaved = await toggleSavedEvent(eventId);
      applySaved(isSaved);
      return isSaved;
    } catch (error) {
      applySaved(wasSaved);
      return wasSaved;
    } finally {
      pendingSaveIds.current.delete(eventId);
    }
  }

  const value = {
    session,
    setSession,
    events,
    setEvents,
    savedEventIds,
    toggleSaved,
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
