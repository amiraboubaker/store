/**
 * Admin action logger.
 *
 * Returns a factory that, given an AdminService instance, produces middleware
 * that records the admin action to the AdminActionLog table AFTER a successful
 * (2xx) response. This keeps logging out of the controllers and guarantees the
 * action is only logged when the request actually succeeded.
 */

const createAdminLogger = (adminService) => {
    /**
     * @param {string} action   - e.g. 'create', 'update', 'delete'
     * @param {string} entity   - e.g. 'product', 'order', 'user'
     * @param {(req) => number|null} [idFrom] - resolve the affected entity id
     */
    return (action, entity, idFrom) => (req, res, next) => {
        res.on('finish', () => {
            if (res.statusCode >= 400 || !req.user) return;

            const entityId = idFrom ? idFrom(req) : null;
            const details = ['create', 'update'].includes(action)
                ? sanitize(req.body)
                : {};

            adminService.logAction({
                admin: req.user,
                action,
                entity,
                entityId,
                details,
                req
            });
        });

        next();
    };
};

function sanitize(body) {
    if (!body || typeof body !== 'object') return {};
    const copy = { ...body };
    if (copy.password) copy.password = '[redacted]';
    return copy;
}

module.exports = { createAdminLogger };
