import express from 'express';
import Loan from '../modals/Loan.js';
import sendResponse from '../helper/sendResponse.js';
const router = express.Router();

router.get("/loans", async (req, res) => {
    const loan = await Loan.find();
    sendResponse(res, 200, false, loan, "Loans Fetched Successfully");

    if (!loan) sendResponse(res, 400, true, null, "Loans Not Found");
})

router.post("/loans", async (req, res) => {
    try {
        let newLoan = new Loan(req.body);
        newLoan = await newLoan.save();
        sendResponse(res, 200, false, newLoan, "Loan Added Successfully")
    }
    catch (error) {
        sendResponse(res, 400, true, null, "Something went wrong");
        console.log(error)
    }
});

export default router;
