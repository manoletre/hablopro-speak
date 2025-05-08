import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DocumentSnapshot } from 'firebase-admin/firestore';

admin.initializeApp();

const db = admin.firestore();

export const onSessionCreate = functions
  .runWith({
    serviceAccount: 'cloud-functions1@hablopro-speak.iam.gserviceaccount.com'
  })
  .firestore
  .document('users/{uid}/sessions/{sid}')
  .onCreate(async (snap: DocumentSnapshot, ctx: functions.EventContext) => {
    const { uid } = ctx.params;
    const ts = snap.data()?.startedAt.toDate();
    if (!ts) return;

    const dayId = ts.toISOString().substring(0, 10); // e.g. 2025-05-07

    const dayRef = db.doc(`users/${uid}/days/${dayId}`);
    const userRef = db.doc(`users/${uid}`);

    await db.runTransaction(async (t: admin.firestore.Transaction) => {
      // 1. Read all necessary documents first
      const userSnap = await t.get(userRef);
      const { currentStreak = 0, longestStreak = 0, lastActive } = userSnap.data() || {};

      const yesterday = new Date(ts);
      yesterday.setUTCDate(ts.getUTCDate() - 1);
      const sameDay = lastActive && lastActive.toDate?.().toISOString().startsWith(dayId);
      const continues = lastActive && lastActive.toDate?.().toISOString().startsWith(yesterday.toISOString().substring(0, 10));

      const newStreak = sameDay ? currentStreak // multiple sessions today
        : continues ? currentStreak + 1 // streak +1
        : 1; // reset

      // 2. Perform all writes after reads
      t.set(dayRef, { count: admin.firestore.FieldValue.increment(1) }, { merge: true });
      t.set(userRef, {
        currentStreak: newStreak,
        longestStreak: Math.max(longestStreak, newStreak),
        lastActive: snap.data()?.startedAt
      }, { merge: true });
    });
  }); 