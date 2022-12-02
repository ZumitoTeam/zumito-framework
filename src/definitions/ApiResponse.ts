export class ApiResponse {
    static notFoundResponse(res, msg): any {
        const data = {
            message: msg,
        };
        return res.status(404).json(data);
    }

    static unauthorizedResponse(res, msg): any {
        const data = {
            message: msg,
        };
        return res.status(401).json(data);
    }
}
