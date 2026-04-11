import { Dispatch } from "react";
import { RestoplanActions } from "../actions/common";
import { RestoplanProject } from "./restoplanProject";

export interface AppContext {
    state: ApplicationState
    dispatch: Dispatch<RestoplanActions>
}

export interface ApplicationState {
    projects?: RestoplanProject[]
    selectedProject?: RestoplanProject
}

export const getDefaultState = (): ApplicationState => {
    return {
        projects: undefined,
        selectedProject: undefined,
    }
}

