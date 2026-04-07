import { Dispatch } from "react";
import { RestoplanActions } from "../actions/common";
import { RestoplanItem } from "./restoplanItem";
import { RestoplanList } from "./restoplanList";

export interface AppContext {
    state: ApplicationState
    dispatch: Dispatch<RestoplanActions>
}

export interface ApplicationState {
    lists?: RestoplanList[]
    selectedList?: RestoplanList
    selectedItem?: RestoplanItem
}

export const getDefaultState = (): ApplicationState => {
    return {
        lists: undefined,
        selectedList: undefined,
        selectedItem: undefined
    }
}

