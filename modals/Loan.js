import mongoose from "mongoose";

const { Schema } = mongoose;

const loanSchemaٖ = new Schema({
    loanCategory: String,
    subCategory: String,
    loanAmount: Number,
    loanPeriod: Number,
    initialDeposit: Number,
});

const Loan = mongoose.model("Loans", loanSchemaٖ);

export default Loan;