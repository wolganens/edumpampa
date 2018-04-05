module.exports = {
	authMiddleware(req, res, next) {
		if (req.user) {
			return next();
		}
		req.session.error_message = 'Você precisa estar autenticado!';
		return res.redirect('/account/signin');
	},
}