import jwt from 'jsonwebtoken';

/** Sign a JWT for a user id. */
export const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/** Send JWT via httpOnly cookie + JSON body (client may use either). */
export const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const days = Number(process.env.JWT_COOKIE_EXPIRES_DAYS || 7);
  res.cookie('token', token, {
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  // Never leak the password hash
  const safeUser = user.toObject();
  delete safeUser.password;
  res.status(statusCode).json({ success: true, token, user: safeUser });
};
