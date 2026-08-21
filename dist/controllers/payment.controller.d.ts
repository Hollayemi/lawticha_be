import { Request, Response } from 'express';
declare class PurchaseController {
    static paystackCallBackVerify(req: Request, res: Response): Promise<void>;
    static handleWebhook(req: Request, res: Response): Promise<Response>;
    static verifyPayment(req: Request, res: Response): Promise<Response>;
}
export default PurchaseController;
//# sourceMappingURL=payment.controller.d.ts.map