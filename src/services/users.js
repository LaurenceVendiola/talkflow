import { db } from '../firebaseConfig';

export async function createUserProfile(uid, data) {
  if (!uid) throw new Error('uid required');
  try {
    await db.collection('users').doc(uid).set({
      uid,
      ...data,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error('createUserProfile failed', e && e.message);
    throw e;
  }
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  try {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? { uid: doc.id, ...(doc.data() || {}) } : null;
  } catch (e) {
    console.error('getUserProfile failed', e && e.message);
    return null;
  }
}
