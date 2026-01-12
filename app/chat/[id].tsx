import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ChatInterface from '../../components/ChatInterface';

export default function ChatScreen() {
    const { id, type, name, sociusRole } = useLocalSearchParams<{
        id: string;
        type: string;
        name: string;
        sociusRole?: string;
    }>();

    // Determine context based on type
    const context = type === 'socius' ? 'global' : 'dm';
    const friendId = type === 'user' ? parseInt(id.replace('user-', '')) : undefined;

    return (
        <ChatInterface
            context={context}
            friendId={friendId}
            sociusRole={sociusRole}
        />
    );
}
