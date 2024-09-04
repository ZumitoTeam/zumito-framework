import { NextFunction, Request, Response } from "express";

export abstract class RouteMiddleware {
    path?: string;

    public abstract callback(req: Request, res: Response, next: NextFunction);
}