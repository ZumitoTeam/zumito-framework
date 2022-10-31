export class ApiResponse {
    static notFoundResponse(res, msg): any {
        let data = {
            message: msg,
        };
        return res.status(404).json(data);
    };

    static unauthorizedResponse(res, msg): any {
        let data = {
            message: msg,
        };
        return res.status(401).json(data);
    };
}