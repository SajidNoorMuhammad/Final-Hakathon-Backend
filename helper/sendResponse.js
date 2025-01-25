export default function sendResponse(res, status, error, data, msg) {
    res.status(status).json({
        error,
        data: data,
        msg
    })
}