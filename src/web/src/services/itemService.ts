import { RestService } from './restService';
import { RestoplanItem } from '../models';

export class ItemService extends RestService<RestoplanItem> {
    public constructor(baseUrl: string, baseRoute: string) {
        super(baseUrl, baseRoute);
    }
}
