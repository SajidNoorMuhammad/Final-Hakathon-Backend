import sendResponse from "../helper/sendResponse.js";
import jwt from 'jsonwebtoken';
import { User } from "../modals/User.js";

export async function authenticateUser(req, res, next) {

    try {
        const bearerToken = req?.headers?.authorization;
        const token = bearerToken?.split(" ")[1];

        if (!token) return sendResponse(res, 400, true, null, "Token Not Access");

        const decoded = await jwt.verify(token, process.env.AUTH_SECRET);

        if (decoded) {
            const user = await User.findById(decoded._id);
            if (!user) return sendResponse(res, 400, true, null, "User Token Not Access");
            req.user = decoded;
            next();
        }
        else {
            sendResponse(res, 500, true, null, "Something went wrong");
        }
    }
    catch (error) {
        console.log(error)
    }
}