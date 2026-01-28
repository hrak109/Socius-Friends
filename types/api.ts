/**
 * TypeScript API response types for Socius Mobile.
 * These types match the Pydantic schemas in the backend.
 */

// ============== AUTH ==============

export interface TokenResponse {
    access_token: string;
    token_type: string;
    username: string;
    user_id: number;
}

// ============== CHAT ==============

export interface ChatMessage {
    id: number;
    message_author: 'user' | 'assistant';
    content: string;
    topic: string;
    created_at: string; // ISO date string
    role?: 'user' | 'assistant'; // Backwards compatibility
}

export interface AskResponse {
    question_id: string;
    status: 'queued';
}

export interface AnswerResponse {
    question_id: string;
    status: 'queued' | 'answered';
    answer?: string;
}

// ============== DIARY ==============

export interface DiaryEntry {
    id: number;
    content: string;
    date: string; // YYYY-MM-DD
    created_at: string;
}

export interface DiaryCreate {
    content: string;
    date: string;
}

export interface DiaryUpdate {
    content: string;
}

// ============== NOTES ==============

export interface NoteEntry {
    id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface NoteCreate {
    title: string;
    content: string;
}

export interface NoteUpdate {
    title: string;
    content: string;
}

// ============== USER ==============

export interface UserProfile {
    id: number;
    username: string;
    display_name: string | null;
    email: string;
    custom_avatar_url: string | null;
    socius_role: string | null;
    language: string | null;
}

export interface UserUpdate {
    username: string;
    display_name?: string;
    custom_avatar_url?: string;
    socius_role?: string;
    language?: string;
}

// ============== FRIENDS ==============

export interface Friend {
    id: number;
    friend_id: number;
    friend_username: string;
    friend_avatar: string | null;
    status: 'pending' | 'accepted' | 'incoming';
    created_at: string;
}

export interface FriendRequest {
    username: string;
}

// ============== MESSAGES ==============

export interface DirectMessage {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
    is_me: boolean;
}

export interface Conversation {
    friend_id: number;
    friend_username: string;
    last_message: string;
    last_message_time: string | null;
    unread_count: number;
}

export interface SendMessageRequest {
    receiver_id: number;
    content: string;
}

// ============== NOTIFICATIONS ==============

export interface UnreadCounts {
    friend_requests: number;
    unread_messages: number;
    socius_unread: number;
    total: number;
}

// ============== API ERROR ==============

export interface ApiError {
    detail: string;
}
