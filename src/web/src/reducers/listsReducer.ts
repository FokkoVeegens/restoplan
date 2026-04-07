import { Reducer } from "react";
import { ActionTypes, RestoplanActions } from "../actions/common";
import { RestoplanList } from "../models"

export const listsReducer: Reducer<RestoplanList[], RestoplanActions> = (state: RestoplanList[], action: RestoplanActions): RestoplanList[] => {
    switch (action.type) {
        case ActionTypes.LOAD_RESTOPLAN_LISTS:
            state = [...action.payload];
            break;
        case ActionTypes.SAVE_RESTOPLAN_LIST:
            state = [...state, action.payload];
            break;
        case ActionTypes.DELETE_RESTOPLAN_LIST:
            state = [...state.filter(list => list.id !== action.payload)]
    }

    return state;
}