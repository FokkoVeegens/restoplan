import { Dispatch } from "react";
import { RestoplanList } from "../models";
import { ListService } from "../services/listService";
import { ActionTypes } from "./common";
import config from "../config"
import { trackEvent } from "../services/telemetryService";
import { ActionMethod, createPayloadAction, PayloadAction } from "./actionCreators";
import { QueryOptions } from "./itemActions";

const listService = new ListService(config.api.baseUrl, '/lists');

export interface ListActions {
    list(options?: QueryOptions): Promise<RestoplanList[]>
    load(id: string): Promise<RestoplanList>
    select(list: RestoplanList): Promise<RestoplanList>
    save(list: RestoplanList): Promise<RestoplanList>
    remove(id: string): Promise<void>
}

export const list = (options?: QueryOptions): ActionMethod<RestoplanList[]> => async (dispatch: Dispatch<ListListsAction>) => {
    const lists = await listService.getList(options);

    dispatch(listListsAction(lists));

    return lists;
}

export const select = (list: RestoplanList): ActionMethod<RestoplanList> => (dispatch: Dispatch<SelectListAction>) => {
    dispatch(selectListAction(list));

    return Promise.resolve(list);
}

export const load = (id: string): ActionMethod<RestoplanList> => async (dispatch: Dispatch<LoadListAction>) => {
    const list = await listService.get(id);

    dispatch(loadListAction(list));

    return list;
}

export const save = (list: RestoplanList): ActionMethod<RestoplanList> => async (dispatch: Dispatch<SaveListAction>) => {
    const newList = await listService.save(list);

    dispatch(saveListAction(newList));

    trackEvent(ActionTypes.SAVE_RESTOPLAN_LIST.toString());

    return newList;
}

export const remove = (id: string): ActionMethod<void> => async (dispatch: Dispatch<DeleteListAction>) => {
    await listService.delete(id);

    dispatch(deleteListAction(id));
}

export interface ListListsAction extends PayloadAction<string, RestoplanList[]> {
    type: ActionTypes.LOAD_RESTOPLAN_LISTS
}

export interface SelectListAction extends PayloadAction<string, RestoplanList | undefined> {
    type: ActionTypes.SELECT_RESTOPLAN_LIST
}

export interface LoadListAction extends PayloadAction<string, RestoplanList> {
    type: ActionTypes.LOAD_RESTOPLAN_LIST
}

export interface SaveListAction extends PayloadAction<string, RestoplanList> {
    type: ActionTypes.SAVE_RESTOPLAN_LIST
}

export interface DeleteListAction extends PayloadAction<string, string> {
    type: ActionTypes.DELETE_RESTOPLAN_LIST
}

const listListsAction = createPayloadAction<ListListsAction>(ActionTypes.LOAD_RESTOPLAN_LISTS);
const selectListAction = createPayloadAction<SelectListAction>(ActionTypes.SELECT_RESTOPLAN_LIST);
const loadListAction = createPayloadAction<LoadListAction>(ActionTypes.LOAD_RESTOPLAN_LIST);
const saveListAction = createPayloadAction<SaveListAction>(ActionTypes.SAVE_RESTOPLAN_LIST);
const deleteListAction = createPayloadAction<DeleteListAction>(ActionTypes.DELETE_RESTOPLAN_LIST);
