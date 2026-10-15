import BottomSheet, { BottomSheetScrollView, TouchableOpacity } from '@gorhom/bottom-sheet';
import {useCallback, useMemo, useRef, useState} from 'react';
import {Button, Keyboard, KeyboardAvoidingView, Text, View, useWindowDimensions} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import xLog from '../utils/logs';

interface FlexableBottomSheetProps {
    visible: boolean;
    maxHeight?: number;
    fixHeight?: number | string; // 固定高度，`FlexableType`为`FIX`或者`FIX_TO_FULL`时,才有效
    children?: ReactNode;
    onClose?: Function;
    type?: FlexableType
    setRefCallback?: Function;
    isTransparentBackground?: boolean;
    snapToPercent?: string;
}

export enum FlexableType {
    FLEX, // 自适应高度
    FIX, // 固定高度
    FIX_TO_FULL, // 固定高度，滑动到全屏
    FLEX_TO_FULL, // 自适应高度，滑动到全屏
    FLEX_TO,  //
}

function FlexableBottomSheet(props: FlexableBottomSheetProps) {

    const { visible, onClose, children, type, maxHeight, fixHeight, setRefCallback, snapToPercent } = props;
    const { height: screenHeight } = useWindowDimensions();
    const DEFAULT_MAX_HEIGHT = 0.8 * screenHeight;
    const DEAULT_FIX_HEIGHT = 0.3 * screenHeight;
    const [contentHeight, setContentHeight] = useState(0);

    // ref
    const bottomSheetRef = useRef<BottomSheet>(null);

    // callbacks
    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            onClose && onClose();
        }
    }, []);

    function getConfigByType(): any {
        const _fixHeight = fixHeight || DEAULT_FIX_HEIGHT;
        switch (type) {
            case FlexableType.FLEX:
                return {
                    enableDynamicSizing: true,
                    contentHeight: 1,
                    maxDynamicContentSize: maxHeight || DEFAULT_MAX_HEIGHT
                };
            case FlexableType.FIX:
            default:
                return {
                    snapPoints: [_fixHeight]
                };
            case FlexableType.FIX_TO_FULL:
                return {
                    snapPoints: [_fixHeight, '100%']
                };
            case FlexableType.FLEX_TO_FULL:
                return {
                    enableDynamicSizing: true,
                    contentHeight: 1,
                    maxDynamicContentSize: maxHeight || DEFAULT_MAX_HEIGHT,
                    snapPoints: ['100%']
                };
            case FlexableType.FLEX_TO:
                const point = snapToPercent ? snapToPercent : '100%';
                return {
                    enableDynamicSizing: true,
                    contentHeight: 1,
                    maxDynamicContentSize: maxHeight || DEFAULT_MAX_HEIGHT,
                    snapPoints: [point]
                };
        }
    }

    function setRef(_ref: any) {
        setRefCallback && setRefCallback(_ref);
        if (bottomSheetRef) {
            bottomSheetRef.current = _ref;
        }
    }

    function _close() {
        if (Keyboard.isVisible()) {
            Keyboard.dismiss();
        } else {
            bottomSheetRef.current?.close();
        }
    }

    return visible ? (
        <GestureHandlerRootView
            style={{flex: 1, width: '100%', position: 'absolute', height: '100%', backgroundColor: 'transparent'}}>
            <View
                style={{
                    height: '100%',
                    backgroundColor: '#00000099',
                    width: '100%',
                    flexDirection: 'column'
                }}>
                <TouchableOpacity 
                    activeOpacity={1} 
                    style={{ backgroundColor: 'transparent', height: (contentHeight === 0 ? 0 : screenHeight - contentHeight), width: '100%' }} 
                    onPress={() => {
                        _close();
                    }}
                />
                <BottomSheet
                    ref={setRef}
                    onChange={handleSheetChanges}
                    handleIndicatorStyle={{ backgroundColor: '#8F8F8F', height: 4, width: 34 }}
                    enablePanDownToClose={true}
                    enableContentPanningGesture={false}
                    keyboardBehavior="extend"
                    keyboardBlurBehavior="restore"
                    android_keyboardInputMode="adjustResize"
                    onClose={() => {
                        _close();
                    }}
                    {...getConfigByType()}
                >
                    <BottomSheetScrollView
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        <View 
                            onLayout={(e: any) => {
                                const { nativeEvent } = e || {};
                                const { layout } = nativeEvent || {};
                                const { height } = layout || {};
                                // xLog.log('height: ', height);
                                setContentHeight(height);
                        }}>
                            {children}
                        </View>
                    </BottomSheetScrollView>
                </BottomSheet>
            </View>
        </GestureHandlerRootView>
    ) : null;
}

export default FlexableBottomSheet;
