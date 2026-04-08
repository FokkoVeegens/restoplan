import { RestService } from './restService';
import { RestoplanProject } from '../models';

export class ProjectService extends RestService<RestoplanProject> {
    public constructor(baseUrl: string, baseRoute: string) {
        super(baseUrl, baseRoute);
    }
}
