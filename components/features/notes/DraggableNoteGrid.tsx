import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    useAnimatedReaction,
    SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const SIDE_PADDING = 16;
const GAP = 8;
const ITEM_WIDTH = (width - (SIDE_PADDING * 2) - GAP) / 2;
const ITEM_HEIGHT = 180;
const VERTICAL_GAP = 12;

interface SortableGridItemProps {
    id: string;
    index: number;
    children: React.ReactNode;
    positions: SharedValue<{ [key: string]: number }>;
    onDragEnd: () => void;
    itemCount: number;
}

const SortableGridItem = ({
    id,
    index,
    children,
    positions,
    onDragEnd,
    itemCount
}: SortableGridItemProps) => {
    const isGestureActive = useSharedValue(false);

    const getPosition = (i: number) => {
        'worklet';
        const col = i % 2;
        const row = Math.floor(i / 2);
        return {
            x: SIDE_PADDING + col * (ITEM_WIDTH + GAP),
            y: row * (ITEM_HEIGHT + VERTICAL_GAP)
        };
    };

    const position = getPosition(index);
    const translateX = useSharedValue(position.x);
    const translateY = useSharedValue(position.y);

    const startX = useSharedValue(0);
    const startY = useSharedValue(0);

    useAnimatedReaction(
        () => positions.value[id],
        (newOrder) => {
            if (!isGestureActive.value && newOrder !== undefined) {
                const newPos = getPosition(newOrder);
                translateX.value = withSpring(newPos.x, { damping: 20, stiffness: 200 });
                translateY.value = withSpring(newPos.y, { damping: 20, stiffness: 200 });
            }
        },
        [positions, id]
    );

    const panGesture = Gesture.Pan()
        .activateAfterLongPress(250)
        .onStart(() => {
            startX.value = translateX.value;
            startY.value = translateY.value;
            isGestureActive.value = true;
        })
        .onUpdate((event) => {
            translateX.value = startX.value + event.translationX;
            translateY.value = startY.value + event.translationY;

            // Calculate target index
            const col = Math.round((translateX.value - 16) / (ITEM_WIDTH + 16));
            const row = Math.round(translateY.value / (ITEM_HEIGHT + 12));

            const clampedCol = Math.max(0, Math.min(1, col));
            const clampedRow = Math.max(0, row);

            const targetIndex = clampedRow * 2 + clampedCol;
            const maxIndex = itemCount - 1;
            const clampedIndex = Math.max(0, Math.min(targetIndex, maxIndex));

            const oldOrder = positions.value[id];
            if (oldOrder !== clampedIndex) {
                const newPositions = { ...positions.value };
                // Shift other items
                for (const key in newPositions) {
                    if (key === id) continue;
                    if (oldOrder < clampedIndex) {
                        if (newPositions[key] > oldOrder && newPositions[key] <= clampedIndex) {
                            newPositions[key] -= 1;
                        }
                    } else {
                        if (newPositions[key] >= clampedIndex && newPositions[key] < oldOrder) {
                            newPositions[key] += 1;
                        }
                    }
                }
                newPositions[id] = clampedIndex;
                positions.value = newPositions;
            }
        })
        .onFinalize(() => {
            isGestureActive.value = false;
            const finalOrder = positions.value[id];
            const finalPos = getPosition(finalOrder);
            translateX.value = withSpring(finalPos.x);
            translateY.value = withSpring(finalPos.y);
            runOnJS(onDragEnd)();
        });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            top: 0,
            left: 0,
            width: ITEM_WIDTH,
            height: ITEM_HEIGHT,
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: withSpring(isGestureActive.value ? 1.05 : 1) },
            ],
            zIndex: isGestureActive.value ? 100 : 1,
            shadowOpacity: withSpring(isGestureActive.value ? 0.2 : 0),
        };
    });

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
                {children}
            </Animated.View>
        </GestureDetector>
    );
};

export interface DraggableNoteGridProps<T> {
    data: T[];
    renderItem: (item: T) => React.ReactNode;
    onOrderChange: (newData: T[]) => void;
    contentContainerStyle?: any;
    ListEmptyComponent?: React.ReactNode;
    ListHeaderComponent?: React.ReactNode;
}

export function DraggableNoteGrid<T extends { id: string }>({
    data,
    renderItem,
    onOrderChange,
    contentContainerStyle,
    ListEmptyComponent,
    ListHeaderComponent
}: DraggableNoteGridProps<T>) {
    const positions = useSharedValue<{ [key: string]: number }>({});
    const dataRef = useRef(data);
    dataRef.current = data;

    useEffect(() => {
        const initialPositions: { [key: string]: number } = {};
        data.forEach((item, index) => {
            initialPositions[item.id] = index;
        });
        positions.value = initialPositions;
    }, [data.length]); // Re-init if length changes

    const handleDragEnd = () => {
        const newOrderIndex = positions.value;
        const newData = [...dataRef.current];
        newData.sort((a, b) => newOrderIndex[a.id] - newOrderIndex[b.id]);
        onOrderChange(newData);
    };

    const rowCount = Math.ceil(data.length / 2);
    const containerHeight = rowCount * (ITEM_HEIGHT + 12) + 100; // + padding

    return (
        <ScrollView
            contentContainerStyle={[contentContainerStyle, { height: containerHeight }]}
            showsVerticalScrollIndicator={false}
        >
            {ListHeaderComponent}
            {data.length === 0 ? (
                ListEmptyComponent
            ) : (
                data.map((item, index) => (
                    <SortableGridItem
                        key={item.id}
                        id={item.id}
                        index={index}
                        positions={positions}
                        onDragEnd={handleDragEnd}
                        itemCount={data.length}
                    >
                        {renderItem(item)}
                    </SortableGridItem>
                ))
            )}
        </ScrollView>
    );
}
