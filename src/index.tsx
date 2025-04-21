import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Text,
  StyleSheet,
  View,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { adaptiveColor, setAlphaColor } from './util';
import type {
  IViuPickerProps,
  IViuPickerState,
  RenderItemProps,
} from './types';
import * as Haptics from 'expo-haptics';

const WheelPickerExpo = ({
  items = [],
  backgroundColor = '#FFFFFF',
  width = 150,
  haptics = false,
  selectedIndex = 0,
  height,
  onChange,
  renderItem,
  flatListProps,
  selectedStyle,
  initialSelectedIndex,
}: IViuPickerProps) => {
  const flatListRef = useRef<FlatList>(null);
  const bgColor = setAlphaColor(backgroundColor, 1);

  const [state, setState] = useState<IViuPickerState>({
    selectedIndex,
    itemHeight: 40,
    listHeight: 200,
    data: [],
  });

  const userTouch = useRef(false);

  useEffect(() => {
    let { itemHeight, listHeight } = state;
    if (items.length) {
      const additionalItem = { label: '', value: null };
      const data = [
        additionalItem,
        additionalItem,
        ...items,
        additionalItem,
        additionalItem,
      ];
      if (height) {
        listHeight = height;
        itemHeight = listHeight / 5;
      }
      setState((prev) => ({ ...prev, data, itemHeight, listHeight }));
    }
  }, [items, height, state]);

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      setState((prev) => ({ ...prev, selectedIndex }));
      onChange?.({ index: selectedIndex, item: items[selectedIndex] });
      scrollToItem(selectedIndex);
    }
  }, [items, onChange, selectedIndex]);

  const gradientColor = Platform.select({
    ios: setAlphaColor(bgColor, 0.2),
    android: setAlphaColor(bgColor, 0.4),
    web: setAlphaColor(bgColor, 0.4),
  });

  const gradientContainerStyle = [
    { height: 2 * state.itemHeight, borderColor: selectedStyle?.borderColor },
    styles.gradientContainer,
  ];

  const handleOnSelect = (index: number) => {
    const selectedIdx = Math.abs(index);
    if (selectedIdx < items.length) {
      if (haptics && userTouch.current && state.selectedIndex !== selectedIdx) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setState((prev) => ({ ...prev, selectedIndex: selectedIdx }));
      onChange?.({ index: selectedIdx, item: items[selectedIdx] });
    }
  };

  const scrollToItem = (index: number) => {
    flatListRef.current?.scrollToIndex({ animated: true, index });
  };

  if (!state.data.length) return null;

  return (
    <View style={{ height: state.listHeight, width, backgroundColor: bgColor }}>
      <FlatList
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={(options) =>
          PickerItem(
            options,
            state.selectedIndex,
            {
              ...styles.listItem,
              backgroundColor: bgColor,
              fontSize: state.itemHeight / 2,
              height: state.itemHeight,
            },
            scrollToItem,
            renderItem
          )
        }
        {...flatListProps}
        onTouchStart={(e) => {
          userTouch.current = true;
          flatListProps?.onTouchStart?.(e);
        }}
        ref={flatListRef}
        initialScrollIndex={initialSelectedIndex}
        data={state.data}
        onScroll={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.y / state.itemHeight
          );
          handleOnSelect(index);
        }}
        getItemLayout={(_, index) => ({
          length: state.itemHeight,
          offset: index * state.itemHeight,
          index,
        })}
        snapToInterval={state.itemHeight}
      />
      <View
        style={[
          gradientContainerStyle,
          styles.topGradient,
          { borderBottomWidth: selectedStyle?.borderWidth },
        ]}
      >
        <LinearGradient
          style={styles.linearGradient}
          colors={[bgColor, gradientColor ?? '#FFFFFF']}
        />
      </View>
      <View
        style={[
          gradientContainerStyle,
          styles.bottomGradient,
          { borderTopWidth: selectedStyle?.borderWidth },
        ]}
      >
        <LinearGradient
          style={styles.linearGradient}
          colors={[gradientColor ?? '#FFFFFF', bgColor]}
        />
      </View>
    </View>
  );
};

const Item = React.memo(
  ({ fontSize, label, fontColor, textAlign }: RenderItemProps) => (
    <Text style={{ fontSize, color: fontColor, textAlign }}>{label}</Text>
  )
);

const PickerItem = (
  { item, index }: any,
  indexSelected: number,
  style: any,
  onPress: (index: number) => void,
  renderItem?: (props: RenderItemProps) => JSX.Element
) => {
  const gap = Math.abs(index - (indexSelected + 2));
  const sizeText = [style.fontSize, style.fontSize / 1.5, style.fontSize / 2];

  const fontSize = gap > 1 ? sizeText[2] : sizeText[gap];
  const fontColor = adaptiveColor(style.backgroundColor);
  const textAlign = 'center';

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => onPress(index - 2)}>
      <View style={style}>
        {renderItem ? (
          renderItem({ fontSize, fontColor, label: item.label, textAlign })
        ) : (
          <Item
            fontSize={fontSize}
            fontColor={fontColor}
            textAlign={textAlign}
            label={item.label}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  listItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientContainer: {
    position: 'absolute',
    width: '100%',
  },
  linearGradient: { flex: 1 },
  topGradient: { top: 0 },
  bottomGradient: { bottom: 0 },
});

export default WheelPickerExpo;
