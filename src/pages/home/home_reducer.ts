import { Action } from "../../types/action";
import { CostType } from "../../db/consts";
import { ACTION_ADD_COST_ITEM, ACTION_DELETE_COST_ITEM, ACTION_REFRESH_COST_LIST, ACTION_UPDATE_COST_ITEM } from "./action";
import calculatorReducer, { DoneButtonState } from "./calulator_reducer";

function homeReducer(state: any, action: Action) {
    const { type, payload } = action || {};
    // xLog.log('type: ', type, ', payload: ', payload, 'state: ', JSON.stringify(state));
    switch (type) {
        case ACTION_REFRESH_COST_LIST:
            const { data } = payload || {};
            return { ...state, data: data || [] };
        case ACTION_ADD_COST_ITEM:
            const { item } = payload || {};
            const { data: originalData } = state || {};
            return { ...state, data: [item, ...(originalData || [])] };
        case ACTION_DELETE_COST_ITEM:
            const { id: deleteId } = payload || {};
            return { ...state, data: (state.data || []).filter((item: any) => item.id !== deleteId) };
        case ACTION_UPDATE_COST_ITEM:
            const { item: updatedItem } = payload || {};
            return {
                ...state,
                data: (state.data || []).map((item: any) => item.id === updatedItem.id ? updatedItem : item),
            };
    }
    // todo how to deal multi reducer.
    return calculatorReducer(state, action);
}

const initHomeState = {
    costMoney: '',  // 计算的金额
    isShowDigitalInput: false,  // 是否显示金额计算器
    doneButtonState: DoneButtonState.DONE, // 完成按钮显示状态
    desc: '', // desc of cost calculator 
    costType: CostType.SHOPPING,
    editingId: null,
    data: [], // cost money 数组
};

export { 
    homeReducer,
    initHomeState
};
