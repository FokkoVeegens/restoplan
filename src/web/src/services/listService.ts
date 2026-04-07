import { RestService } from './restService';
import { RestoplanList } from '../models';

export class ListService extends RestService<RestoplanList> {
    public constructor(baseUrl: string, baseRoute: string) {
        super(baseUrl, baseRoute);
    }
}
