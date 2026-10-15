// database const
const DB_NAME = 'wallet.db';
const DB_VERSION = '1.0';
const DB_ALIAS_NAME = 'wallet';
const DB_SIZE = 200000;

// table const
const TABLE_COST = "table_cost";

enum TABLE_COST_INFO {
    ID = 'id',
    COST = 'cost', // 花费金额
    DESC = 'desc', // 花费详情
    TYPE = 'type', // 花费类型 `COST_TYPE`
    TIMESTAMP = 'timestamp', // 时间戳
    STATE = 'state' // 状态 `CostState`
}


// modal const
enum CostType {
    SHOPPING = 1,
    TRANSPORT = 2,
    FOOD = 3,
    ENTERTAINMENT = 4,
    OTHER = 5,
}

enum CostState {
    INIT = 1,  // 创建
    DELETEd = -1,  // 删除
    UPDATED = 2,  // 更新
}

export {
    DB_NAME,
    DB_ALIAS_NAME,
    DB_SIZE,
    DB_VERSION,
    TABLE_COST ,
    CostType,
    TABLE_COST_INFO,
    CostState
}
