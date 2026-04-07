export enum RestoplanItemState {
    Todo = "todo",
    InProgress = "inprogress",
    Done = "done"
}

export interface RestoplanItem {
    id?: string
    listId: string
    name: string
    state: RestoplanItemState
    description?: string
    dueDate?: Date
    completedDate?:Date
    startDate?: Date
    createdDate?: Date
    updatedDate?: Date
}