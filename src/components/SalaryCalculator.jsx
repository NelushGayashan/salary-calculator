import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from 'react';
import { motion } from "framer-motion";

const formatCurrency = (value) =>
  value ? `Rs. ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Rs. 0.00";

function calculateTax(grossSalary) {
  const taxSlabs = [
    { lower: 0, upper: 150000, rate: 0 },
    { lower: 150000, upper: 233333, rate: 0.06 },
    { lower: 233333, upper: 275000, rate: 0.18 },
    { lower: 275000, upper: 316667, rate: 0.24 }
  ];

  let tax = 0;
  let remainingSalary = grossSalary;

  for (const slab of taxSlabs) {
    if (remainingSalary <= 0) break;

    if (grossSalary > slab.lower) {
      const taxableInThisSlab = Math.min(remainingSalary, slab.upper - slab.lower);
      tax += taxableInThisSlab * slab.rate;
      remainingSalary -= taxableInThisSlab;
    }
  }

  return tax;
}

function calculateSalary({ basicSalary, incentives }) {
  const basic = Number(basicSalary);
  const totalIncentives = incentives.reduce((sum, incentive) => sum + Number(incentive.value || 0), 0);
  const grossSalary = basic + totalIncentives;
  const epfEmployee = basic * 0.08;
  const epfEmployer = basic * 0.12;
  const etf = basic * 0.03;
  const taxAmount = calculateTax(grossSalary);
  const netSalary = grossSalary - epfEmployee - taxAmount;

  return {
    basic: basic.toFixed(2),
    incentives: incentives,
    totalIncentives: totalIncentives.toFixed(2),
    gross: grossSalary.toFixed(2),
    net: netSalary.toFixed(2),
    epfEmployee: epfEmployee.toFixed(2),
    epfEmployer: epfEmployer.toFixed(2),
    etf: etf.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalDeductions: (epfEmployee + taxAmount).toFixed(2)
  };
}

const SalaryCalculator = () => {
  const [results, setResults] = useState({
    basic: 0,
    incentives: [],
    totalIncentives: 0,
    gross: 0,
    net: 0,
    epfEmployee: 0,
    epfEmployer: 0,
    etf: 0,
    taxAmount: 0,
    totalDeductions: 0
  });

  const formik = useFormik({
    initialValues: {
      basicSalary: "",
      incentives: [{ id: 1, label: "Incentive 1", value: "" }],
    },
    validationSchema: Yup.object({
      basicSalary: Yup.number().required("Required").positive("Must be positive"),
      incentives: Yup.array().of(
        Yup.object().shape({
          label: Yup.string().required("Required"),
          value: Yup.number().required("Required").min(0, "Cannot be negative"),
        })
      ),
    }),
    onSubmit: (values, { setSubmitting }) => {
      setResults(calculateSalary(values));
      toast.success("Salary calculated successfully!");
      setSubmitting(false);
    },
    enableReinitialize: true
  });

  const addIncentive = () => {
    const newId = formik.values.incentives.length > 0
      ? Math.max(...formik.values.incentives.map(inc => inc.id)) + 1
      : 1;

    formik.setValues({
      ...formik.values,
      incentives: [
        ...formik.values.incentives,
        { id: newId, label: `Incentive ${newId}`, value: "" }
      ]
    });
  };

  const removeIncentive = (id) => {
    if (formik.values.incentives.length <= 1) {
      toast.warning("You need at least one incentive field");
      return;
    }

    formik.setValues({
      ...formik.values,
      incentives: formik.values.incentives.filter(inc => inc.id !== id)
    });
  };

  const handleLabelChange = (id, newLabel) => {
    formik.setValues({
      ...formik.values,
      incentives: formik.values.incentives.map(inc =>
        inc.id === id ? { ...inc, label: newLabel } : inc
      )
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl flex flex-col md:flex-row gap-8"
      >
        {/* Form Section */}
        <div className="md:w-1/2 w-full">
          <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
            Sri Lankan Salary Calculator
          </h1>
          <form onSubmit={formik.handleSubmit} className="space-y-6" autoComplete="off">
            {/* Basic Salary Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="basicSalary" className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Basic Salary (Rs.)
                </label>
                {formik.touched.basicSalary && !formik.errors.basicSalary && (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input
                id="basicSalary"
                name="basicSalary"
                type="number"
                min="1"
                placeholder="e.g. 100000"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.basicSalary || ""}
                className={`w-full px-4 py-3 rounded-lg border ${
                  formik.errors.basicSalary && formik.touched.basicSalary
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 ${
                  formik.errors.basicSalary ? 'focus:ring-red-500' : 'focus:ring-blue-500'
                } transition-all`}
                aria-label="Basic Salary"
              />
              {formik.errors.basicSalary && formik.touched.basicSalary && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {formik.errors.basicSalary}
                </p>
              )}
            </div>

            {/* Incentives Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Incentives</h3>
                <button
                  type="button"
                  onClick={addIncentive}
                  className="p-1 bg-green-100 dark:bg-green-800 rounded-full text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-700 transition-colors"
                  aria-label="Add incentive"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {formik.values.incentives.map((incentive, index) => (
                  <div key={incentive.id} className="flex items-start space-x-2">
                    <div className="flex-1">
                      <div className="mb-1">
                        <input
                          type="text"
                          value={incentive.label}
                          onChange={(e) => handleLabelChange(incentive.id, e.target.value)}
                          onBlur={formik.handleBlur}
                          placeholder="Incentive name"
                          className={`w-full px-4 py-3 rounded-lg border ${
                            formik.touched.incentives &&
                            formik.errors.incentives &&
                            formik.errors.incentives[formik.values.incentives.findIndex(inc => inc.id === incentive.id)]?.label
                              ? 'border-red-500'
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all`}
                          aria-label={`${incentive.label} name`}
                        />
                        {formik.touched.incentives &&
                          formik.errors.incentives &&
                          formik.errors.incentives[formik.values.incentives.findIndex(inc => inc.id === incentive.id)]?.label && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {formik.errors.incentives[formik.values.incentives.findIndex(inc => inc.id === incentive.id)].label}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 25000"
                          value={incentive.value || ""}
                          onChange={(e) => {
                            const newIncentives = [...formik.values.incentives];
                            newIncentives[index].value = e.target.value;
                            formik.setValues({
                              ...formik.values,
                              incentives: newIncentives
                            });
                          }}
                          onBlur={formik.handleBlur}
                          className={`w-full px-4 py-3 rounded-lg border ${
                            formik.touched.incentives &&
                            formik.errors.incentives &&
                            formik.errors.incentives[index]?.value
                              ? 'border-red-500'
                              : 'border-gray-300 dark:border-gray-600'
                          } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all`}
                          aria-label={`${incentive.label} value`}
                        />
                        {formik.touched.incentives &&
                          formik.errors.incentives &&
                          formik.errors.incentives[formik.values.incentives.findIndex(inc => inc.id === incentive.id)]?.value && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {formik.errors.incentives[formik.values.incentives.findIndex(inc => inc.id === incentive.id)].value}
                          </p>
                        )}

                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeIncentive(incentive.id)}
                      className="mt-8 p-1 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                      aria-label="Remove incentive"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Information Section */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-gray-700 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Calculation Method</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Basic + Sum of Incentives</span>
                  <span className="font-medium">= Gross Salary</span>
                </div>
                <div className="flex justify-between">
                  <span>EPF/ETF calculated on</span>
                  <span className="font-medium">Basic Salary only</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax calculated on</span>
                  <span className="font-medium">Gross Salary</span>
                </div>
              </div>
            </div>

            {/* Tax Information Section */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-gray-700 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sri Lankan Tax Slabs (2025)</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Up to Rs. 150,000</span>
                  <span className="font-medium">0%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rs. 150,001 - Rs. 233,333</span>
                  <span className="font-medium">6%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rs. 233,334 - Rs. 275,000</span>
                  <span className="font-medium">18%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rs. 275,001 - Rs. 316,667</span>
                  <span className="font-medium">24%</span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!formik.isValid || formik.isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formik.isSubmitting ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </div>
              ) : (
                "Calculate Salary"
              )}
            </motion.button>
          </form>
        </div>

        {/* Result Section */}
        <div className="md:w-1/2 w-full">
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center space-x-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Salary Breakdown</span>
          </h2>

          <div className="space-y-4">
            {/* Basic Salary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-gray-600 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Basic Salary</span>
              </div>
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                {formatCurrency(results.basic)}
              </span>
            </motion.div>

            {/* Individual Incentives */}
            {results.incentives && results.incentives.map((incentive, index) => (
              <motion.div
                key={incentive.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-gray-600 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{incentive.label}</span>
                </div>
                <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                  {formatCurrency(incentive.value)}
                </span>
              </motion.div>
            ))}

            {/* Total Incentives */}
            {Number(results.totalIncentives) > 0 && results.incentives && results.incentives.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-gray-600 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Total Incentives</span>
                </div>
                <span className="font-bold text-lg text-purple-600 dark:text-purple-400">
                  {formatCurrency(results.totalIncentives)}
                </span>
              </motion.div>
            )}

            {/* Gross Salary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-gray-600 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Gross Salary</span>
              </div>
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                {formatCurrency(results.gross)}
              </span>
            </motion.div>

            {/* Net Salary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-gray-600 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Net Salary</span>
              </div>
              <span className="font-bold text-lg text-green-600 dark:text-green-400">
                {formatCurrency(results.net)}
              </span>
            </motion.div>
          </div>

          {/* Deductions Breakdown */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Deductions Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">EPF (Employee 8% of Basic)</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {formatCurrency(results.epfEmployee)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Income Tax (on Gross)</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {formatCurrency(results.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-700 dark:text-gray-300">Total Deductions</span>
                <span className="text-red-600 dark:text-red-400">
                  {formatCurrency(results.totalDeductions)}
                </span>
              </div>
            </div>
          </div>

          {/* Employer Contributions */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Employer Contributions</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">EPF (Employer 12% of Basic)</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {formatCurrency(results.epfEmployer)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">ETF (Employer 3% of Basic)</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {formatCurrency(results.etf)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-700 dark:text-gray-300">Total Employer Contribution</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatCurrency((Number(results.epfEmployer) + Number(results.etf)).toFixed(2))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
   );
   };

export default SalaryCalculator;
