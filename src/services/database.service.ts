import path from "path";
import { Pool, PoolClient } from "pg";
import * as admin from "firebase-admin";
import { env } from "../config/env";
import logger from "../config/logger";
import { MedicalProfile, ChatLog } from "../models/types";

if (!admin.apps.length) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceAccount = require(path.resolve(env.FIREBASE_SERVICE_ACCOUNT_PATH));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

class DatabaseService {
  private pool: Pool;
  private static instance: DatabaseService;

  private constructor() {
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on("error", (err) => {
      logger.error({ err: err.message }, "PostgreSQL pool error");
    });
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async getUserMedicalProfile(userId: string): Promise<MedicalProfile | null> {
    const client = await this.pool.connect();
    try {
      const user = await client.query(
        `SELECT id FROM users WHERE id = $1 AND account_status = 'ACTIVE' LIMIT 1`,
        [userId]
      );
      if (user.rows.length === 0) return null;

      const [personalInfo, medicalProfile, allergies, chronicConditions, medications, emergencyContacts, medicalHistory] =
        await Promise.all([
          this.fetchPersonalInfo(client, userId),
          this.fetchMedicalProfile(client, userId),
          this.fetchAllergies(client, userId),
          this.fetchChronicConditions(client, userId),
          this.fetchMedications(client, userId),
          this.fetchEmergencyContacts(client, userId),
          this.fetchMedicalHistory(client, userId),
        ]);

      return {
        userId,
        personalInfo,
        medicalProfile,
        allergies,
        chronicConditions,
        currentMedications: medications,
        emergencyContacts,
        medicalHistory,
      };
    } finally {
      client.release();
    }
  }

  private async fetchPersonalInfo(client: PoolClient, userId: string) {
    const result = await client.query(
      `SELECT first_name, last_name, date_of_birth, gender, blood_type
       FROM personal_information WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth).toISOString() : null,
      gender: row.gender,
      bloodType: row.blood_type,
    };
  }

  private async fetchMedicalProfile(client: PoolClient, userId: string) {
    const result = await client.query(
      `SELECT height_cm, weight_kg, organ_donor, insurance_provider, additional_notes
       FROM medical_profile WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      heightCm: row.height_cm ? Number(row.height_cm) : null,
      weightKg: row.weight_kg ? Number(row.weight_kg) : null,
      organDonor: row.organ_donor,
      insuranceProvider: row.insurance_provider,
      additionalNotes: row.additional_notes,
    };
  }

  private async fetchAllergies(client: PoolClient, userId: string) {
    const result = await client.query(
      `SELECT allergen_name, allergy_type, severity, reaction_description, is_active
       FROM allergies WHERE user_id = $1 ORDER BY severity DESC`,
      [userId]
    );
    return result.rows.map((row) => ({
      allergenName: row.allergen_name,
      allergyType: row.allergy_type,
      severity: row.severity,
      reactionDescription: row.reaction_description,
      isActive: row.is_active,
    }));
  }

  private async fetchChronicConditions(client: PoolClient, userId: string) {
    const result = await client.query(
      `SELECT condition_name, severity, status, notes
       FROM chronic_conditions
       WHERE user_id = $1 AND status IN ('ACTIVE', 'MANAGED')
       ORDER BY severity DESC NULLS LAST`,
      [userId]
    );
    return result.rows.map((row) => ({
      conditionName: row.condition_name,
      severity: row.severity,
      status: row.status,
      notes: row.notes,
    }));
  }

  private async fetchMedications(client: PoolClient, userId: string) {
    const result = await client.query(
      `SELECT
         COALESCE(mc.generic_name, um.custom_medication_name) as name,
         um.dosage, um.frequency, um.route, um.purpose
       FROM user_medications um
       LEFT JOIN medication_catalog mc ON um.medication_id = mc.id
       WHERE um.user_id = $1 AND um.is_current = true`,
      [userId]
    );
    return result.rows.map((row) => ({
      name: row.name,
      dosage: row.dosage,
      frequency: row.frequency,
      route: row.route,
      purpose: row.purpose,
      isCurrent: true,
    }));
  }

  private async fetchEmergencyContacts(client: PoolClient, userId: string) {
    const result = await client.query(
      `SELECT full_name, relationship, phone_primary, phone_secondary, priority_order
       FROM emergency_contacts
       WHERE user_id = $1 AND is_active = true
       ORDER BY priority_order ASC`,
      [userId]
    );
    return result.rows.map((row) => ({
      fullName: row.full_name,
      relationship: row.relationship,
      phonePrimary: row.phone_primary,
      phoneSecondary: row.phone_secondary,
      priorityOrder: row.priority_order,
    }));
  }

  private async fetchMedicalHistory(client: PoolClient, userId: string) {
    const result = await client.query(
      `SELECT event_type, event_name, event_date, outcome
       FROM medical_history
       WHERE user_id = $1
       ORDER BY event_date DESC NULLS LAST
       LIMIT 10`,
      [userId]
    );
    return result.rows.map((row) => ({
      eventType: row.event_type,
      eventName: row.event_name,
      eventDate: row.event_date ? new Date(row.event_date).toISOString() : null,
      outcome: row.outcome,
    }));
  }

  async getTodayHealthReadings(userId: string): Promise<{
    heartRate?: number; steps?: number; calories?: number;
    activityMinutes?: number; battery?: number; timestamp?: string;
  } | null> {
    try {
      const db = admin.firestore();
      const doc = await db.collection('health_readings').doc(userId).get();
      if (!doc.exists) return null;
      const d = doc.data()!;
      return {
        heartRate:       d.heartRate       ?? undefined,
        steps:           d.steps           ?? undefined,
        calories:        d.calories        ?? undefined,
        activityMinutes: d.activityMinutes ?? undefined,
        battery:         d.battery         ?? undefined,
        timestamp:       d.timestamp       ?? undefined,
      };
    } catch {
      return null;
    }
  }

  async saveChatLog(log: ChatLog): Promise<void> {
    const db = admin.firestore();
    await db.collection("chat_logs").doc(log.sessionId).set({
      user_id: log.userId,
      session_id: log.sessionId,
      started_at: log.startedAt,
      ended_at: log.endedAt,
      summary: log.summary,
      main_topics: log.mainTopics ?? [],
      alert_level: log.alertLevel,
      emergency_services_recommended: log.emergencyServicesRecommended,
      key_recommendations: log.keyRecommendations ?? [],
      requires_follow_up: log.requiresFollowUp,
      follow_up_reason: log.followUpReason,
      message_count: log.messageCount,
    });
  }

  async getChatHistory(userId: string, limit = 30): Promise<object[]> {
    const db = admin.firestore();
    const snap = await db
      .collection("chat_logs")
      .where("user_id", "==", userId)
      .limit(limit)
      .get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown>));
    // Ordenar en memoria por started_at desc (evita índice compuesto en Firestore)
    return docs.sort((a, b) => {
      const aTs = (a.started_at as { _seconds?: number })?._seconds ?? 0;
      const bTs = (b.started_at as { _seconds?: number })?._seconds ?? 0;
      return bTs - aTs;
    });
  }

  async ping(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }
}

export const databaseService = DatabaseService.getInstance();
