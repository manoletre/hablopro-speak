import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { DocumentSnapshot } from 'firebase-admin/firestore';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { CloudTasksClient, protos } from '@google-cloud/tasks';

admin.initializeApp();

const db = admin.firestore();
const sesClient = new SESClient({ region: 'us-east-2' });
const tasksClient = new CloudTasksClient();
const projectId = JSON.parse(process.env.FIREBASE_CONFIG!).projectId;
const location = 'us-central1';
const queue = 'daily-reminders';

/**
 * Convert a date to the user's local date string (YYYY-MM-DD) based on timezone offset
 * @param date Date to convert
 * @param timezoneOffsetMinutes User's timezone offset in minutes (from getTimezoneOffset())
 * @returns Date string in YYYY-MM-DD format in user's timezone
 */
function getUserLocalDateString(date: Date, timezoneOffsetMinutes: number = 0): string {
  // Create a new date by adjusting for the user's timezone
  // Note: getTimezoneOffset() returns minutes WEST of UTC, 
  // so we SUBTRACT the offset to get the correct local time
  // For example: 
  // - UTC+8 (Japan) has offset of -480, so we subtract -480 = add 480 minutes to UTC time
  // - UTC-5 (Colombia) has offset of +300, so we subtract 300 minutes from UTC time
  const localDate = new Date(date.getTime() - (timezoneOffsetMinutes * 60 * 1000));
  return localDate.toISOString().substring(0, 10); // Returns YYYY-MM-DD
}

// Helper to schedule a Cloud Task for a user's reminder
async function scheduleUserReminder(uid: string, reminderDate: Date): Promise<string> {
  const parent = tasksClient.queuePath(projectId, location, queue);
  const url = `https://${location}-${projectId}.cloudfunctions.net/sendDailyReminder`;
  const payload = { uid };
  const task: protos.google.cloud.tasks.v2.ITask = {
    httpRequest: {
      httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
      url,
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
    },
    scheduleTime: { seconds: Math.floor(reminderDate.getTime() / 1000) },
  };
  const [response] = await tasksClient.createTask({ parent, task });
  return response.name!;
}

// Helper to compute the next reminder time in UTC based on user's timezone and target local time
function computeNextReminderTime(timezoneOffsetMinutes: number, targetHour: number, targetMinute: number): Date {
  const nowUtc = new Date();
  const localNow = new Date(nowUtc.getTime() - timezoneOffsetMinutes * 60 * 1000);
  const localSchedule = new Date(localNow);
  localSchedule.setHours(targetHour, targetMinute, 0, 0);
  if (localSchedule <= localNow) localSchedule.setDate(localSchedule.getDate() + 1);
  return new Date(localSchedule.getTime() + timezoneOffsetMinutes * 60 * 1000);
}

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
    
    // Get the session data which may include timezone information
    const sessionData = snap.data();
    
    // Default to 0 (UTC) if timezoneOffset isn't provided
    const timezoneOffsetMinutes = sessionData?.timezoneOffsetMinutes || 0;
    
    // Generate the day ID in the user's local timezone
    const dayId = getUserLocalDateString(ts, timezoneOffsetMinutes);
    
    console.log(`Session created for user ${uid}:`);
    console.log(`- Server timestamp: ${ts.toISOString()}`);
    console.log(`- User timezone offset: ${timezoneOffsetMinutes} minutes`);
    console.log(`- Local date ID: ${dayId}`);

    const dayRef = db.doc(`users/${uid}/days/${dayId}`);
    const userRef = db.doc(`users/${uid}`);

    await db.runTransaction(async (t: admin.firestore.Transaction) => {
      // 1. Read all necessary documents first
      const userSnap = await t.get(userRef);
      const { currentStreak = 0, longestStreak = 0, lastActive } = userSnap.data() || {};

      let sameDay = false;
      let continues = false;

      if (lastActive) {
        // Convert lastActive to user's local time
        const lastActiveDate = lastActive.toDate?.();
        if (lastActiveDate) {
          const lastActiveDayId = getUserLocalDateString(lastActiveDate, timezoneOffsetMinutes);
          
          // Check if it's the same day
          sameDay = lastActiveDayId === dayId;
          
          // Calculate yesterday's date in user's timezone
          const yesterday = new Date(ts);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayId = getUserLocalDateString(yesterday, timezoneOffsetMinutes);
          
          // Check if it continues the streak (was yesterday)
          continues = lastActiveDayId === yesterdayId;
          
          console.log(`- Last active date: ${lastActiveDate.toISOString()}`);
          console.log(`- Last active local day: ${lastActiveDayId}`);
          console.log(`- Yesterday local day: ${yesterdayId}`);
          console.log(`- Same day? ${sameDay}, Continues streak? ${continues}`);
        }
      }

      const newStreak = sameDay ? currentStreak // multiple sessions today
        : continues ? currentStreak + 1 // streak +1
        : 1; // reset
        
      console.log(`- Current streak: ${currentStreak} → New streak: ${newStreak}`);
      console.log(`- Longest streak: ${Math.max(longestStreak, newStreak)}`);

      // 2. Perform all writes after reads
      t.set(dayRef, { count: admin.firestore.FieldValue.increment(1) }, { merge: true });
      t.set(userRef, {
        currentStreak: newStreak,
        longestStreak: Math.max(longestStreak, newStreak),
        lastActive: snap.data()?.startedAt
      }, { merge: true });
    });
  });

// Send a welcome email via Amazon SES when a new user profile is created
export const onUserCreate = functions
  .runWith({
    serviceAccount: 'cloud-functions1@hablopro-speak.iam.gserviceaccount.com'
  })
  .firestore
  .document('users/{userId}')
  .onCreate(async (snap: DocumentSnapshot, ctx: functions.EventContext) => {
    const data = snap.data();
    // Use current time as signup timestamp and get user document reference
    const userRef = db.doc(`users/${ctx.params.userId}`);
    const email = data?.email;
    const uiLanguage = data?.uiLanguage || 'en';
    if (!email) {
      console.warn(`No email found for user ${ctx.params.userId}`);
      return;
    }
    const isSpanish = uiLanguage === 'es';
    const subject = isSpanish
      ? '¡Bienvenido a hablo.pro!'
      : 'Welcome to hablo.pro!';
    const body = isSpanish
      ? `¡Hola Grass!

Soy Manu, y quería darte personalmente la bienvenida a hablo.pro.

Creé a Nacho (tu tutor de idiomas con IA) para ayudarte a practicar conversaciones reales sin la presión o ansiedad que suele acompañar al aprendizaje de un nuevo idioma. Puedes cometer errores, intentarlo de nuevo y ganar confianza a tu propio ritmo.

Para comenzar, simplemente ve a hablo.pro y estarás hablando en minutos.

Si tienes alguna pregunta o comentario, responde directamente a este correo. Leo cada mensaje.

¡Espero poder ayudarte en tu viaje de aprendizaje!

Manu

P.D. Hecho con ❤️ desde Colombia 🇨🇴`
      : `Hey Raccoon!

I'm Manu, and I just wanted to personally welcome you to hablo.pro.

I created Nacho (your AI language tutor) to help you practice real conversations without the pressure or anxiety that often comes with learning a new language. You can make mistakes, try again, and build confidence at your own pace.

To get started, just visit hablo.pro and you'll be speaking in minutes.

If you have any questions or feedback, just reply directly to this email. I read every message personally.

Looking forward to helping you on your language journey!

Manu

P.S. Made with ❤️ from Colombia 🇨🇴`;

    const params = {
      Destination: { ToAddresses: [email] },
      Message: {
        Body: {
          Text: { Data: body },
        },
        Subject: { Data: subject },
      },
      Source: isSpanish ? 'Manu de hablo.pro <hello@notify.hablo.pro>' : 'Manu from hablo.pro <hello@notify.hablo.pro>',
      ReplyToAddresses: ['manuel@hablo.pro'],
    };

    try {
      await sesClient.send(new SendEmailCommand(params));
      console.log(`Sent welcome email to ${email}`);
    } catch (error) {
      console.error('Error sending welcome email to', email, error);
    }

    // Schedule first reminder 24h after signup
    // const firstReminderDate = new Date(signupDate.getTime() + 24 * 60 * 60 * 1000);
    const firstReminderDate = new Date(Date.now() + 60 * 1000);
    try {
      const taskName = await scheduleUserReminder(ctx.params.userId, firstReminderDate);
      await userRef.set({ reminderEnabled: true, reminderTaskName: taskName }, { merge: true });
    } catch (error) {
      console.error('Error scheduling first reminder for user', ctx.params.userId, error);
    }
  });

export const sendDailyReminder = functions
  .runWith({
    serviceAccount: 'cloud-functions1@hablopro-speak.iam.gserviceaccount.com'
  })
  .https
  .onRequest(async (req, res) => {
    const { uid } = req.body || {};
    if (!uid) {
      res.status(400).send('Missing uid'); return;
    }
    try {
      const userRef = db.doc(`users/${uid}`);
      const userSnap = await userRef.get();
      const userData = userSnap.data() || {};
      const { email, uiLanguage = 'en', reminderEnabled, currentStreak = 0 } = userData;
      if (!email || reminderEnabled !== true) {
        res.status(200).send('No reminder sent'); return;
      }
      const isSpanish = uiLanguage === 'es';
      const subject = isSpanish
        ? `¡No pierdas tu racha de ${currentStreak} días!`
        : `Don't lose your ${currentStreak}-day streak!`;
      const unsubscribeUrl = `https://hablo.pro/settings?uid=${uid}`;
      const body = isSpanish
        ? `¡Hola!\n\nNo pierdas tu racha de ${currentStreak} días. Sigue practicando hoy para mantener tu racha.\n\nSi quieres darte de baja de los recordatorios diarios, haz clic aquí: ${unsubscribeUrl}`
        : `Hey!\n\nDon't lose your ${currentStreak}-day streak. Keep practicing today to maintain your streak.\n\nIf you no longer wish to receive daily reminders, click here: ${unsubscribeUrl}`;
      const params = {
        Destination: { ToAddresses: [email] },
        Message: {
          Body: { Text: { Data: body } },
          Subject: { Data: subject },
        },
        Source: isSpanish ? 'Manu de hablo.pro <hello@notify.hablo.pro>' : 'Manu from hablo.pro <hello@notify.hablo.pro>',
        ReplyToAddresses: ['manuel@hablo.pro'],
      };
      await sesClient.send(new SendEmailCommand(params));
      console.log(`Sent daily reminder to ${email}`);
      // Schedule next reminder 24h later
      const nextReminderDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const nextTaskName = await scheduleUserReminder(uid, nextReminderDate);
      await userRef.set({ reminderTaskName: nextTaskName }, { merge: true });
      res.status(200).send('Reminder sent');
    } catch (error) {
      console.error('Error in sendDailyReminder', error);
      res.status(500).send('Error sending reminder');
    }
  });

export const onUserUpdateReminderSettings = functions
  .runWith({
    serviceAccount: 'cloud-functions1@hablopro-speak.iam.gserviceaccount.com'
  })
  .firestore
  .document('users/{uid}')
  .onUpdate(async (change, ctx) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const userRef = db.doc(`users/${ctx.params.uid}`);
    const prevTaskName = before.reminderTaskName;
    const prevEnabled = before.reminderEnabled;
    const afterEnabled = after.reminderEnabled;
    const { reminderHour, reminderMinute, timezoneOffsetMinutes = 0 } = after;

    // Cancel reminders if disabled
    if (prevTaskName && prevEnabled && !afterEnabled) {
      await tasksClient.deleteTask({ name: prevTaskName });
      await userRef.set({ reminderTaskName: admin.firestore.FieldValue.delete() }, { merge: true });
      return;
    }

    // Reschedule if enabled or time changed
    if (afterEnabled && (!prevEnabled || reminderHour !== before.reminderHour || reminderMinute !== before.reminderMinute)) {
      if (prevTaskName) await tasksClient.deleteTask({ name: prevTaskName });
      const nextDate = computeNextReminderTime(timezoneOffsetMinutes, reminderHour, reminderMinute);
      const nextTask = await scheduleUserReminder(ctx.params.uid, nextDate);
      await userRef.set({ reminderTaskName: nextTask }, { merge: true });
    }
  }); 