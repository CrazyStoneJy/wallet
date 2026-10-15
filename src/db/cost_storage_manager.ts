import xLog from "../utils/logs";
import { CostState, TABLE_COST, TABLE_COST_INFO } from "./consts";
import { is_id } from "./internal/is";
import sqliteHelper from "./internal/sqlite_helper";
import dao from "./internal/storage_access_manager";
import { CostEnity } from "./types";

function CostStorageManager() {

    /**
     * data type
     * 
     * type CostEnity = {
            timestamp: number;
            cost: number;
            desc: string;
            type: CostType;
        }
     */
    async function createTable(): Promise<any> {
        const sqlString = `CREATE TABLE IF NOT EXISTS ${TABLE_COST} ( 
            ${TABLE_COST_INFO.ID} INTEGER PRIMARY KEY NOT NULL, 
            ${TABLE_COST_INFO.COST} FLOAT, 
            ${TABLE_COST_INFO.DESC} VARCHAR(20),
            ${TABLE_COST_INFO.TYPE} INTEGER,
            ${TABLE_COST_INFO.STATE} INTEGER,
            ${TABLE_COST_INFO.TIMESTAMP} INTEGER ); `;
        return sqliteHelper.createTable(TABLE_COST, sqlString);
    }

    function insert(enity: CostEnity): Promise<any> {
        if (!enity) {
            return Promise.reject('entity is null');
        }
        const { cost, type, desc, timestamp } = enity || {};
        return dao.insertData(TABLE_COST, [TABLE_COST_INFO.COST, TABLE_COST_INFO.DESC, TABLE_COST_INFO.TYPE, TABLE_COST_INFO.TIMESTAMP, TABLE_COST_INFO.STATE], [cost, desc, type, timestamp, CostState.INIT]);
    }

    function queryAll(): Promise<any> {
        const sqlString = `SELECT * from ${TABLE_COST} WHERE state != ${CostState.DELETEd} ORDER BY timestamp DESC;`;
        return dao.queryData(sqlString, []).then((results: any) => {
            let array = [];
            const { rows } = results || {};
            const len = rows.length || 0;
            for (let i = 0; i < len; i++) {
                let row = results.rows.item(i);
                const { cost, desc, type, timestamp, id, state } = row || {};
                // xLog.logDB('row: ', row);
                const entity = {
                    cost,
                    desc,
                    type,
                    timestamp,
                    id,
                    state
                }
                array.push(entity);
            }
            return Promise.resolve(array);
        });
    }

    function updateById(enity: CostEnity): Promise<any> {
        if (!enity || !is_id(enity.id)) {
            return Promise.reject('entity id is invalid');
        }
        const desc = String(enity.desc || '').replace(/"/g, '""');
        const sqlString = `UPDATE ${TABLE_COST} SET ${TABLE_COST_INFO.COST} = ${enity.cost}, ${TABLE_COST_INFO.DESC} = "${desc}", ${TABLE_COST_INFO.TYPE} = ${enity.type}, ${TABLE_COST_INFO.TIMESTAMP} = ${enity.timestamp}, ${TABLE_COST_INFO.STATE} = ${CostState.UPDATED} WHERE ${TABLE_COST_INFO.ID} = ${enity.id};`;
        return dao.updateData(sqlString);
    }

    /**
     * represent it that make `state` to 
     */
    function deleteById(id: CostEnity['id']): Promise<any> {
        if (!is_id(id)) {
            return Promise.reject(`is not a id`);
        }
        const sqlString = `UPDATE ${TABLE_COST} SET ${TABLE_COST_INFO.STATE} = ${CostState.DELETEd} WHERE ${TABLE_COST_INFO.ID} = ${id};`
        return dao.updateData(sqlString);
    }

    return {
        createTable,
        insert,
        queryAll,
        updateById,
        deleteById
    }

}

const costStorageManager = CostStorageManager();

export default costStorageManager;
