import { FC, ReactElement } from 'react';
import RestoplanListMenu from '../components/restoplanListMenu';
import { RestoplanList } from '../models/restoplanList';

interface SidebarProps {
    selectedList?: RestoplanList
    lists?: RestoplanList[];
    onListCreate: (list: RestoplanList) => void
}

const Sidebar: FC<SidebarProps> = (props: SidebarProps): ReactElement => {
    return (
        <div>
            <RestoplanListMenu
                selectedList={props.selectedList}
                lists={props.lists}
                onCreate={props.onListCreate} />
        </div>
    );
};

export default Sidebar;