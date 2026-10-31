/**
 * Role-based authorization middleware.
 * Verifies that the authenticated employee's role is in the allowed roles list.
 */
const requireRole = (allowedRoles) => (req, res, next) => {
  const userRole = req.user?.employee_role || req.user?.role;

  if (!req.user || !userRole || !allowedRoles.includes(userRole)) {
    return res.status(403).json({
      status: "Failure",
      message: "Forbidden: insufficient role",
    });
  }

  next();
};

module.exports = requireRole;

