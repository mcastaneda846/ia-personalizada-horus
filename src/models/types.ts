// ─── Sesión de chat ───────────────────────────────────────────────────────────

export interface ChatSession {
  sessionId: string;
  userId: string;
  systemPrompt: string;
  history: ChatMessage[];
  createdAt: Date;
  lastActivityAt: Date;
}

export interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
  timestamp: Date;
}

// ─── Perfil médico (viene de Qdrant) ─────────────────────────────────────────

export interface MedicalProfile {
  userId: string;
  personalInfo: PersonalInfo | null;
  medicalProfile: MedicalProfileData | null;
  allergies: Allergy[];
  chronicConditions: ChronicCondition[];
  currentMedications: Medication[];
  emergencyContacts: EmergencyContact[];
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodType: string | null;
}

export interface MedicalProfileData {
  heightCm: number | null;
  weightKg: number | null;
  organDonor: boolean;
  insuranceProvider: string | null;
  additionalNotes: string | null;
}

export interface Allergy {
  allergenName: string;
  allergyType: string;
  severity: string;
  reactionDescription: string | null;
  isActive: boolean;
}

export interface ChronicCondition {
  conditionName: string;
  severity: string | null;
  status: string;
  notes: string | null;
}

export interface Medication {
  name: string;
  dosage: string | null;
  frequency: string | null;
  route: string;
  purpose: string | null;
  isCurrent: boolean;
}

export interface EmergencyContact {
  fullName: string;
  relationship: string;
  phonePrimary: string;
  phoneSecondary: string | null;
  priorityOrder: number;
}

// ─── Qdrant ───────────────────────────────────────────────────────────────────

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    userId: string;
    profileText: string;
    medicalProfile: MedicalProfile;
    updatedAt: string;
  };
}

// ─── Chat log (se guarda en PostgreSQL al cerrar sesión) ──────────────────────

export interface ChatLog {
  userId: string;
  sessionId: string;
  startedAt: Date;
  endedAt: Date;
  summary: string;
  mainTopics: string[];
  alertLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  emergencyServicesRecommended: boolean;
  keyRecommendations: string[];
  requiresFollowUp: boolean;
  followUpReason: string | null;
  messageCount: number;
}

// ─── Request / Response schemas ───────────────────────────────────────────────

export interface InitChatRequest {
  userId: string;
}

export interface InitChatResponse {
  sessionId: string;
  message: string;
  disclaimer: string;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
}

export interface SendMessageResponse {
  sessionId: string;
  response: string;
  timestamp: Date;
}

export interface EndChatRequest {
  sessionId: string;
}

export interface EndChatResponse {
  message: string;
  logSaved: boolean;
}

export interface SyncUserRequest {
  userId: string;
}

export interface SyncUserResponse {
  success: boolean;
  message: string;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  code: string;
  statusCode: number;
}
