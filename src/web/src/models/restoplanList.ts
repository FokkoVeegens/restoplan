import { RestoplanItem } from "./restoplanItem";

export interface RestoplanList {
    id?: string
    name: string
    items?: RestoplanItem[]
    description?: string
    createdDate?: Date
    updatedDate?: Date
}