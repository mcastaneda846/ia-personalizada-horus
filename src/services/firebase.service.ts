import * as admin from "firebase-admin";
import { env } from "../config/env";
import { ChatSession } from "../models/types";

class FirebaseService {
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          // Reemplazar saltos de línea literales por saltos reales
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    }
  }

  async saveChatLogToFirestore(
    session: ChatSession,
    summaryData: any
  ): Promise<void> {
    const db = admin.firestore();
    const docRef = db.collection("chat_logs").doc(session.sessionId);

    await docRef.set({
      sessionId: session.sessionId,
      userId: session.userId,
      startedAt: session.createdAt,
      endedAt: new Date(),
      messageCount: Math.floor(session.history.length / 2),
      summary: summaryData,
      history: session.history,
    });
  }
}

export const firebaseService = new FirebaseService();
