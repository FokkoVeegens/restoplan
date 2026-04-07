import { Dispatch } from "react";
import { RestoplanItem } from "../models";
import { ItemService } from "../services/itemService";
import { ActionTypes } from "./common";
import config from "../config"
import { ActionMethod, createPayloadAction, PayloadAction } from "./actionCreators";

export interface QueryOptions {
    [key: string]: RegExp | boolean
}

export interface ItemActions {
    list(listId: string, options?: QueryOptions): Promise<RestoplanItem[]>
    select(item?: RestoplanItem): Promise<RestoplanItem>
    load(listId: string, id: string): Promise<RestoplanItem>
    save(listId: string, Item: RestoplanItem): Promise<RestoplanItem>
    remove(listId: string, Item: RestoplanItem): Promise<void>
}

export const list = (listId: string, options?: QueryOptions): ActionMethod<RestoplanItem[]> => async (dispatch: Dispatch<ListItemsAction>) => {
    const itemService = new ItemService(config.api.baseUrl, `/lists/${listId}/items`);
    const items = await itemService.getList(options);

    dispatch(listItemsAction(items));

    return items;
}

export const select = (item?: RestoplanItem): ActionMethod<RestoplanItem | undefined> => async (dispatch: Dispatch<SelectItemAction>) => {
    dispatch(selectItemAction(item));

    return Promise.resolve(item);
}

export const load = (listId: string, id: string): ActionMethod<RestoplanItem> => async (dispatch: Dispatch<LoadItemAction>) => {
    const itemService = new ItemService(config.api.baseUrl, `/lists/${listId}/items`);
    const item = await itemService.get(id);

    dispatch(loadItemAction(item));

    return item;
}

export const save = (listId: string, item: RestoplanItem): ActionMethod<RestoplanItem> => async (dispatch: Dispatch<SaveItemAction>) => {
    const itemService = new ItemService(config.api.baseUrl, `/lists/${listId}/items`);
    const newItem = await itemService.save(item);

    dispatch(saveItemAction(newItem));

    return newItem;
}

export const remove = (listId: string, item: RestoplanItem): ActionMethod<void> => async (dispatch: Dispatch<DeleteItemAction>) => {
    const itemService = new ItemService(config.api.baseUrl, `/lists/${listId}/items`);
    if (item.id) {
        await itemService.delete(item.id);
        dispatch(deleteItemAction(item.id));
    }
}

export interface ListItemsAction extends PayloadAction<string, RestoplanItem[]> {
    type: ActionTypes.LOAD_RESTOPLAN_ITEMS
}

export interface SelectItemAction extends PayloadAction<string, RestoplanItem | undefined> {
    type: ActionTypes.SELECT_RESTOPLAN_ITEM
}

export interface LoadItemAction extends PayloadAction<string, RestoplanItem> {
    type: ActionTypes.LOAD_RESTOPLAN_ITEM
}

export interface SaveItemAction extends PayloadAction<string, RestoplanItem> {
    type: ActionTypes.SAVE_RESTOPLAN_ITEM
}

export interface DeleteItemAction extends PayloadAction<string, string> {
    type: ActionTypes.DELETE_RESTOPLAN_ITEM
}

const listItemsAction = createPayloadAction<ListItemsAction>(ActionTypes.LOAD_RESTOPLAN_ITEMS);
const selectItemAction = createPayloadAction<SelectItemAction>(ActionTypes.SELECT_RESTOPLAN_ITEM);
const loadItemAction = createPayloadAction<LoadItemAction>(ActionTypes.LOAD_RESTOPLAN_ITEM);
const saveItemAction = createPayloadAction<SaveItemAction>(ActionTypes.SAVE_RESTOPLAN_ITEM);
const deleteItemAction = createPayloadAction<DeleteItemAction>(ActionTypes.DELETE_RESTOPLAN_ITEM);
