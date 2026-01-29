import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ChatInterface from '@/components/features/chat/ChatInterface';

export default function SociusChatScreen() {
    const { context } = useLocalSearchParams<{
        context?: string;
    }>();

    // Default to 'default' if no context provided
    const chatContext = context || 'default';

    return (
        <ChatInterface
            message_group_id={chatContext}
        />
    );
}
