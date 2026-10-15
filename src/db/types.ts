import { CostType } from "./consts";

export type CostEnity = {
    timestamp: number;
    cost: number;
    desc: string;
    type: CostType;
    id?: number;
    state?: number;
}
