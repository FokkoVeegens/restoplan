import { Dispatch } from "react";
import { RestoplanProject } from "../models";
import { ProjectService } from "../services/projectService";
import { ActionTypes } from "./common";
import config from "../config"
import { trackEvent } from "../services/telemetryService";
import { ActionMethod, createPayloadAction, PayloadAction } from "./actionCreators";

export interface QueryOptions {
    skip?: number;
    batchSize?: number;
}

export interface ProjectActions {
    list(options?: QueryOptions): Promise<RestoplanProject[]>
    load(id: string): Promise<RestoplanProject>
    select(project?: RestoplanProject): Promise<RestoplanProject | undefined>
    save(project: RestoplanProject): Promise<RestoplanProject>
    remove(id: string): Promise<void>
}

const projectService = new ProjectService(config.api.baseUrl, '/projects');

export const list = (options?: QueryOptions): ActionMethod<RestoplanProject[]> => async (dispatch: Dispatch<ListProjectsAction>) => {
    const projects = await projectService.getList(options);
    dispatch(listProjectsAction(projects));
    return projects;
}

export const select = (project?: RestoplanProject): ActionMethod<RestoplanProject | undefined> => (dispatch: Dispatch<SelectProjectAction>) => {
    dispatch(selectProjectAction(project));
    return Promise.resolve(project);
}

export const load = (id: string): ActionMethod<RestoplanProject> => async (dispatch: Dispatch<LoadProjectAction>) => {
    const project = await projectService.get(id);
    dispatch(loadProjectAction(project));
    return project;
}

export const save = (project: RestoplanProject): ActionMethod<RestoplanProject> => async (dispatch: Dispatch<SaveProjectAction>) => {
    const saved = await projectService.save(project);
    dispatch(saveProjectAction(saved));
    trackEvent(ActionTypes.SAVE_RESTOPLAN_PROJECT.toString());
    return saved;
}

export const remove = (id: string): ActionMethod<void> => async (dispatch: Dispatch<DeleteProjectAction>) => {
    await projectService.delete(id);
    dispatch(deleteProjectAction(id));
}

export interface ListProjectsAction extends PayloadAction<string, RestoplanProject[]> {
    type: ActionTypes.LOAD_RESTOPLAN_PROJECTS
}

export interface SelectProjectAction extends PayloadAction<string, RestoplanProject | undefined> {
    type: ActionTypes.SELECT_RESTOPLAN_PROJECT
}

export interface LoadProjectAction extends PayloadAction<string, RestoplanProject> {
    type: ActionTypes.LOAD_RESTOPLAN_PROJECT
}

export interface SaveProjectAction extends PayloadAction<string, RestoplanProject> {
    type: ActionTypes.SAVE_RESTOPLAN_PROJECT
}

export interface DeleteProjectAction extends PayloadAction<string, string> {
    type: ActionTypes.DELETE_RESTOPLAN_PROJECT
}

const listProjectsAction = createPayloadAction<ListProjectsAction>(ActionTypes.LOAD_RESTOPLAN_PROJECTS);
const selectProjectAction = createPayloadAction<SelectProjectAction>(ActionTypes.SELECT_RESTOPLAN_PROJECT);
const loadProjectAction = createPayloadAction<LoadProjectAction>(ActionTypes.LOAD_RESTOPLAN_PROJECT);
const saveProjectAction = createPayloadAction<SaveProjectAction>(ActionTypes.SAVE_RESTOPLAN_PROJECT);
const deleteProjectAction = createPayloadAction<DeleteProjectAction>(ActionTypes.DELETE_RESTOPLAN_PROJECT);
