import { Pool, PoolClient } from "pg";
import * as admin from "firebase-admin";
import { env } from "../config/env";
import { MedicalProfile, ChatLog } from "../models/types";

// 🔴 CAMBIO MÍNIMO: inicializar Firebase UNA sola vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
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
      console.error("❌ PostgreSQL pool error:", err.message);
    });
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // ───────────────────────────────
  // PERFIL MÉDICO
  // ───────────────────────────────

  async getUserMedicalProfile(userId: string): Promise<MedicalProfile | null> {
    const client = await this.pool.connect();

    try {
      const userResult = await client.query(
        `SELECT id FROM users WHERE id = $1 AND account_status = 'ACTIVE' LIMIT 1`,
        [userId]
      );

      if (userResult.rows.length === 0) return null;

      const personalInfo = await this.fetchPersonalInfo(client, userId);
      const medicalProfile = await this.fetchMedicalProfile(client, userId);
      const allergies = await this.fetchAllergies(client, userId);
      const chronicConditions = await this.fetchChronicConditions(client, userId);
      const medications = await this.fetchMedications(client, userId);
      const emergencyContacts = await this.fetchEmergencyContacts(client, userId);

      return {
        userId,
        personalInfo,
        medicalProfile,
        allergies,
        chronicConditions,
        currentMedications: medications,
        emergencyContacts,
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
      dateOfBirth: row.date_of_birth
        ? new Date(row.date_of_birth).toISOString()
        : null,
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

  // ───────────────────────────────
  // CHAT LOGS
  // ───────────────────────────────

  async saveChatLog(log: ChatLog): Promise<void> {
    try {
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
    } catch (err) {
      console.error("❌ Error guardando chat log:", err);
      throw err;
    }
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