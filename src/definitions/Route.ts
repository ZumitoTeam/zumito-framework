import { Request, Response } from "express";

export enum RouteMethod {
    get = "get",
    post = 'post',
    put = 'put',
    delete = 'delete',
    all = 'all',
}

export abstract class Route {
    method: RouteMethod;
    path: string;

    public abstract execute(req: Request, res: Response)
}