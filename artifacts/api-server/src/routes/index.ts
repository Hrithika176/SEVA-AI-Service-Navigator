import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sevaRouter from "./seva";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sevaRouter);

export default router;
