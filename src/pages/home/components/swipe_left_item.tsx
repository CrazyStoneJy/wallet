import { useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import Animated from "react-native-reanimated";
import { color_green, color_green_dark, color_green_light, color_red } from "../../../colors";
import { CostType } from "../../../db/consts";
import { font_size_14 } from "../../../dp";

interface LeftSwipeItemProps {
    onLeftSwipe?: Function;
    onEdit?: (item: any) => void;
    onDelete?: (item: any) => void;
    item: any;
    index: number;
}

function LeftSwipeItem(props: LeftSwipeItemProps) {
    const { item, index, onEdit, onDelete } = props;
    const { desc, cost, id, type } = item || {};
    const swiperableRef = useRef(null);

    function renderRightActions(
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) {
        return (
            <View style={{ height: "100%", width: 120, flexDirection: "row" }}>
                <TouchableOpacity
                    style={styles.style_right_action_item_container}
                    activeOpacity={0.8}
                    onPress={() => onEdit && onEdit(item)}
                >
                    <Text style={styles.style_right_action_text}>编辑</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.style_right_action_item_container}
                    activeOpacity={0.8}
                    onPress={() => onDelete && onDelete(item)}
                >
                    <Text style={styles.style_right_action_text}>删除</Text>
                </TouchableOpacity>
            </View>
        );
    }

    function deleteAction() {}

    function getTypeLabel() {
        switch (type) {
            case CostType.SHOPPING:
                return "购物";
            case CostType.TRANSPORT:
                return "交通";
            case CostType.FOOD:
                return "餐饮";
            case CostType.ENTERTAINMENT:
                return "娱乐";
            default:
                return "其他";
        }
    }

    function close() {
        if (swiperableRef.current) {
            // @ts-ignore
            swiperableRef.current?.close();
        }
    }

    return (
        <GestureHandlerRootView style={styles.style_item_guesture_container}>
            <Swipeable
                childrenContainerStyle={{
                    flexDirection: "row",
                    width: "100%",
                    backgroundColor: color_green,
                }}
                renderRightActions={renderRightActions}
                overshootRight={false}
            >
                <View style={styles.style_item_container} key={`item_${index}`}>
                    <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{getTypeLabel()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.descText}>{desc || "未填写备注"}</Text>
                    </View>
                    <Text style={styles.costText}>{"- ¥ " + Number(cost || 0).toFixed(2)}</Text>
                </View>
            </Swipeable>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    style_item_guesture_container: {
        flexDirection: "row",
        height: 50,
        width: "100%",
        alignItems: "center",
        // backgroundColor: "orange",
        marginBottom: StyleSheet.hairlineWidth,
    },
    style_item_container: {
        flexDirection: "row",
        height: 50,
        width: "100%",
        alignItems: "center",
        backgroundColor: "white",
        borderBottomColor: "#E5EFE8",
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    typeBadge: {
        alignItems: "center",
        backgroundColor: color_green_light,
        borderRadius: 14,
        justifyContent: "center",
        marginLeft: 14,
        marginRight: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    typeBadgeText: {
        color: color_green_dark,
        fontSize: 12,
        fontWeight: "600",
    },
    descText: {
        color: "#385442",
        fontSize: 15,
    },
    costText: {
        color: color_green_dark,
        fontSize: 15,
        fontWeight: "600",
        marginRight: 16,
    },
    style_right_action_item_container: {
        flexDirection: "row",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color_red,
    },
    style_right_action_text: {
        fontSize: font_size_14,
        color: "white",
    },
});

export default LeftSwipeItem;
