import { Reducer } from "react";
import { ActionTypes, RestoplanActions } from "../actions/common";
import { RestoplanProject } from "../models";

export const projectsReducer: Reducer<RestoplanProject[], RestoplanActions> = (state: RestoplanProject[], action: RestoplanActions): RestoplanProject[] => {
    switch (action.type) {
        case ActionTypes.LOAD_RESTOPLAN_PROJECTS:
            state = [...action.payload];
            break;
        case ActionTypes.SAVE_RESTOPLAN_PROJECT: {
            const index = state.findIndex(p => p.id === action.payload.id);
            if (index > -1) {
                const updated = [...state];
                updated.splice(index, 1, action.payload);
                state = updated;
            } else {
                state = [...state, action.payload];
            }
            break;
        }
        case ActionTypes.DELETE_RESTOPLAN_PROJECT:
            state = [...state.filter(p => p.id !== action.payload)];
    }

    return state;
}
