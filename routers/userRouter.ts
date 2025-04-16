import express from 'express';
import { userRegister, loginUser, userLogout, getUsers, getCurrentUser, refreshAccessToken, checkAccessToken } from '../controllers/userController';
import { protect } from '../middleware/protect';
import { verifyToken } from '../middleware/token/verifyToken';

const userRouter = express.Router();

userRouter.post('/register', userRegister);
// userRouter.post("/login", rateLimiter,loginUser)
userRouter.post("/login", loginUser)
userRouter.delete("/logout", userLogout);
userRouter.get("/all", getUsers)
userRouter.get("/me", protect, getCurrentUser);
userRouter.post("/refresh-token", verifyToken, refreshAccessToken);
userRouter.get("/check-token", checkAccessToken);



export default userRouter;

