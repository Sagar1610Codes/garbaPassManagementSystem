const ErrorResponse = require('../utils/errorResponse');

// Grant access to specific roles
const authorize = (...roles) => {
  console.log('Authorizing access for roles:', roles);
  return (req, res, next) => {
    console.log('User making request:', {
      userId: req.user?.id,
      userRole: req.user?.role,
      requiredRoles: roles
    });

    if (!req.user) {
      console.error('No user found in request');
      return next(new ErrorResponse('Not authorized - no user data', 401));
    }

    if (!req.user.role) {
      console.error('No role found for user:', req.user.id);
      return next(new ErrorResponse('User role not defined', 403));
    }

    if (!roles.includes(req.user.role)) {
      console.log(`Access denied. User role '${req.user.role}' not in required roles:`, roles);
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }

    console.log('Access granted for role:', req.user.role);
    next();
  };
};

module.exports = authorize;
