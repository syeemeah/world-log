import { Router, type IRouter } from "express";
import healthRouter from "./health";
import visitsRouter from "./visits";
import statsRouter from "./stats";
import memoriesRouter from "./memories";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(visitsRouter);
router.use(statsRouter);
router.use(memoriesRouter);

export default router;
