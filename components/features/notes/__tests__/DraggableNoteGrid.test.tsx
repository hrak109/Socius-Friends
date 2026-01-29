import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { DraggableNoteGrid } from '../DraggableNoteGrid';

// Mock dependencies
jest.mock('react-native-reanimated', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.useSharedValue = jest.fn(() => ({ value: {} }));
    Reanimated.useAnimatedStyle = jest.fn(() => ({}));
    Reanimated.useAnimatedReaction = jest.fn();
    Reanimated.withSpring = jest.fn((val: any) => val);
    return Reanimated;
});

jest.mock('react-native-gesture-handler', () => ({
    GestureDetector: ({ children }: any) => children,
    Gesture: {
        Pan: () => ({
            activateAfterLongPress: () => ({
                onStart: () => ({
                    onUpdate: () => ({
                        onFinalize: () => ({})
                    })
                })
            })
        })
    }
}));

describe('DraggableNoteGrid', () => {
    const mockData = [
        { id: '1', title: 'Note 1' },
        { id: '2', title: 'Note 2' },
    ];

    const renderItem = (item: any) => (
        <View testID={`note-${item.id}`}>
            <Text>{item.title}</Text>
        </View>
    );

    it('renders the correct number of items', () => {
        const { getByTestId } = render(
            <DraggableNoteGrid
                data={mockData}
                renderItem={renderItem}
                onOrderChange={jest.fn()}
            />
        );

        expect(getByTestId('note-1')).toBeTruthy();
        expect(getByTestId('note-2')).toBeTruthy();
    });

    it('renders ListEmptyComponent when data is empty', () => {
        const { getByText } = render(
            <DraggableNoteGrid
                data={[]}
                renderItem={renderItem}
                onOrderChange={jest.fn()}
                ListEmptyComponent={<Text>Empty State</Text>}
            />
        );

        expect(getByText('Empty State')).toBeTruthy();
    });

    it('renders ListHeaderComponent when provided', () => {
        const { getByText } = render(
            <DraggableNoteGrid
                data={mockData}
                renderItem={renderItem}
                onOrderChange={jest.fn()}
                ListHeaderComponent={<Text>Header</Text>}
            />
        );

        expect(getByText('Header')).toBeTruthy();
    });
});
