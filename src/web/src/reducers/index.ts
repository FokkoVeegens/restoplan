import { Reducer } from "react";
import { RestoplanActions } from "../actions/common";
import { projectsReducer } from "./projectsReducer";
import { selectedProjectReducer } from "./selectedProjectReducer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const combineReducers = (slices: {[key: string]: Reducer<any, RestoplanActions>}) => (prevState: any, action: RestoplanActions) =>
    Object.keys(slices).reduce(
        (nextState, nextProp) => ({
            ...nextState,
            [nextProp]: slices[nextProp](prevState[nextProp], action)
        }),
        prevState
    );

export default combineReducers({
    projects: projectsReducer,
    selectedProject: selectedProjectReducer,
});
