import * as projectActions from './projectActions';

export enum ActionTypes {
    LOAD_RESTOPLAN_PROJECTS = "LOAD_RESTOPLAN_PROJECTS",
    LOAD_RESTOPLAN_PROJECT = "LOAD_RESTOPLAN_PROJECT",
    SELECT_RESTOPLAN_PROJECT = "SELECT_RESTOPLAN_PROJECT",
    SAVE_RESTOPLAN_PROJECT = "SAVE_RESTOPLAN_PROJECT",
    DELETE_RESTOPLAN_PROJECT = "DELETE_RESTOPLAN_PROJECT",
}

export type RestoplanActions =
    projectActions.ListProjectsAction |
    projectActions.SelectProjectAction |
    projectActions.LoadProjectAction |
    projectActions.SaveProjectAction |
    projectActions.DeleteProjectAction;