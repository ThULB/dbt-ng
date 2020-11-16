import { UIRouter } from "@uirouter/core";

import { authHook } from "./auth.hook";
import { routerHook } from "./router.hook";

export const routerConfigFn = (router: UIRouter) => {
    const transitionService = router.transitionService;

    authHook(transitionService);
    routerHook(transitionService);
};
