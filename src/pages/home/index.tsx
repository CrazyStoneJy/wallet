import {
    StyleSheet,
    Text,
    View,
    Button,
    Keyboard,
    ToastAndroid,
    SectionList,
    TouchableOpacity
} from "react-native";
import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from "react";
import DigitalInput, { GridType } from "./components/digital_input";
import { DoneButtonState } from "./calulator_reducer";
import {
    ACTION_ADD_COST_ITEM,
    ACTION_CHANGE_COST_TYPE,
    ACTION_CHANGE_DESC,
    ACTION_DELETE_COST_ITEM,
    ACTION_HOME_DEAL_INPUT,
    ACTION_INIT_COST_MONEY,
    ACTION_REFRESH_COST_LIST,
    ACTION_REFRESH_DIGITAL_INPUT_STATE,
    ACTION_START_EDIT_COST_ITEM,
    ACTION_UPDATE_COST_ITEM,
} from "./action";
import sqliteHelper from "../../db/internal/sqlite_helper";
import { CostType, TABLE_COST } from "../../db/consts";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import costStorageManager from "../../db/cost_storage_manager";
import { safeParseFloat } from "../../utils/safe_invoker";
import FlexableBottomSheet, {
    FlexableType,
} from "../../components/flexable_bottom_sheet";
import xLog from "../../utils/logs";
import { homeReducer, initHomeState } from "./home_reducer";
import { useNavigation } from "@react-navigation/native";
import {
    color_divider,
    color_green,
    color_green_dark,
    color_green_light,
    color_green_pale,
    color_primary,
} from "../../colors";
import LeftSwipeItem from "./components/swipe_left_item";
import _ from "../../utils/debounce";

// >>>>>> const area start >>>>>>>

const BUTTON_SIZE = 50;

function getDateKey(timestamp: number) {
    const date = new Date(timestamp);
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
        .map((value) => String(value).padStart(2, "0"))
        .join("-");
}

function getDateTitle(dateKey: string) {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    const todayKey = getDateKey(today.getTime());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday.getTime());

    if (dateKey === todayKey) {
        return `今天 · ${year}年${month}月${day}日`;
    }
    if (dateKey === yesterdayKey) {
        return `昨天 · ${year}年${month}月${day}日`;
    }
    return `${year}年${month}月${day}日`;
}

// >>>>>> const area end >>>>>>>

function HomePage() {
    const [state, dispatch] = useReducer(homeReducer, initHomeState);
    const { costMoney, isShowDigitalInput, doneButtonState, desc, costType, editingId } =
        state || {};
    const { data } = state || {};
    const totalCost = useMemo(
        () => (data || []).reduce((total: number, item: any) => total + Number(item.cost || 0), 0),
        [data]
    );
    const costSections = useMemo(() => {
        const groups: { [key: string]: any[] } = {};
        (data || []).forEach((item: any) => {
            const key = getDateKey(Number(item.timestamp));
            groups[key] = groups[key] || [];
            groups[key].push(item);
        });

        return Object.keys(groups)
            .sort((first, second) => second.localeCompare(first))
            .map((key) => ({
                key,
                title: getDateTitle(key),
                data: groups[key].sort((first, second) => second.timestamp - first.timestamp),
            }));
    }, [data]);
    const categoryOptions = [
        { type: CostType.SHOPPING, label: "购物" },
        { type: CostType.TRANSPORT, label: "交通" },
        { type: CostType.FOOD, label: "餐饮" },
        { type: CostType.ENTERTAINMENT, label: "娱乐" },
        { type: CostType.OTHER, label: "其他" },
    ];
    const bottomSheetRef = useRef(null);
    const navigation = useNavigation();

    useEffect(() => {
        costStorageManager.queryAll().then((result: any) => {
            dispatch({
                type: ACTION_REFRESH_COST_LIST,
                payload: {
                    data: result || [],
                },
            });
        });
        return () => {
            sqliteHelper && sqliteHelper.close();
        };
    }, []);

    function _renderAddButton() {
        return (
            <TouchableOpacity
                style={{
                    position: "absolute",
                    bottom: 80,
                    right: 50,
                    width: BUTTON_SIZE,
                    height: BUTTON_SIZE,
                }}
                onPress={() => {
                    dispatch({ type: ACTION_INIT_COST_MONEY });
                    dispatch({
                        type: ACTION_REFRESH_DIGITAL_INPUT_STATE,
                        payload: { isShow: true },
                    });
                }}
            >
                <View
                    style={{
                        backgroundColor: color_primary,
                        height: BUTTON_SIZE,
                        width: BUTTON_SIZE,
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: BUTTON_SIZE / 2,
                    }}
                >
                    <Text
                        style={{
                            color: color_green_dark,
                            fontSize: 40,
                            fontWeight: "400",
                        }}
                    >
                        +
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    function _renderCostListItem({ item, index }: any) {
        const { cost, desc, type, timestamp } = item || {};
        // xLog.log('item:', item);
        return (
            <LeftSwipeItem
                item={item}
                index={index}
                onEdit={(selectedItem) => dispatch({ type: ACTION_START_EDIT_COST_ITEM, payload: { item: selectedItem } })}
                onDelete={_deleteCostItem}
            />
        );
    }

    function _deleteCostItem(item: any) {
        if (!item || !item.id) {
            return;
        }
        dispatch({ type: ACTION_DELETE_COST_ITEM, payload: { id: item.id } });
        if (item.id > 0) {
            costStorageManager.deleteById(item.id);
        }
    }

    function _renderCostListByDay() {
        if (!data) {
            return;
        }
        return (
            <View
                style={{
                    flex: 1,
                    flexDirection: "column",
                    marginTop: 10,
                    width: "100%",
                }}
            >
                <SectionList
                    sections={costSections}
                    renderItem={_renderCostListItem}
                    keyExtractor={(item: any, index: number) => String(item.id || `${item.timestamp}_${index}`)}
                    renderSectionHeader={({ section }: any) => (
                        <View style={styles.dateHeader}>
                            <Text style={styles.dateHeaderText}>{section.title}</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>还没有记账记录</Text>
                            <Text style={styles.emptyText}>点击右下角按钮，记录第一笔消费</Text>
                        </View>
                    }
                />
            </View>
        );
    }

    function _renderSummary() {
        return (
            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>总消费</Text>
                <Text style={styles.summaryAmount}>¥ {totalCost.toFixed(2)}</Text>
                <Text style={styles.summaryHint}>{data.length} 笔记录 · 今天也要好好生活</Text>
            </View>
        );
    }

    function _renderCategoryPicker() {
        return (
            <View style={styles.categorySection}>
                <Text style={styles.fieldLabel}>消费分类</Text>
                <View style={styles.categoryRow}>
                    {categoryOptions.map((option) => (
                        <TouchableOpacity
                            key={option.type}
                            style={[styles.categoryChip, costType === option.type && styles.categoryChipActive]}
                            onPress={() => dispatch({ type: ACTION_CHANGE_COST_TYPE, payload: { costType: option.type } })}
                        >
                            <Text style={[styles.categoryText, costType === option.type && styles.categoryTextActive]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    function _renderBottomSheetContent() {
        const doneText =
            doneButtonState === DoneButtonState.DONE ? "完成" : "=";
        return (
            <View style={{ flexDirection: "column", width: "100%" }}>
                {_renderCategoryPicker()}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginHorizontal: 20,
                        marginBottom: 10,
                        height: 40,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            flex: 1,
                            height: 40,
                            alignItems: "center",
                        }}
                    >
                        <Text>描述：</Text>
                        <BottomSheetTextInput
                            placeholder="请输入"
                            value={desc}
                            onSubmitEditing={Keyboard.dismiss}
                            onChangeText={(text: string) => {
                                xLog.log("text:", text);
                                dispatch({
                                    type: ACTION_CHANGE_DESC,
                                    payload: { desc: text },
                                });
                            }}
                        />
                    </View>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ paddingLeft: 20 }}
                        onPress={() => {
                            if (Keyboard.isVisible()) {
                                Keyboard.dismiss();
                            }
                        }}
                    >
                        <Text style={{ fontSize: 25, fontWeight: "400" }}>
                            {costMoney ? costMoney : 0}
                        </Text>
                    </TouchableOpacity>
                </View>
                <DigitalInput
                    doneText={doneText}
                    onClickCallback={(gridType: GridType, text: string) => {
                        dispatch({
                            type: ACTION_HOME_DEAL_INPUT,
                            payload: { gridType },
                        });
                        if (
                            gridType === GridType.GRID_DONE &&
                            doneButtonState === DoneButtonState.DONE
                        ) {
                            if (!costMoney) {
                                ToastAndroid.show(
                                    "请输入金额",
                                    ToastAndroid.SHORT
                                );
                                return;
                            }
                            const isEditing = editingId !== null && editingId !== undefined;
                            const item = {
                                ...(isEditing ? { id: editingId } : {}),
                                desc,
                                type: costType,
                                cost: costMoney ? safeParseFloat(costMoney) : 0,
                                timestamp: isEditing ? state.data.find((record: any) => record.id === editingId)?.timestamp || Date.now() : Date.now(),
                            };
                            dispatch({ type: ACTION_INIT_COST_MONEY });
                            if (isEditing) {
                                dispatch({
                                    type: ACTION_UPDATE_COST_ITEM,
                                    payload: { item },
                                });
                                if (editingId > 0) {
                                    costStorageManager.updateById(item);
                                }
                            } else {
                                costStorageManager.insert(item).then((result: any) => {
                                    dispatch({
                                        type: ACTION_ADD_COST_ITEM,
                                        payload: { item: { ...item, id: result?.insertId } },
                                    });
                                });
                            }
                        }
                    }}
                />
            </View>
        );
    }

    function _renderBottomSheet() {
        return (
            <FlexableBottomSheet
                setRefCallback={(_ref: any) => {
                    bottomSheetRef.current = _ref;
                }}
                snapToPercent={"50%"}
                visible={isShowDigitalInput}
                type={FlexableType.FLEX_TO}
                children={_renderBottomSheetContent()}
                onClose={() => {
                    dispatch({
                        type: ACTION_REFRESH_DIGITAL_INPUT_STATE,
                        payload: { isShow: false },
                    });
                }}
            />
        );
    }

    return (
        <View style={styles.style_home_container}>
            {_renderSummary()}
            {_renderCostListByDay()}
            {_renderAddButton()}
            {_renderBottomSheet()}
        </View>
    );
}

const styles = StyleSheet.create({
    style_home_container: {
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: color_green_pale,
        height: "100%",
        width: "100%",
    },
    summaryCard: {
        width: "100%",
        backgroundColor: color_green,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    summaryLabel: {
        color: "#EAF5ED",
        fontSize: 15,
        marginBottom: 8,
    },
    summaryAmount: {
        color: "white",
        fontSize: 34,
        fontWeight: "700",
        letterSpacing: 0,
    },
    summaryHint: {
        color: "#EAF5ED",
        fontSize: 13,
        marginTop: 8,
    },
    emptyContainer: {
        alignItems: "center",
        paddingTop: 72,
    },
    emptyTitle: {
        color: color_green_dark,
        fontSize: 16,
        fontWeight: "600",
    },
    emptyText: {
        color: "#7D9785",
        fontSize: 13,
        marginTop: 8,
    },
    dateHeader: {
        backgroundColor: color_green_pale,
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 8,
    },
    dateHeaderText: {
        color: color_green_dark,
        fontSize: 14,
        fontWeight: "600",
    },
    categorySection: {
        paddingHorizontal: 20,
        paddingTop: 2,
        paddingBottom: 6,
    },
    fieldLabel: {
        color: color_green_dark,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 10,
    },
    categoryRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    categoryChip: {
        borderColor: color_divider,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: color_green_pale,
    },
    categoryChipActive: {
        backgroundColor: color_green_light,
        borderColor: color_green,
    },
    categoryText: {
        color: "#6E8274",
        fontSize: 13,
    },
    categoryTextActive: {
        color: color_green_dark,
        fontWeight: "600",
    },
});

export default HomePage;
