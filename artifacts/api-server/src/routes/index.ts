import { Router, type IRouter } from "express";
import healthRouter from "./health";
import visitsRouter from "./visits";
import statsRouter from "./stats";
import memoriesRouter from "./memories";
import authRouter from "./auth";
import journalRouter from "./journal";
import feedbackRouter from "./feedback";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(visitsRouter);
router.use(statsRouter);
router.use(memoriesRouter);
router.use(journalRouter);
router.use(feedbackRouter);

export default router;
