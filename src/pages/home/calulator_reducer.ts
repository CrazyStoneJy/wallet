import { Action } from "../../types/action";
import { CostType } from "../../db/consts";
import xLog from "../../utils/logs";
import { safeParseFloat } from "../../utils/safe_invoker";
import { ACTION_ADD_COST_ITEM, ACTION_CHANGE_COST_TYPE, ACTION_CHANGE_DESC, ACTION_HOME_DEAL_INPUT, ACTION_INIT_COST_MONEY, ACTION_REFRESH_COST_LIST, ACTION_REFRESH_DIGITAL_INPUT_STATE, ACTION_START_EDIT_COST_ITEM } from "./action";
import { GridType } from "./components/digital_input";

export enum DoneButtonState {
    CALCULATE = 1,
    DONE = 2
}

enum OperationType {
    OPERARION_ADD = 1,
    OPERATION_SUBTRACT = 2
}

const operationSymbols = [ '+', '-' ];

export default function reducer(state: any, action: Action) {
    const { type, payload } = action || {};
    // xLog.log('calculator type: ', type, ', payload: ', payload, 'state: ', JSON.stringify(state));
    switch (type) {
        case ACTION_HOME_DEAL_INPUT:
            const dealedState = dealInput(state, payload);
            return { ...state, ...dealedState };
        case ACTION_REFRESH_DIGITAL_INPUT_STATE:
            const { isShow } = payload || {};
            return { ...state, isShowDigitalInput: isShow };
        case ACTION_INIT_COST_MONEY:
            return {
                ...state,
                costMoney: '',
                desc: '',
                costType: CostType.SHOPPING,
                editingId: null,
                doneButtonState: DoneButtonState.DONE,
            };
        case ACTION_CHANGE_DESC:
            const { desc } = payload || {};
            return { ...state, desc };
        case ACTION_CHANGE_COST_TYPE:
            const { costType } = payload || {};
            return { ...state, costType };
        case ACTION_START_EDIT_COST_ITEM:
            const { item } = payload || {};
            return {
                ...state,
                costMoney: String(item.cost || ""),
                desc: item.desc || "",
                costType: item.type,
                editingId: item.id,
                isShowDigitalInput: true,
                doneButtonState: DoneButtonState.DONE,
            };
    }
}

function dealInput(state: any, payload: any) {
    let { costMoney, isShowDigitalInput } = state || {};
    const { gridType } = payload || {};
    let doneState = DoneButtonState.DONE;
    switch (gridType) {
        case GridType.GRID_1:
        case GridType.GRID_2:
        case GridType.GRID_3:
        case GridType.GRID_4:
        case GridType.GRID_5:
        case GridType.GRID_6:
        case GridType.GRID_7:
        case GridType.GRID_8:
        case GridType.GRID_9:
            costMoney = carryDigital(costMoney, gridType);
            doneState = hasOperationSymbol(costMoney) ? DoneButtonState.CALCULATE : DoneButtonState.DONE;
            return { ...state, costMoney, doneButtonState: doneState };
        case GridType.GRID_BACK:
            if (costMoney && costMoney.length > 0) {
                costMoney = costMoney.slice(0, costMoney.length - 1);
            }
            doneState = hasOperationSymbol(costMoney) ? DoneButtonState.CALCULATE : DoneButtonState.DONE;
            return { ...state, costMoney, doneButtonState: doneState };
        case GridType.GRID_DONE:
            const { doneButtonState } = state || {};
            if (doneButtonState === DoneButtonState.DONE) {
                if (!costMoney) {
                    return { ...state };
                }
                return { ...state, isShowDigitalInput: false };
            } else {
                costMoney = calulateOperation(costMoney);
                return { ...state, costMoney, doneButtonState: DoneButtonState.DONE };
            }
        case GridType.GRID_ADD:
            costMoney = dealAddOperation(costMoney);
            doneState = hasOperationSymbol(costMoney) ? DoneButtonState.CALCULATE : DoneButtonState.DONE;
            return { ...state, costMoney, doneButtonState: doneState };
        case GridType.GRID_SUBTRACT:
            costMoney = dealSubtractOperation(costMoney);
            doneState = hasOperationSymbol(costMoney) ? DoneButtonState.CALCULATE : DoneButtonState.DONE;
            return { ...state, costMoney, doneButtonState: doneState };
        case GridType.GRID_DOT:
            costMoney = addDotOperation(costMoney);
            return { ...state, costMoney };
        case GridType.GRID_ZERO:
            costMoney = dealZeroOperation(costMoney);
            return { ...state, costMoney };
    }
}

function dealZeroOperation(costMoney: string) {
    if (costMoney === '0') {
        return costMoney;
    }
    return costMoney + '0';
}

function calulateOperation(costMoney: string) {
    const expressionSymbol = getExpressionSymbol(costMoney);
    console.log(">>>expressionSymbol: ", expressionSymbol);
    
    if (!expressionSymbol) {
        return costMoney;
    }
    // todo how to calculate negative number.
    const operationNumbers = costMoney.split(expressionSymbol);
    if (operationNumbers && operationNumbers.length === 2) {
        const num1 = operationNumbers[0] === '' ? 0 : safeParseFloat(operationNumbers[0]);
        const num2 = operationNumbers[1] === '' ? 0 : safeParseFloat(operationNumbers[1]);
        costMoney = calculate(num1, num2, expressionSymbol) + "";
    }
    return costMoney;
}

function addDotOperation(costMoney: string) {
    if (costMoney === '') {
        return '.';
    }
    const lastIndex = costMoney.length - 1;
    if (costMoney.lastIndexOf('.') === lastIndex) {
        return costMoney;
    }
    return costMoney += '.';
}


/**
 * check expression has already that have (add or subtract) symbol,
 * if has should be calulate, otherwise append (+ , -) at string tail position.
 */
function dealMathOperation(costMoney: string, operationType: OperationType): string {
    if (costMoney === '') {
        return costMoney;
    }
    const opertationSymbol = getOperationSymbol(operationType);
    // check has operation symbol whether or not.
    if (hasOperationSymbol(costMoney)) {
        // deal symbol at tail.
        const last = costMoney.substring(costMoney.length - 1, costMoney.length);
        if (operationSymbols.indexOf(last) >= 0) {
            if (opertationSymbol === last) {
                return costMoney;
            } else {
                // current symbol is not equals last symbol.
                return costMoney.replace(last, opertationSymbol);
            }
        }
        // calculate
        const expressionSymbol = getExpressionSymbol(costMoney);
        if (!expressionSymbol) {
            return costMoney;
        }
        // todo how to calculate negative number.
        const operationNumbers = costMoney.split(expressionSymbol);
        if (operationNumbers && operationNumbers.length === 2) {
            const num1 = safeParseFloat(operationNumbers[0]);
            const num2 = safeParseFloat(operationNumbers[1]);
            costMoney = calculate(num1, num2, expressionSymbol) + opertationSymbol;
        }
    } else {
        costMoney += opertationSymbol;
    }
    return costMoney;
}

function getExpressionSymbol(costMoney: string): string | undefined {
    return operationSymbols.find((symbol: string) => {
        return costMoney.indexOf(symbol) >= 0;
    });
}

function getDicimalBase(num: number) {
    let temp = num.toString();
    let array = temp.split(".");
    return array[1] ? array[1].length : 0;
}

function calculate(num1: number, num2: number, symbol: string) {
    // get max digital decimal base
    const maxDecimalBase = Math.max(getDicimalBase(num1), getDicimalBase(num2));
    switch (symbol) {
        case '+':
            return (num1 + num2).toFixed(maxDecimalBase);
        case '-':
            return (num1 - num2).toFixed(maxDecimalBase);
    }
}

function hasOperationSymbol(costMoney: string) {
    if (!costMoney) {
        return false;
    }
    return operationSymbols.some((symbol: string) => {
        return costMoney.indexOf(symbol) >= 0;
    })
}

function getOperationSymbol(operationType: OperationType) {
    switch (operationType) {
        case OperationType.OPERARION_ADD:
            return '+';
        case OperationType.OPERATION_SUBTRACT:
            return '-';
    }
}

function dealAddOperation(costMoney: string) {
    return dealMathOperation(costMoney, OperationType.OPERARION_ADD);
}

function dealSubtractOperation(costMoney: string) {
    return dealMathOperation(costMoney, OperationType.OPERATION_SUBTRACT);
}

// 进位
function carryDigital(costMoney: string, digital: number) {
    if (costMoney === '0') {
        return digital + "";
    }
    // console.log("costMoney: ", costMoney, ", digital: ", digital);
    return costMoney + digital;
}
