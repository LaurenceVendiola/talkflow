// Provides Firestore-backed storage for patients and sessions with per-user scoping
import { db, auth } from '../firebaseConfig';
import firebase from 'firebase/compat/app';

let patientsCache = [];
let sessionsCache = [];

let patientsUnsub = null;
let sessionsUnsub = null;
let currentUid = null;

function _clearCaches() {
  patientsCache = [];
  sessionsCache = [];
  window.dispatchEvent(new Event('tf:patients-updated'));
  window.dispatchEvent(new Event('tf:sessions-updated'));
}

function _unsubscribeAll() {
  try {
    if (patientsUnsub) {
      patientsUnsub();
      patientsUnsub = null;
    }
    if (sessionsUnsub) {
      sessionsUnsub();
      sessionsUnsub = null;
    }
  } catch (e) {
    console.warn('Error unsubscribing listeners', e && e.message);
  }
}

function _initListenersForUser(uid) {
  _unsubscribeAll();
  currentUid = uid;

  if (!uid) {
    _clearCaches();
    return;
  }

  try {
    patientsUnsub = db.collection('patients')
      .where('ownerId', '==', uid)
      .onSnapshot(snap => {
        const arr = [];
        snap.forEach(doc => arr.push({ patientId: doc.id, ...(doc.data() || {}) }));
        patientsCache = arr;
        window.dispatchEvent(new Event('tf:patients-updated'));
      }, err => {
        console.error('patients snapshot error', err && err.message);
      });

    sessionsUnsub = db.collection('sessions')
      .where('ownerId', '==', uid)
      .onSnapshot(snap => {
        const arr = [];
        snap.forEach(doc => arr.push({ id: doc.id, ...(doc.data() || {}) }));
        sessionsCache = arr;
        window.dispatchEvent(new Event('tf:sessions-updated'));
      }, err => {
        console.error('sessions snapshot error', err && err.message);
      });
  } catch (e) {
    console.error('Failed to initialize Firestore listeners for user', e && e.message);
    _clearCaches();
  }
}

// Re-initializes Firestore listeners when authentication state changes
export function setCurrentUser(uid) {
  _initListenersForUser(uid);
}

// Returns cached patients for the current user
export function getPatients() {
  if (currentUid === null && auth && auth.currentUser) {
    _initListenersForUser(auth.currentUser.uid);
  }
  return patientsCache.slice();
}

export function savePatient(patient) {
  patientsCache = [patient, ...patientsCache.filter(p => p.patientId !== patient.patientId)];
  window.dispatchEvent(new Event('tf:patients-updated'));

  try {
    const ownerId = (auth && auth.currentUser && auth.currentUser.uid) || currentUid || null;
  const payload = { ...(patient || {}), ownerId, createdAt: patient.createdAt || firebase.firestore.FieldValue.serverTimestamp() };
    if (patient.patientId) {
      db.collection('patients').doc(patient.patientId).set(payload).catch(() => {});
    } else {
      db.collection('patients').add(payload).catch(() => {});
    }
  } catch (e) {
    console.error('savePatient write failed', e && e.message);
  }
}

export async function clearPatients() {
  const uid = (auth && auth.currentUser && auth.currentUser.uid) || currentUid;
  if (!uid) return;
  try {
  const snap = await db.collection('patients').where('ownerId', '==', uid).get();
    const batch = db.batch();
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (e) {
    console.error('clearPatients failed', e && e.message);
  }
}

export async function deletePatient(patientId) {
  if (!patientId) return;
  patientsCache = patientsCache.filter(p => p.patientId !== patientId);
  window.dispatchEvent(new Event('tf:patients-updated'));

  try {
    await db.collection('patients').doc(patientId).delete();
    const uid = (auth && auth.currentUser && auth.currentUser.uid) || currentUid;
  const snap = await db.collection('sessions').where('patientId', '==', patientId).where('ownerId', '==', uid).get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    sessionsCache = sessionsCache.filter(s => s.patientId !== patientId);
    window.dispatchEvent(new Event('tf:sessions-updated'));
  } catch (e) {
    console.error('deletePatient failed', e && e.message);
  }
}

export function getSessions() {
  if (currentUid === null && auth && auth.currentUser) {
    _initListenersForUser(auth.currentUser.uid);
  }
  return sessionsCache.slice();
}

export function addSession(session) {
  sessionsCache = [session, ...sessionsCache.filter(s => s.id !== session.id)];
  window.dispatchEvent(new Event('tf:sessions-updated'));

  try {
    const ownerId = (auth && auth.currentUser && auth.currentUser.uid) || currentUid || null;
  const payload = { ...(session || {}), ownerId, createdAt: session.createdAt || firebase.firestore.FieldValue.serverTimestamp() };
    if (session.id) {
      db.collection('sessions').doc(session.id).set(payload).catch(() => {});
    } else {
      db.collection('sessions').add(payload).catch(() => {});
    }
  } catch (e) {
    console.error('addSession write failed', e && e.message);
  }
}

export function getSessionsForPatient(patientId) {
  return sessionsCache.filter(s => s.patientId === patientId);
}

export function totalSessionsCount() {
  return sessionsCache.length;
}

export function findPatientById(id) {
  return patientsCache.find(p => p.patientId === id) || null;
}

export function findSessionById(id) {
  return sessionsCache.find(s => s.id === id) || null;
}

export async function deleteSession(sessionId) {
  if (!sessionId) return;
  sessionsCache = sessionsCache.filter(s => s.id !== sessionId);
  window.dispatchEvent(new Event('tf:sessions-updated'));

  try {
    await db.collection('sessions').doc(sessionId).delete();
  } catch (e) {
    console.error('deleteSession failed', e && e.message);
  }
}
