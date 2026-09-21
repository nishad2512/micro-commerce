import jwt from "jsonwebtoken";

export const verifyUser = async (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ message: "Access Denied: No Token Provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decodedPayload = jwt.verify(
            token,
            process.env.JWT_SECRET || "secret",
        );

        req.user = decodedPayload;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or Expired Token" });
    }
};

export const adminOnly = (req: any, res: any, next: any) => {
    const user = req?.user;
    if (!user) {
        return res.status(403).json({ message: "Unauthenticated user" });
    }
    if (user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized user!" });
    }
    next();
};
