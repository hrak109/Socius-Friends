import React from 'react';
import { View } from 'react-native';
import { MessageText, MessageTextProps, IMessage } from 'react-native-gifted-chat';
import CalorieWidget from '@/components/features/chat/widgets/CalorieWidget';
import WorkoutWidget from '@/components/features/chat/widgets/WorkoutWidget';
import PasswordWidget from '@/components/features/chat/widgets/PasswordWidget';

export const renderMessageWidgets = (props: MessageTextProps<IMessage>) => {
    const { currentMessage } = props;
    let text = currentMessage.text;
    const widgets: React.ReactNode[] = [];
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    let match;

    while ((match = jsonRegex.exec(currentMessage.text)) !== null) {
        try {
            const data = JSON.parse(match[1]);
            const key = `${currentMessage._id}-widget-${widgets.length}`;

            if (data.type === 'calorie_event') {
                const foodName = data.food || data.name || data.item || data.title || 'Food';
                widgets.push(
                    <View key={key} style={{ padding: 5, width: 250, marginTop: 10 }}>
                        <CalorieWidget
                            food={foodName}
                            options={data.options || []}
                            messageId={`${currentMessage._id}_${widgets.length}`}
                        />
                    </View>
                );
            } else if (data.type === 'workout_event') {
                const exerciseName = data.exercise || data.name || data.activity || data.workout || 'Workout';
                widgets.push(
                    <View key={key} style={{ padding: 5, width: 250, marginTop: 10 }}>
                        <WorkoutWidget
                            exercise={exerciseName}
                            duration={data.duration}
                            options={data.options || []}
                            messageId={`${currentMessage._id}_${widgets.length}`}
                        />
                    </View>
                );
            } else if (data.type === 'password_event') {
                widgets.push(
                    <View key={key} style={{ padding: 5, width: 280, marginTop: 10 }}>
                        <PasswordWidget
                            service={data.service || ''}
                            username={data.username || ''}
                            password={data.password || ''}
                            messageId={`${currentMessage._id}_${widgets.length}`}
                        />
                    </View>
                );
            }
        } catch (e) {
            console.warn("Failed to parse widget JSON", e);
        }
    }

    text = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '').trim();

    if (!text && widgets.length === 0) return null;

    return (
        <View>
            {text ? (
                <MessageText
                    {...props}
                    currentMessage={{
                        ...currentMessage,
                        text: text
                    }}
                />
            ) : null}
            {widgets}
        </View>
    );
};
