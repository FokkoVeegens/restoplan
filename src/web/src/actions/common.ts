import * as itemActions from './itemActions';
import * as listActions from './listActions';

export enum ActionTypes {
    LOAD_RESTOPLAN_LISTS = "LOAD_RESTOPLAN_LISTS",
    LOAD_RESTOPLAN_LIST = "LOAD_RESTOPLAN_LIST",
    SELECT_RESTOPLAN_LIST = "SELECT_RESTOPLAN_LIST",
    SAVE_RESTOPLAN_LIST = "SAVE_RESTOPLAN_LIST",
    DELETE_RESTOPLAN_LIST = "DELETE_RESTOPLAN_LIST",
    LOAD_RESTOPLAN_ITEMS = "LOAD_RESTOPLAN_ITEMS",
    LOAD_RESTOPLAN_ITEM = "LOAD_RESTOPLAN_ITEM",
    SELECT_RESTOPLAN_ITEM = "SELECT_RESTOPLAN_ITEM",
    SAVE_RESTOPLAN_ITEM = "SAVE_RESTOPLAN_ITEM",
    DELETE_RESTOPLAN_ITEM = "DELETE_RESTOPLAN_ITEM"
}

export type RestoplanActions =
    itemActions.ListItemsAction |
    itemActions.SelectItemAction |
    itemActions.LoadItemAction |
    itemActions.SaveItemAction |
    itemActions.DeleteItemAction |
    listActions.ListListsAction |
    listActions.SelectListAction |
    listActions.LoadListAction |
    listActions.SaveListAction |
    listActions.DeleteListAction;