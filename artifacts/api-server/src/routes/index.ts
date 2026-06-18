import { Router, type IRouter } from "express";
import healthRouter from "./health";
import visitsRouter from "./visits";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(visitsRouter);
router.use(statsRouter);

export default router;
