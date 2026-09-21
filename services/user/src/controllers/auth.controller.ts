import { loginUser, userDetails } from "../services/user.service.js";

export const login = async (req: any, res: any) => {
    try {
        const result = await loginUser(req.body);

        res.status(200).json(result);
    } catch (err: any) {
        res.json({ success: false, message: err.message || "Login failed!" });
    }
};

export const me = async (req: any, res: any) => {
    try {
        const result = await userDetails(req!.user?.id);

        res.status(200).json(result);
    } catch (err: any) {
        res.json({
            success: false,
            message: err.message || "User identification failed",
        });
    }
};

export const userData = async (req: any, res: any) => {
    try {
        const userId = req.params.id;
        const result = await userDetails(userId);

        res.status(200).json(result)
    } catch (err: any) {
        res.json({
            success: false,
            message: err.message || "Users data finding failed",
        });
    }
};
