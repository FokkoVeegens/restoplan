import { Reducer } from "react";
import { ActionTypes, RestoplanActions } from "../actions/common";
import { RestoplanList } from "../models"

export const selectedListReducer: Reducer<RestoplanList | undefined, RestoplanActions> = (state: RestoplanList | undefined, action: RestoplanActions) => {
    switch (action.type) {
        case ActionTypes.SELECT_RESTOPLAN_LIST:
        case ActionTypes.LOAD_RESTOPLAN_LIST:
            state = action.payload ? { ...action.payload } : undefined;
            break;
        case ActionTypes.DELETE_RESTOPLAN_LIST:
            if (state && state.id === action.payload) {
                state = undefined;
            }
            break;
        case ActionTypes.LOAD_RESTOPLAN_ITEMS:
            if (state) {
                state.items = [...action.payload];
            }
            break;
        case ActionTypes.SAVE_RESTOPLAN_ITEM:
            if (state) {
                const items = [...state.items || []];
                const index = items.findIndex(item => item.id === action.payload.id);
                if (index > -1) {
                    items.splice(index, 1, action.payload);
                    state.items = items;
                } else {
                    state.items = [...items, action.payload];
                }
            }
            break;
        case ActionTypes.DELETE_RESTOPLAN_ITEM:
            if (state) {
                state.items = [...(state.items || []).filter(item => item.id !== action.payload)];
            }
            break;
    }

    return state;
}