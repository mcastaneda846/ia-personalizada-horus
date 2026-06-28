export interface ChatSession {
  sessionId: string;
  userId: string;
  systemPrompt: string;
  history: ChatMessage[];
  createdAt: Date;
  lastActivityAt: Date;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface MedicalProfile {
  userId: string;
  personalInfo: PersonalInfo | null;
  medicalProfile: MedicalProfileData | null;
  allergies: Allergy[];
  chronicConditions: ChronicCondition[];
  currentMedications: Medication[];
  emergencyContacts: EmergencyContact[];
  medicalHistory: MedicalHistoryEvent[];
}

export interface MedicalHistoryEvent {
  eventType: string;
  eventName: string;
  eventDate: string | null;
  outcome: string | null;
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

export interface KnowledgeChunk {
  id?: string;
  content: string;
  category: string;
  source?: string;
}

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

export interface ApiError {
  error: string;
  code: string;
  statusCode: number;
}
