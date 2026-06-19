import { Router, type IRouter } from "express";
import healthRouter from "./health";
import visitsRouter from "./visits";
import statsRouter from "./stats";
import memoriesRouter from "./memories";
import authRouter from "./auth";
import linksRouter from "./links";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(visitsRouter);
router.use(statsRouter);
router.use(memoriesRouter);
router.use(linksRouter);

export default router;
