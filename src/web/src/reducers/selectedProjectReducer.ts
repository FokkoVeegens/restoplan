import { Reducer } from "react";
import { ActionTypes, RestoplanActions } from "../actions/common";
import { RestoplanProject } from "../models";

export const selectedProjectReducer: Reducer<RestoplanProject | undefined, RestoplanActions> = (state: RestoplanProject | undefined, action: RestoplanActions) => {
    switch (action.type) {
        case ActionTypes.SELECT_RESTOPLAN_PROJECT:
        case ActionTypes.LOAD_RESTOPLAN_PROJECT:
            state = action.payload ? { ...action.payload } : undefined;
            break;
        case ActionTypes.DELETE_RESTOPLAN_PROJECT:
            if (state && state.id === action.payload) {
                state = undefined;
            }
            break;
        case ActionTypes.SAVE_RESTOPLAN_PROJECT:
            if (state && state.id === action.payload.id) {
                state = { ...action.payload };
            }
            break;
    }

    return state;
}
