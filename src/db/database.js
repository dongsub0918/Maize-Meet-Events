import * as SQLite from 'expo-sqlite';
import { seedEvents } from '../data/seedEvents';

const DATABASE_NAME = 'maizemeet.db';

let databasePromise;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return databasePromise;
}

export async function initializeDatabase() {
  const db = await getDatabase();
  const existingColumns = await db.getAllAsync('PRAGMA table_info(events)');
  if (existingColumns.length && !existingColumns.some((column) => column.name === 'startsAt')) {
    await db.execAsync(`
      DROP TABLE IF EXISTS registrations;
      DROP TABLE IF EXISTS notes;
      DROP TABLE IF EXISTS saved_events;
      DROP TABLE IF EXISTS events;
    `);
  }
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS events (
      rowId INTEGER PRIMARY KEY AUTOINCREMENT,
      id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      startsAt TEXT NOT NULL,
      endsAt TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      room TEXT,
      capacity INTEGER,
      registeredCount INTEGER NOT NULL,
      tags TEXT
    );

    -- [Modified] QA-01: Earlier launches stored a new copy of every seed event each time the
    -- app opened. This deletes those duplicates, keeping only the first (oldest) row for each
    -- event id.
    DELETE FROM events
      WHERE rowId NOT IN (SELECT MIN(rowId) FROM events GROUP BY id);

    -- [Modified] QA-01: A UNIQUE index on events.id, so the database itself refuses to store
    -- the same event twice.
    CREATE UNIQUE INDEX IF NOT EXISTS idx_events_id ON events (id);
    CREATE TABLE IF NOT EXISTS saved_events (
      rowId INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId TEXT NOT NULL
    );

    -- [Modified] QA-02: Repeated heart taps could store the same event in
    -- saved_events more than once. This deletes those duplicate saved rows, keeping one row
    -- per event.
    DELETE FROM saved_events
      WHERE rowId NOT IN (SELECT MIN(rowId) FROM saved_events GROUP BY eventId);

    -- [Modified] QA-02: A UNIQUE index so each event can be saved at most once.
    CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_events_eventId ON saved_events (eventId);
    CREATE TABLE IF NOT EXISTS notes (
      eventId TEXT PRIMARY KEY,
      body TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS registrations (
      rowId INTEGER PRIMARY KEY AUTOINCREMENT,
      eventId TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // [Modified] QA-01: This seeding loop runs on every app launch. It used a plain INSERT, so
  // each launch added another full copy of every event, and Discover showed each event
  // multiple times. With INSERT OR IGNORE and the unique index above, a seed event is only
  // inserted when that id is not already stored. Existing rows are left unchanged, so data
  // such as an updated registeredCount is kept across launches.
  for (const event of seedEvents) {
    await db.runAsync(
      `INSERT OR IGNORE INTO events
        (id, title, description, startsAt, endsAt, category, location, room, capacity, registeredCount, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      event.id,
      event.title,
      event.description,
      event.startsAt,
      event.endsAt,
      event.category,
      event.location,
      event.room,
      event.capacity,
      event.registeredCount,
      event.tags ? JSON.stringify(event.tags) : null
    );
  }
}

function mapEvent(row) {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
  };
}

export async function getEvents() {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync('SELECT * FROM events');
    return rows.map(mapEvent);
  } catch {
    return [];
  }
}

export async function getEvent(eventId) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM events WHERE id = ?', eventId);
  return row ? mapEvent(row) : null;
}

export async function getSavedEvents() {
  try {
    const db = await getDatabase();
    // [Modified] QA-02: Returns the saved events. The old INNER JOIN returned an
    // event once for every matching row in saved_events, so duplicate saved rows showed up as
    // repeated entries on the Saved screen. The IN subquery returns each event row once.
    const rows = await db.getAllAsync(`
      SELECT events.*
      FROM events
      WHERE events.id IN (SELECT eventId FROM saved_events)
    `);
    return rows.map(mapEvent);
  } catch {
    return [];
  }
}

export async function getSavedEventIds() {
  try {
    const db = await getDatabase();
    // [Modified] QA-02: DISTINCT so each saved event id is returned only once.
    const rows = await db.getAllAsync('SELECT DISTINCT eventId FROM saved_events');
    return rows.map((row) => row.eventId);
  } catch {
    return [];
  }
}

export async function toggleSavedEvent(eventId) {
  const db = await getDatabase();
  const saved = await db.getFirstAsync(
    'SELECT rowId FROM saved_events WHERE eventId = ?',
    eventId
  );

  if (saved) {
    await db.runAsync('DELETE FROM saved_events WHERE eventId = ?', eventId);
    return false;
  }

  // [Modified] QA-02: INSERT OR IGNORE plus the unique index means an overlapping
  // second save of the same event cannot create a duplicate saved row.
  await db.runAsync('INSERT OR IGNORE INTO saved_events (eventId) VALUES (?)', eventId);
  return true;
}

export async function getNote(eventId) {
  const db = await getDatabase();
  return db.getFirstAsync('SELECT body, updatedAt FROM notes WHERE eventId = ?', eventId);
}

export async function saveNote(eventId, body) {
  const db = await getDatabase();
  const updatedAt = new Date().toISOString();
  await db.execAsync(
    `INSERT OR REPLACE INTO notes (eventId, body, updatedAt) VALUES ('${eventId}', '${body}', '${updatedAt}')`
  );
  return updatedAt;
}

export async function registerForEvent(eventId) {
  const db = await getDatabase();
  const event = await db.getFirstAsync(
    'SELECT capacity, registeredCount FROM events WHERE id = ?',
    eventId
  );

  if (event.capacity !== null && event.registeredCount > event.capacity) {
    throw new Error('This event is full.');
  }

  await db.runAsync(
    'INSERT INTO registrations (eventId, createdAt) VALUES (?, ?)',
    eventId,
    new Date().toISOString()
  );
  await db.runAsync(
    'UPDATE events SET registeredCount = registeredCount + 1 WHERE id = ?',
    eventId
  );
}

export async function isRegistered(eventId) {
  const db = await getDatabase();
  return Boolean(
    await db.getFirstAsync('SELECT rowId FROM registrations WHERE eventId = ?', eventId)
  );
}
