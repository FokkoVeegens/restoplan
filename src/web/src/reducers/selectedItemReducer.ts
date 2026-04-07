import { Reducer } from "react";
import { ActionTypes, RestoplanActions } from "../actions/common";
import { RestoplanItem } from "../models"

export const selectedItemReducer: Reducer<RestoplanItem | undefined, RestoplanActions> = (state: RestoplanItem | undefined, action: RestoplanActions): RestoplanItem | undefined => {
    switch (action.type) {
        case ActionTypes.SELECT_RESTOPLAN_ITEM:
        case ActionTypes.LOAD_RESTOPLAN_ITEM:
            state = action.payload ? { ...action.payload } : undefined;
            break;
        case ActionTypes.LOAD_RESTOPLAN_LIST:
            state = undefined;
            break;
        case ActionTypes.DELETE_RESTOPLAN_ITEM:
            if (state && state.id === action.payload) {
                state = undefined;
            }
    }

    return state;
}