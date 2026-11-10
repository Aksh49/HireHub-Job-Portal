const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Please login first"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }
}


// Admin authorization middleware
function verifyAdmin(req, res, next) {

    if (req.user.role !== "admin") {

        return res.status(403).json({
            message: "Access denied. Admin only."
        });

    }

    next();
}


// Export both functions
module.exports = {
    verifyToken,
    verifyAdmin
};